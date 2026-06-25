# RedRob AI — Intelligent Candidate Ranking System

> **HacktoSkill 2026 · Team Viltrumites**

An AI-driven candidate ranking engine that thinks like an experienced recruiter — not a keyword counter. It processes a job description and a large candidate pool, runs a multi-stage evaluation pipeline entirely on local hardware, and surfaces the top 100 best-fit candidates with transparent AI reasoning.

---

## Table of Contents

1. [The Problem](#the-problem)
2. [Solution Overview](#solution-overview)
3. [Architecture](#architecture)
4. [Pipeline Workflow](#pipeline-workflow)
5. [Scoring Model](#scoring-model)
6. [API Reference](#api-reference)
7. [Project Setup](#project-setup)
8. [Frontend Features](#frontend-features)
9. [Tech Stack](#tech-stack)

---

## The Problem

Traditional ATS systems rank candidates by keyword frequency. A resume stuffed with buzzwords beats a genuinely qualified candidate who describes real achievements in plain language — this is the **Keyword Blindspot**.

| | Keyword-stuffer | Hidden gem |
|---|---|---|
| Resume | Copies "Python, Lead, Agile" verbatim | "Guided a team of 4 through a high-pressure DB migration, delivered 2 weeks early" |
| ATS rank | **#1** | **Auto-rejected** |
| RedRob rank | Low — penalised for hollow buzzwords | **Top 10** — semantic skill match + STAR behavioral score |

---

## Solution Overview

RedRob AI evaluates every candidate across three stages:

| Stage | Method | Weight |
|---|---|---|
| **Stage 1 — Semantic Skill Match** | `all-MiniLM-L6-v2` embeddings + C++ cosine engine | 40% |
| **Stage 2 — Behavioral STAR Score** | Local `Qwen 2.5:3b` LLM via Ollama | 40% |
| **Stage 3 — Platform Telemetry** | GitHub activity + skill assessments + availability signals | 20% |

**Final Score = (S1 × 0.40) + (S2 × 0.40) + (S3 × 0.20)**

---

## Architecture

```
Candidate-Ranking-System/
├── backend/
│   ├── main.py                        # FastAPI app — all endpoints + cascade funnel
│   ├── compile.py                     # Compiles C++ ranker → native .pyd extension
│   ├── requirements.txt
│   ├── data/
│   │   └── candidate.jsonl            # Candidate pool (loaded at startup, gitignored)
│   ├── src/
│   │   └── ranker.cpp                 # C++ cosine similarity engine (pybind11)
│   └── app/
│       ├── schemas.py                 # Pydantic models — CandidateModel, JobDescriptionInput
│       ├── stage_1_skills.py          # Semantic skill scoring via sentence-transformers + C++
│       ├── stage_2_behavioral.py      # STAR behavioral scoring via Ollama
│       ├── stage_3_signals.py         # Platform telemetry signal calculator
│       ├── insight_matrix.py          # 150-sentence insight corpus + cosine reasoning engine
│       ├── agent_prompts.py           # LLM prompt templates
│       ├── exporter.py                # CSV export generator
│       └── sandbox_jd_parser/
│           ├── extractor.py           # .docx → structured JD via Qwen + regex fallback
│           ├── pipeline.py            # Orchestrates extraction → Pydantic validation → JSON
│           └── schemas.py             # JobDescriptionSchema (Pydantic)
├── frontend/
│   └── ui/
│       ├── src/
│       │   ├── pages/
│       │   │   ├── Landing.jsx        # JD upload + analysis trigger
│       │   │   ├── Dashboard.jsx      # Ranked candidate grid
│       │   │   ├── CandidateDetail.jsx
│       │   │   └── ComparisonPage.jsx
│       │   ├── components/
│       │   │   ├── AnalysisLoadingScreen.jsx  # Live SSE progress tracker
│       │   │   ├── CandidateCard.jsx
│       │   │   ├── RadarChartComponent.jsx
│       │   │   ├── WeightSliderPanel.jsx
│       │   │   └── BlindspotVisualizer.jsx
│       │   └── services/
│       │       └── api.js             # All backend calls + SSE progress URL
│       └── package.json
├── dataset/                           # Challenge dataset (gitignored)
├── docs/
│   └── agent.md                       # Architecture prompts & agent instructions
└── .gitignore
```

---

## Pipeline Workflow

### Startup (once, on server boot)
```
candidate.jsonl ──► line-by-line parse ──► List[CandidateModel] (_candidate_pool)
                                                        │
all-MiniLM-L6-v2 ──► encode 150 insight strings ──► GLOBAL_INSIGHT_EMBEDDINGS (numpy cache)
```

### Per-request flow (`POST /api/rank/start`)

```
Frontend uploads job_description.docx
        │
        ▼
POST /api/jd/parse
  └── Qwen 2.5:3b parses .docx → structured JD JSON
  └── Returns: { parsed_jd, evaluation_text }
        │
        ▼
Frontend generates job_id → opens SSE stream to GET /api/progress/{job_id}
        │
        ▼
POST /api/rank/start  { ...parsedJD, job_id }
        │
        ├── STEP 1+2  ── Stage 1: all candidates scored via C++ cosine engine
        │                         bounded min-heap → retain top 500  O(n log 500)
        │                         ── 99,500 candidates discarded, GC freed
        │
        ├── STEP 3+4  ── Stage 2: Qwen STAR behavioral score  (top 500 only)
        │              ── Stage 3: Platform telemetry signals  (top 500 only)
        │              ── Composite score applied → bounded min-heap → top 100  O(500 log 100)
        │
        ├── STEP 5+6  ── Cosine similarity: candidate text vs. 150-vector insight matrix
        │              ── Best-matching insight sentence assigned as "reasoning"
        │
        └── STEP 7   ── Rank 1→100 injected → session stored → JSON response
                                                                      │
                                                                      ▼
                                          Frontend receives top-100 (V8-safe payload)
                                          → navigate to Dashboard with rankings in state
                                          → SSE stream closes (done = true)
```

### Progress tracking (SSE)

The backend emits real-time JSON snapshots to `GET /api/progress/{job_id}` throughout the pipeline:

| Stage key | % range | Description |
|---|---|---|
| `starting` | 0–5 | JD evaluation text built |
| `stage1` | 5–35 | Skill scoring across full candidate pool |
| `stage1_done` | 35 | Top 500 shortlisted |
| `stage2_3` | 35–88 | Deep behavioral + telemetry pass |
| `insights` | 88–99 | Cosine insight assignment |
| `complete` | 100 | Top 100 ranked and ready |

---

## Scoring Model

### Stage 1 — Semantic Skill Match (40%)
- JD text and each candidate skill name are encoded with `all-MiniLM-L6-v2`
- Cosine similarity computed via native C++ module (`cpp_ranker.pyd`) — compiled from `ranker.cpp` using pybind11
- Handles synonyms, related technologies, and domain-equivalent phrasing

### Stage 2 — Behavioral STAR Score (40%)
- Candidate profile + career history sent to local `Qwen 2.5:3b` via Ollama
- Prompt enforces single integer output (0–100), no filler text
- Evaluates: Situation, Task, Action, Result completeness
- Penalises hollow buzzword lists lacking factual context

### Stage 3 — Platform Telemetry (20%)
- GitHub activity score (50% of stage weight)
- Skill assessment scores from platform (50% of stage weight)
- Notice period and open-to-work flags applied as availability multipliers
- Hard-clamped to [0, 100]

### AI Reasoning Assignment
For each of the final top 100 candidates:
- Experience text (headline + summary + top 3 roles) is encoded with `all-MiniLM-L6-v2`
- Dot-product similarity computed against the 150-vector `GLOBAL_INSIGHT_EMBEDDINGS` cache
- Best-matching sentence from the static 150-insight corpus is assigned as `reasoning`
- No LLM call required — fully deterministic, zero latency

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/jd/parse` | Upload `.docx` JD → returns structured `parsed_jd` JSON |
| `POST` | `/api/rank/start` | Trigger ranking against loaded pool; accepts `{ ...parsedJD, job_id }` |
| `GET` | `/api/progress/{job_id}` | SSE stream — emits `{ stage, pct, detail, done }` snapshots |
| `GET` | `/api/rank/leaderboard/{session_id}` | Retrieve stored top-100 for a session |
| `POST` | `/api/rank/evaluate` | Legacy batch endpoint (small payloads / testing only) |
| `POST` | `/api/rank/export` | Stream top-100 rankings as a `.csv` file |

### CSV export columns
`candidate_id`, `rank`, `score`, `ai_reasoning`
Candidates beyond rank 100 are marked `rejected`.

---

## Project Setup

The entire stack — backend, frontend, and local LLM — runs as Docker containers. No manual Python environment, Node install, or Ollama setup required on your machine beyond Docker itself.

### Prerequisites

| Dependency | Notes |
|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | v24+ recommended |
| `docker compose` | Included with Docker Desktop |
| `candidate.jsonl` | Place in `backend/data/` before starting (gitignored) |

### Services

| Container | Port | Description |
|---|---|---|
| `redrob-backend` | `8000` | FastAPI + C++ ranker + sentence-transformers |
| `redrob-frontend` | `3000` | React SPA served via nginx |
| `redrob-ollama` | `11434` | Qwen 2.5:3b local LLM runtime |

### Quick start

```bash
# 1. Clone the repo
git clone https://github.com/gurunesh30/Candidate-Ranking-System.git
cd Candidate-Ranking-System

# 2. Add the candidate dataset
#    Place candidate.jsonl inside backend/data/ (file is gitignored)
cp /path/to/candidate.jsonl backend/data/candidate.jsonl

# 3. Build and start all services
docker compose up --build

# 4. Open the app
#    Frontend → http://localhost:3000
#    Backend API → http://localhost:8000
#    API docs (Swagger) → http://localhost:8000/docs
```

> **First run only:** The `ollama` container automatically pulls `qwen2.5:3b` (~2 GB) on startup. Subsequent starts skip the download because model weights are stored in the `ollama-data` named volume.

### Common commands

```bash
# Start in detached (background) mode
docker compose up -d

# Tail backend logs in real time
docker compose logs -f backend

# Tail all service logs
docker compose logs -f

# Stop and remove containers (keeps volumes)
docker compose down

# Stop, remove containers AND volumes (deletes downloaded LLM model)
docker compose down -v

# Rebuild a single service after code changes
docker compose up --build backend
```

### What happens at startup

```
docker compose up --build
    │
    ├── ollama        pulls qwen2.5:3b → serves on :11434
    │
    ├── backend       compiles C++ ranker (pybind11)
    │                 downloads all-MiniLM-L6-v2 embeddings (build-time cache)
    │                 loads candidate.jsonl into memory
    │                 pre-computes 150 insight embeddings
    │                 serves FastAPI on :8000
    │
    └── frontend      builds React bundle (Vite)
                      serves static assets via nginx on :3000
```

### Without Docker (manual setup)

If you prefer running services directly:

```bash
# Backend
cd backend
python -m venv env && env\Scripts\activate   # Windows
pip install -r requirements.txt
python compile.py                            # compile C++ ranker
uvicorn main:app --reload --port 8000

# Ollama (separate terminal)
ollama serve
ollama pull qwen2.5:3b

# Frontend (separate terminal)
cd frontend/ui
npm install
npm run dev    # runs on http://localhost:5173
```

---

## Frontend Features

| Feature | Description |
|---|---|
| **JD Upload** | Upload a `.docx` job description — parsed and structured by the backend |
| **Live progress screen** | SSE-driven stage tracker shows real-time pipeline progress (skill scoring → deep eval → insight assignment) |
| **Ranked dashboard** | Top-100 candidates displayed in a scored grid immediately on completion |
| **AI Reasoning modal** | Per-candidate score breakdown (Stage 1 / 2 / 3) with cosine-matched insight sentence |
| **Dynamic weight sliders** | Adjust the 40/40/20 weighting live without re-running the pipeline |
| **Candidate comparison** | Side-by-side view of two candidates across all dimensions |
| **ATS Blindspot Visualizer** | Shows how traditional keyword ATS would have ranked vs. AI ranking |
| **CSV export** | Download `candidate_id, rank, score, ai_reasoning` for the full top-100 |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI (Python 3.10+) |
| Semantic embeddings | `sentence-transformers` — `all-MiniLM-L6-v2` |
| Cosine engine | Custom C++ module via pybind11 |
| Behavioral LLM | Qwen 2.5:3b via Ollama (local, no API key) |
| JD parser | Qwen 2.5:3b + regex heuristic fallback |
| Progress streaming | Server-Sent Events (SSE) |
| Frontend | React 19 + Vite 8 |
| Charts | Recharts |
| Export | Python `csv` module (backend streaming) |

---

*HacktoSkill 2026 — Team Viltrumites*
