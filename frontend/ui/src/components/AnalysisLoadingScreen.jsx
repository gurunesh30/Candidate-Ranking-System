import React from "react";

const AnalysisLoadingScreen = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <div
      className="ald-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-label="Analysis in progress"
    >
      <div className="ald-scene">
        <svg
          className="ald-char"
          viewBox="0 0 88 106"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Antenna stem */}
          <line
            x1="44"
            y1="14"
            x2="44"
            y2="5"
            stroke="#93c5fd"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Antenna tip — pulses */}
          <circle
            className="ald-antenna"
            cx="44"
            cy="3.2"
            r="3.2"
            fill="#3b82f6"
          />

          {/* Head */}
          <rect x="8" y="14" width="72" height="50" rx="18" fill="#1e3a8a" />

          {/* Left eye group — blinks */}
          <g className="ald-eye-l">
            <circle cx="29" cy="39" r="8.5" fill="white" />
            <circle cx="29" cy="39" r="4.2" fill="#2563eb" />
            <circle cx="31.2" cy="37" r="1.6" fill="white" fillOpacity="0.85" />
          </g>

          {/* Right eye group — blinks with slight delay */}
          <g className="ald-eye-r">
            <circle cx="59" cy="39" r="8.5" fill="white" />
            <circle cx="59" cy="39" r="4.2" fill="#2563eb" />
            <circle cx="61.2" cy="37" r="1.6" fill="white" fillOpacity="0.85" />
          </g>

          {/* Mouth */}
          <path
            d="M33 54 Q44 60 55 54"
            stroke="#93c5fd"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Neck */}
          <rect x="34" y="64" width="20" height="8" rx="4" fill="#1e40af" />

          {/* Body */}
          <rect x="14" y="72" width="60" height="30" rx="13" fill="#1e40af" />

          {/* Body detail lines */}
          <rect
            x="24"
            y="80"
            width="40"
            height="3"
            rx="1.5"
            fill="rgba(255,255,255,0.18)"
          />
          <rect
            x="24"
            y="86"
            width="26"
            height="3"
            rx="1.5"
            fill="rgba(255,255,255,0.11)"
          />

          {/* Arms */}
          <rect x="0" y="74" width="12" height="20" rx="6" fill="#1e3a8a" />
          <rect x="76" y="74" width="12" height="20" rx="6" fill="#1e3a8a" />
        </svg>

        <p className="ald-label">Analyzing</p>
      </div>
    </div>
  );
};

export default AnalysisLoadingScreen;
