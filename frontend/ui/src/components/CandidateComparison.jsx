// CandidateComparison - Side-by-side comparison of two candidates
import React from 'react';
import { FiMapPin, FiBriefcase, FiAward, FiCheck } from 'react-icons/fi';
import RadarChartComponent from './RadarChartComponent';

const CandidateComparison = ({ candidate1, candidate2 }) => {
  if (!candidate1 || !candidate2) return null;

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 80) return '#3b82f6';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  // Prepare data for radar chart comparison
  const radarData = [
    {
      name: candidate1.name,
      subject: 'Semantic Match',
      A: candidate1.scoreBreakdown.semanticMatch,
      fullMark: 100
    },
    {
      name: candidate1.name,
      subject: 'Skill Match',
      A: candidate1.scoreBreakdown.skillMatch,
      fullMark: 100
    },
    {
      name: candidate1.name,
      subject: 'Behavioral Match',
      A: candidate1.scoreBreakdown.behavioralMatch,
      fullMark: 100
    },
    {
      name: candidate1.name,
      subject: 'Career Progression',
      A: candidate1.scoreBreakdown.careerProgression,
      fullMark: 100
    },
    {
      name: candidate1.name,
      subject: 'Domain Experience',
      A: candidate1.scoreBreakdown.domainExperience,
      fullMark: 100
    },
    {
      name: candidate2.name,
      subject: 'Semantic Match',
      B: candidate2.scoreBreakdown.semanticMatch,
      fullMark: 100
    },
    {
      name: candidate2.name,
      subject: 'Skill Match',
      B: candidate2.scoreBreakdown.skillMatch,
      fullMark: 100
    },
    {
      name: candidate2.name,
      subject: 'Behavioral Match',
      B: candidate2.scoreBreakdown.behavioralMatch,
      fullMark: 100
    },
    {
      name: candidate2.name,
      subject: 'Career Progression',
      B: candidate2.scoreBreakdown.careerProgression,
      fullMark: 100
    },
    {
      name: candidate2.name,
      subject: 'Domain Experience',
      B: candidate2.scoreBreakdown.domainExperience,
      fullMark: 100
    }
  ];

  // Format for the actual radar chart component
  const formattedRadarData = [
    { subject: 'Semantic Match', [candidate1.name]: candidate1.scoreBreakdown.semanticMatch, [candidate2.name]: candidate2.scoreBreakdown.semanticMatch },
    { subject: 'Skill Match', [candidate1.name]: candidate1.scoreBreakdown.skillMatch, [candidate2.name]: candidate2.scoreBreakdown.skillMatch },
    { subject: 'Behavioral Match', [candidate1.name]: candidate1.scoreBreakdown.behavioralMatch, [candidate2.name]: candidate2.scoreBreakdown.behavioralMatch },
    { subject: 'Career Progression', [candidate1.name]: candidate1.scoreBreakdown.careerProgression, [candidate2.name]: candidate2.scoreBreakdown.careerProgression },
    { subject: 'Domain Experience', [candidate1.name]: candidate1.scoreBreakdown.domainExperience, [candidate2.name]: candidate2.scoreBreakdown.domainExperience }
  ];

  const allSkills = [...new Set([...candidate1.skills, ...candidate2.skills])];

  return (
    <div className="comparison-container">
      <div className="comparison-header">
        <h2>Candidate Comparison</h2>
        <p>Side-by-side analysis of two candidates</p>
      </div>

      {/* Overall Score Cards */}
      <div className="comparison-scores">
        <div className="comparison-score-card" style={{ borderLeft: `4px solid ${getScoreColor(candidate1.overallScore)}` }}>
          <h3>{candidate1.name}</h3>
          <div className="score-display">
            <span className="overall-score" style={{ color: getScoreColor(candidate1.overallScore) }}>
              {candidate1.overallScore}
            </span>
            <span className="score-label">Overall Match</span>
          </div>
          <div className="mini-stats">
            <span>ATS: {candidate1.atsScore}</span>
            <span>Exp: {candidate1.experience}</span>
          </div>
        </div>

        <div className="vs-divider">VS</div>

        <div className="comparison-score-card" style={{ borderRight: `4px solid ${getScoreColor(candidate2.overallScore)}` }}>
          <h3>{candidate2.name}</h3>
          <div className="score-display">
            <span className="overall-score" style={{ color: getScoreColor(candidate2.overallScore) }}>
              {candidate2.overallScore}
            </span>
            <span className="score-label">Overall Match</span>
          </div>
          <div className="mini-stats">
            <span>ATS: {candidate2.atsScore}</span>
            <span>Exp: {candidate2.experience}</span>
          </div>
        </div>
      </div>

      {/* Radar Chart Comparison */}
      <div className="comparison-chart-section">
        <h3>Skill Breakdown Comparison</h3>
        <RadarChartComponent 
          data={candidate1}
          multipleData={[
            candidate1,
            candidate2
          ]}
          colors={['#6366f1', '#8b5cf6']}
        />
      </div>

      {/* Detailed Comparison Grid */}
      <div className="comparison-grid">
        {/* Scores Info */}
        <div className="comparison-row">
          <div className="comparison-label">Overall AI Score</div>
          <div className="comparison-value" style={{ fontWeight: 'bold', color: getScoreColor(candidate1.overallScore) }}>
            {candidate1.overallScore}%
          </div>
          <div className="comparison-value" style={{ fontWeight: 'bold', color: getScoreColor(candidate2.overallScore) }}>
            {candidate2.overallScore}%
          </div>
        </div>

        <div className="comparison-row">
          <div className="comparison-label">ATS Score</div>
          <div className="comparison-value" style={{ fontWeight: '500' }}>
            {candidate1.atsScore}%
          </div>
          <div className="comparison-value" style={{ fontWeight: '500' }}>
            {candidate2.atsScore}%
          </div>
        </div>

        {/* Basic Info */}
        <div className="comparison-row">
          <div className="comparison-label">Role</div>
          <div className="comparison-value">{candidate1.role}</div>
          <div className="comparison-value">{candidate2.role}</div>
        </div>

        <div className="comparison-row">
          <div className="comparison-label">Location</div>
          <div className="comparison-value">
            <FiMapPin className="inline-icon" />
            {candidate1.location}
          </div>
          <div className="comparison-value">
            <FiMapPin className="inline-icon" />
            {candidate2.location}
          </div>
        </div>

        <div className="comparison-row">
          <div className="comparison-label">Experience</div>
          <div className="comparison-value">
            <FiBriefcase className="inline-icon" />
            {candidate1.experience}
          </div>
          <div className="comparison-value">
            <FiBriefcase className="inline-icon" />
            {candidate2.experience}
          </div>
        </div>

        {/* Skills Comparison */}
        <div className="comparison-row skills-row">
          <div className="comparison-label">Skills</div>
          <div className="comparison-value skills-list">
            {candidate1.skills.map((skill, idx) => (
              <span 
                key={idx} 
                className={`skill-badge ${candidate2.skills.includes(skill) ? 'common' : 'unique'}`}
              >
                {candidate2.skills.includes(skill) && <FiCheck className="skill-check-icon" />}
                {skill}
              </span>
            ))}
          </div>
          <div className="comparison-value skills-list">
            {candidate2.skills.map((skill, idx) => (
              <span 
                key={idx} 
                className={`skill-badge ${candidate1.skills.includes(skill) ? 'common' : 'unique'}`}
              >
                {candidate1.skills.includes(skill) && <FiCheck className="skill-check-icon" />}
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="comparison-row">
          <div className="comparison-label">Education</div>
          <div className="comparison-value education">
            {candidate1.education[0]?.degree}<br />
            <span className="school">{candidate1.education[0]?.school}</span>
          </div>
          <div className="comparison-value education">
            {candidate2.education[0]?.degree}<br />
            <span className="school">{candidate2.education[0]?.school}</span>
          </div>
        </div>

        {/* Certifications */}
        <div className="comparison-row">
          <div className="comparison-label">Certifications</div>
          <div className="comparison-value certifications">
            {candidate1.certifications.map((cert, idx) => (
              <div key={idx} className="cert-item">
                <FiAward className="cert-icon" />
                {cert}
              </div>
            ))}
          </div>
          <div className="comparison-value certifications">
            {candidate2.certifications.map((cert, idx) => (
              <div key={idx} className="cert-item">
                <FiAward className="cert-icon" />
                {cert}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateComparison;
