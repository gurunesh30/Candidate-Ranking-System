import os
import re
import gc
import uuid
import heapq
import asyncio
import json
import tempfile
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional
import httpx
from fastapi import FastAPI, Body, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

# Pipeline Scoring Core Imports
from app.schemas import CandidateModel, JobDescriptionInput
from app.stage_1_skills import evaluate_semantic_skills, embedding_model
from app.stage_3_signals import calculate_platform_signals
from app.agent_prompts import STAR_SCORING_PROMPT
from app.sandbox_jd_parser import run_pipeline
from app.insight_matrix import init_insight_matrix, assign_insight

from fastapi.responses import StreamingResponse
from app.exporter import convert_rankings_to_csv_stream

# ---------------------------------------------------------------------------
# Funnel constants
# ---------------------------------------------------------------------------
STAGE_1_KEEP = 500   # Primary heap cap: retain top-500 after Stage 1
FINAL_KEEP   = 100   # Final heap cap: retain top-100 after composite scoring

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
MODEL_NAME  = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")

# Path to the candidate dataset — resolved relative to this file's location
CANDIDATE_JSONL_PATH = os.path.join(os.path.dirname(__file__), "data", "candidate.jsonl")

# In-memory session store: { session_id -> { rankings, total_processed } }
_session_store: Dict[str, Any] = {}

# ---------------------------------------------------------------------------
# Global candidate pool — loaded once at server startup
# ---------------------------------------------------------------------------
_candidate_pool: List[CandidateModel] = []


def _load_candidate_pool() -> List[CandidateModel]:
    """
    Reads candidate.jsonl from disk line-by-line at startup.
    Each valid line is parsed into a CandidateModel and stored in memory.
    Invalid lines are skipped silently.
    """
    pool: List[CandidateModel] = []
    if not os.path.exists(CANDIDATE_JSONL_PATH):
        print(f"[WARN] candidate.jsonl not found at {CANDIDATE_JSONL_PATH}. Pool will be empty.")
        return pool

    with open(CANDIDATE_JSONL_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                cand_dict = json.loads(line)
                pool.append(CandidateModel(**cand_dict))
            except Exception:
                continue

    print(f"[INFO] Loaded {len(pool)} candidates into memory from {CANDIDATE_JSONL_PATH}")
    return pool


# ---------------------------------------------------------------------------
# Lifespan startup: load candidates + pre-compute insight matrix
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global _candidate_pool
    # Load candidate dataset into memory once
    _candidate_pool = _load_candidate_pool()
    # Pre-compute 150-sentence insight embedding matrix
    init_insight_matrix(embedding_model)
    yield
    # Shutdown — nothing to clean up


app = FastAPI(
    title="Talent Context Ranker API — Inverted Cascade Funnel",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# LLM helper — Stage 2 only, called on the top-500 subset
# ---------------------------------------------------------------------------

async def extract_star_score(candidate_payload: str) -> float:
    """
    Sends the candidate JSON block to Qwen 2.5:3b and extracts a single
    integer behavioral score via regex. Hard-clamped to [0, 100].
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                OLLAMA_URL,
                json={
                    "model": MODEL_NAME,
                    "prompt": f"System: {STAR_SCORING_PROMPT}\n\nUser Data:\n{candidate_payload}",
                    "stream": False,
                    "options": {
                        "num_predict": 10,   # single integer only
                        "temperature": 0.0,  # deterministic
                        "num_gpu": 99,
                    },
                },
            )
            if response.status_code != 200:
                return 50.0

            raw_text = response.json().get("response", "").strip()
            match = re.search(r'\d+', raw_text)
            if match:
                return float(min(max(int(match.group()), 0), 100))
            return 50.0

    except Exception:
        return 50.0


# ---------------------------------------------------------------------------
# Core evaluation function (used by both endpoints)
# ---------------------------------------------------------------------------

async def _evaluate_rankings_streaming(
    jd_evaluation_text: str,
    candidates: List[CandidateModel]
) -> tuple[list, int]:
    """
    Executes the 7-step inverted cascade funnel on a list of candidates.
    Returns (ranked_results, total_input).
    """
    total_input = len(candidates)
    if total_input == 0:
        return [], 0

    # ==================================================================
    # STEP 1 — Stage 1 skill scoring across ALL candidates
    # STEP 2 — Bounded min-heap keeps top-500 in O(n log 500)
    # ==================================================================
    stage1_heap: list = []   # (score, tie_idx, candidate)

    for tie_idx, candidate in enumerate(candidates):
        skill_score = round(float(min(max(
            evaluate_semantic_skills(jd_evaluation_text, candidate.skills),
            0.0), 100.0)), 2)

        entry = (skill_score, tie_idx, candidate)

        if len(stage1_heap) < STAGE_1_KEEP:
            heapq.heappush(stage1_heap, entry)
        elif skill_score > stage1_heap[0][0]:
            heapq.heappushpop(stage1_heap, entry)

    gc.collect()

    # ==================================================================
    # STEP 3 — Deep cognitive pass on top-500 only
    # STEP 4 — Second bounded min-heap keeps top-100 in O(500 log 100)
    # ==================================================================
    final_heap: list = []    # (composite, tie_idx, enriched)

    for tie_idx, (s1_score, _, candidate) in enumerate(stage1_heap):
        # Stage 2 — Qwen STAR behavioral score
        candidate_payload = candidate.json(include={"profile", "career_history"})
        behavioral_score = round(float(min(max(
            await extract_star_score(candidate_payload), 0.0), 100.0)), 2)

        # Stage 3 — Platform telemetry signals
        platform_score = round(float(min(max(
            calculate_platform_signals(candidate.redrob_signals), 0.0), 100.0)), 2)

        # Composite formula: (S1 * 0.40) + (S2 * 0.40) + (S3 * 0.20)
        composite = round(float(min(max(
            s1_score * 0.40 + behavioral_score * 0.40 + platform_score * 0.20,
            0.0), 100.0)), 2)

        enriched = {
            "candidate":      candidate,
            "stage_1_score":  s1_score,
            "stage_2_score":  behavioral_score,
            "stage_3_score":  platform_score,
            "final_score":    composite,
        }

        entry = (composite, tie_idx, enriched)

        if len(final_heap) < FINAL_KEEP:
            heapq.heappush(final_heap, entry)
        elif composite > final_heap[0][0]:
            heapq.heappushpop(final_heap, entry)

    del stage1_heap
    gc.collect()

    # Extract and sort descending
    top_100 = sorted(final_heap, key=lambda x: x[0], reverse=True)
    del final_heap
    gc.collect()

    # ==================================================================
    # STEP 5+6 — Cosine insight assignment for the final top-100
    # ==================================================================
    ranked_results = []

    for rank_pos, (_, _, item) in enumerate(top_100, start=1):
        candidate: CandidateModel = item["candidate"]

        # Build compact experience string (capped at top-3 roles to limit tokens)
        experience_text = (
            f"{candidate.profile.headline}. "
            f"{candidate.profile.summary}. "
            + " ".join(
                f"{job.title} at {job.company}: {job.description}"
                for job in candidate.career_history[:3]
            )
        )

        reasoning = assign_insight(experience_text, embedding_model)

        ranked_results.append({
            "rank":         rank_pos,
            "candidate_id": candidate.candidate_id,
            "final_score":  item["final_score"],
            "reasoning":    reasoning,
            "breakdown": {
                "stage_1_skills_semantic":  item["stage_1_score"],
                "stage_2_behavioral_star":  item["stage_2_score"],
                "stage_3_platform_signals": item["stage_3_score"],
            },
        })

    del top_100
    gc.collect()

    return ranked_results, total_input


# ---------------------------------------------------------------------------
# Endpoint 1: Legacy batch evaluate (for small payloads / testing)
# ---------------------------------------------------------------------------

@app.post("/api/rank/evaluate")
async def evaluate_and_rank_fast(
    job_description: JobDescriptionInput = Body(..., embed=True),
    candidates: List[CandidateModel] = Body(...),
):
    """
    Legacy batch endpoint — expects the entire candidate list in the request body.
    Only suitable for small test datasets. For production use /api/rank/start.
    """
    if not candidates:
        raise HTTPException(status_code=400, detail="Candidate roster cannot be empty.")

    jd_evaluation_text = job_description.to_evaluation_text()
    ranked_results, total_input = await _evaluate_rankings_streaming(
        jd_evaluation_text,
        candidates,
    )

    session_id = str(uuid.uuid4())
    _session_store[session_id] = {
        "rankings":        ranked_results,
        "total_processed": total_input,
    }

    return {
        "status":          "success",
        "session_id":      session_id,
        "total_processed": total_input,
        "rankings":        ranked_results,
    }


# ---------------------------------------------------------------------------
# Endpoint 2: Production — rank against server-loaded candidate pool
# ---------------------------------------------------------------------------

@app.post("/api/rank/start")
async def rank_against_loaded_pool(
    job_description: JobDescriptionInput = Body(...),
):
    """
    Production endpoint: uses the candidate pool already loaded into memory
    at server startup (from candidate.jsonl). Frontend only sends the parsed JD.
    No candidate data is ever sent over the network or loaded in the browser.
    Returns the top-100 ranked candidates.
    """
    if not _candidate_pool:
        raise HTTPException(
            status_code=503,
            detail="Candidate pool is empty. Ensure candidate.jsonl exists in backend/data/ and restart the server.",
        )

    jd_evaluation_text = job_description.to_evaluation_text()
    ranked_results, total_input = await _evaluate_rankings_streaming(
        jd_evaluation_text,
        _candidate_pool,
    )

    session_id = str(uuid.uuid4())
    _session_store[session_id] = {
        "rankings":        ranked_results,
        "total_processed": total_input,
    }

    return {
        "status":          "success",
        "session_id":      session_id,
        "total_processed": total_input,
        "rankings":        ranked_results,   # exactly top-100 rows
    }


# ---------------------------------------------------------------------------
# Leaderboard retrieval
# ---------------------------------------------------------------------------

@app.get("/api/rank/leaderboard/{session_id}")
async def get_leaderboard(session_id: str):
    """Retrieves previously evaluated top-100 rankings for a given session ID."""
    session = _session_store.get(session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail=f"Session '{session_id}' not found. It may have expired or the server was restarted.",
        )
    return {
        "status":          "success",
        "session_id":      session_id,
        "total_processed": session["total_processed"],
        "rankings":        session["rankings"],
    }


# ---------------------------------------------------------------------------
# JD Parser
# ---------------------------------------------------------------------------

@app.post("/api/jd/parse")
async def parse_job_description(file: UploadFile = File(...)):
    """
    Parses a Job Description .docx file and returns a structured JSON
    plus a condensed evaluation_text ready for /api/rank/evaluate.
    """
    if not file.filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="Only .docx files are supported.")

    temp_file_path = ""
    try:
        import tempfile

        with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        json_result   = run_pipeline(temp_file_path)
        os.unlink(temp_file_path)

        parsed_dict = json.loads(json_result)
        jd_model    = JobDescriptionInput(**parsed_dict)

        return {
            "parsed_jd":       parsed_dict,
            "evaluation_text": jd_model.to_evaluation_text(),
        }

    except Exception as exc:
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Failed to parse JD: {str(exc)}")


# ---------------------------------------------------------------------------
# CSV Export
# ---------------------------------------------------------------------------

@app.post("/api/rank/export")
async def export_stateless_rankings(rankings: List[dict] = Body(...)):
    """
    Accepts the top-100 rankings from the client and streams a CSV.
    Columns: candidate_id, rank, score, ai_reasoning.
    """
    if not rankings:
        raise HTTPException(status_code=400, detail="Rankings payload cannot be empty.")

    try:
        csv_stream = convert_rankings_to_csv_stream(rankings)
        return StreamingResponse(
            csv_stream,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=AI_Recruiter_Leaderboard_Export.csv"},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate CSV stream: {str(exc)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
