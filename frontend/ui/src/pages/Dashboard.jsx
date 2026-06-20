// Dashboard Page - Main recruiter interface with candidate ranking
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiSearch, FiFilter, FiSliders, FiTrendingUp, FiDownload, FiMapPin, FiBriefcase, FiCrosshair, FiCpu, FiX } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import CandidateCard from '../components/CandidateCard';
import WeightSliderPanel, { DEFAULT_WEIGHTS } from '../components/WeightSliderPanel';
import BlindspotVisualizer from '../components/BlindspotVisualizer';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const [candidates, setCandidates] = useState([]);
  // baseCandidates holds the original scores from the backend, never mutated by weight changes
  const baseCandidatesRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('score'); // score, experience, name
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minExperience: 0,
    minScore: 0,
    skills: []
  });
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [showWeightPanel, setShowWeightPanel] = useState(false);
  const [topCandidate, setTopCandidate] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [selectedAiCandidate, setSelectedAiCandidate] = useState(null);

  useEffect(() => {
    loadCandidates();
  }, [searchParams]);

  const fetchAiResponse = (candidate) => {
    setSelectedAiCandidate(candidate);
    setShowAiModal(true);
  };

  const loadCandidates = async () => {
    try {
      const data = await api.getCandidates(sessionId);
      baseCandidatesRef.current = data;
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
    const newWeights = { ...weights, [key]: value };
    setWeights(newWeights);
    applyWeights(newWeights);
  };

  const handleWeightReset = () => {
    setWeights(DEFAULT_WEIGHTS);
    applyWeights(DEFAULT_WEIGHTS);
  };

  const applyWeights = (newWeights) => {
    const updatedCandidates = baseCandidatesRef.current.map(candidate => {
      const newScore = api.calculateWeightedScore(candidate, newWeights);
      return { ...candidate, overallScore: newScore };
    });
    setCandidates(updatedCandidates);
    const sorted = [...updatedCandidates].sort((a, b) => b.overallScore - a.overallScore);
    setTopCandidate(sorted[0]);
  };

  const handleExportExcel = () => {
    const ranked = [...candidates].sort((a, b) => b.overallScore - a.overallScore);
    const rows = ranked.map((c, i) => ({
      'Candidate ID': c.id,
      Name: c.name,
      'Score (%)': c.overallScore,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Ranked Candidates');
    XLSX.writeFile(wb, `ranked_candidates_${Date.now()}.xlsx`);
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

  // Compute rank based on score-sorted order (used for rank badge on each card)
  const rankedById = useMemo(() => {
    const byscore = [...candidates].sort((a, b) => b.overallScore - a.overallScore);
    const map = {};
    byscore.forEach((c, i) => { map[c.id] = i + 1; });
    return map;
  }, [candidates]);

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
            className="icon-btn"
            onClick={handleExportExcel}
          >
            <FiDownload className="btn-icon" />
            <span>Export Results</span>
          </button>
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
                  <span className="stat"><FiMapPin style={{marginRight: '4px'}} /> {topCandidate.location}</span>
                  <span className="stat"><FiBriefcase style={{marginRight: '4px'}} /> {topCandidate.experience}</span>
                  <span className="stat"><FiCrosshair style={{marginRight: '4px'}} /> {topCandidate.overallScore}% Match</span>
                </div>
                <div className="action-row" style={{ marginTop: '1rem' }}>
                  <button 
                    className="icon-btn active" 
                    onClick={() => fetchAiResponse(topCandidate)}
                  >
                    <FiCpu style={{marginRight: '8px'}} /> View AI Response
                  </button>
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
                <CandidateCard 
                  key={candidate.id} 
                  candidate={candidate} 
                  rank={rankedById[candidate.id]}
                  sessionId={sessionId} 
                  onViewInsights={() => fetchAiResponse(candidate)} 
                />
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
              onReset={handleWeightReset}
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
      {/* AI Scores Modal */}
      {showAiModal && selectedAiCandidate && (() => {
        const bd = selectedAiCandidate.breakdown || {};
        const sb = selectedAiCandidate.scoreBreakdown || {};
        const semantic  = bd.stage_1_skills_semantic  ?? sb.semanticMatch  ?? 0;
        const behavioral = bd.stage_2_behavioral_star  ?? sb.behavioralMatch ?? 0;
        const platform  = bd.stage_3_platform_signals ?? sb.domainExperience ?? 0;
        const overall   = selectedAiCandidate.overallScore ?? 0;

        const getColor = (v) => v >= 80 ? '#10b981' : v >= 60 ? '#3b82f6' : v >= 40 ? '#f59e0b' : '#ef4444';

        const stages = [
          { label: 'Semantic Skill Match', key: 'stage_1', value: semantic,   weight: '40%', icon: <FiSearch size={16}/> },
          { label: 'Behavioral STAR Score', key: 'stage_2', value: behavioral, weight: '40%', icon: <FiCpu size={16}/> },
          { label: 'Platform Signals',      key: 'stage_3', value: platform,   weight: '20%', icon: <FiTrendingUp size={16}/> },
        ];

        return (
          <div className="ai-modal-overlay" onClick={() => setShowAiModal(false)}>
            <div className="ai-modal-content" onClick={e => e.stopPropagation()}>
              <div className="ai-modal-header">
                <div className="modal-title-block">
                  <h2>{selectedAiCandidate.name}</h2>
                  <span className="modal-subtitle">{selectedAiCandidate.role}</span>
                </div>
                <button className="close-btn" onClick={() => setShowAiModal(false)}><FiX size={20} /></button>
              </div>

              <div className="ai-modal-body">
                {/* Overall score ring */}
                <div className="modal-overall-row">
                  <div className="modal-score-ring" style={{
                    background: `conic-gradient(${getColor(overall)} ${overall}%, #e5e7eb ${overall}%)`
                  }}>
                    <span className="modal-ring-inner" style={{ color: getColor(overall) }}>{overall}</span>
                  </div>
                  <div className="modal-overall-label">
                    <span className="label-heading">Overall AI Score</span>
                    <span className="label-sub">Composite across 3 pipeline stages</span>
                  </div>
                </div>

                <div className="modal-stage-divider" />

                {/* Stage breakdown */}
                <div className="modal-stages">
                  {stages.map(stage => (
                    <div key={stage.key} className="modal-stage-row">
                      <div className="stage-meta">
                        <span className="stage-icon">{stage.icon}</span>
                        <span className="stage-label">{stage.label}</span>
                        <span className="stage-weight">{stage.weight} weight</span>
                      </div>
                      <div className="stage-bar-wrap">
                        <div className="stage-bar-track">
                          <div
                            className="stage-bar-fill"
                            style={{ width: `${stage.value}%`, backgroundColor: getColor(stage.value) }}
                          />
                        </div>
                        <span className="stage-score" style={{ color: getColor(stage.value) }}>
                          {stage.value}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="modal-engine-note">
                  Scoring pipeline: C++ semantic engine (40%) + Qwen STAR numerical score (40%) + Platform signals (20%)
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Dashboard;
