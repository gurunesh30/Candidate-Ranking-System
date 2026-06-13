from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import CandidateInput
from app.stage_1_skills import evaluate_semantic_skills
from app.stage_2_behavioral import evaluate_behavioral_star
from typing import List

app = FastAPI(title="Talent Context Ranker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/rank/evaluate")
async def evaluate_candidates(
    job_description: str = Body(..., embed=True),
    candidates: List[CandidateInput] = Body(...)
):
    results = []
    
    for candidate in candidates:
        # Phase 1: Local Mathematical Skills Vector Space Core
        semantic_score = evaluate_semantic_skills(job_description, candidate.skills)
        
        # Phase 2: Local AI Behavioral Star Narrative Breakdown
        behavioral_score, ai_reasoning = evaluate_behavioral_star(
            job_description, 
            candidate.profile, 
            candidate.career_history
        )
        
        # Temporary Composite Score aggregation (40% Skills, 60% STAR Behavioral Experience)
        composite_score = (semantic_score * 0.4) + (behavioral_score * 0.6)
        
        results.append({
            "candidate_id": candidate.candidate_id,
            "final_score": round(composite_score, 2),
            "breakdown": {
                "stage_1_skills_semantic": round(semantic_score, 2),
                "stage_2_behavioral_star": round(behavioral_score, 2)
            },
            "ai_justification": ai_reasoning
        })
        
    # Sort rankings smoothly based on final score priority
    results.sort(key=lambda x: x["final_score"], reverse=True)
    
    return {
        "status": "success",
        "total_processed": len(candidates),
        "rankings": results
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)