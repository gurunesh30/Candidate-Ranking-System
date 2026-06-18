# `__MACOSX` Directory Analysis & Implementation Strategy

## Analysis of `__MACOSX`
The `__MACOSX` folder and its contents (like `__MACOSX/[PUB] India_runs_data_and_ai_challenge`) are simply metadata artifacts created by the macOS built-in compression utility. When a user zips files on a Mac, the operating system includes resource forks, extended attributes, and folder view settings in a hidden `__MACOSX` directory containing `._` prefixed files (e.g., `._.DS_Store`).

**Verdict:** These files are completely useless for our AI-Driven Candidate Ranking System. They contain no actual data, code, or resumes. 

The actual dataset from the Hackathon challenge is located in the adjacent sibling directory: `[PUB] India_runs_data_and_ai_challenge`.

---

## Analysis of the Real Dataset
Inside `[PUB] India_runs_data_and_ai_challenge/India_runs_data_and_ai_challenge`, we have the real payload for the "HacktoSkill 2026" challenge, which perfectly maps to the architecture outlined in your `readme.md`:

1. **`job_description.docx`**: This aligns perfectly with the JD input needed for the **JobUpload.jsx** component and the **Backend JD Parser**.
2. **`candidates.jsonl` (487MB) & `sample_candidates.json` (300KB)**: This is the bulk candidate resume data. We can use the sample to locate our archetypal "Candidate A (keyword-stuffer)" and "Candidate B (hidden gem)" for the **Blindspot Visualizer Demo**.
3. **`candidate_schema.json`**: Explains the exact structure of the candidate data, which saves us from having to parse raw PDFs from scratch.
4. **`sample_submission.csv`, `submission_spec.docx`, & `validate_submission.py`**: Tells us exactly how the Hackathon judges expect the final output to be formatted for scoring.

---

## Further Implementation Strategy

Based on your `readme.md`, here are the actionable next steps to integrate this dataset into the Viltrumites project:

### 1. Repository Cleanup
- Delete the `__MACOSX` folder entirely to reduce repository clutter.
- Add `.DS_Store` and `__MACOSX/` to your `.gitignore`.

### 2. Dataset Integration (Backend Engine)
- Move `sample_candidates.json` and `job_description.docx` into a new `backend/data/` folder to serve as our primary test fixtures.
- **Adapt the Resume Parser:** Update `backend/resume_parser.py` to ingest the JSON structured data (using `candidate_schema.json`) rather than building a complex PDF parser. Since the Hackathon provides pre-structured candidate data, this massively simplifies the extraction process and allows us to focus purely on the **Hybrid Scoring Engine**.
- Map the JSON candidate fields (e.g., work experience, education, skills) directly into Stage 1 (Semantic Skill Matching) and Stage 3 (Career Trajectory).

### 3. Fulfilling the Project Milestones
- **Demo Dataset Prep:** Write a small Python script to sift through `sample_candidates.json` and isolate two specific profiles to act as "Candidate A" and "Candidate B" for the React dashboard.
- **JD Parser Tuning:** Tune the `backend/jd_parser.py` Gemini prompt to extract the "Core Intent, Behavioral Traits, and Technical Skills" directly from the text within the provided `job_description.docx`.
- **Hackathon Submission:** Ensure that our final output from the ranking engine conforms to `sample_submission.csv` and successfully passes the `validate_submission.py` script so that the team actually gets points during judging!
