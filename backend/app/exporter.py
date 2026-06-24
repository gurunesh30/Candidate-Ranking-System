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
import csv

TOP_N = 100  # Only the top N candidates are ranked; the rest are rejected


def generate_leaderboard_csv(document: dict) -> io.BytesIO:
    """
    Takes a raw session document, keeps only the top TOP_N candidates as ranked
    and marks the rest as rejected, then streams a CSV with four columns:
    candidate_id, rank, score, ai_reasoning.

    Supports both 'reasoning' (new cascade pipeline) and legacy 'ai_reasoning' keys.
    """
    rankings_list = document.get("rankings", [])

    # Sort descending by final_score to guarantee correct ordering
    rankings_list = sorted(rankings_list, key=lambda x: x.get("final_score", 0), reverse=True)

    output = io.BytesIO()
    text_buffer = io.StringIO()

    writer = csv.DictWriter(
        text_buffer,
        fieldnames=["candidate_id", "rank", "score", "ai_reasoning"],
    )
    writer.writeheader()

    for index, candidate in enumerate(rankings_list, start=1):
        if index <= TOP_N:
            rank_value = index
            # Accept both key names — new pipeline uses "reasoning"
            ai_reasoning = (
                candidate.get("reasoning")
                or candidate.get("ai_reasoning")
                or ""
            )
        else:
            rank_value = "rejected"
            ai_reasoning = "rejected"

        writer.writerow({
            "candidate_id": candidate.get("candidate_id"),
            "rank": rank_value,
            "score": round(candidate.get("final_score", 0), 2),
            "ai_reasoning": ai_reasoning,
        })

    output.write(text_buffer.getvalue().encode("utf-8"))
    output.seek(0)
    return output


def convert_rankings_to_csv_stream(rankings_list: list) -> io.BytesIO:
    """
    Converts a list of candidate ranking dicts directly to a CSV byte stream.
    """
    return generate_leaderboard_csv({"rankings": rankings_list})
