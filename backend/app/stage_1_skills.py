import cpp_ranker  # Imports your compiled C++ binary module natively!
from app.schemas import SkillModel
# pyrefly: ignore [missing-import]
from sentence_transformers import SentenceTransformer
from typing import List

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def evaluate_semantic_skills(job_description_text: str, candidate_skills: List[SkillModel]) -> float:
    if not candidate_skills:
        return 0.0

    # 1. Compute vectors into standard array representations
    jd_vector = embedding_model.encode(job_description_text).tolist()
    
    # 2. Package skills into a clean list of tuples expected by the C++ memory module
    prepared_skills = []
    for skill in candidate_skills:
        skill_vector = embedding_model.encode(skill.name).tolist()
        prepared_skills.append((skill_vector, skill.proficiency.lower(), skill.duration_months))
    
    # 3. Ship data over the bridge—C++ processes it at bare-metal execution speeds
    final_score = cpp_ranker.calculate_fast_stage_1(jd_vector, prepared_skills)
    return final_score