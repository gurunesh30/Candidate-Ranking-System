from fastapi import FastAPI, Body, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uuid

from app.schemas import CandidateModel
from app.stage_1_skills import evaluate_semantic_skills
from app.stage_2_behavioral import evaluate_behavioral_star
from app.stage_3_signals import calculate_platform_signals 

# MongoDB Connection & Validation Imports
from app.db import get_leaderboard_collection
from app.models import LeaderboardSessionDocument, StoredRankingItem

from typing import List

app = FastAPI(title="Talent Context Ranker API (MongoDB)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def _execute_and_serialize_pipeline(job_description: str, candidates: List[CandidateModel]) -> List[dict]:
    """
    Executes the 3-stage ranking logic across all candidates and returns standard dictionaries.
    """
    results = []
    for candidate in candidates:
        # Phase 1: Native C++ Core Module
        semantic_score = evaluate_semantic_skills(job_description, candidate.skills)
        
        # Phase 2: Local Ollama STAR Evaluation Engine
        behavioral_score, ai_reasoning = evaluate_behavioral_star(
            job_description, 
            candidate.profile, 
            candidate.career_history
        )
        
        # Phase 3: Platform Telemetry Signal Evaluation
        platform_score = calculate_platform_signals(candidate.redrob_signals)
        
        # Comprehensive Aggregated Weight Matrix Logic Matrix Calculation
        composite_score = (semantic_score * 0.40) + (behavioral_score * 0.40) + (platform_score * 0.20)
        
        results.append({
            "candidate_id": candidate.candidate_id,
            "final_score": round(composite_score, 2),
            "breakdown": {
                "stage_1_skills_semantic": round(semantic_score, 2),
                "stage_2_behavioral_star": round(behavioral_score, 2),
                "stage_3_platform_signals": round(platform_score, 2)
            },
            "ai_justification": ai_reasoning
        })
        
    # Order rankings directly by best score prior to returning
    results.sort(key=lambda x: x["final_score"], reverse=True)
    return results


@app.post("/api/rank/evaluate")
async def evaluate_candidates(
    job_description: str = Body(..., embed=True),
    candidates: List[CandidateModel] = Body(...),
    collection = Depends(get_leaderboard_collection)
):
    session_id = str(uuid.uuid4())[:8]  # Quick short tracking signature
    
    # 1. Run evaluation matrix
    processed_rankings = await _execute_and_serialize_pipeline(job_description, candidates)
    
    # 2. Build the BSON Document schema object
    session_doc = LeaderboardSessionDocument(
        session_id=session_id,
        total_processed=len(processed_rankings),
        rankings=processed_rankings
    )
    
    # 3. Perform an async atomic write to Mongo
    # .dict() exports clean nested JSON directly to the collection
    await collection.insert_one(session_doc.dict())
    
    return {
        "status": "success",
        "session_id": session_id,
        "total_processed": len(processed_rankings),
        "rankings": processed_rankings
    }


@app.get("/api/rank/leaderboard/{session_id}")
async def get_stored_leaderboard(
    session_id: str, 
    collection = Depends(get_leaderboard_collection)
):
    """
    Fetches the persistent JSON object straight from MongoDB.
    Bypasses C++ computational layers and local LLM runtime delays completely.
    """
    # Async match projection to locate session array footprint
    document = await collection.find_one({"session_id": session_id})
    
    if not document:
        raise HTTPException(status_code=404, detail="Leaderboard execution signature not found.")
        
    return {
        "status": "success",
        "session_id": document["session_id"],
        "total_processed": document["total_processed"],
        "rankings": document["rankings"]
    }


if __name__ == "__main__":
    import uvicorn 
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)