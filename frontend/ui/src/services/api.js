// API Service for RedRob AI Recruiter
// This service handles all data operations and connects to the FastAPI backend

import { sampleJobDescription } from '../data/mockCandidates';
import candidateData from '../../../../backend/data/candidate.json';

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
  }

  const response = await fetch(`${BASE_URL}/api/rank/leaderboard/${sessionId}`);
  if (!response.ok) {
    throw new Error(`Failed to load leaderboard session: ${response.statusText}`);
  }

  const data = await response.json();
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
  return {
    success: true,
    session_id: result.session_id,
    analyzedCount: result.total_processed,
    rankings: result.rankings
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

