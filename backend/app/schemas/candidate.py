from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class SkillModel(BaseModel):
    name: str
    proficiency: str
    endorsements: int
    duration_months: int

class CareerHistoryModel(BaseModel):
    company: str
    title: str
    start_date: str
    end_date: Optional[str] = None
    duration_months: int
    is_current: bool
    description: str  # This is the goldmine for your STAR parser

class RedrobSignalsModel(BaseModel):
    profile_completeness_score: float
    open_to_work_flag: bool
    notice_period_days: int
    github_activity_score: Optional[int] = None
    skill_assessment_scores: Dict[str, Any]
    interview_completion_rate: Optional[float] = None

class CandidateRecord(BaseModel):
    candidate_id: str
    profile: Dict[str, Any]
    career_history: List[CareerHistoryModel]
    skills: List[SkillModel]
    redrob_signals: RedrobSignalsModel