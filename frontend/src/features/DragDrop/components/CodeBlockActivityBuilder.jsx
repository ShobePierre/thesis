import React, { useState, useEffect } from "react";
import axios from "axios";
import { CodeBlockParser, createSampleCodeBlocks } from "../utils/codeBlockParser";
import AnswerSequenceEditor from "./AnswerSequenceEditor";
import "./CodeBlockActivityBuilder.css";

/**
 * Instructor UI for creating code-block drag-drop activities
 * Allows uploading code, marking hidden blocks, and configuring difficulty
 */
export default function CodeBlockActivityBuilder({ activityId, onSave, initialData = null }) {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [hiddenBlockIds, setHiddenBlockIds] = useState([]);
  const [correctBlockOrder, setCorrectBlockOrder] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [hints, setHints] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = "http://localhost:5000/api";

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setLanguage(initialData.language || "python");
      setCode(initialData.code || "");
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setDifficulty(initialData.difficulty || "easy");
      setHiddenBlockIds(initialData.hiddenBlockIds || []);
      setCorrectBlockOrder(initialData.correctBlockOrder || []);
      setHints(initialData.hints || {});
      parseCodeBlocks(initialData.code, initialData.language);
    }
  }, [initialData]);

  /**
   * Parse code and extract blocks
   */
  const parseCodeBlocks = (sourceCode, lang) => {
    setParseError(null);

    if (!sourceCode.trim()) {
      setBlocks([]);
      return;
    }

    try {
      const parser = new CodeBlockParser(lang || language);
      const parsedBlocks = parser.parseCode(sourceCode);
      setBlocks(parsedBlocks);
    } catch (error) {
      setParseError(`Failed to parse code: ${error.message}`);
      setBlocks([]);
    }
  };

  /**
   * Handle code input change
   */
  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    parseCodeBlocks(newCode, language);
  };

  /**
   * Handle language change
   */
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    parseCodeBlocks(code, newLanguage);
  };

  /**
   * Toggle block visibility
   */
  const toggleBlockHidden = (blockId) => {
    setHiddenBlockIds((prev) =>
      prev.includes(blockId)
        ? prev.filter((id) => id !== blockId)
        : [...prev, blockId]
    );
  };

  /**
   * Update hint for a block
   */
  const updateBlockHint = (blockId, hint) => {
    setHints((prev) => ({
      ...prev,
      [blockId]: hint,
    }));
  };

  /**
   * Load sample code
   */
  const loadSampleCode = () => {
    const samples = {
      python: `x = 10
y = 20
z = x + y
print(z)`,
      javascript: `let x = 10;
let y = 20;
let z = x + y;
console.log(z);`,
      java: `int x = 10;
int y = 20;
int z = x + y;
System.out.println(z);`,
    };

    const sampleCode = samples[language] || samples.python;
    setCode(sampleCode);
    parseCodeBlocks(sampleCode, language);
  };

  /**
   * Save activity to backend
   */
  const handleSave = async () => {
    if (!title.trim()) {
      setParseError("Please enter a title");
      return;
    }

    if (blocks.length === 0) {
      setParseError("Please provide code with at least one block");
      return;
    }

    if (hiddenBlockIds.length === 0) {
      setParseError("Please mark at least one block as hidden");
      return;
    }

    if (correctBlockOrder.length === 0) {
      setParseError("Please set the correct answer sequence before saving");
      return;
    }

    if (correctBlockOrder.length !== hiddenBlockIds.length) {
      setParseError("All hidden blocks must be included in the correct sequence");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const activityData = {
        title,
        description,
        language,
        code,
        blocks,
        hiddenBlockIds,
        correctBlockOrder,
        difficulty,
        hints,
        type: "codeblock",
      };

      if (activityId) {
        // Update existing activity
        await axios.put(
          `${API_BASE_URL}/activity/${activityId}`,
          activityData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create new activity
        await axios.post(
          `${API_BASE_URL}/activity`,
          activityData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setSuccessMessage("Activity saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);

      if (onSave) {
        onSave(activityData);
      }
    } catch (error) {
      setParseError(`Failed to save activity: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="code-block-builder">
      <div className="builder-wrapper">
        {/* Animated Header */}
        <div className="builder-header">
          <div className="header-content">
            <div className="header-icon">🧩</div>
            <div className="header-text">
              <h1>Code Block Activity Builder</h1>
              <p>Create interactive drag-and-drop coding challenges for your students</p>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{width: `${Math.min(100, (title && code && hiddenBlockIds.length > 0 && correctBlockOrder.length > 0 ? 100 : 50))}%`}}></div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="builder-content">
          {/* Left Panel - Code Input */}
          <div className="builder-panel input-panel">
            <div className="panel-header">
              <span className="step-number">1</span>
              <h2>Activity Details</h2>
            </div>

            <div className="form-group">
              <label>Activity Title *</label>
              <input
                type="text"
                placeholder="e.g., Complete the Loop Function"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                placeholder="Describe what students need to accomplish..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="textarea-field"
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Language *</label>
                <select value={language} onChange={handleLanguageChange} className="select-field">
                  <option value="python">🐍 Python</option>
                  <option value="javascript">📜 JavaScript</option>
                  <option value="java">☕ Java</option>
                  <option value="cpp">⚙️ C++</option>
                </select>
              </div>

              <div className="form-group">
                <label>Difficulty *</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="select-field difficulty-select">
                  <option value="easy">🟢 Easy</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="hard">🔴 Hard</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Source Code *</label>
              <div className="code-input-wrapper">
                <textarea
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="Paste your code here..."
                  className="code-input"
                  spellCheck="false"
                />
                <button className="btn-helper" onClick={loadSampleCode}>
                  📋 Load Sample
                </button>
              </div>
            </div>

            {parseError && <div className="alert alert-error">⚠️ {parseError}</div>}
            {successMessage && <div className="alert alert-success">✓ {successMessage}</div>}
          </div>

          {/* Middle Panel - Block Configuration */}
          <div className="builder-panel config-panel">
            <div className="panel-header">
              <span className="step-number">2</span>
              <h2>Select Hidden Blocks</h2>
            </div>

            {blocks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <p>Enter code to see code blocks</p>
              </div>
            ) : (
              <div className="blocks-list">
                {blocks.map((block, idx) => (
                  <div key={block.id} className={`block-item ${hiddenBlockIds.includes(block.id) ? 'hidden' : ''}`}>
                    <div className="block-index">{idx + 1}</div>
                    <label className="block-checkbox">
                      <input
                        type="checkbox"
                        checked={hiddenBlockIds.includes(block.id)}
                        onChange={() => toggleBlockHidden(block.id)}
                      />
                      <span className="checkmark"></span>
                    </label>
                    <div className="block-details">
                      <code className="block-code">{block.content}</code>
                      <span className="block-type">{block.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="blocks-stats">
              <div className="stat">
                <span className="stat-icon">📦</span>
                <div>
                  <div className="stat-value">{blocks.length}</div>
                  <div className="stat-label">Total Blocks</div>
                </div>
              </div>
              <div className="stat">
                <span className="stat-icon">🔒</span>
                <div>
                  <div className="stat-value">{hiddenBlockIds.length}</div>
                  <div className="stat-label">Hidden</div>
                </div>
              </div>
            </div>

            {hiddenBlockIds.length > 0 && (
              <div className="hints-section">
                <h3>Hints for Hidden Blocks</h3>
                {blocks.filter(b => hiddenBlockIds.includes(b.id)).map((block) => (
                  <div key={block.id} className="hint-item">
                    <code className="hint-code">{block.content}</code>
                    <input
                      type="text"
                      placeholder="Add a helpful hint..."
                      value={hints[block.id] || ""}
                      onChange={(e) => updateBlockHint(block.id, e.target.value)}
                      className="hint-input"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel - Answer Sequence */}
          {hiddenBlockIds.length > 0 && (
            <div className="builder-panel answer-panel">
              <div className="panel-header">
                <span className="step-number">3</span>
                <h2>Correct Sequence</h2>
              </div>
              <p className="panel-description">Drag hidden blocks in the correct order:</p>
              <AnswerSequenceEditor 
                blocks={blocks}
                hiddenBlockIds={hiddenBlockIds}
                initialSequence={correctBlockOrder}
                onSequenceSet={setCorrectBlockOrder}
              />
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="builder-footer">
          <div className="footer-info">
            <div className="info-item">
              <span className="info-icon">✅</span>
              <span className="info-text">Title: {title ? '✓' : '✗'}</span>
            </div>
            <div className="info-item">
              <span className="info-icon">✅</span>
              <span className="info-text">Code: {code ? '✓' : '✗'}</span>
            </div>
            <div className="info-item">
              <span className="info-icon">✅</span>
              <span className="info-text">Blocks Hidden: {hiddenBlockIds.length > 0 ? '✓' : '✗'}</span>
            </div>
            <div className="info-item">
              <span className="info-icon">✅</span>
              <span className="info-text">Sequence Set: {correctBlockOrder.length > 0 ? '✓' : '✗'}</span>
            </div>
          </div>

          <div className="footer-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setShowPreview(!showPreview)}
              disabled={blocks.length === 0}
            >
              {showPreview ? '👁️ Hide Preview' : '👁️ Preview'}
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? '⏳ Saving...' : '💾 Save Activity'}
            </button>
          </div>
        </div>

        {/* Preview Section */}
        {showPreview && blocks.length > 0 && (
          <div className="preview-section">
            <div className="preview-header">
              <h3>📊 Student Preview</h3>
              <button onClick={() => setShowPreview(false)} className="btn-close">✕</button>
            </div>
            <div className="preview-container">
              <div className="preview-item">
                <h4>{title || 'Untitled Activity'}</h4>
                <p>{description || 'No description'}</p>
              </div>
              <div className="preview-item">
                <h5>Code to Complete:</h5>
                <pre className="preview-code">
                  {blocks
                    .map((block) =>
                      hiddenBlockIds.includes(block.id) ? '[ ? ]' : block.content
                    )
                    .join('\n')}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
