// API Service for RedRob AI Recruiter
// This service handles all data operations and connects to the FastAPI backend

import { mockCandidates, sampleJobDescription } from '../data/mockCandidates';

const BASE_URL = 'http://localhost:8000';

/**
 * Helper to map mock candidate structure to the backend Pydantic CandidateModel schema
 */
export const mapMockToCandidateModel = (mockCandidate) => {
  return {
    candidate_id: mockCandidate.id.toString(),
    profile: {
      anonymized_name: mockCandidate.name,
      headline: mockCandidate.role,
      summary: mockCandidate.summary,
      location: mockCandidate.location,
      country: mockCandidate.location.split(', ').pop() || 'USA',
      years_of_experience: mockCandidate.experienceYears || parseFloat(mockCandidate.experience) || 5.0,
      current_title: mockCandidate.role,
      current_company: 'TechCorp',
      current_company_size: '1000+',
      current_industry: 'Technology'
    },
    career_history: (mockCandidate.experience_details || []).map((exp, index) => ({
      company: exp.company,
      title: exp.position,
      start_date: '2020-01-01',
      end_date: index === 0 ? null : '2022-01-01',
      duration_months: 24,
      is_current: index === 0,
      industry: 'Technology',
      company_size: '1000+',
      description: exp.description
    })),
    education: (mockCandidate.education || []).map(edu => ({
      institution: edu.school,
      degree: edu.degree,
      field_of_study: edu.degree,
      start_year: parseInt(edu.year) - 4 || 2011,
      end_year: parseInt(edu.year) || 2015,
      grade: '8.5 CGPA',
      tier: 'tier_2'
    })),
    skills: (mockCandidate.skills || []).map(skillName => ({
      name: skillName,
      proficiency: 'advanced',
      endorsements: 10,
      duration_months: 36
    })),
    certifications: mockCandidate.certifications || [],
    languages: [{ language: 'English', proficiency: 'fluent' }],
    redrob_signals: {
      profile_completeness_score: 90.0,
      signup_date: '2024-01-01',
      last_active_date: '2026-06-01',
      open_to_work_flag: true,
      profile_views_received_30d: 15,
      applications_submitted_30d: 5,
      recruiter_response_rate: 0.85,
      avg_response_time_hours: 12.0,
      github_activity_score: 8.5,
      connection_count: 200,
      endorsements_received: 20,
      notice_period_days: 30,
      expected_salary_range_inr_lpa: {
        min: 15.0,
        max: 30.0
      },
      preferred_work_mode: 'hybrid',
      willing_to_relocate: true,
      search_appearance_30d: 150,
      saved_by_recruiters_30d: 10,
      interview_completion_rate: 0.9,
      offer_acceptance_rate: 0.8,
      verified_email: true,
      verified_phone: true,
      linkedin_connected: true,
      skill_assessment_scores: {}
    }
  };
};

/**
 * Fetch all candidates with optional filtering from the local database
 * Maps rankings backend payload back to mockCandidates elements to preserve details
 */
export const getCandidates = async (sessionId) => {
  if (!sessionId) {
    // If no sessionId, return mock candidates mapped to include the breakdown sub-object structure
    return mockCandidates.map(c => ({
      ...c,
      breakdown: {
        stage_1_skills_semantic: c.scoreBreakdown?.semanticMatch || 80,
        stage_2_behavioral_star: c.scoreBreakdown?.skillMatch || 80,
        stage_3_platform_signals: c.scoreBreakdown?.behavioralMatch || 80
      }
    }));
  }

  const response = await fetch(`${BASE_URL}/api/rank/leaderboard/${sessionId}`);
  if (!response.ok) {
    throw new Error(`Failed to load leaderboard session: ${response.statusText}`);
  }

  const data = await response.json();
  const rankings = data.rankings || [];

  // Map each ranked candidate from database back to the detailed frontend profile
  return rankings.map(rank => {
    const mock = mockCandidates.find(c => c.id.toString() === rank.candidate_id);
    if (!mock) return null;

    return {
      ...mock,
      overallScore: rank.final_score,
      breakdown: rank.breakdown // stage_1_skills_semantic, stage_2_behavioral_star, stage_3_platform_signals
    };
  }).filter(Boolean);
};

/**
 * Get a single candidate by ID (Fallback mock finder or custom)
 */
export const getCandidateById = async (id) => {
  const candidate = mockCandidates.find(c => c.id === parseInt(id));
  if (!candidate) {
    throw new Error('Candidate not found');
  }
  return candidate;
};

/**
 * Get job description
 */
export const getJobDescription = async () => {
  return sampleJobDescription;
};

/**
 * Calculate weighted score based on custom weights
 */
export const calculateWeightedScore = (candidate, weights) => {
  // Backend uses breakdown sub-object or falls back to scoreBreakdown if breakdown is not yet set
  const breakdown = candidate.breakdown || {
    stage_1_skills_semantic: candidate.scoreBreakdown?.semanticMatch || 0,
    stage_2_behavioral_star: candidate.scoreBreakdown?.behavioralMatch || 0,
    stage_3_platform_signals: candidate.scoreBreakdown?.domainExperience || 0, // mock signal map
  };
  
  const semantic = breakdown.stage_1_skills_semantic;
  const skill = breakdown.stage_2_behavioral_star;
  const behavioral = breakdown.stage_3_platform_signals;
  const career = candidate.scoreBreakdown?.careerProgression || 80;
  const domain = candidate.scoreBreakdown?.domainExperience || 80;

  const totalWeight = weights.semantic + weights.skill + weights.behavioral + weights.career + weights.domain;
  
  const weightedScore = (
    (semantic * weights.semantic) +
    (skill * weights.skill) +
    (behavioral * weights.behavioral) +
    (career * weights.career) +
    (domain * weights.domain)
  ) / totalWeight;
  
  return Math.round(weightedScore);
};

/**
 * Compare two candidates
 */
export const compareCandidates = async (id1, id2) => {
  const candidate1 = mockCandidates.find(c => c.id === parseInt(id1));
  const candidate2 = mockCandidates.find(c => c.id === parseInt(id2));
  
  if (!candidate1 || !candidate2) {
    throw new Error('One or both candidates not found');
  }
  
  return { candidate1, candidate2 };
};

/**
 * Get all unique skills from candidates
 */
export const getAllSkills = async () => {
  const skills = new Set();
  mockCandidates.forEach(candidate => {
    candidate.skills.forEach(skill => skills.add(skill));
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
  const list = candidatesList || mockCandidates;

  const formattedCandidates = list.map(mapMockToCandidateModel);

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

/**
 * Get deep-dive AI justification paragraph from backend
 */
export const getCandidateJustification = async (sessionId, candidateId) => {
  const response = await fetch(`${BASE_URL}/api/rank/leaderboard/${sessionId}/candidate/${candidateId}/justification`);
  if (!response.ok) {
    throw new Error(`Failed to load AI justification: ${response.statusText}`);
  }
  const result = await response.json();
  return result.ai_justification;
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
  getCandidateJustification
};

