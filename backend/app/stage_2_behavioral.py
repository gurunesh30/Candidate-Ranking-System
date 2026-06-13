import requests
import json
from app.schemas import ProfileModel, CareerHistoryModel
from typing import List

def evaluate_behavioral_star(job_description: str, profile: ProfileModel, career_history: List[CareerHistoryModel]) -> tuple:
    """
    Extracts deep narrative text from candidate profiles and evaluates behavioral 
    competency using a free local Ollama instance.
    """
    # 1. Synthesize target textual descriptions to preserve token counts
    narrative_context = f"Candidate Professional Summary: {profile.summary}\n\n"
    narrative_context += "Detailed Work History:\n"
    
    for job in career_history:
        narrative_context += f"- Role: {job.title} at {job.company} (Duration: {job.duration_months} months)\n"
        narrative_context += f"  Context & Impact: {job.description}\n\n"
        
    # 2. Frame a mathematically strict structural prompt for the local LLM
    prompt = f"""
    Job Description Expectations:
    {job_description}

    Candidate Contextual Timeline:
    {narrative_context}

    Task:
    Evaluate the candidate's achievements using the STAR methodology (Situation, Task, Action, Result). 
    Look for explicit technical metrics, quantitative ownership signals, and real-world results.
    Severely penalize buzzword stuffing lacking factual backup descriptions. 
    Provide a behavioral score between 0 and 100.

    You must output exactly a single, valid raw JSON object. Do not include any conversational text or markdown code blocks like ```json.
    Match this schema structure:
    {{
        "score": 78,
        "justification": "Candidate demonstrates clear leadership metrics in scaling microservices but shows standard performance patterns elsewhere."
    }}
    """

    url = "http://localhost:11434/api/generate"
    payload = {
        "model": "qwen2.5:3b",
        "prompt": prompt,
        "format": "json", # Dictates structural validity at the server core level
        "stream": False
    }

    try:
        response = requests.post(url, json=payload, timeout=45)
        response_data = response.json()
        
        # Parse output data cleanly
        parsed_json = json.loads(response_data["response"])
        return float(parsed_json.get("score", 50.0)), parsed_json.get("justification", "Evaluated locally via Ollama.")
    except Exception as e:
        print(f"Local Inference Warning: {e}")
        return 50.0, "Local contextual processing layer fallback applied."