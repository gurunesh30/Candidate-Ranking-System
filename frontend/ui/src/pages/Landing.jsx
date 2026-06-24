import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUpload,
  FiPlay,
  FiArrowRight,
  FiCheck,
  FiFileText,
  FiX,
  FiZap,
  FiFolder,
  FiCpu,
  FiCrosshair,
  FiBarChart2,
  FiUsers,
  FiEye,
  FiSliders,
} from "react-icons/fi";
import AnalysisLoadingScreen from "../components/AnalysisLoadingScreen";
import api from "../services/api";

const Landing = () => {
  const navigate = useNavigate();
  const jdInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
<<<<<<< HEAD
  const [uploadStatus, setUploadStatus] = useState({
    jd: false,
    resumes: false,
  });
  const [jdFile, setJdFile] = useState(null); // raw File object — do NOT read as text
  const [jdFileName, setJdFileName] = useState("");
=======
  const [uploadStatus, setUploadStatus] = useState({ jd: false, resumes: false });
  const [jdText, setJdText] = useState(null);
  const [jdFileName, setJdFileName] = useState('');
  const [resumeCount, setResumeCount] = useState(0);
  const [jdFile, setJdFile] = useState(null);       // raw File object — do NOT read as text
  const [jdFileName, setJdFileName] = useState('');
>>>>>>> 625c5377da17495cda9ab7bce93160e9c31a91aa
  const [resumeCount, setResumeCount] = useState(0);
  const [parsedJDTitle, setParsedJDTitle] = useState("");

  const handleJDUploadClick = () => {
    jdInputRef.current?.click();
  };

  const handleJDFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result;
      if (text) {
        setJdText(text);
        setJdFileName(file.name);
        setUploadStatus(prev => ({ ...prev, jd: true }));
      }
    };
    reader.readAsText(file);
    // Store the raw File object — .docx is a zip binary, don't read as text
    setJdFile(file);
    setJdFileName(file.name);
    setUploadStatus((prev) => ({ ...prev, jd: true }));
  };

  const handleResumeUploadClick = () => {
    resumeInputRef.current?.click();
  };

  const handleResumeFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setResumeCount(files.length);
    setUploadStatus((prev) => ({ ...prev, resumes: true }));
  };

  const clearJD = () => {
    setJdText(null);
    setJdFileName('');
    setJdFile(null);
    setJdFileName("");
    setParsedJDTitle("");
    setUploadStatus((prev) => ({ ...prev, jd: false }));
    if (jdInputRef.current) jdInputRef.current.value = "";
  };

  const clearResumes = () => {
    setResumeCount(0);
    setUploadStatus((prev) => ({ ...prev, resumes: false }));
    if (resumeInputRef.current) resumeInputRef.current.value = "";
  };

  const handleStartAnalysis = async () => {
    if (!jdFile) {
      alert("Please upload a Job Description (.docx) file first.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await api.runAIAnalysis(jdText);
      if (result.success && result.session_id) {
      const result = await api.runAIAnalysis(jdFile);
      if (result.success && result.session_id) {
        if (result.parsedJD?.job_title) setParsedJDTitle(result.parsedJD.job_title);
        // Stop the loading animation first, then navigate with rankings in state
        // so Dashboard renders immediately without a second network round-trip.
        setIsAnalyzing(false);
        navigate(`/dashboard?session=${result.session_id}`, {
          state: { rankings: result.rankings, analyzedCount: result.analyzedCount },
        });
      } else {
        setIsAnalyzing(false);
        alert("AI Analysis failed to return a session ID.");
      }
    } catch (error) {
      setIsAnalyzing(false);
      console.error(error);
      alert("Error running AI Analysis: " + error.message);
    }
  };

  return (
    <>
      <AnalysisLoadingScreen isActive={isAnalyzing} />
      <div className="landing-page">
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">
              <FiZap className="badge-icon" />
              <span>AI-Powered Recruitment</span>
            </div>

            <h1 className="hero-title">
              Hire Better Candidates with{" "}
              <span className="gradient-text">AI Intelligence</span>
            </h1>

            <p className="hero-subtitle">
              Traditional ATS systems reject 75% of qualified candidates based
              on keyword matching. RedRob uses advanced AI to understand
              context, skills, and potential — not just keywords.
            </p>

            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-value">94%</span>
                <span className="stat-label">Accuracy</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-value">3x</span>
                <span className="stat-label">Faster Hiring</span>
              </div>
              <div className="stat-divider" />
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

        <section className="how-it-works">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <FiFileText className="step-icon" />
              <h3>Upload Job Description</h3>
              <p>
                Share your job requirements and we'll analyze what makes a
                candidate successful in this role.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <FiFolder className="step-icon" />
              <h3>Upload Resumes</h3>
              <p>
                Submit candidate resumes in any format. Our AI parses and
                understands each profile deeply.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <FiCpu className="step-icon" />
              <h3>AI Analysis</h3>
              <p>
                Our AI evaluates candidates across 5 dimensions: semantic match,
                skills, behavior, career growth, and domain expertise.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <FiCrosshair className="step-icon" />
              <h3>Get Ranked Results</h3>
              <p>
                Receive intelligently ranked candidates with detailed insights
                and comparison tools.
              </p>
            </div>
          </div>
        </section>

        <section className="upload-section">
          <h2 className="section-title">Get Started</h2>
          <div className="upload-container">
            <div className="upload-card">
              <div className="upload-header">
                <FiUpload className="upload-icon" />
                <h3>Job Description</h3>
              </div>
              <div
                className={`upload-area ${uploadStatus.jd ? "uploaded" : ""}`}
                onClick={handleJDUploadClick}
              >
                {uploadStatus.jd ? (
                  <>
                    <FiCheck className="check-icon" />
                    <span>Job Description Uploaded</span>
                    <span className="upload-hint">{jdFileName}</span>
                  </>
                ) : (
                  <>
                    <FiFileText className="upload-big-icon" />
                    <span>Click to upload job description</span>
                    <span className="upload-hint">
                      Supports .txt, .pdf, .docx
                    </span>
                  </>
                )}
              </div>
              <input
                ref={jdInputRef}
                type="file"
                accept=".txt,.pdf,.docx,.doc"
                onChange={handleJDFileChange}
                style={{ display: "none" }}
              />
              {uploadStatus.jd && (
                <div className="jd-preview">
                  <div className="jd-preview-header">
                    <FiFileText className="jd-preview-icon" />
                    <span className="jd-preview-filename">{jdFileName}</span>
                    <button
                      className="jd-clear-btn"
                      onClick={clearJD}
                      title="Remove file"
                    >
                      <FiX />
                    </button>
                  </div>
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: "0.82rem",
                      color: "var(--text-muted, #8892a4)",
                      padding: "0 4px",
                    }}
                  >
                    ✓ Ready — the backend will parse this file when you start
                    analysis.
                  </p>
                </div>
              )}
            </div>

            <div className="upload-card">
              <div className="upload-header">
                <FiUpload className="upload-icon" />
                <h3>Candidate Resumes</h3>
              </div>
              <div className="upload-area">
                <FiUpload className="upload-big-icon" />
                <span>Resume upload</span>
                <span className="upload-hint">
                  Candidates are loaded server-side — no upload needed
                </span>
              </div>
              <input
                ref={resumeInputRef}
                type="file"
                accept=".txt,.pdf,.docx,.doc"
                multiple
                onChange={handleResumeFileChange}
                style={{ display: "none" }}
              />
            </div>
          </div>

          <button
            className={`start-analysis-btn ${!uploadStatus.jd ? "disabled" : ""}`}
            onClick={handleStartAnalysis}
            disabled={!uploadStatus.jd || isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <span className="loading-spinner" />
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

        <section className="features-section">
          <h2 className="section-title">Why RedRob AI?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <FiCpu className="feature-icon" />
              <h3>Semantic Understanding</h3>
              <p>Understands context and meaning, not just keyword matching.</p>
            </div>
            <div className="feature-card">
              <svg
                className="feature-icon"
                viewBox="0 0 24 24"
                width="1em"
                height="1em"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="8" y1="22" x2="16" y2="22" />
                <path d="M6 6l-4 10h8L6 6z" />
                <path d="M18 6l-4 10h8l-4-10z" />
              </svg>
              <h3>Fair Evaluation</h3>
              <p>
                Reduces bias by focusing on skills and potential rather than
                pedigree.
              </p>
            </div>
            <div className="feature-card">
              <FiBarChart2 className="feature-icon" />
              <h3>Detailed Insights</h3>
              <p>
                Get comprehensive breakdowns of each candidate's strengths and
                areas for growth.
              </p>
            </div>
            <div className="feature-card">
              <FiSliders className="feature-icon" />
              <h3>Customizable Weights</h3>
              <p>
                Adjust scoring criteria based on your specific hiring
                priorities.
              </p>
            </div>
            <div className="feature-card">
              <FiUsers className="feature-icon" />
              <h3>Candidate Comparison</h3>
              <p>Side-by-side comparison tools to make informed decisions.</p>
            </div>
            <div className="feature-card">
              <FiEye className="feature-icon" />
              <h3>ATS Blindspot Detection</h3>
              <p>
                Find great candidates that traditional systems would reject.
              </p>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <h2>Ready to Transform Your Hiring?</h2>
          <p>
            Join companies that are making smarter hiring decisions with AI.
          </p>
<<<<<<< HEAD
          <button className="cta-button" onClick={() => navigate("/dashboard")}>
            Go to Dashboard
            <FiArrowRight className="btn-icon" />
          </button>
        </section>
      </div>
    </>
=======

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-value">94%</span>
              <span className="stat-label">Accuracy</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">3x</span>
              <span className="stat-label">Faster Hiring</span>
            </div>
            <div className="stat-divider" />
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

      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <FiFileText className="step-icon" />
            <h3>Upload Job Description</h3>
            <p>Share your job requirements and we'll analyze what makes a candidate successful in this role.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <FiFolder className="step-icon" />
            <h3>Upload Resumes</h3>
            <p>Submit candidate resumes in any format. Our AI parses and understands each profile deeply.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <FiCpu className="step-icon" />
            <h3>AI Analysis</h3>
            <p>Our AI evaluates candidates across 5 dimensions: semantic match, skills, behavior, career growth, and domain expertise.</p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <FiCrosshair className="step-icon" />
            <h3>Get Ranked Results</h3>
            <p>Receive intelligently ranked candidates with detailed insights and comparison tools.</p>
          </div>
        </div>
      </section>

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
              onClick={handleJDUploadClick}
            >
              {uploadStatus.jd ? (
                <>
                  <FiCheck className="check-icon" />
                  <span>Job Description Uploaded</span>
                  <span className="upload-hint">{jdFileName}</span>
                </>
              ) : (
                <>
                  <FiFileText className="upload-big-icon" />
                  <span>Click to upload job description</span>
                  <span className="upload-hint">Supports .txt, .pdf, .docx</span>
                </>
              )}
            </div>
            <input
              ref={jdInputRef}
              type="file"
              accept=".txt,.pdf,.docx,.doc"
              onChange={handleJDFileChange}
              style={{ display: 'none' }}
            />
            {uploadStatus.jd && (
              <div className="jd-preview">
                <div className="jd-preview-header">
                  <FiFileText className="jd-preview-icon" />
                  <span className="jd-preview-filename">{jdFileName}</span>
                  <button className="jd-clear-btn" onClick={clearJD} title="Remove file">
                    <FiX />
                  </button>
                </div>
                <textarea
                  className="jd-textarea"
                  value={jdText || ''}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Job description content..."
                  rows={6}
                />
                <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: 'var(--text-muted, #8892a4)', padding: '0 4px' }}>
                  ✓ Ready — the backend will parse this file when you start analysis.
                </p>
              </div>
            )}
          </div>

          <div className="upload-card">
            <div className="upload-header">
              <FiUpload className="upload-icon" />
              <h3>Candidate Resumes</h3>
            </div>
            <div
              className={`upload-area ${uploadStatus.resumes ? 'uploaded' : ''}`}
              onClick={handleResumeUploadClick}
            >
              {uploadStatus.resumes ? (
                <>
                  <FiCheck className="check-icon" />
                  <span>{resumeCount} Resume{resumeCount > 1 ? 's' : ''} Uploaded</span>
                </>
              ) : (
                <>
                  <FiUpload className="upload-big-icon" />
                  <span>Click to upload resumes</span>
                  <span className="upload-hint">Multiple files supported</span>
                </>
              )}
            </div>
            <input
              ref={resumeInputRef}
              type="file"
              accept=".txt,.pdf,.docx,.doc"
              multiple
              onChange={handleResumeFileChange}
              style={{ display: 'none' }}
            />
            {uploadStatus.resumes && (
              <div className="jd-preview">
                <div className="jd-preview-header">
                  <FiFileText className="jd-preview-icon" />
                  <span className="jd-preview-filename">{resumeCount} file{resumeCount > 1 ? 's' : ''} selected</span>
                  <button className="jd-clear-btn" onClick={clearResumes} title="Remove files">
                    <FiRefreshCw />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          className={`start-analysis-btn ${(!uploadStatus.jd || !uploadStatus.resumes) ? 'disabled' : ''}`}
          onClick={handleStartAnalysis}
          disabled={!uploadStatus.jd || !uploadStatus.resumes || isAnalyzing}
          className={`start-analysis-btn ${!uploadStatus.jd ? 'disabled' : ''}`}
          onClick={handleStartAnalysis}
          disabled={!uploadStatus.jd || isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <span className="loading-spinner" />
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

      <section className="features-section">
        <h2 className="section-title">Why RedRob AI?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <FiCpu className="feature-icon" />
            <h3>Semantic Understanding</h3>
            <p>Understands context and meaning, not just keyword matching.</p>
          </div>
          <div className="feature-card">
            <svg className="feature-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="8" y1="22" x2="16" y2="22" />
              <path d="M6 6l-4 10h8L6 6z" />
              <path d="M18 6l-4 10h8l-4-10z" />
            </svg>
            <h3>Fair Evaluation</h3>
            <p>Reduces bias by focusing on skills and potential rather than pedigree.</p>
          </div>
          <div className="feature-card">
            <FiBarChart2 className="feature-icon" />
            <h3>Detailed Insights</h3>
            <p>Get comprehensive breakdowns of each candidate's strengths and areas for growth.</p>
          </div>
          <div className="feature-card">
            <FiSliders className="feature-icon" />
            <h3>Customizable Weights</h3>
            <p>Adjust scoring criteria based on your specific hiring priorities.</p>
          </div>
          <div className="feature-card">
            <FiUsers className="feature-icon" />
            <h3>Candidate Comparison</h3>
            <p>Side-by-side comparison tools to make informed decisions.</p>
          </div>
          <div className="feature-card">
            <FiEye className="feature-icon" />
            <h3>ATS Blindspot Detection</h3>
            <p>Find great candidates that traditional systems would reject.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Transform Your Hiring?</h2>
        <p>Join companies that are making smarter hiring decisions with AI.</p>
        <button className="cta-button" onClick={() => navigate('/dashboard')}>
          Go to Dashboard
          <FiArrowRight className="btn-icon" />
        </button>
      </section>
    </div>
>>>>>>> 625c5377da17495cda9ab7bce93160e9c31a91aa
  );
};

export default Landing;
