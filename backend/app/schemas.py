from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from typing import Any, List, Dict, Optional

class SalaryRangeModel(BaseModel):
    min: float
    max: float

class RedRobSignalsModel(BaseModel):
    profile_completeness_score: float
    signup_date: Optional[str] = None
    last_active_date: Optional[str] = None
    open_to_work_flag: bool
    profile_views_received_30d: Optional[int] = 0
    applications_submitted_30d: Optional[int] = 0
    recruiter_response_rate: float
    avg_response_time_hours: Optional[float] = 0.0
    github_activity_score: float
    connection_count: Optional[int] = 0
    endorsements_received: Optional[int] = 0
    notice_period_days: int
    expected_salary_range_inr_lpa: SalaryRangeModel
    preferred_work_mode: Optional[str] = "onsite"
    willing_to_relocate: Optional[bool] = False
    search_appearance_30d: Optional[int] = 0
    saved_by_recruiters_30d: Optional[int] = 0
    interview_completion_rate: Optional[float] = 0.0
    offer_acceptance_rate: Optional[float] = 0.0
    verified_email: Optional[bool] = True
    verified_phone: Optional[bool] = False
    linkedin_connected: Optional[bool] = False
    skill_assessment_scores: Dict[str, float] = Field(default_factory=dict)


# =====================================================================
# CORE CANDIDATE PROFILE & LIFECYCLE SCHEMAS
# =====================================================================
class ProfileDetailsModel(BaseModel):
    anonymized_name: str
    headline: str
    summary: str
    location: str
    country: str
    years_of_experience: float
    current_title: Optional[str] = None
    current_company: Optional[str] = None
    current_company_size: Optional[str] = None
    current_industry: Optional[str] = None

class CareerHistoryModel(BaseModel):
    company: str
    title: str
    start_date: str
    end_date: Optional[str] = None
    duration_months: int
    is_current: bool
    industry: Optional[str] = None
    company_size: Optional[str] = None
    description: str

class EducationModel(BaseModel):
    institution: str
    degree: str
    field_of_study: str
    start_year: int
    end_year: int
    grade: Optional[str] = None
    tier: Optional[str] = "tier_4"

class SkillModel(BaseModel):
    name: str
    proficiency: str
    endorsements: Optional[int] = 0
    duration_months: int


# =====================================================================
# MAIN PIPELINE INPUT SCHEMA
# =====================================================================
class CandidateModel(BaseModel):
    candidate_id: str
    profile: ProfileDetailsModel
    career_history: List[CareerHistoryModel]
    education: List[EducationModel]
    skills: List[SkillModel]
    certifications: List[str] = Field(default_factory=list)
    languages: List[Dict[str, str]] = Field(default_factory=list)
    redrob_signals: RedRobSignalsModel  # Phase 3 data contract binding

    certifications: List[Any] = Field(default_factory=list)  # supports str or {name,issuer,year} objects
    languages: List[Dict[str, str]] = Field(default_factory=list)
    redrob_signals: RedRobSignalsModel  # Phase 3 data contract binding

class JobDescriptionInput(BaseModel):
    """Structured JD produced by the parser pipeline."""
    job_title: str = "Unknown"
    department: str = "Unknown"
    experience_required: str = "Unknown"
    core_technical_skills: List[str] = Field(default_factory=list)
    behavioral_competencies: List[str] = Field(default_factory=list)
    detailed_responsibilities: str = "Unknown"

    def to_evaluation_text(self) -> str:
        """Condense structured JD into a focused text string for semantic embedding."""
        skills_text = ", ".join(self.core_technical_skills) if self.core_technical_skills else ""
        parts = [
            f"Role: {self.job_title}.",
            f"Department: {self.department}.",
            f"Experience: {self.experience_required}.",
        ]
        if skills_text:
            parts.append(f"Required skills: {skills_text}.")
        if self.detailed_responsibilities and self.detailed_responsibilities != "Unknown":
            parts.append(f"Responsibilities: {self.detailed_responsibilities}")
        return " ".join(parts)


class RankingPayloadSchema(BaseModel):
    job_description: str
    candidates: List[CandidateModel]