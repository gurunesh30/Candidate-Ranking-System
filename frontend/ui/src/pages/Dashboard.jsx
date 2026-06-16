// Dashboard Page - Main recruiter interface with candidate ranking
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiSearch, FiFilter, FiSliders, FiTrendingUp } from 'react-icons/fi';
import CandidateCard from '../components/CandidateCard';
import WeightSliderPanel from '../components/WeightSliderPanel';
import BlindspotVisualizer from '../components/BlindspotVisualizer';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('score'); // score, experience, name
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minExperience: 0,
    minScore: 0,
    skills: []
  });
  const [weights, setWeights] = useState({
    semantic: 100,
    skill: 100,
    behavioral: 100,
    career: 100,
    domain: 100
  });
  const [showWeightPanel, setShowWeightPanel] = useState(false);
  const [topCandidate, setTopCandidate] = useState(null);

  useEffect(() => {
    loadCandidates();
  }, [searchParams]);

  const loadCandidates = async () => {
    try {
      const data = await api.getCandidates(sessionId);
      setCandidates(data);
      
      // Find top candidate
      const sorted = [...data].sort((a, b) => b.overallScore - a.overallScore);
      setTopCandidate(sorted[0]);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading candidates:', error);
      setLoading(false);
    }
  };

  const handleWeightChange = (key, value) => {
    setWeights(prev => ({ ...prev, [key]: value }));
    
    // Recalculate scores based on new weights
    const updatedCandidates = candidates.map(candidate => {
      const newScore = api.calculateWeightedScore(candidate, { ...weights, [key]: value });
      return { ...candidate, overallScore: newScore };
    });
    
    setCandidates(updatedCandidates);
    const sorted = [...updatedCandidates].sort((a, b) => b.overallScore - a.overallScore);
    setTopCandidate(sorted[0]);
  };

  const filteredCandidates = candidates
    .filter(candidate => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          candidate.name.toLowerCase().includes(search) ||
          candidate.role.toLowerCase().includes(search) ||
          candidate.skills.some(s => s.toLowerCase().includes(search))
        );
      }
      return true;
    })
    .filter(candidate => {
      // Experience filter
      if (filters.minExperience > 0 && candidate.experienceYears < filters.minExperience) {
        return false;
      }
      // Score filter
      if (filters.minScore > 0 && candidate.overallScore < filters.minScore) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort
      if (sortBy === 'score') return b.overallScore - a.overallScore;
      if (sortBy === 'experience') return b.experienceYears - a.experienceYears;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner-large"></div>
        <p>Loading candidates...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Candidate Dashboard</h1>
          <p className="subtitle">{candidates.length} candidates analyzed with AI</p>
        </div>
        
        <div className="header-actions">
          <button 
            className={`icon-btn ${showWeightPanel ? 'active' : ''}`}
            onClick={() => setShowWeightPanel(!showWeightPanel)}
          >
            <FiSliders className="btn-icon" />
            <span>Adjust Weights</span>
          </button>
        </div>
      </div>

      {/* Top Candidate Highlight */}
      {topCandidate && (
        <div className="top-candidate-section">
          <div className="section-badge">
            <FiTrendingUp className="badge-icon" />
            <span>Top Match</span>
          </div>
          <div className="top-candidate-card">
            <div className="top-candidate-info">
              <div className="avatar-large">
                {topCandidate.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="candidate-details">
                <h2>{topCandidate.name}</h2>
                <p className="role">{topCandidate.role}</p>
                <div className="stats-row">
                  <span className="stat">📍 {topCandidate.location}</span>
                  <span className="stat">💼 {topCandidate.experience}</span>
                  <span className="stat">🎯 {topCandidate.overallScore}% Match</span>
                </div>
              </div>
            </div>
            <div className="top-score-display">
              <div className="score-circle" style={{ 
                background: `conic-gradient(#10b981 ${topCandidate.overallScore}%, #374151 ${topCandidate.overallScore}%)` 
              }}>
                <span className="score-inner">{topCandidate.overallScore}</span>
              </div>
              <p className="score-label">Overall Score</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, role, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <button 
            className={`filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter className="btn-icon" />
            Filters
          </button>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="score">Sort by Score</option>
            <option value="experience">Sort by Experience</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Minimum Experience (years)</label>
            <input
              type="range"
              min="0"
              max="15"
              value={filters.minExperience}
              onChange={(e) => setFilters(prev => ({ ...prev, minExperience: parseInt(e.target.value) }))}
              className="filter-slider"
            />
            <span className="filter-value">{filters.minExperience}+ years</span>
          </div>
          
          <div className="filter-group">
            <label>Minimum Score</label>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.minScore}
              onChange={(e) => setFilters(prev => ({ ...prev, minScore: parseInt(e.target.value) }))}
              className="filter-slider"
            />
            <span className="filter-value">{filters.minScore}+</span>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="dashboard-content">
        {/* Main Content - Candidate List */}
        <div className={`candidates-section ${showWeightPanel ? 'narrow' : ''}`}>
          <div className="candidates-grid">
            {filteredCandidates.length === 0 ? (
              <div className="no-results">
                <p>No candidates match your criteria</p>
              </div>
            ) : (
              filteredCandidates.map(candidate => (
                <CandidateCard key={candidate.id} candidate={candidate} sessionId={sessionId} />
              ))
            )}
          </div>
        </div>

        {/* Side Panel - Weight Adjustment */}
        {showWeightPanel && (
          <div className="side-panel">
            <WeightSliderPanel 
              weights={weights}
              onWeightChange={handleWeightChange}
            />
            
            <div className="blindspot-section">
              <h3>ATS Blindspot Example</h3>
              {filteredCandidates.length > 0 && (
                <BlindspotVisualizer 
                  atsScore={filteredCandidates[0].atsScore}
                  aiScore={filteredCandidates[0].overallScore}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
