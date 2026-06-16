from pydantic import BaseModel, Field
from typing import List, Dict, Any
import datetime

class StoredRankingItem(BaseModel):
    candidate_id: str
    final_score: float
    breakdown: Dict[str, float]
    ai_justification: str

class LeaderboardSessionDocument(BaseModel):
    session_id: str = Field(..., description="Unique 8-character session string")
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    total_processed: int
    rankings: List[StoredRankingItem]