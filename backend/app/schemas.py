from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class ProfileModel(BaseModel):
    anonymized_name: str
    headline: str
    summary: str
    location: str
    country: str
    years_of_experience: float
    current_title: str
    current_company: str
    current_company_size: str
    current_industry: str

class CareerHistoryModel(BaseModel):
    company: str
    title: str
    start_date: str
    end_date: Optional[str] = None
    duration_months: int
    is_current: bool
    industry: str
    company_size: str
    description: str

class EducationModel(BaseModel):
    institution: str
    degree: str
    field_of_study: str
    start_year: int
    end_year: int
    grade: Optional[str] = None
    tier: str

class SkillModel(BaseModel):
    name: str
    proficiency: str
    endorsements: int
    duration_months: int = 0

class CertificationModel(BaseModel):
    name: str
    issuer: str
    year: int

class LanguageModel(BaseModel):
    language: str
    proficiency: str

class SalaryRangeModel(BaseModel):
    min: float
    max: float

class RedrobSignalsModel(BaseModel):
    profile_completeness_score: float
    signup_date: str
    last_active_date: str
    open_to_work_flag: bool
    profile_views_received_30d: int
    applications_submitted_30d: int
    recruiter_response_rate: float
    avg_response_time_hours: float
    skill_assessment_scores: Dict[str, float]
    connection_count: int
    endorsements_received: int
    notice_period_days: int
    expected_salary_range_inr_lpa: SalaryRangeModel
    preferred_work_mode: str
    willing_to_relocate: bool
    github_activity_score: float
    search_appearance_30d: int
    saved_by_recruiters_30d: int
    interview_completion_rate: float
    offer_acceptance_rate: float
    verified_email: bool
    verified_phone: bool
    linkedin_connected: bool

class CandidateInput(BaseModel):
    candidate_id: str = Field(..., pattern=r"^CAND_[0-9]{7}$")
    profile: ProfileModel
    career_history: List[CareerHistoryModel]
    education: List[EducationModel]
    skills: List[SkillModel]
    certifications: Optional[List[CertificationModel]] = []
    languages: Optional[List[LanguageModel]] = []
    redrob_signals: RedrobSignalsModel