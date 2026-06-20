// ComparisonPage - Page for comparing two candidates side-by-side
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiUserPlus, FiRepeat } from 'react-icons/fi';
import CandidateComparison from '../components/CandidateComparison';
import api from '../services/api';
import './ComparisonPage.css';

const ComparisonPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [candidates, setCandidates] = useState([]);
  const [candidate1, setCandidate1] = useState(null);
  const [candidate2, setCandidate2] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const selected1 = searchParams.get('c1') || '';
  const selected2 = searchParams.get('c2') || '';
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
      
      let nextParams = null;
      let s1 = selected1;
      let s2 = selected2;

      if (!s1 && data.length > 0) {
        s1 = data[0].id.toString();
        nextParams = nextParams || new URLSearchParams(searchParams);
        nextParams.set('c1', s1);
      }
      if (!s2 && data.length > 1) {
        const nextCand = data.find(c => c.id.toString() !== s1);
        s2 = nextCand ? nextCand.id.toString() : data[1].id.toString();
        nextParams = nextParams || new URLSearchParams(searchParams);
        nextParams.set('c2', s2);
      } else if (s1 && s2 && s1 === s2 && data.length > 1) {
        // Prevent duplicate selection
        const nextCand = data.find(c => c.id.toString() !== s1);
        s2 = nextCand ? nextCand.id.toString() : data[1].id.toString();
        nextParams = nextParams || new URLSearchParams(searchParams);
        nextParams.set('c2', s2);
      }

      if (nextParams) {
        setSearchParams(nextParams);
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

  const handleSelect1Change = (val) => {
    const params = new URLSearchParams(searchParams);
    if (val) params.set('c1', val);
    else params.delete('c1');
    setSearchParams(params);
  };

  const handleSelect2Change = (val) => {
    const params = new URLSearchParams(searchParams);
    if (val) params.set('c2', val);
    else params.delete('c2');
    setSearchParams(params);
  };

  const handleSwap = () => {
    const params = new URLSearchParams(searchParams);
    params.set('c1', selected2);
    params.set('c2', selected1);
    setSearchParams(params);
  };

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(sessionId ? `/dashboard?session=${sessionId}` : '/dashboard');
    }
  };

  return (
    <div className="comparison-page">
      {/* Header */}
      <div className="comparison-header-bar">
        <button onClick={handleBack} className="back-button">
          <FiArrowLeft className="btn-icon" />
          Back
        </button>
        
        <h1>Candidate Comparison</h1>
      </div>

      {/* Candidate Selectors */}
      <div className="candidate-selectors">
        <div className="selector-group">
          <label>Candidate 1</label>
          <select 
            value={selected1} 
            onChange={(e) => handleSelect1Change(e.target.value)}
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
          <FiRepeat size={24} />
        </button>

        <div className="selector-group">
          <label>Candidate 2</label>
          <select 
            value={selected2} 
            onChange={(e) => handleSelect2Change(e.target.value)}
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
