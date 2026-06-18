// Landing Page - Main entry point for RedRob AI Recruiter
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiPlay, FiArrowRight, FiCheck } from 'react-icons/fi';
import api from '../services/api';

const Landing = () => {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ jd: false, resumes: false });
  const [jdText, setJdText] = useState(null);

  const handleJDUpload = async (e) => {
    e.preventDefault();
    // Simulate file upload
    const result = await api.uploadJobDescription([{}]);
    if (result.success) {
      setUploadStatus(prev => ({ ...prev, jd: true }));
      setJdText(result.data.description);
    }
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    // Simulate file upload
    const result = await api.uploadResumes([{}, {}, {}]);
    if (result.success) {
      setUploadStatus(prev => ({ ...prev, resumes: true }));
    }
  };

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await api.runAIAnalysis(jdText);
      if (result.success && result.session_id) {
        setIsAnalyzing(false);
        navigate(`/dashboard?session=${result.session_id}`);
      } else {
        setIsAnalyzing(false);
        alert('AI Analysis failed to return session tracking ID');
      }
    } catch (error) {
      setIsAnalyzing(false);
      console.error(error);
      alert('Error running AI Analysis: ' + error.message);
    }
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">🚀</span>
            <span>AI-Powered Recruitment</span>
          </div>
          
          <h1 className="hero-title">
            Hire Better Candidates with{' '}
            <span className="gradient-text">AI Intelligence</span>
          </h1>
          
          <p className="hero-subtitle">
            Traditional ATS systems reject 75% of qualified candidates based on keyword matching. 
            RedRob uses advanced AI to understand context, skills, and potential — not just keywords.
          </p>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-value">94%</span>
              <span className="stat-label">Accuracy</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">3x</span>
              <span className="stat-label">Faster Hiring</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">+29</span>
              <span className="stat-label">Avg Score Boost</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="floating-card card-1">
            <div className="card-avatar">SC</div>
            <div className="card-info">
              <span className="card-name">Sarah Chen</span>
              <span className="card-score">94</span>
            </div>
          </div>
          <div className="floating-card card-2">
            <div className="card-avatar">MR</div>
            <div className="card-info">
              <span className="card-name">Marcus Johnson</span>
              <span className="card-score">87</span>
            </div>
          </div>
          <div className="floating-card card-3">
            <div className="card-avatar">ER</div>
            <div className="card-info">
              <span className="card-name">Emily Rodriguez</span>
              <span className="card-score">91</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-icon">📄</div>
            <h3>Upload Job Description</h3>
            <p>Share your job requirements and we'll analyze what makes a candidate successful in this role.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-icon">📁</div>
            <h3>Upload Resumes</h3>
            <p>Submit candidate resumes in any format. Our AI parses and understands each profile deeply.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-icon">🤖</div>
            <h3>AI Analysis</h3>
            <p>Our AI evaluates candidates across 5 dimensions: semantic match, skills, behavior, career growth, and domain expertise.</p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <div className="step-icon">🎯</div>
            <h3>Get Ranked Results</h3>
            <p>Receive intelligently ranked candidates with detailed insights and comparison tools.</p>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section className="upload-section">
        <h2 className="section-title">Get Started</h2>
        <div className="upload-container">
          <div className="upload-card">
            <div className="upload-header">
              <FiUpload className="upload-icon" />
              <h3>Job Description</h3>
            </div>
            <div 
              className={`upload-area ${uploadStatus.jd ? 'uploaded' : ''}`}
              onClick={handleJDUpload}
            >
              {uploadStatus.jd ? (
                <>
                  <FiCheck className="check-icon" />
                  <span>Job Description Uploaded</span>
                </>
              ) : (
                <>
                  <span>Click to upload job description</span>
                  <span className="upload-hint">PDF, DOC, DOCX</span>
                </>
              )}
            </div>
          </div>

          <div className="upload-card">
            <div className="upload-header">
              <FiUpload className="upload-icon" />
              <h3>Candidate Resumes</h3>
            </div>
            <div 
              className={`upload-area ${uploadStatus.resumes ? 'uploaded' : ''}`}
              onClick={handleResumeUpload}
            >
              {uploadStatus.resumes ? (
                <>
                  <FiCheck className="check-icon" />
                  <span>Resumes Uploaded</span>
                </>
              ) : (
                <>
                  <span>Click to upload resumes</span>
                  <span className="upload-hint">Multiple files supported</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button 
          className={`start-analysis-btn ${(!uploadStatus.jd || !uploadStatus.resumes) ? 'disabled' : ''}`}
          onClick={handleStartAnalysis}
          disabled={!uploadStatus.jd || !uploadStatus.resumes || isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <span className="loading-spinner"></span>
              Analyzing with AI...
            </>
          ) : (
            <>
              <FiPlay className="btn-icon" />
              Start AI Analysis
              <FiArrowRight className="btn-icon" />
            </>
          )}
        </button>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Why RedRob AI?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>Semantic Understanding</h3>
            <p>Understands context and meaning, not just keyword matching.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚖️</div>
            <h3>Fair Evaluation</h3>
            <p>Reduces bias by focusing on skills and potential rather than pedigree.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Detailed Insights</h3>
            <p>Get comprehensive breakdowns of each candidate's strengths and areas for growth.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Customizable Weights</h3>
            <p>Adjust scoring criteria based on your specific hiring priorities.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Candidate Comparison</h3>
            <p>Side-by-side comparison tools to make informed decisions.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>ATS Blindspot Detection</h3>
            <p>Find great candidates that traditional systems would reject.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to Transform Your Hiring?</h2>
        <p>Join companies that are making smarter hiring decisions with AI.</p>
        <button className="cta-button" onClick={() => navigate('/dashboard')}>
          Go to Dashboard
          <FiArrowRight className="btn-icon" />
        </button>
      </section>
    </div>
  );
};

export default Landing;
