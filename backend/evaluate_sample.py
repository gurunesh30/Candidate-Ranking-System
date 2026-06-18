import os
import sys
import argparse
import json
import requests
from pathlib import Path

# Add backend directory to path so imports work correctly
backend_path = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_path))

from app.utils import extract_text_from_docx, load_sample_candidates

DEFAULT_JD_PATH = r"d:\Viltrumites\[PUB] India_runs_data_and_ai_challenge\India_runs_data_and_ai_challenge\job_description.docx"
DEFAULT_JSON_PATH = r"d:\Viltrumites\[PUB] India_runs_data_and_ai_challenge\India_runs_data_and_ai_challenge\sample_candidates.json"

def main():
    parser = argparse.ArgumentParser(description="Evaluate 2 sample candidates against the Job Description.")
    parser.add_argument("--jd", type=str, default=DEFAULT_JD_PATH, help="Path to job_description.docx")
    parser.add_argument("--json", type=str, default=DEFAULT_JSON_PATH, help="Path to sample_candidates.json")
    parser.add_argument("--standalone", action="store_true", help="Run evaluation in-process using FastAPI TestClient")
    parser.add_argument("--url", type=str, default="http://localhost:8000/api/rank/evaluate", help="Target API URL for POST mode")
    parser.add_argument("--save", type=str, default=None, help="Optional path to save output as a JSON file")
    
    args = parser.parse_args()
    
    # Debug messages sent to sys.stderr so your stdout contains ONLY clean JSON if piped
    print("==================================================", file=sys.stderr)
    print("AI-Driven Candidate Ranking System: Sample Runner", file=sys.stderr)
    print("==================================================", file=sys.stderr)
    
    # 1. Load Job Description
    print(f"\n[1/3] Extracting Job Description from: {args.jd}", file=sys.stderr)
    try:
        job_description = extract_text_from_docx(args.jd)
        print(f"Success! Extracted {len(job_description)} characters of text.", file=sys.stderr)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
        
    # 2. Load exactly 2 candidates
    print(f"\n[2/3] Loading 2 sample candidates from: {args.json}", file=sys.stderr)
    try:
        candidates = load_sample_candidates(args.json, count=2)
        print(f"Success! Loaded {len(candidates)} candidates.", file=sys.stderr)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
        
    # 3. Formulate payload
    payload = {
        "job_description": job_description,
        "candidates": candidates
    }
    
    # 4. Post/Evaluate
    print(f"\n[3/3] Evaluating candidates...", file=sys.stderr)
    if args.standalone:
        print("Running in STANDALONE mode using FastAPI TestClient (in-process)...", file=sys.stderr)
        try:
            from fastapi.testclient import TestClient
            from main import app
            client = TestClient(app)
            response = client.post("/api/rank/evaluate", json=payload)
            response_code = response.status_code
            response_data = response.json()
        except Exception as e:
            print(f"Standalone mode failed: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        print(f"Running in POST mode. Sending HTTP request to: {args.url}", file=sys.stderr)
        try:
            response = requests.post(args.url, json=payload, timeout=60)
            response_code = response.status_code
            response_data = response.json()
        except requests.exceptions.ConnectionError:
            print(f"Error: Could not connect to API server at {args.url}.", file=sys.stderr)
            print("Make sure the server is running, or run with '--standalone' to evaluate in-process.", file=sys.stderr)
            sys.exit(1)
        except Exception as e:
            print(f"POST request failed: {e}", file=sys.stderr)
            sys.exit(1)
            
    # 5. Output Clean JSON Structural Results
    if response_code != 200:
        print(f"\nError Response (Status {response_code}):", file=sys.stderr)
        print(json.dumps(response_data, indent=2))
        sys.exit(1)
    else:
        print("\n=================== JSON OUTPUT ==================", file=sys.stderr)
        # This outputs the perfect structural JSON payload to the terminal console
        final_json_output = json.dumps(response_data, indent=2)
        print(final_json_output)
        print("==================================================\n", file=sys.stderr)
        
        # Save output to file if requested via parameters
        if args.save:
            try:
                with open(args.save, 'w', encoding='utf-8') as f:
                    json.dump(response_data, f, indent=2)
                print(f"Successfully exported JSON results to: {args.save}", file=sys.stderr)
            except Exception as e:
                print(f"Failed to save JSON file: {e}", file=sys.stderr)

if __name__ == "__main__":
    main()