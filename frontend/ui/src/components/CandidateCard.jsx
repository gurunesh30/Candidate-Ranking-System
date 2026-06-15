// CandidateCard component - Displays candidate summary with score
import React from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiBriefcase, FiArrowRight } from 'react-icons/fi';

const CandidateCard = ({ candidate }) => {
  // Determine score color based on overall score
  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981'; // Green
    if (score >= 80) return '#3b82f6'; // Blue
    if (score >= 70) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const scoreColor = getScoreColor(candidate.overallScore);

  return (
    <div className="candidate-card">
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

        {/* ATS vs AI Score Comparison */}
        <div className="score-comparison">
          <div className="comparison-item">
            <span className="comparison-label">ATS Score</span>
            <span className="comparison-value ats">{candidate.atsScore}</span>
          </div>
          <div className="comparison-item">
            <span className="comparison-label">AI Score</span>
            <span className="comparison-value ai" style={{ color: scoreColor }}>
              {candidate.overallScore}
            </span>
          </div>
          <div className="comparison-difference">
            <span className={`difference ${candidate.overallScore - candidate.atsScore >= 0 ? 'positive' : 'negative'}`}>
              {candidate.overallScore - candidate.atsScore >= 0 ? '+' : ''}
              {candidate.overallScore - candidate.atsScore}
            </span>
          </div>
        </div>

        {/* View Details Button */}
        <Link to={`/candidate/${candidate.id}`} className="view-details-btn">
          View Details
          <FiArrowRight className="btn-icon" />
        </Link>
      </div>
    </div>
  );
};

export default CandidateCard;
