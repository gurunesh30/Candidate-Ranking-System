import os
import re
import gc
import uuid
import heapq
import json
from contextlib import asynccontextmanager
from typing import List, Dict, Any

import httpx
from fastapi import FastAPI, Body, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

# Pipeline Scoring Core Imports
from app.schemas import CandidateModel, JobDescriptionInput
from app.stage_1_skills import evaluate_semantic_skills, embedding_model
from app.stage_3_signals import calculate_platform_signals
from app.agent_prompts import STAR_SCORING_PROMPT
from app.sandbox_jd_parser import run_pipeline
from app.insight_matrix import init_insight_matrix, assign_insight
from app.exporter import convert_rankings_to_csv_stream

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
STAGE_1_KEEP = 500   # Retain top-500 after Stage 1 (skill scoring)
FINAL_KEEP   = 100   # Retain top-100 after composite scoring

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
MODEL_NAME  = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")

# Candidate dataset path — relative to this file
CANDIDATE_JSONL_PATH = os.path.join(os.path.dirname(__file__), "data", "candidate.jsonl")

# In-memory stores
_session_store:   Dict[str, Any]      = {}
_candidate_pool:  List[CandidateModel] = []


# ---------------------------------------------------------------------------
# Startup helpers
# ---------------------------------------------------------------------------

def _load_candidate_pool() -> List[CandidateModel]:
    """
    Reads candidate.jsonl line-by-line at server startup.
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
                pool.append(CandidateModel(**json.loads(line)))
            except Exception:
                continue

    print(f"[INFO] Loaded {len(pool)} candidates from {CANDIDATE_JSONL_PATH}")
    return pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load candidate pool and pre-compute insight embeddings at startup."""
    global _candidate_pool
    _candidate_pool = _load_candidate_pool()
    init_insight_matrix(embedding_model)
    yield
    # shutdown — nothing to clean up


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

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
# Core evaluation — 7-step inverted cascade funnel
# ---------------------------------------------------------------------------

async def _evaluate_rankings_streaming(
    jd_evaluation_text: str,
    candidates: List[CandidateModel],
) -> tuple[list, int]:
    """
    Runs the full cascade funnel on the given candidate list.
    Returns (ranked_results[top-100], total_input).

    STEP 1+2 — Stage 1 skill scoring → bounded min-heap → top-500
    STEP 3+4 — Stage 2 (Qwen STAR) + Stage 3 (telemetry) on top-500
               → composite score → bounded min-heap → top-100
    STEP 5+6 — Cosine insight assignment from pre-computed 150-vector matrix
    STEP 7   — Rank injection 1→100
    """
    total_input = len(candidates)
    if total_input == 0:
        return [], 0

    # ── STEP 1+2: Stage 1 skill scoring, bounded min-heap → top-500 ──────────
    stage1_heap: list = []  # (score, tie_idx, candidate)

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

    # ── STEP 3+4: Deep pass on top-500, bounded min-heap → top-100 ───────────
    final_heap: list = []  # (composite, tie_idx, enriched)

    for tie_idx, (s1_score, _, candidate) in enumerate(stage1_heap):
        candidate_payload = candidate.json(include={"profile", "career_history"})

        behavioral_score = round(float(min(max(
            await extract_star_score(candidate_payload), 0.0), 100.0)), 2)

        platform_score = round(float(min(max(
            calculate_platform_signals(candidate.redrob_signals), 0.0), 100.0)), 2)

        composite = round(float(min(max(
            s1_score * 0.40 + behavioral_score * 0.40 + platform_score * 0.20,
            0.0), 100.0)), 2)

        enriched = {
            "candidate":     candidate,
            "stage_1_score": s1_score,
            "stage_2_score": behavioral_score,
            "stage_3_score": platform_score,
            "final_score":   composite,
        }

        entry = (composite, tie_idx, enriched)

        if len(final_heap) < FINAL_KEEP:
            heapq.heappush(final_heap, entry)
        elif composite > final_heap[0][0]:
            heapq.heappushpop(final_heap, entry)

    del stage1_heap
    gc.collect()

    # Sort the 100-item heap descending — O(100 log 100), negligible
    top_100 = sorted(final_heap, key=lambda x: x[0], reverse=True)
    del final_heap
    gc.collect()

    # ── STEP 5+6: Cosine insight assignment ──────────────────────────────────
    ranked_results = []

    for rank_pos, (_, _, item) in enumerate(top_100, start=1):
        candidate: CandidateModel = item["candidate"]

        experience_text = (
            f"{candidate.profile.headline}. "
            f"{candidate.profile.summary}. "
            + " ".join(
                f"{job.title} at {job.company}: {job.description}"
                for job in candidate.career_history[:3]
            )
        )

        reasoning = assign_insight(experience_text, embedding_model)

        # ── STEP 7: Rank injection ────────────────────────────────────────────
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
# Endpoint: Production ranking (uses server-loaded candidate pool)
# ---------------------------------------------------------------------------

@app.post("/api/rank/start")
async def rank_against_loaded_pool(
    job_description: JobDescriptionInput = Body(...),
):
    """
    Main production endpoint. Frontend sends only the parsed JD JSON.
    Backend runs the full cascade funnel against the pre-loaded candidate pool
    and returns only the top-100 ranked results — no candidate data ever
    crosses the network to the browser.
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
        "rankings":        ranked_results,
    }


# ---------------------------------------------------------------------------
# Endpoint: Legacy batch evaluate (testing / small payloads only)
# ---------------------------------------------------------------------------

@app.post("/api/rank/evaluate")
async def evaluate_and_rank_fast(
    job_description: JobDescriptionInput = Body(..., embed=True),
    candidates: List[CandidateModel] = Body(...),
):
    """
    Legacy endpoint — full candidate list in request body.
    Suitable for test datasets only. Production should use /api/rank/start.
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
# Endpoint: Leaderboard retrieval
# ---------------------------------------------------------------------------

@app.get("/api/rank/leaderboard/{session_id}")
async def get_leaderboard(session_id: str):
    """Retrieves the top-100 rankings for a given session ID."""
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
# Endpoint: JD Parser
# ---------------------------------------------------------------------------

@app.post("/api/jd/parse")
async def parse_job_description(file: UploadFile = File(...)):
    """
    Parses a .docx Job Description file and returns:
    - parsed_jd: structured JSON with extracted fields
    - evaluation_text: condensed string ready for embedding
    """
    if not file.filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="Only .docx files are supported.")

    temp_file_path = ""
    try:
        import tempfile

        with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
            tmp.write(await file.read())
            temp_file_path = tmp.name

        json_result = run_pipeline(temp_file_path)
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
# Endpoint: CSV Export
# ---------------------------------------------------------------------------

@app.post("/api/rank/export")
async def export_rankings_csv(rankings: List[dict] = Body(...)):
    """
    Accepts the top-100 rankings and streams a CSV file.
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
        raise HTTPException(status_code=500, detail=f"Failed to generate CSV: {str(exc)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
