// CandidateCard component - Displays candidate summary with score
import React from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiBriefcase, FiArrowRight, FiCpu } from 'react-icons/fi';

const CandidateCard = ({ candidate, rank, sessionId, onViewInsights }) => {
  // Determine score color based on overall score
  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981'; // Green
    if (score >= 80) return '#3b82f6'; // Blue
    if (score >= 70) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const scoreColor = getScoreColor(candidate.overallScore);

  const getRankLabel = (r) => {
    if (r === 1) return '🥇';
    if (r === 2) return '🥈';
    if (r === 3) return '🥉';
    return `#${r}`;
  };

  return (
    <div className="candidate-card">
      {/* Rank Badge */}
      {rank != null && (
        <div className="rank-badge" title={`Rank #${rank}`}>
          {getRankLabel(rank)}
        </div>
      )}

      {/* Score Badge */}
      <div 
        className="score-badge"
        style={{ backgroundColor: scoreColor }}
      >
        <span className="score-value">{candidate.overallScore}</span>
        <span className="score-label">Match</span>
      </div>

      {/* Card Content */}
      <div className="card-content">
        <div className="card-header">
          <div className="candidate-avatar">
            {candidate.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="candidate-info">
            <h3 className="candidate-name">{candidate.name}</h3>
            <p className="candidate-role">{candidate.role}</p>
          </div>
        </div>

        <div className="card-details">
          <div className="detail-item">
            <FiMapPin className="detail-icon" />
            <span>{candidate.location}</span>
          </div>
          <div className="detail-item">
            <FiBriefcase className="detail-icon" />
            <span>{candidate.experience} experience</span>
          </div>
        </div>

        {/* Skills Preview */}
        <div className="skills-preview">
          {candidate.skills.slice(0, 5).map((skill, index) => (
            <span key={index} className="skill-tag">
              {skill}
            </span>
          ))}
          {candidate.skills.length > 5 && (
            <span className="skill-tag more">
              +{candidate.skills.length - 5} more
            </span>
          )}
        </div>

        <div className="card-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', width: '100%' }}>
          <button onClick={onViewInsights} className="view-details-btn" style={{ flex: 1, background: 'var(--murray-accent)', color: 'white', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}>
            <FiCpu style={{marginRight: '4px'}} /> View Insights
          </button>
          <Link to={sessionId ? `/candidate/${sessionId}/${candidate.id}` : `/candidate/${candidate.id}`} className="view-details-btn" style={{ flex: 1, textAlign: 'center', background: 'transparent', color: 'var(--murray-accent)', border: '1px solid var(--murray-accent)' }}>
            View Details
            <FiArrowRight className="btn-icon" style={{ marginLeft: '4px' }} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CandidateCard;
