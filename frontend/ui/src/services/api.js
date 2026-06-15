// API Service for RedRob AI Recruiter
// This service handles all data operations and simulates API calls

import { mockCandidates, sampleJobDescription } from '../data/mockCandidates';

/**
 * Simulates an API call with a delay
 */
const simulateApiDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch all candidates with optional filtering
 */
export const getCandidates = async (filters = {}) => {
  await simulateApiDelay();
  
  let filtered = [...mockCandidates];
  
  // Apply search filter
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(candidate => 
      candidate.name.toLowerCase().includes(searchTerm) ||
      candidate.role.toLowerCase().includes(searchTerm) ||
      candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm))
    );
  }
  
  // Apply skills filter
  if (filters.skills && filters.skills.length > 0) {
    filtered = filtered.filter(candidate =>
      filters.skills.some(skill => 
        candidate.skills.some(s => s.toLowerCase() === skill.toLowerCase())
      )
    );
  }
  
  // Apply experience filter
  if (filters.minExperience) {
    filtered = filtered.filter(candidate => 
      candidate.experienceYears >= filters.minExperience
    );
  }
  
  // Apply score filter
  if (filters.minScore) {
    filtered = filtered.filter(candidate => 
      candidate.overallScore >= filters.minScore
    );
  }
  
  return filtered;
};

/**
 * Get a single candidate by ID
 */
export const getCandidateById = async (id) => {
  await simulateApiDelay();
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
  await simulateApiDelay();
  return sampleJobDescription;
};

/**
 * Calculate weighted score based on custom weights
 */
export const calculateWeightedScore = (candidate, weights) => {
  const { semanticMatch, skillMatch, behavioralMatch, careerProgression, domainExperience } = candidate.scoreBreakdown;
  
  const totalWeight = weights.semantic + weights.skill + weights.behavioral + weights.career + weights.domain;
  
  const weightedScore = (
    (semanticMatch * weights.semantic) +
    (skillMatch * weights.skill) +
    (behavioralMatch * weights.behavioral) +
    (careerProgression * weights.career) +
    (domainExperience * weights.domain)
  ) / totalWeight;
  
  return Math.round(weightedScore);
};

/**
 * Compare two candidates
 */
export const compareCandidates = async (id1, id2) => {
  await simulateApiDelay();
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
  await simulateApiDelay();
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
  await simulateApiDelay(1000);
  // In a real app, this would parse the file and extract requirements
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
  await simulateApiDelay(1500);
  // In a real app, this would parse resumes and create candidate profiles
  return {
    success: true,
    message: `${files.length} resume(s) uploaded successfully`,
    parsedCount: files.length
  };
};

/**
 * Run AI analysis (simulated)
 */
export const runAIAnalysis = async () => {
  await simulateApiDelay(2000);
  return {
    success: true,
    message: 'AI Analysis completed successfully',
    analyzedCount: mockCandidates.length,
    averageScore: Math.round(mockCandidates.reduce((sum, c) => sum + c.overallScore, 0) / mockCandidates.length)
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
