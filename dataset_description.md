# Dataset Description: Intelligent Candidate Discovery & Ranking

This document outlines the structure, format, and available attributes for the candidate dataset provided for the HacktoSkill 2026 challenge. 

## Overview
The dataset contains structured profiles of candidates formatted in JSON/JSONL. Each candidate record mimics a comprehensive professional profile, encompassing their basic information, career timeline, education, skill sets, and simulated platform engagement signals.

**Format:** JSON / JSONL
**Schema Validation:** Validated against `http://json-schema.org/draft-07/schema#`

---

## High-Level Structure

Every candidate record contains the following top-level attributes:

| Attribute | Type | Description |
|-----------|------|-------------|
| `candidate_id` | String | Unique identifier for the candidate (Format: `CAND_XXXXXXX`). |
| `profile` | Object | Basic professional and demographic information. |
| `career_history` | Array[Object] | Chronological list of work experiences and roles. |
| `education` | Array[Object] | Academic background and degrees obtained. |
| `skills` | Array[Object] | Technical and soft skills with proficiency indicators. |
| `certifications` | Array[Object] | Professional certifications and issuers. *(Optional)* |
| `languages` | Array[Object] | Known languages and fluency levels. *(Optional)* |
| `redrob_signals` | Object | Simulated behavioral and platform-engagement metrics. |

---

## Detailed Attribute Breakdown

### 1. Profile (`profile`)
Contains the candidate's core professional summary.
- **`anonymized_name`**: Candidate's disguised full name.
- **`headline`**: One-line professional headline.
- **`summary`**: Multi-sentence overview of career and aspirations.
- **`location` / `country`**: Geographic details.
- **`years_of_experience`**: Total professional experience (Float, up to 50 years).
- **`current_title` / `current_company`**: Current role details.
- **`current_company_size` / `current_industry`**: Metadata about the current employer.

### 2. Career History (`career_history`)
An array containing up to 10 past and present job roles.
- **`company` / `title`**: Employer name and job designation.
- **`start_date` / `end_date`**: Tenure timelines (Date strings).
- **`duration_months`**: Calculated tenure length.
- **`is_current`**: Boolean flag for ongoing employment.
- **`industry` / `company_size`**: Employer metadata.
- **`description`**: Detailed breakdown of responsibilities, achievements, and impact. (Useful for STAR method extraction).

### 3. Education (`education`)
Academic credentials, up to 5 entries.
- **`institution` / `degree` / `field_of_study`**: College/University and course details.
- **`start_year` / `end_year`**: Study timeline.
- **`grade`**: Academic performance (GPA, percentage, etc.).
- **`tier`**: Internal prestige tiering of the institution (`tier_1` to `tier_4`, `unknown`).

### 4. Skills (`skills`)
Granular breakdown of candidate capabilities.
- **`name`**: Skill identifier (e.g., "Python", "NLP", "Project Management").
- **`proficiency`**: Self-assessed level (`beginner`, `intermediate`, `advanced`, `expert`).
- **`endorsements`**: Number of peer validations.
- **`duration_months`**: Amount of time the candidate has utilized this skill.

### 5. Platform Engagement (`redrob_signals`)
A unique set of simulated data points mimicking how the candidate interacts within a hiring ecosystem. Very useful for behavioral and intent scoring.
- **Activity Metrics**: `signup_date`, `last_active_date`, `profile_completeness_score`.
- **Intent Signals**: `open_to_work_flag`, `notice_period_days`, `expected_salary_range_inr_lpa`, `willing_to_relocate`.
- **Recruiter Interactions**: `profile_views_received_30d`, `applications_submitted_30d`, `saved_by_recruiters_30d`.
- **Responsiveness**: `recruiter_response_rate`, `avg_response_time_hours`, `interview_completion_rate`, `offer_acceptance_rate`.
- **External Signals**: `github_activity_score` (0-100 rating based on external commits/PRs), `skill_assessment_scores` (internal platform test scores).
- **Verification**: `verified_email`, `verified_phone`, `linkedin_connected`.

---

## Implementation Considerations

For the **AI-Driven Candidate Ranking System**:
1. **Semantic Skill Matching (Stage 1):** You can directly use the `skills` array, filtering by `duration_months` and `proficiency` to weigh candidate technical depth.
2. **Behavioral Alignment (Stage 2):** Feed the `career_history.description` into the LLM to extract STAR achievements. Adjust weights based on `redrob_signals` like `github_activity_score` or `skill_assessment_scores`.
3. **Career Trajectory (Stage 3):** Iterate through `career_history` chronologically to track promotion velocity and tenure stability.

