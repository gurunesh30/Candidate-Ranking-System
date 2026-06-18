from fastapi import FastAPI, Body, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uuid

# Base data parsing models
from app.schemas import CandidateModel
from app.stage_1_skills import evaluate_semantic_skills
from app.stage_2_behavioral import evaluate_behavioral_star
from app.stage_3_signals import calculate_platform_signals 

# MongoDB Connection & Validation Imports
from app.db import get_leaderboard_collection
from app.models import LeaderboardSessionDocument

from typing import List

app = FastAPI(title="Talent Context Ranker API (MongoDB Optimized)")

# Enable CORS for frontend dashboard communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def _execute_and_serialize_pipeline(job_description: str, candidates: List[CandidateModel]) -> List[dict]:
    """
    Executes the 3-stage ranking logic across all candidates, aggregates
    scores using the composite matrix weights, and returns a sorted list of dictionaries.
    """
    results = []
    for candidate in candidates:
        # Phase 1: Native C++ Core Module (Semantic Skill Matrix)
        semantic_score = evaluate_semantic_skills(job_description, candidate.skills)
        
        # Phase 2: Local Ollama STAR Narrative Evaluation Engine
        behavioral_score, ai_reasoning = evaluate_behavioral_star(
            job_description, 
            candidate.profile, 
            candidate.career_history
        )
        
        # Phase 3: Platform Telemetry & Availability Signal Evaluation
        platform_score = calculate_platform_signals(candidate.redrob_signals)
        
        # Comprehensive Aggregated Weight Matrix Logic Calculation:
        # 40% Matrix Skills Match + 40% STAR Contextual Alignment + 20% Intent/Availability Signals
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
        
    # Order rankings cleanly based on highest final leaderboard score priority
    results.sort(key=lambda x: x["final_score"], reverse=True)
    return results


@app.post("/api/rank/evaluate")
async def evaluate_candidates(
    job_description: str = Body(..., embed=True),
    candidates: List[CandidateModel] = Body(...),
    collection = Depends(get_leaderboard_collection)
):
    """
    Triggers the complete AI ranking pipeline, persists the deep evaluation 
    data into MongoDB, and returns a unique, secure session_id tracking slug.
    """
    # Generate a cryptographically secure, unguessable tracking signature
    session_id = str(uuid.uuid4())
    
    # 1. Run evaluation matrix calculations
    processed_rankings = await _execute_and_serialize_pipeline(job_description, candidates)
    
    # 2. Build the Document schema structure matching MongoDB storage contract
    session_doc = LeaderboardSessionDocument(
        session_id=session_id,
        total_processed=len(processed_rankings),
        rankings=processed_rankings
    )
    
    # 3. Perform an atomic async write to MongoDB (.dict() handles nested json parsing)
    await collection.insert_one(session_doc.dict())
    
    return {
        "status": "success",
        "session_id": session_id,
        "total_processed": len(processed_rankings),
        "rankings": processed_rankings
    }


# =====================================================================
# OPTIMIZED DATABASE PROJECTION ENDPOINTS (SOLUTION 1)
# =====================================================================

@app.get("/api/rank/leaderboard/{session_id}")
async def get_stored_leaderboard(
    session_id: str, 
    collection = Depends(get_leaderboard_collection)
):
    """
    Optimized Summary Endpoint: Fetches the candidate roster layout 
    WITHOUT the heavy text paragraphs. Perfect for lightning-fast table renders.
    """
    # MongoDB Projection: Setting "rankings.ai_justification": 0 tells the database 
    # to omit the long 7-8 lines of text from disk/network transmission entirely.
    document = await collection.find_one(
        {"session_id": session_id},
        projection={"_id": 0, "rankings.ai_justification": 0}
    )
    
    if not document:
        raise HTTPException(status_code=404, detail="Leaderboard execution signature not found.")
        
    return document


@app.get("/api/rank/leaderboard/{session_id}/candidate/{candidate_id}/justification")
async def get_candidate_justification(
    session_id: str,
    candidate_id: str,
    collection = Depends(get_leaderboard_collection)
):
    """
    Deep-Dive Detail Endpoint: Fetches ONLY the 7-8 line text block for 
    a specific candidate when a recruiter clicks their card or 'View Details'.
    """
    # Find the matching session document and use MongoDB's '$elemMatch' projection
    # to extract ONLY the targeted candidate's array element out of the database.
    document = await collection.find_one(
        {"session_id": session_id, "rankings.candidate_id": candidate_id},
        projection={"_id": 0, "rankings.$": 1}
    )
    
    if not document or "rankings" not in document:
        raise HTTPException(status_code=404, detail="Candidate or Session matching signature not found.")
        
    # Extract the nested paragraph text from the single matching array slice
    target_candidate = document["rankings"][0]
    return {
        "candidate_id": candidate_id,
        "ai_justification": target_candidate.get("ai_justification", "No justification recorded.")
    }


if __name__ == "__main__":
    import uvicorn 
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)