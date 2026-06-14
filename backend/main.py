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

@app.post("/api/rank/evaluate/sample")
async def evaluate_sample_candidates(
    jd_path: str = Body(default=None, embed=True),
    json_path: str = Body(default=None, embed=True),
    count: int = Body(default=2, embed=True)
):
    from app.utils import extract_text_from_docx, load_sample_candidates
    from app.schemas import CandidateInput
    
    # 1. Resolve paths
    resolved_jd_path = jd_path or r"d:\Viltrumites\[PUB] India_runs_data_and_ai_challenge\India_runs_data_and_ai_challenge\job_description.docx"
    resolved_json_path = json_path or r"d:\Viltrumites\[PUB] India_runs_data_and_ai_challenge\India_runs_data_and_ai_challenge\sample_candidates.json"
    
    # 2. Extract JD text
    try:
        job_description = extract_text_from_docx(resolved_jd_path)
    except Exception as e:
        return {"status": "error", "message": f"Failed to extract job description: {str(e)}"}
        
    # 3. Load sample candidates
    try:
        raw_candidates = load_sample_candidates(resolved_json_path, count=count)
    except Exception as e:
        return {"status": "error", "message": f"Failed to load sample candidates: {str(e)}"}
        
    # 4. Parse into CandidateInput models
    candidates = []
    for cand in raw_candidates:
        try:
            candidates.append(CandidateInput(**cand))
        except Exception as e:
            return {"status": "error", "message": f"Candidate validation failed for {cand.get('candidate_id')}: {str(e)}"}
            
    # 5. Reuse the existing evaluate_candidates core logic
    results = []
    for candidate in candidates:
        semantic_score = evaluate_semantic_skills(job_description, candidate.skills)
        behavioral_score, ai_reasoning = evaluate_behavioral_star(
            job_description, 
            candidate.profile, 
            candidate.career_history
        )
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
        
    results.sort(key=lambda x: x["final_score"], reverse=True)
    return {
        "status": "success",
        "total_processed": len(candidates),
        "rankings": results
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)