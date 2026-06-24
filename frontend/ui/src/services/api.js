// API Service for RedRob AI Recruiter
<<<<<<< HEAD
=======
// This service handles all data operations and connects to the FastAPI backend

import { sampleJobDescription } from '../data/mockCandidates';
import candidateData from '../../../../backend/data/candidate.json';

>>>>>>> 625c5377da17495cda9ab7bce93160e9c31a91aa
const BASE_URL = 'http://localhost:8000';

// ---------------------------------------------------------------------------
// Shape helper: map a ranked result from the backend into what the UI expects
// ---------------------------------------------------------------------------
const mapRankedToFrontend = (rank) => ({
  id:              rank.candidate_id,
  name:            `Candidate ${rank.candidate_id.slice(-6)}`,
  role:            'AI-Ranked Candidate',
  summary:         rank.reasoning || '',
  location:        '',
  experience:      '',
  experienceYears: 0,
  skills:          [],
  education:       [],
  experience_details: [],
  certifications:  [],
  atsScore:        0,
  overallScore:    rank.final_score,
  rank:            rank.rank,
  reasoning:       rank.reasoning,
  breakdown:       rank.breakdown || {
    stage_1_skills_semantic:  0,
    stage_2_behavioral_star:  0,
    stage_3_platform_signals: 0,
  },
  scoreBreakdown: {
    semanticMatch:     rank.breakdown?.stage_1_skills_semantic  ?? 0,
    behavioralMatch:   rank.breakdown?.stage_2_behavioral_star  ?? 0,
    domainExperience:  rank.breakdown?.stage_3_platform_signals ?? 0,
  },
});

<<<<<<< HEAD
// ---------------------------------------------------------------------------
// getCandidates — pull top-100 from a session stored on the backend
// ---------------------------------------------------------------------------
=======
// Create a list with the candidate from backend data
const importedCandidatesList = Array.isArray(candidateData) ? candidateData : [candidateData];

/**
 * Fetch all candidates with optional filtering from the local database
 * Maps rankings backend payload back to imported candidates elements to preserve details
 */
export const getCandidates = async (sessionId) => {
  if (!sessionId) {
    // If no sessionId, return mapped candidate data directly
    return importedCandidatesList.map(c => {
      const frontendCand = mapCandidateModelToFrontend(c);
      return {
        ...frontendCand,
        overallScore: 80, // default fallback
        breakdown: {
          stage_1_skills_semantic: 80,
          stage_2_behavioral_star: 80,
          stage_3_platform_signals: 80
        }
      };
    });
/**
 * Fetch all candidates from the session leaderboard (no local candidate data).
 * The backend now handles the 100k dataset; frontend only gets the top 100.
 */
>>>>>>> 625c5377da17495cda9ab7bce93160e9c31a91aa
export const getCandidates = async (sessionId) => {
  if (!sessionId) return [];

  const response = await fetch(`${BASE_URL}/api/rank/leaderboard/${sessionId}`);
  if (!response.ok) throw new Error(`Failed to load session: ${response.statusText}`);

  const data = await response.json();
<<<<<<< HEAD
  return (data.rankings || []).map(mapRankedToFrontend);
=======
  const rankings = data.rankings || [];

  // Map each ranked candidate from database back to the detailed frontend profile
  return rankings.map(rank => {
    const backendCand = importedCandidatesList.find(c => c.candidate_id === rank.candidate_id);
    if (!backendCand) return null;

    const frontendCand = mapCandidateModelToFrontend(backendCand);
    return {
      ...frontendCand,
      overallScore: rank.final_score,
      breakdown: rank.breakdown // stage_1_skills_semantic, stage_2_behavioral_star, stage_3_platform_signals
    };
  }).filter(Boolean);
};

/**
 * Get a single candidate by ID
 */
export const getCandidateById = async (id) => {
  const candidate = importedCandidatesList.find(c => c.candidate_id === id || c.candidate_id === `CAND_000000${id}`);
  if (!candidate) {
    throw new Error('Candidate not found');
  }
  return mapCandidateModelToFrontend(candidate);
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
>>>>>>> 625c5377da17495cda9ab7bce93160e9c31a91aa
};

// ---------------------------------------------------------------------------
// getCandidateById — lightweight placeholder (no full dataset in browser)
// ---------------------------------------------------------------------------
export const getCandidateById = async (id) => ({
  id,
  name:            `Candidate ${id.slice(-6)}`,
  role:            'AI-Ranked Candidate',
  summary:         'Full profile stored server-side.',
  location:        '',
  experience:      '',
  experienceYears: 0,
  skills:          [],
  education:       [],
  experience_details: [],
  certifications:  [],
  atsScore:        0,
  overallScore:    0,
  breakdown:       {},
  scoreBreakdown:  {},
});

// ---------------------------------------------------------------------------
// getJobDescription — stub
// ---------------------------------------------------------------------------
export const getJobDescription = async () => ({
  title: '', department: '', experience: '', skills: [], responsibilities: '',
});

// ---------------------------------------------------------------------------
// calculateWeightedScore
// ---------------------------------------------------------------------------
export const calculateWeightedScore = (candidate, weights) => {
  const bd = candidate.breakdown    || {};
  const sb = candidate.scoreBreakdown || {};

  const semantic   = bd.stage_1_skills_semantic  ?? sb.semanticMatch    ?? 0;
  const behavioral = bd.stage_2_behavioral_star  ?? sb.behavioralMatch  ?? 0;
  const platform   = bd.stage_3_platform_signals ?? sb.domainExperience ?? 0;

  const wSem  = (weights.semantic   ?? 40) / 100;
  const wBeh  = (weights.behavioral ?? 40) / 100;
  const wPlat = (weights.platform   ?? 20) / 100;
  const total  = wSem + wBeh + wPlat || 1;

  return Math.round(((semantic * wSem) + (behavioral * wBeh) + (platform * wPlat)) / total);
};

<<<<<<< HEAD
// ---------------------------------------------------------------------------
// compareCandidates — stub (requires session data, not implemented client-side)
// ---------------------------------------------------------------------------
export const compareCandidates = async () => {
  throw new Error('Run AI analysis first to compare ranked candidates.');
=======
/**
 * Compare two candidates
 */
export const compareCandidates = async (id1, id2) => {
  const cand1 = importedCandidatesList.find(c => c.candidate_id === id1);
  const cand2 = importedCandidatesList.find(c => c.candidate_id === id2);
  
  if (!cand1 || !cand2) {
    throw new Error('One or both candidates not found');
  }
  
  return { 
    candidate1: mapCandidateModelToFrontend(cand1), 
    candidate2: mapCandidateModelToFrontend(cand2) 
  };
};

/**
 * Get all unique skills from candidates
 */
export const getAllSkills = async () => {
  const skills = new Set();
  importedCandidatesList.forEach(candidate => {
    candidate.skills.forEach(skill => skills.add(skill.name));
  });
  return Array.from(skills).sort();
 * Compare two candidates — NOT SUPPORTED for 100k dataset without session.
 */
export const compareCandidates = async (id1, id2) => {
  throw new Error(
    'Direct candidate comparison unavailable. Please run AI analysis first to get ranked candidates.'
  );
>>>>>>> 625c5377da17495cda9ab7bce93160e9c31a91aa
};

// ---------------------------------------------------------------------------
// Stubs
// ---------------------------------------------------------------------------
export const getAllSkills       = async () => [];
export const uploadJobDescription = async () => ({ success: true });
export const uploadResumes      = async (files) => ({
  success: true,
  message: `${files.length} file(s) noted (resume parsing is handled server-side).`,
  parsedCount: files.length,
});

<<<<<<< HEAD
// ---------------------------------------------------------------------------
// runAIAnalysis — the main pipeline
//
// Flow:
//   1. POST jdFile to /api/jd/parse  → get parsed_jd JSON
//   2. POST parsed_jd to /api/rank/start → backend ranks its pre-loaded
//      candidate pool and returns the top-100
//   3. Return session_id + rankings to the caller
//
// The candidate dataset NEVER touches the frontend.
// The resume upload on the landing page is a placeholder UI only.
// ---------------------------------------------------------------------------
export const runAIAnalysis = async (jdFile) => {
  if (!jdFile) {
    throw new Error('Please upload a Job Description (.docx) file to begin analysis.');
=======
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
 * Run AI analysis (real connection to backend)
 */
export const runAIAnalysis = async (jobDescriptionText, candidatesList) => {
  const jd = jobDescriptionText || sampleJobDescription.description;
  
  // Directly use the imported candidate data from backend
  const formattedCandidates = importedCandidatesList;

  const response = await fetch(`${BASE_URL}/api/rank/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      job_description: jd,
      candidates: formattedCandidates
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to evaluate candidates: ${errText}`);
  }

  const result = await response.json();
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
>>>>>>> 625c5377da17495cda9ab7bce93160e9c31a91aa
  }

  // ── Step 1: Parse the .docx into structured JD JSON ──────────────────────
  const formData = new FormData();
  formData.append('file', jdFile);

  const parseRes = await fetch(`${BASE_URL}/api/jd/parse`, {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type — browser sets multipart boundary automatically
  });

  if (!parseRes.ok) {
    const err = await parseRes.text();
    throw new Error(`Failed to parse job description: ${err}`);
  }

  const { parsed_jd: parsedJD } = await parseRes.json();

  // ── Step 2: Trigger ranking against the server-loaded candidate pool ──────
  const rankRes = await fetch(`${BASE_URL}/api/rank/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsedJD),
  });

  if (!rankRes.ok) {
    const err = await rankRes.text();
    throw new Error(`Ranking failed: ${err}`);
  }

  const result = await rankRes.json();

  return {
    success:      true,
    session_id:   result.session_id,
    analyzedCount: result.total_processed,
<<<<<<< HEAD
    rankings:     result.rankings,
    parsedJD,
=======
    rankings: result.rankings
    rankings: result.rankings,
    parsedJD,            // expose so Landing can display parsed title/dept if needed
>>>>>>> 625c5377da17495cda9ab7bce93160e9c31a91aa
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
  runAIAnalysis,
};

