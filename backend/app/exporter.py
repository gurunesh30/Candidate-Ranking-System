# app/exporter.py
import io
import pandas as pd

def generate_leaderboard_excel(document: dict) -> io.BytesIO:
    """
    Takes a raw MongoDB document snapshot from a session, flattens the 
    nested candidate dictionaries, and builds an in-memory Excel spreadsheet stream.
    """
    rankings_list = document.get("rankings", [])
    
    # 1. Map out structural columns by flattening the nested MongoDB elements
    flattened_rows = []
    for index, candidate in enumerate(rankings_list, start=1):
        breakdown = candidate.get("breakdown", {})
        
        flattened_rows.append({
            "Current Leaderboard Rank": candidate.get("rank", index),
            "Candidate Tracker ID": candidate.get("candidate_id"),
            "Composite Evaluation Score": candidate.get("final_score"),
            "Stage 1: Core C++ Skill Match": breakdown.get("stage_1_skills_semantic"),
            "Stage 2: Behavioral STAR Score": breakdown.get("stage_2_behavioral_star"),
            "Stage 3: Platform Telemetry Signals": breakdown.get("stage_3_platform_signals"),
            "Multi-Agent AI Justification Notes": candidate.get("ai_justification")
        })
        
    # 2. Compile row structures into a Pandas DataFrame Matrix
    df = pd.DataFrame(flattened_rows)
    
    # 3. Stream data straight into an ephemeral bytes buffer block
    excel_buffer = io.BytesIO()
    with pd.ExcelWriter(excel_buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="AI Recruiter Analytics")
        
    # Reset stream cursor pointer position so FastAPI can read it out from the beginning
    excel_buffer.seek(0)
    return excel_buffer

def convert_rankings_to_excel_stream(rankings_list: list) -> io.BytesIO:
    """
    Converts a list of candidate rankings directly to an Excel spreadsheet stream.
    """
    return generate_leaderboard_excel({"rankings": rankings_list})