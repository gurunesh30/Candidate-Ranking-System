// API Service for RedRob AI Recruiter
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

// ---------------------------------------------------------------------------
// getCandidates — pull top-100 from a session stored on the backend
// ---------------------------------------------------------------------------
export const getCandidates = async (sessionId) => {
  if (!sessionId) return [];

  const response = await fetch(`${BASE_URL}/api/rank/leaderboard/${sessionId}`);
  if (!response.ok) throw new Error(`Failed to load session: ${response.statusText}`);

  const data = await response.json();
  return (data.rankings || []).map(mapRankedToFrontend);
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

// ---------------------------------------------------------------------------
// compareCandidates — stub (requires session data, not implemented client-side)
// ---------------------------------------------------------------------------
export const compareCandidates = async () => {
  throw new Error('Run AI analysis first to compare ranked candidates.');
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
    rankings:     result.rankings,
    parsedJD,
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
