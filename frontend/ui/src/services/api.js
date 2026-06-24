// API Service for RedRob AI Recruiter
// This service handles all data operations and connects to the FastAPI backend

import { sampleJobDescription } from '../data/mockCandidates';

const BASE_URL = 'http://localhost:8000';

/**
 * Helper to map CandidateModel schema from backend/data to frontend expected structure
 */
const mapCandidateModelToFrontend = (model) => {
  return {
    id: model.candidate_id, // ensure string id mapping works for frontend components
    name: model.profile.anonymized_name,
    role: model.profile.headline,
    summary: model.profile.summary,
    location: `${model.profile.location}, ${model.profile.country}`,
    experience: `${model.profile.years_of_experience} years`,
    experienceYears: model.profile.years_of_experience,
    skills: model.skills.map(s => s.name),
    education: model.education.map(e => ({ 
      school: e.institution, 
      degree: e.degree, 
      year: e.end_year 
    })),
    experience_details: model.career_history.map(c => ({ 
      company: c.company, 
      position: c.title, 
      description: c.description 
    })),
    certifications: model.certifications || [],
    atsScore: model.atsScore ?? Math.floor(55 + (model.profile.years_of_experience * 3) % 25),
    overallScore: model.overallScore ?? 80, // default fallback
    breakdown: model.breakdown || {
      stage_1_skills_semantic: 80,
      stage_2_behavioral_star: 80,
      stage_3_platform_signals: 80
    },
    scoreBreakdown: { // fallback mock scores if needed
      semanticMatch: 85,
      skillMatch: 80,
      behavioralMatch: 75,
      careerProgression: 80,
      domainExperience: 85
    }
  };
};

/**
 * Fetch all candidates from the session leaderboard (no local candidate data).
 * The backend now handles the 100k dataset; frontend only gets the top 100.
 */
export const getCandidates = async (sessionId) => {
  if (!sessionId) {
    // If no sessionId, return empty array — frontend should never hold the full dataset
    return [];
  }

  const response = await fetch(`${BASE_URL}/api/rank/leaderboard/${sessionId}`);
  if (!response.ok) {
    throw new Error(`Failed to load leaderboard session: ${response.statusText}`);
  }

  const data = await response.json();
  const rankings = data.rankings || [];

  // Map the ranked results (already enriched by backend)
  return rankings.map(rank => ({
    id:           rank.candidate_id,
    overallScore: rank.final_score,
    reasoning:    rank.reasoning,
    rank:         rank.rank,
    breakdown:    rank.breakdown,
    // The rest of the fields will be populated lazily via getCandidateById if needed
    name:         `Candidate ${rank.candidate_id.slice(-6)}`, // placeholder
    role:         "AI‑Ranked Candidate",
    summary:      "",
    location:     "",
    experience:   "",
    experienceYears: 0,
    skills:       [],
    education:    [],
    experience_details: [],
    certifications: [],
    atsScore:     0,
    scoreBreakdown: {},
  }));
};

/**
 * Get a single candidate by ID — NOT USED for 100k dataset; only for demo/fallback.
 */
export const getCandidateById = async (id) => {
  // No longer load full dataset; return a minimal placeholder
  return {
    id,
    name: `Candidate ${id.slice(-6)}`,
    role: "AI‑Ranked Candidate",
    summary: "Detailed profile available only in backend dataset.",
    location: "Unknown",
    experience: "Unknown",
    experienceYears: 0,
    skills: [],
    education: [],
    experience_details: [],
    certifications: [],
    atsScore: 0,
    overallScore: 0,
    breakdown: {},
    scoreBreakdown: {},
  };
};

/**
 * Get job description
 */
export const getJobDescription = async () => {
  return sampleJobDescription;
};

/**
 * Calculate weighted score based on custom weights.
 * weights = { semantic: number, behavioral: number, platform: number }
 * Values represent percentages; they should sum to 100.
 */
export const calculateWeightedScore = (candidate, weights) => {
  const bd = candidate.breakdown || {};
  const sb = candidate.scoreBreakdown || {};

  const semantic   = bd.stage_1_skills_semantic  ?? sb.semanticMatch  ?? 0;
  const behavioral = bd.stage_2_behavioral_star  ?? sb.behavioralMatch ?? 0;
  const platform   = bd.stage_3_platform_signals ?? sb.domainExperience ?? 0;

  const wSem  = (weights.semantic  ?? 40) / 100;
  const wBeh  = (weights.behavioral ?? 40) / 100;
  const wPlat = (weights.platform  ?? 20) / 100;

  // Normalise in case sliders don't sum exactly to 100
  const total = wSem + wBeh + wPlat || 1;

  return Math.round(
    ((semantic * wSem) + (behavioral * wBeh) + (platform * wPlat)) / total
  );
};

/**
 * Compare two candidates — NOT SUPPORTED for 100k dataset without session.
 */
export const compareCandidates = async (id1, id2) => {
  throw new Error(
    'Direct candidate comparison unavailable. Please run AI analysis first to get ranked candidates.'
  );
};

/**
 * Get all unique skills — NOT SUPPORTED for 100k dataset without loading it.
 */
export const getAllSkills = async () => {
  return []; // cannot load 100k skills on frontend
};

/**
 * Upload job description (simulated)
 */
export const uploadJobDescription = async (file) => {
  return {
    success: true,
    message: 'Job description uploaded successfully',
    data: sampleJobDescription
  };
};

/**
 * Upload resumes (simulated)
 */
export const uploadResumes = async (files) => {
  return {
    success: true,
    message: `${files.length} resume(s) uploaded successfully`,
    parsedCount: files.length
  };
};

/**
 * Run AI analysis — new two‑step pipeline that avoids frontend OOM:
 * 1. POST docx file to /api/jd/parse → get structured JD JSON + evaluation_text
 * 2. POST structured job_description + candidate file to /api/rank/upload
 *
 * The candidate file can be a local .jsonl (100k entries) — backend streams it,
 * frontend never loads the whole JSON into V8 heap.
 *
 * @param {File} jdFile - The raw .docx File object from the file input
 * @param {File} candidateFile - The .jsonl file containing candidate dataset
 */
export const runAIAnalysis = async (jdFile, candidateFile) => {
  if (!jdFile || !candidateFile) {
    throw new Error('Both job description (.docx) and candidate dataset (.jsonl) files are required.');
  }

  // ── Step 1: Parse the .docx into structured JSON ────────────────────────
  const formData1 = new FormData();
  formData1.append('file', jdFile);

  const parseResponse = await fetch(`${BASE_URL}/api/jd/parse`, {
    method: 'POST',
    body: formData1,
  });

  if (!parseResponse.ok) {
    const errText = await parseResponse.text();
    throw new Error(`Failed to parse job description: ${errText}`);
  }

  const parseResult = await parseResponse.json();
  const parsedJD = parseResult.parsed_jd;

  // ── Step 2: Upload candidate file and structured JD together ─────────────
  const formData2 = new FormData();

  // Job description as JSON blob
  formData2.append('job_description', JSON.stringify(parsedJD));
  // Candidate file as uploaded binary
  formData2.append('candidate_file', candidateFile);

  const evaluateResponse = await fetch(`${BASE_URL}/api/rank/upload`, {
    method: 'POST',
    body: formData2,
  });

  if (!evaluateResponse.ok) {
    const errText = await evaluateResponse.text();
    throw new Error(`Failed to evaluate candidates: ${errText}`);
  }

  const result = await evaluateResponse.json();
  return {
    success: true,
    session_id: result.session_id,
    analyzedCount: result.total_processed,
    rankings: result.rankings,
    parsedJD,            // expose so Landing can display parsed title/dept if needed
  };
};

export default {
  getCandidates,
  getCandidateById,
  getJobDescription,
  calculateWeightedScore,
  compareCandidates,
  getAllSkills,
  uploadJobDescription,
  uploadResumes,
  runAIAnalysis
};
