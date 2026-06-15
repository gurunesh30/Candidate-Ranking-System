// CandidateDetail Page - Detailed view of a single candidate
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, FiMapPin, FiBriefcase, FiAward, 
  FiBook, FiCheckCircle, FiTrendingUp, FiAlertCircle 
} from 'react-icons/fi';
import RadarChartComponent from '../components/RadarChartComponent';
import BlindspotVisualizer from '../components/BlindspotVisualizer';
import AIInsightCard from '../components/AIInsightCard';
import api from '../services/api';
import './CandidateDetail.css';

const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadCandidate();
  }, [id]);

  const loadCandidate = async () => {
    try {
      const data = await api.getCandidateById(id);
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
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          <FiArrowLeft className="btn-icon" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 80) return '#3b82f6';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const scoreColor = getScoreColor(candidate.overallScore);

  return (
    <div className="candidate-detail-page">
      {/* Header with Back Button */}
      <div className="detail-header">
        <button onClick={() => navigate('/dashboard')} className="back-button">
          <FiArrowLeft className="btn-icon" />
          Back to Dashboard
        </button>
        
        <div className="header-actions">
          <button 
            className="compare-btn"
            onClick={() => navigate(`/comparison?c1=${candidate.id}`)}
          >
            Compare Candidate
          </button>
        </div>
      </div>

      {/* Main Profile Section */}
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
              <span className="meta-item">
                <FiAward className="meta-icon" />
                {candidate.certifications.length} Certifications
              </span>
            </div>

            <p className="profile-summary">{candidate.summary}</p>
          </div>

          <div className="profile-score">
            <div 
              className="score-circle-large"
              style={{ 
                background: `conic-gradient(${scoreColor} ${candidate.overallScore}%, #374151 ${candidate.overallScore}%)` 
              }}
            >
              <div className="score-content">
                <span className="score-number">{candidate.overallScore}</span>
                <span className="score-text">Overall Match</span>
              </div>
            </div>
            <div className="ats-comparison">
              <span className="ats-label">ATS Score</span>
              <span className="ats-value">{candidate.atsScore}</span>
              <span className={`difference ${candidate.overallScore - candidate.atsScore >= 0 ? 'positive' : 'negative'}`}>
                {candidate.overallScore - candidate.atsScore >= 0 ? '+' : ''}
                {candidate.overallScore - candidate.atsScore}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="detail-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'experience' ? 'active' : ''}`}
          onClick={() => setActiveTab('experience')}
        >
          Experience
        </button>
        <button 
          className={`tab ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          Skills & Analysis
        </button>
        <button 
          className={`tab ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          AI Insights
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              {/* Skills Section */}
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

              {/* Education Section */}
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

              {/* Certifications Section */}
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
            </div>
          </div>
        )}

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

        {activeTab === 'skills' && (
          <div className="skills-tab">
            <div className="skills-analysis-grid">
              {/* Radar Chart */}
              <div className="chart-card">
                <div className="card-header">
                  <FiTrendingUp className="card-icon" />
                  <h3>Skill Breakdown</h3>
                </div>
                <RadarChartComponent data={candidate.scoreBreakdown} />
                
                <div className="score-breakdown-list">
                  {Object.entries(candidate.scoreBreakdown).map(([key, value]) => (
                    <div key={key} className="breakdown-item">
                      <span className="breakdown-label">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className="breakdown-bar">
                        <div 
                          className="breakdown-fill"
                          style={{ 
                            width: `${value}%`,
                            backgroundColor: getScoreColor(value)
                          }}
                        ></div>
                      </div>
                      <span className="breakdown-value">{value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ATS Blindspot */}
              <div className="blindspot-card">
                <BlindspotVisualizer 
                  atsScore={candidate.atsScore}
                  aiScore={candidate.overallScore}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="insights-tab">
            <AIInsightCard insights={candidate.aiInsights} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateDetail;
