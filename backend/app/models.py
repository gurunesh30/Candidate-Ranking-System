from pydantic import BaseModel, Field
from typing import List, Dict
import datetime

# Clean, lightweight model for the summary dashboard table
class StoredRankingSummaryItem(BaseModel):
    candidate_id: str
    final_score: float
    breakdown: Dict[str, float]

# Full model extending the summary item to include the long AI text block
class StoredRankingFullItem(StoredRankingSummaryItem):
    ai_justification: str

# The main database document wrapper
class LeaderboardSessionDocument(BaseModel):
    session_id: str = Field(..., description="Unique 8-character session string")
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    total_processed: int
    rankings: List[StoredRankingFullItem] # The database still stores everything safely