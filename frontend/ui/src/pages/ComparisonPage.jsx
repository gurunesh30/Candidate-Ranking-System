// ComparisonPage - Page for comparing two candidates side-by-side
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiUserPlus } from 'react-icons/fi';
import CandidateComparison from '../components/CandidateComparison';
import api from '../services/api';
import './ComparisonPage.css';

const ComparisonPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [candidates, setCandidates] = useState([]);
  const [selected1, setSelected1] = useState(searchParams.get('c1') || '');
  const [selected2, setSelected2] = useState(searchParams.get('c2') || '');
  const [candidate1, setCandidate1] = useState(null);
  const [candidate2, setCandidate2] = useState(null);
  const [loading, setLoading] = useState(false);
  const sessionId = searchParams.get('session');

  useEffect(() => {
    loadAllCandidates();
  }, [sessionId]);

  useEffect(() => {
    if (selected1 && selected2) {
      loadSelectedCandidates();
    }
  }, [selected1, selected2, candidates]);

  const loadAllCandidates = async () => {
    try {
      const data = await api.getCandidates(sessionId);
      setCandidates(data);
      
      // Auto-select first two if none selected
      if (!selected1 && data.length > 0) {
        setSelected1(data[0].id.toString());
      }
      if (!selected2 && data.length > 1) {
        setSelected2(data[1].id.toString());
      }
    } catch (error) {
      console.error('Error loading candidates:', error);
    }
  };

  const loadSelectedCandidates = async () => {
    if (!selected1 || !selected2) return;
    
    setLoading(true);
    try {
      const c1 = candidates.find(c => c.id.toString() === selected1.toString());
      const c2 = candidates.find(c => c.id.toString() === selected2.toString());
      
      if (c1 && c2) {
        setCandidate1(c1);
        setCandidate2(c2);
      } else {
        const result = await api.compareCandidates(selected1, selected2);
        setCandidate1(result.candidate1);
        setCandidate2(result.candidate2);
      }
    } catch (error) {
      console.error('Error loading selected candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    const temp = selected1;
    setSelected1(selected2);
    setSelected2(temp);
  };

  return (
    <div className="comparison-page">
      {/* Header */}
      <div className="comparison-header-bar">
        <button onClick={() => navigate(sessionId ? `/dashboard?session=${sessionId}` : '/dashboard')} className="back-button">
          <FiArrowLeft className="btn-icon" />
          Back to Dashboard
        </button>
        
        <h1>Candidate Comparison</h1>
      </div>

      {/* Candidate Selectors */}
      <div className="candidate-selectors">
        <div className="selector-group">
          <label>Candidate 1</label>
          <select 
            value={selected1} 
            onChange={(e) => setSelected1(e.target.value)}
            className="candidate-select"
          >
            <option value="">Select Candidate</option>
            {candidates.map(candidate => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name} - {candidate.role} ({candidate.overallScore})
              </option>
            ))}
          </select>
        </div>

        <button className="swap-btn" onClick={handleSwap} title="Swap candidates">
          ⇄
        </button>

        <div className="selector-group">
          <label>Candidate 2</label>
          <select 
            value={selected2} 
            onChange={(e) => setSelected2(e.target.value)}
            className="candidate-select"
          >
            <option value="">Select Candidate</option>
            {candidates.map(candidate => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name} - {candidate.role} ({candidate.overallScore})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="comparison-loading">
          <div className="loading-spinner-large"></div>
          <p>Loading comparison...</p>
        </div>
      )}

      {/* Comparison Content */}
      {!loading && candidate1 && candidate2 && (
        <CandidateComparison candidate1={candidate1} candidate2={candidate2} />
      )}

      {/* No Selection State */}
      {!loading && (!candidate1 || !candidate2) && (
        <div className="no-selection">
          <FiUserPlus className="no-selection-icon" />
          <h3>Select Two Candidates to Compare</h3>
          <p>Choose two candidates from the dropdowns above to see a detailed side-by-side comparison.</p>
        </div>
      )}
    </div>
  );
};

export default ComparisonPage;
