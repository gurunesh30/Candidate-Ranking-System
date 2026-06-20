// CandidateDetail Page - Detailed view of a single candidate
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiMapPin, FiBriefcase, FiAward,
  FiBook, FiCheckCircle, FiTrendingUp, FiSearch, FiCpu, FiBarChart2
} from 'react-icons/fi';
import RadarChartComponent from '../components/RadarChartComponent';
import BlindspotVisualizer from '../components/BlindspotVisualizer';
import api from '../services/api';
import './CandidateDetail.css';

const CandidateDetail = () => {
  const { sessionId, id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadCandidate();
  }, [id, sessionId]);

  const loadCandidate = async () => {
    try {
      let data = null;
      if (sessionId) {
        const candidates = await api.getCandidates(sessionId);
        data = candidates.find(c => c.id.toString() === id.toString());
      }
      if (!data) {
        data = await api.getCandidateById(id);
      }
      setCandidate(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading candidate:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="loading-spinner-large"></div>
        <p>Loading candidate details...</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="not-found">
        <h2>Candidate not found</h2>
        <button onClick={() => navigate(-1)} className="back-btn">
          <FiArrowLeft className="btn-icon" />
          Back
        </button>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const scoreColor = getScoreColor(candidate.overallScore);

  // Resolve pipeline breakdown from backend or fallback
  const bd = candidate.breakdown || {};
  const sb = candidate.scoreBreakdown || {};
  const semantic   = bd.stage_1_skills_semantic  ?? sb.semanticMatch  ?? 0;
  const behavioral = bd.stage_2_behavioral_star  ?? sb.behavioralMatch ?? 0;
  const platform   = bd.stage_3_platform_signals ?? sb.domainExperience ?? 0;

  const pipelineStages = [
    { label: 'Semantic Skill Match',   value: semantic,   weight: '40%', icon: <FiSearch size={15} /> },
    { label: 'Behavioral STAR Score',  value: behavioral, weight: '40%', icon: <FiCpu size={15} /> },
    { label: 'Platform Signals',       value: platform,   weight: '20%', icon: <FiTrendingUp size={15} /> },
  ];

  return (
    <div className="candidate-detail-page">
      {/* Header */}
      <div className="detail-header">
        <button onClick={() => navigate(sessionId ? `/dashboard?session=${sessionId}` : '/dashboard')} className="back-button">
          <FiArrowLeft className="btn-icon" />
          Back
        </button>
        <div className="header-actions">
          <button
            className="compare-btn"
            onClick={() => navigate(sessionId ? `/comparison?session=${sessionId}&c1=${candidate.id}` : `/comparison?c1=${candidate.id}`)}
          >
            Compare Candidate
          </button>
        </div>
      </div>

      {/* Profile Section */}
      <div className="profile-section">
        <div className="profile-card">
          <div className="profile-avatar">
            {candidate.name.split(' ').map(n => n[0]).join('')}
          </div>

          <div className="profile-info">
            <h1 className="profile-name">{candidate.name}</h1>
            <p className="profile-role">{candidate.role}</p>

            <div className="profile-meta">
              <span className="meta-item">
                <FiMapPin className="meta-icon" />
                {candidate.location}
              </span>
              <span className="meta-item">
                <FiBriefcase className="meta-icon" />
                {candidate.experience}
              </span>
              {candidate.certifications?.length > 0 && (
                <span className="meta-item">
                  <FiAward className="meta-icon" />
                  {candidate.certifications.length} Certifications
                </span>
              )}
            </div>

            <p className="profile-summary">{candidate.summary}</p>
          </div>

          {/* Overall score ring with ATS comparison */}
          <div className="profile-score">
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div
                className="score-circle-large"
                style={{
                  background: `conic-gradient(${scoreColor} ${candidate.overallScore}%, #e5e7eb ${candidate.overallScore}%)`
                }}
              >
                <div className="score-content">
                  <span className="score-number" style={{ color: scoreColor }}>{candidate.overallScore}</span>
                  <span className="score-text">AI Score</span>
                </div>
              </div>

              <div className="ats-comparison">
                <span className="ats-label">ATS Score</span>
                <span className="ats-value">{candidate.atsScore}%</span>
                <span className={`difference ${candidate.overallScore >= candidate.atsScore ? 'positive' : 'negative'}`}>
                  {candidate.overallScore >= candidate.atsScore ? '+' : ''}
                  {candidate.overallScore - candidate.atsScore}% AI Boost
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        {['overview', 'experience', 'skills', 'insights'].map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview'    ? 'Overview'
            : tab === 'experience' ? 'Experience'
            : tab === 'skills'     ? 'Skills & Analysis'
            :                        'AI Score Breakdown'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              <div className="info-card">
                <div className="card-header">
                  <FiCheckCircle className="card-icon" />
                  <h3>Skills</h3>
                </div>
                <div className="skills-cloud">
                  {candidate.skills.map((skill, index) => (
                    <span key={index} className="skill-badge">{skill}</span>
                  ))}
                </div>
              </div>

              <div className="info-card">
                <div className="card-header">
                  <FiBook className="card-icon" />
                  <h3>Education</h3>
                </div>
                <div className="education-list">
                  {candidate.education.map((edu, index) => (
                    <div key={index} className="education-item">
                      <div className="degree">{edu.degree}</div>
                      <div className="school">{edu.school}</div>
                      <div className="year">{edu.year}</div>
                    </div>
                  ))}
                </div>
              </div>

              {candidate.certifications?.length > 0 && (
                <div className="info-card full-width">
                  <div className="card-header">
                    <FiAward className="card-icon" />
                    <h3>Certifications</h3>
                  </div>
                  <div className="certifications-grid">
                    {candidate.certifications.map((cert, index) => (
                      <div key={index} className="certification-item">
                        <FiAward className="cert-icon" />
                        <span>{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── EXPERIENCE ── */}
        {activeTab === 'experience' && (
          <div className="experience-tab">
            <h3>Professional Experience</h3>
            <div className="timeline">
              {candidate.experience_details.map((exp, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <h4 className="position">{exp.position}</h4>
                      <span className="duration">{exp.duration}</span>
                    </div>
                    <div className="company">{exp.company}</div>
                    <p className="description">{exp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SKILLS & ANALYSIS ── */}
        {activeTab === 'skills' && (
          <div className="skills-tab">
            <div className="skills-analysis-grid">
              <div className="chart-card">
                <div className="card-header">
                  <FiTrendingUp className="card-icon" />
                  <h3>Skill Breakdown</h3>
                </div>
                <RadarChartComponent data={candidate} />

                <div className="score-breakdown-list">
                  {pipelineStages.map((stage, idx) => (
                    <div key={idx} className="breakdown-item">
                      <span className="breakdown-label">
                        <span style={{ marginRight: 6, color: 'var(--murray-accent)', display: 'inline-flex', verticalAlign: 'middle' }}>{stage.icon}</span>
                        {stage.label}
                        <span className="breakdown-weight-badge">{stage.weight}</span>
                      </span>
                      <div className="breakdown-bar">
                        <div
                          className="breakdown-fill"
                          style={{
                            width: `${stage.value}%`,
                            backgroundColor: getScoreColor(stage.value)
                          }}
                        />
                      </div>
                      <span className="breakdown-value" style={{ color: getScoreColor(stage.value) }}>
                        {stage.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="blindspot-card">
                <BlindspotVisualizer
                  atsScore={candidate.atsScore ?? 0}
                  aiScore={candidate.overallScore}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── AI SCORE BREAKDOWN ── */}
        {activeTab === 'insights' && (
          <div className="insights-tab">
            <div className="pipeline-breakdown-panel">
              <div className="pipeline-header">
                <FiBarChart2 className="pipeline-icon" />
                <div>
                  <h3>AI Pipeline Score Breakdown</h3>
                  <p className="pipeline-subtitle">
                    Composite: C++ Semantic Engine (40%) + Qwen STAR Numerical Score (40%) + Platform Signals (20%)
                  </p>
                </div>
              </div>

              {/* Overall score hero */}
              <div className="pipeline-overall">
                <div
                  className="pipeline-ring"
                  style={{
                    background: `conic-gradient(${scoreColor} ${candidate.overallScore}%, #e5e7eb ${candidate.overallScore}%)`
                  }}
                >
                  <span className="pipeline-ring-inner" style={{ color: scoreColor }}>
                    {candidate.overallScore}
                  </span>
                </div>
                <div className="pipeline-overall-text">
                  <span className="pipeline-overall-label">Overall AI Score</span>
                  <span className="pipeline-overall-sub">Weighted composite across 3 stages</span>
                </div>
              </div>

              {/* Stage cards */}
              <div className="pipeline-stages">
                {pipelineStages.map((stage, idx) => (
                  <div key={idx} className="pipeline-stage-card">
                    <div className="pipeline-stage-top">
                      <span className="pipeline-stage-icon">{stage.icon}</span>
                      <span className="pipeline-stage-label">{stage.label}</span>
                      <span className="pipeline-stage-weight">{stage.weight} weight</span>
                    </div>
                    <div className="pipeline-stage-bar-wrap">
                      <div className="pipeline-stage-track">
                        <div
                          className="pipeline-stage-fill"
                          style={{
                            width: `${stage.value}%`,
                            backgroundColor: getScoreColor(stage.value)
                          }}
                        />
                      </div>
                      <span className="pipeline-stage-score" style={{ color: getScoreColor(stage.value) }}>
                        {stage.value}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="pipeline-note">
                Scores are computed by a stateless multi-agent numerical pipeline. No text-based explanations are generated — only precise numerical signals.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateDetail;
