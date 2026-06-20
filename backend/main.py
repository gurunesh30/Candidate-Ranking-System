import os
import re
import uuid
import asyncio
from typing import List, Dict, Any
import httpx
from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Pipeline Scoring Core Imports
from app.schemas import CandidateModel
from app.stage_1_skills import evaluate_semantic_skills
from app.stage_3_signals import calculate_platform_signals 
from app.agent_prompts import STAR_SCORING_PROMPT

from fastapi.responses import StreamingResponse
from app.exporter import convert_rankings_to_excel_stream

app = FastAPI(title="Talent Context Ranker API (High-Speed Numerical Engine)")

# In-memory session store: { session_id -> { rankings, total_processed, created_at } }
# Avoids DB dependency while still enabling the leaderboard endpoint
_session_store: Dict[str, Any] = {}

# Enable CORS for frontend layout communications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
MODEL_NAME = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")


async def extract_star_score(candidate_payload: str) -> float:
    """
    Sends the candidate JSON summary to Qwen and forces it to yield a 
    single number, then extracts it safely using regex.
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
                        "num_predict": 10,     # Extremely low to make the response instant
                        "temperature": 0.0,    # 0.0 forces the model to be purely mathematical
                        "num_gpu": 99
                    }
                }
            )
            if response.status_code != 200:
                return 50.0 # Secure baseline fallback on inference slip
                
            raw_text = response.json().get("response", "").strip()
            
            # Use Regex to clean out anything that isn't a direct integer digit
            match = re.search(r'\d+', raw_text)
            if match:
                score = int(match.group())
                return min(max(score, 0), 100) # Clamp between 0 and 100 safely
            return 50.0
            
    except Exception:
        return 50.0 # Baseline fallback if local engine drops


@app.post("/api/rank/evaluate")
async def evaluate_and_rank_fast(
    job_description: str = Body(..., embed=True),
    candidates: List[CandidateModel] = Body(...)
):
    """
    High-Speed Stateless Evaluation: Extracts an analytical STAR number from Qwen, 
    aggregates it directly into the overall mathematical score, ranks candidates 
    in memory, and returns the list instantly without database storage overhead.
    """
    if not candidates:
        raise HTTPException(status_code=400, detail="Candidate roster cannot be empty.")
        
    evaluated_list = []
    
    for candidate in candidates:
        # Phase 1: Native C++ Core Module (Skills Match)
        semantic_score = evaluate_semantic_skills(job_description, candidate.skills)
        
        # Phase 3: Platform Telemetry Signal Evaluation
        platform_score = calculate_platform_signals(candidate.redrob_signals)
        
        # -----------------------------------------------------------------
        # NEW HIGH-SPEED NUMERICAL STAR ANALYSIS
        # -----------------------------------------------------------------
        # Flatten candidate info into a clean, text-minimized JSON block for the prompt
        candidate_json_payload = candidate.json(include={'profile', 'career_history'})
        
        # Call local Qwen for the fast single-integer score
        behavioral_star_score = await extract_star_score(candidate_json_payload)
        
        # Comprehensive Aggregated Weight Matrix Calculation (40/40/20)
        # semantic_score (out of 100), behavioral_star_score (out of 100), platform_score (out of 100)
        composite_score = (semantic_score * 0.40) + (behavioral_star_score * 0.40) + (platform_score * 0.20)
        evaluated_list.append({
            "candidate_id": candidate.candidate_id,
            "final_score": round(composite_score, 2),
            "breakdown": {
                "stage_1_skills_semantic": round(semantic_score, 2),
                "stage_2_behavioral_star": round(behavioral_star_score, 2), # Clean integer score
                "stage_3_platform_signals": round(platform_score, 2)
            }
        })
        
    # 1. Sort the entire candidate roster based on final scores (highest first)
    evaluated_list.sort(key=lambda x: x["final_score"], reverse=True)
    
    # 2. Append the absolute integer ranking order positions
    for index, record in enumerate(evaluated_list, start=1):
        record["rank"] = index

    # 3. Generate a unique session ID and persist rankings in-memory
    session_id = str(uuid.uuid4())
    _session_store[session_id] = {
        "rankings": evaluated_list,
        "total_processed": len(evaluated_list),
    }
        
    return {
        "status": "success",
        "session_id": session_id,
        "total_processed": len(evaluated_list),
        "rankings": evaluated_list
    }
@app.get("/api/rank/leaderboard/{session_id}")
async def get_leaderboard(session_id: str):
    """
    Retrieves previously evaluated rankings for a given session ID.
    Rankings are stored in-memory after /api/rank/evaluate is called.
    """
    session = _session_store.get(session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail=f"Session '{session_id}' not found. It may have expired or the server was restarted."
        )
    return {
        "status": "success",
        "session_id": session_id,
        "total_processed": session["total_processed"],
        "rankings": session["rankings"],
    }


@app.post("/api/rank/export")
async def export_stateless_rankings(
    rankings: List[dict] = Body(...)
):
    """
    Stateless Export Endpoint: Accepts the current sorted candidate 
    rankings state directly from the client and converts it into a 
    downloadable clean Excel Spreadsheet (.xlsx) file stream instantly.
    """
    if not rankings:
        raise HTTPException(status_code=400, detail="Rankings data matrix payload cannot be empty.")
        
    try:
        # Generate the Excel data matrix byte stream out of memory block
        excel_file_stream = convert_rankings_to_excel_stream(rankings)
        
        # Dispatch a native browser-trigger file download attachment signature
        return StreamingResponse(
            excel_file_stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=AI_Recruiter_Leaderboard_Export.xlsx"}
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate tabular file attachment stream: {str(exc)}"
        )

if __name__ == "__main__":
    import uvicorn 
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)