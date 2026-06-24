from pydantic import BaseModel, Field
from typing import List

class JobDescriptionSchema(BaseModel):
    """
    Schema for a parsed Job Description.
    """
    job_title: str = Field(..., description="The title of the job position.")
    department: str = Field(..., description="The department the job belongs to.")
    experience_required: str = Field(..., description="The experience requirements for the job.")
    core_technical_skills: List[str] = Field(..., description="List of core technical skills required.")
    behavioral_competencies: List[str] = Field(..., description="List of behavioral competencies/soft skills.")
    detailed_responsibilities: str = Field(..., description="Detailed explanation of the job responsibilities.")
