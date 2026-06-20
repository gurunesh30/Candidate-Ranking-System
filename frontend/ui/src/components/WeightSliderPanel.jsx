// WeightSliderPanel - Allows recruiters to adjust scoring weights
import React from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

const DEFAULT_WEIGHTS = { semantic: 40, behavioral: 40, platform: 20 };

const WeightSliderPanel = ({ weights, onWeightChange, onReset }) => {
  const weightCategories = [
    {
      key: 'semantic',
      label: 'Semantic Skill Match',
      description: 'C++ engine — how well the resume semantically matches the job description',
      color: '#3b82f6',
    },
    {
      key: 'behavioral',
      label: 'Behavioral STAR Score',
      description: 'Qwen LLM — cultural fit, STAR-method responses, and behavioral indicators',
      color: '#8b5cf6',
    },
    {
      key: 'platform',
      label: 'Platform Signals',
      description: 'Activity signals, engagement, and domain credibility indicators',
      color: '#10b981',
    },
  ];

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const isBalanced = totalWeight === 100;

  return (
    <div className="weight-panel">
      <div className="panel-header">
        <div className="panel-title-row">
          <h3>Adjust Scoring Weights</h3>
          <button className="reset-weights-btn" onClick={onReset} title="Reset to defaults">
            <FiRefreshCw size={14} />
            Reset
          </button>
        </div>
        <p className="panel-subtitle">Drag sliders to reprioritise scoring. Scores update live.</p>
      </div>

      <div className="weight-sliders">
        {weightCategories.map((category) => (
          <div key={category.key} className="weight-slider-item">
            <div className="slider-label-group">
              <label className="slider-label">{category.label}</label>
              <span className="slider-value" style={{ color: category.color }}>
                {weights[category.key]}%
              </span>
            </div>
            <p className="slider-description">{category.description}</p>
            <div className="slider-track-wrap">
              <input
                type="range"
                min="0"
                max="100"
                value={weights[category.key]}
                onChange={(e) => onWeightChange(category.key, parseInt(e.target.value))}
                className="weight-slider"
                style={{ '--slider-color': category.color }}
              />
              <div
                className="slider-fill-indicator"
                style={{
                  width: `${weights[category.key]}%`,
                  backgroundColor: category.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="weight-summary">
        <div className="total-weight">
          <span>Total Weight:</span>
          <span className={`weight-value ${!isBalanced ? 'warning' : 'ok'}`}>
            {totalWeight}%
          </span>
        </div>
        {!isBalanced && (
          <p className="weight-warning">
            <FiAlertTriangle style={{ marginRight: '4px' }} />
            Weights should sum to 100%. Current total: {totalWeight}%. Scores are normalised automatically.
          </p>
        )}
        {isBalanced && (
          <p className="weight-ok">
            ✓ Weights are balanced
          </p>
        )}
      </div>
    </div>
  );
};

export { DEFAULT_WEIGHTS };
export default WeightSliderPanel;
