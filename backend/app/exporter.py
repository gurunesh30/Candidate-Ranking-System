# app/exporter.py
import io
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
