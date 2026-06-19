// BlindspotVisualizer - Compares ATS Score vs AI Score visually
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FiClipboard, FiCpu, FiTarget, FiAlertTriangle, FiZap } from 'react-icons/fi';

const BlindspotVisualizer = ({ atsScore, aiScore }) => {
  const difference = aiScore - atsScore;
  const isPositive = difference >= 0;

  const data = [
    {
      name: 'ATS Score',
      score: atsScore,
      fill: '#6b7280' // Gray for traditional ATS
    },
    {
      name: 'AI Score',
      score: aiScore,
      fill: isPositive ? '#10b981' : '#ef4444' // Green if better, red if worse
    }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{payload[0].payload.name}</p>
          <p className="tooltip-value">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="blindspot-visualizer">
      <div className="visualizer-header">
        <h3>ATS Blindspot Visualizer</h3>
        <p className="visualizer-subtitle">
          See how AI scoring reveals candidates that traditional ATS might miss
        </p>
      </div>

      <div className="score-cards-row">
        <div className="score-card ats">
          <div className="card-icon"><FiClipboard /></div>
          <div className="card-info">
            <span className="card-label">Traditional ATS</span>
            <span className="card-score">{atsScore}</span>
          </div>
        </div>

        <div className="score-card ai">
          <div className="card-icon"><FiCpu /></div>
          <div className="card-info">
            <span className="card-label">AI Match Score</span>
            <span className="card-score">{aiScore}</span>
          </div>
        </div>

        <div className={`score-card difference ${isPositive ? 'positive' : 'negative'}`}>
          <div className="card-icon">{isPositive ? <FiTarget /> : <FiAlertTriangle />}</div>
          <div className="card-info">
            <span className="card-label">Difference</span>
            <span className="card-score">
              {isPositive ? '+' : ''}{difference}
            </span>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#9ca3af' }}
              axisLine={{ stroke: '#4b5563' }}
            />
            <YAxis 
              domain={[0, 100]}
              tick={{ fill: '#9ca3af' }}
              axisLine={{ stroke: '#4b5563' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="score" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {isPositive && difference > 10 && (
        <div className="insight-banner">
          <span className="insight-icon"><FiZap /></span>
          <p>
            <strong>Insight:</strong> This candidate scores {difference} points higher with AI analysis! 
            Traditional keyword-based ATS systems often miss qualified candidates who use different terminology 
            or have transferable skills.
          </p>
        </div>
      )}
    </div>
  );
};

export default BlindspotVisualizer;
