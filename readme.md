# AI-Driven Candidate Ranking System
### *Solving the Keyword Blindspot in Recruitment*

**HacktoSkill 2026 · Team Viltrumites**  
| Field | Details |
|---|---|
| **Project Name** | AI-Driven Candidate Ranking System |
| **Hackathon** | HacktoSkill 2026 |
| **Team** | Viltrumites |
| **Domain** | AI / Human Resources Technology |
| **Tech Stack** | FastAPI (Python) + React (Vite) + Local LLM Model + Semantic Embeddings |

---

## The Problem

Traditional Applicant Tracking Systems (ATS) rank candidates based on keyword frequency — meaning a resume stuffed with buzzwords beats a genuinely qualified candidate who describes real achievements in natural language. This is the **Keyword Blindspot**.

**Example:**
- **Candidate A** copies keywords ("Python", "Lead", "Project Management") but has only performed basic solo tasks → ranked **#1**
- **Candidate B** writes *"Guided a team of 4 through a high-pressure database migration, turning around a delayed launch 2 weeks ahead of schedule"* — a perfect fit, but without exact buzzwords → **auto-rejected**

---

## Solution

An AI-driven resume ranking system that thinks like an experienced human recruiter rather than a rigid keyword counter. It accepts a Job Description and a batch of candidate resumes, then outputs a ranked shortlist with transparent, explainable AI justifications.

---

## Implementation Plan

### Stage 1 — Semantic Skill Matching
Cosine similarity between candidate skill vectors and JD requirements. Handles synonyms, related technologies, and domain-equivalent experience — so "guided a migration" maps to "project management" even without the exact phrase.

### Stage 2 — Behavioral & Contextual Alignment
An LLM evaluates candidate achievements using the **STAR method** (Situation, Task, Action, Result) against the implicit behavioral traits in the JD. Includes a **Keyword Stuffing Penalty** that reduces the weight of repetitive buzzwords or isolated skill lists lacking real context.

### Stage 3 — Career Trajectory & Experience Fit
Evaluates career progression, tenure, and seniority alignment. The candidate's profile is treated as a continuous career story to verify that real-world experience aligns with the strategic intent of the role.

---

## Scoring Model

**Final Score = (w_skills × S_skills) + (w_behavior × S_behavior) + (w_trajectory × S_trajectory) + (w_experience × S_experience)**

All weights are adjustable via interactive sliders in the recruiter dashboard and must sum to 100%.

| Dimension | Default Weight | Fresher Focus | Experienced Focus |
|---|---|---|---|
| Semantic Skill Match | 30% | Skills + Projects | Technical Depth |
| Behavioral & Contextual Alignment | 35% | Internships + Learning | Leadership + Impact |
| Career Trajectory & Growth | 20% | Growth Potential | Career Progression |
| Experience & Tenure Fit | 15% | Extracurriculars | Tenure + Seniority |

### Fresher vs. Experienced Handling
A single unified ranked list is maintained for all candidates. Recruiters can apply a filter to view only freshers or only experienced candidates — ranks re-number automatically when filtered. Dimension weights can be dynamically adjusted per candidate type via the dashboard.

### Borderline Candidates
Rather than a hard cutoff, a borderline candidate buffer surfaces candidates who score just below the primary threshold for manual review instead of auto-rejection. The displayed cutoff (e.g. 75) differs from the effective backend threshold (e.g. 70) to surface borderline cases without introducing bias.

---

## Technical Architecture

### Backend — FastAPI (Python) + C++ Core

```
backend/
├── main.py                # FastAPI app — ranking & sample-evaluation endpoints
├── evaluate_sample.py     # CLI script — loads sample_candidates.json, posts 2 candidates for evaluation
├── compile.py             # Compiles the C++ ranker into a native Python extension (.pyd)
├── requirements.txt       # Python dependencies
├── app/
│   ├── schemas.py         # Pydantic models matching the HacktoSkill candidate JSON schema
│   ├── stage_1_skills.py  # Semantic skill matching via sentence-transformers + C++ cosine engine
│   ├── stage_2_behavioral.py  # STAR behavioral evaluation via local Ollama LLM (qwen2.5:3b)
│   └── utils.py           # .docx text extractor & sample candidate JSON loader
└── src/
    └── ranker.cpp         # High-speed C++ cosine similarity engine (pybind11)
```

### Frontend — React + Vite

```
frontend/
├── JobUpload.jsx       # JD input area
├── ResumeUpload.jsx    # Drag-and-drop multi-resume upload
├── CandidateList.jsx   # Sidebar with ranked shortlist + fresher/experienced filter
└── CandidateDetail.jsx # Radar chart, AI explainability card, Blindspot Visualizer
```

### AI Pipeline Flow

```
JD ──────────────────► LLM Context Extractor ──► JD Dimensional Intent ──────────────────┐
                                                                                           ▼
Resume ──────────────► Resume Behavioral &  ──► Structured Resume Profile ──► Hybrid Scoring Engine
                        Skill Extractor                                                    │
                                                                           ┌───────────────┘
                                                                           ▼
                                                              Semantic Score
                                                            + Dimensional Score     ──► Weighted Final Score
                                                            + Trajectory Score             │
                                                                                           ▼
                                                                                   Ranked Shortlist
                                                                                           │
                                                                                           ▼
                                                                               Recruiter Dashboard
```

---

## Sample Candidate Evaluation

The system can load candidate profiles directly from the HacktoSkill challenge dataset (`sample_candidates.json`) and evaluate them against the provided job description (`job_description.docx`) — no manual data entry required.

### How It Works
1. The `.docx` job description is parsed natively using Python's `zipfile` + `xml.etree` (zero external dependencies).
2. The first **2** candidate records are extracted from `sample_candidates.json`.
3. Each candidate is validated against the full Pydantic schema and evaluated through the two-stage pipeline.
4. Results are returned as a ranked JSON payload with scores and AI justifications.

### Two Ways to Run

| Method | Command / Action | Server Required? |
|---|---|---|
| **Standalone script** | `python evaluate_sample.py --standalone` | No |
| **HTTP POST to API** | `python evaluate_sample.py` | Yes (`uvicorn main:app`) |
| **Direct API call** | `POST /api/rank/evaluate/sample` with `{}` body | Yes |

---

## Recruiter Dashboard Features

- **Dynamic weight sliders** — adjust dimension weights live without re-running the full pipeline
- **Side-by-side candidate comparison**
- **Radar charts** — visual breakdown of each candidate's dimensional scores
- **Blindspot Visualizer** — demonstrates how the AI rescues high-performers that traditional ATS would reject
- **Fresher / Experienced filter** with automatic re-ranking

---

## Project Setup

### Repository Structure
```
Candidate-Ranking-System/
├── backend/
│   ├── main.py
│   ├── evaluate_sample.py
│   ├── compile.py
│   ├── app/
│   │   ├── schemas.py
│   │   ├── stage_1_skills.py
│   │   ├── stage_2_behavioral.py
│   │   └── utils.py
│   └── src/
│       └── ranker.cpp
└── frontend/   (planned)
```

### Prerequisites
- Python 3.10+
- C++ compiler (MSVC on Windows / GCC on Linux) for pybind11
- [Ollama](https://ollama.com/) with `qwen2.5:3b` model (optional — falls back gracefully)
- Node.js with Vite (for frontend, when available)

### Quick Start

```bash
# 1. Set up the backend
cd backend
pip install -r requirements.txt

# 2. Compile the C++ ranking engine
python compile.py

# 3. (Optional) Pull the Ollama model for Stage 2 behavioral evaluation
ollama pull qwen2.5:3b

# 4. Run the API server
uvicorn main:app --reload

# 5. Evaluate 2 sample candidates (standalone — no server needed)
python evaluate_sample.py --standalone

# 6. Or evaluate via the running API server
python evaluate_sample.py
```

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/rank/evaluate` | Evaluate a custom list of candidates against a job description |
| POST | `/api/rank/evaluate/sample` | Auto-load and evaluate 2 sample candidates from the challenge dataset |

---

## Milestones

- [X] Finalise tech stack and confirm Gemini API as LLM provider
- [X] Set up project repo with `backend/` and `frontend/` structure
- [X] Local Embedding & Skill Matching (C++ cosine engine via pybind11)
- [X] Integrate Local Ollama Model (`qwen2.5:3b`) for STAR behavioral evaluation
- [X] Implement sample candidate evaluation pipeline (`evaluate_sample.py` + `/api/rank/evaluate/sample`)
- [X] Native `.docx` JD parser and JSON candidate loader (zero-dependency)
- [ ] Build JD parser and resume parser (LLM-powered) — **next milestone**
- [ ] Implement hybrid scoring engine with configurable weights
- [ ] Develop React dashboard with radar charts and Blindspot Visualizer
- [ ] Prepare demo dataset: Candidate A (keyword-stuffer) vs. Candidate B (hidden gem)
- [ ] Verification: upload Lead Developer JD and confirm Candidate B ranks above Candidate A

---

## Open Questions

| Question | Options / Notes |
|---|---|
| **AI/LLM Provider** |Local Models |
| **Backend Language** | Python + FastAPI — recommended for NLP/embeddings |
| **Demo Data** | Pre-configured Candidate A vs. Candidate B scenario for Blindspot Visualizer |
| **Verification Plan** | Unit tests for scoring engine + manual upload test with Lead Developer JD |

---

*HacktoSkill 2026 — Team Viltrumites*
