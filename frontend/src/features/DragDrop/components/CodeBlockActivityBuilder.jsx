import React, { useState, useEffect } from "react";
import axios from "axios";
import { CodeBlockParser, createSampleCodeBlocks } from "../utils/codeBlockParser";
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
      <div className="builder-header">
        <h2>Code Block Activity Builder</h2>
        <p>Create interactive code-block drag-and-drop challenges</p>
      </div>

      <div className="builder-container">
        {/* Left Panel - Code Input */}
        <div className="builder-section input-section">
          <h3>Source Code</h3>

          <div className="form-group">
            <label>Activity Title</label>
            <input
              type="text"
              placeholder="e.g., Complete the variable assignment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Describe what students need to do..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea-field"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Programming Language</label>
              <select value={language} onChange={handleLanguageChange} className="select-field">
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>

            <div className="form-group">
              <label>Difficulty Level</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="select-field">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Code</label>
            <div className="code-input-wrapper">
              <textarea
                value={code}
                onChange={handleCodeChange}
                placeholder="Paste or write your code here..."
                className="code-input"
                spellCheck="false"
              />
              <button className="btn-secondary" onClick={loadSampleCode}>
                Load Sample
              </button>
            </div>
          </div>

          {parseError && <div className="error-message">{parseError}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
        </div>

        {/* Right Panel - Block Configuration */}
        <div className="builder-section config-section">
          <h3>Code Blocks</h3>

          {blocks.length === 0 ? (
            <div className="empty-state">
              <p>Enter code to see blocks</p>
            </div>
          ) : (
            <div className="blocks-list">
              {blocks.map((block) => (
                <div key={block.id} className="block-item">
                  <div className="block-header">
                    <label className="block-checkbox">
                      <input
                        type="checkbox"
                        checked={hiddenBlockIds.includes(block.id)}
                        onChange={() => toggleBlockHidden(block.id)}
                      />
                      <span className="checkmark"></span>
                    </label>
                    <div className="block-content">
                      <code className={`block-code block-type-${block.type.toLowerCase()}`}>
                        {block.content}
                      </code>
                      <span className="block-type">{block.type}</span>
                    </div>
                  </div>

                  {hiddenBlockIds.includes(block.id) && (
                    <div className="block-hint">
                      <input
                        type="text"
                        placeholder="Add a hint for this block..."
                        value={hints[block.id] || ""}
                        onChange={(e) => updateBlockHint(block.id, e.target.value)}
                        className="hint-input"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="blocks-stats">
            <p>Total Blocks: <strong>{blocks.length}</strong></p>
            <p>Hidden Blocks: <strong>{hiddenBlockIds.length}</strong></p>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="builder-actions">
        <button className="btn-primary" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Activity"}
        </button>
        <button
          className="btn-secondary"
          onClick={() => setShowPreview(!showPreview)}
          disabled={blocks.length === 0}
        >
          {showPreview ? "Hide Preview" : "Preview"}
        </button>
      </div>

      {/* Preview Section */}
      {showPreview && blocks.length > 0 && (
        <div className="preview-section">
          <h3>Preview</h3>
          <div className="preview-container">
            <h4>{title || "Untitled Activity"}</h4>
            <p>{description || "No description provided"}</p>
            <div className="preview-blocks">
              <h5>Code to Complete:</h5>
              <pre className="preview-code">
                {blocks
                  .map((block) =>
                    hiddenBlockIds.includes(block.id) ? "?" : block.content
                  )
                  .join(" ")}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
