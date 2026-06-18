// WeightSliderPanel - Allows recruiters to adjust scoring weights
import React from 'react';

const WeightSliderPanel = ({ weights, onWeightChange }) => {
  const weightCategories = [
    { key: 'semantic', label: 'Semantic Match', description: 'How well the resume matches job description semantically' },
    { key: 'skill', label: 'Skill Match', description: 'Alignment of candidate skills with job requirements' },
    { key: 'behavioral', label: 'Behavioral Match', description: 'Cultural fit and behavioral indicators' },
    { key: 'career', label: 'Career Progression', description: 'Growth trajectory and role advancement' },
    { key: 'domain', label: 'Domain Experience', description: 'Relevant industry and domain expertise' },
  ];

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

  return (
    <div className="weight-panel">
      <div className="panel-header">
        <h3>Adjust Scoring Weights</h3>
        <p className="panel-subtitle">Customize how candidates are scored based on your priorities</p>
      </div>

      <div className="weight-sliders">
        {weightCategories.map((category) => (
          <div key={category.key} className="weight-slider-item">
            <div className="slider-label-group">
              <label className="slider-label">{category.label}</label>
              <span className="slider-value">{weights[category.key]}%</span>
            </div>
            <p className="slider-description">{category.description}</p>
            <input
              type="range"
              min="0"
              max="100"
              value={weights[category.key]}
              onChange={(e) => onWeightChange(category.key, parseInt(e.target.value))}
              className="weight-slider"
            />
          </div>
        ))}
      </div>

      <div className="weight-summary">
        <div className="total-weight">
          <span>Total Weight:</span>
          <span className={`weight-value ${totalWeight !== 500 ? 'warning' : ''}`}>
            {totalWeight}%
          </span>
        </div>
        {totalWeight !== 500 && (
          <p className="weight-warning">
            ⚠️ For balanced scoring, total should equal 500% (100% per category)
          </p>
        )}
      </div>
    </div>
  );
};

export default WeightSliderPanel;
