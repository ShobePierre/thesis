import React, { useState, useEffect, useRef } from "react";
import Phaser from "phaser";
import CodeBlockScene from "../pages/CodeBlockScene";
import "./CodeBlockActivityView.css";

/**
 * Student-facing component for completing code-block drag-drop activities
 * Integrates Phaser.io for interactive drag-and-drop gameplay
 * NOW WITH DYNAMIC HEIGHT AND SCROLLING SUPPORT
 */
export default function CodeBlockActivityView({
  activityId,
  activityData,
  onSubmit,
  onExit,
}) {
  const gameRef = useRef(null);
  const containerRef = useRef(null);
  const [validationFeedback, setValidationFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);

  // Timer for tracking time spent
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Initialize Phaser game with code-block scene
   */
  useEffect(() => {
    // Only run this once
    if (gameRef.current) return;
    
    if (!containerRef.current) return;

    console.log("CodeBlockActivityView - Activity Data:", {
      activityId,
      activityData,
    });

    // Prepare scene data
    const sceneData = {
      activityId,
      language: activityData?.language || "python",
      code: activityData?.code || "",
      hiddenBlockIds: activityData?.hiddenBlockIds || [],
      correctBlockOrder: activityData?.correctBlockOrder || [],
      checkpointId: activityId,
    };

    console.log("CodeBlockScene - Scene Data to pass:", sceneData);

    // Create a custom scene class that carries the data
    class CodeBlockSceneWithData extends CodeBlockScene {
      constructor() {
        super();
        this.codeBlockData = sceneData;
      }
    }

    // Calculate dynamic height based on number of code lines
    const codeLines = activityData?.code?.split('\n').length || 10;
    const estimatedBlockHeight = 55; // pixels per code block
    const headerFooterHeight = 200; // combined height of header + footer + padding
    const availableHeight = window.innerHeight - headerFooterHeight;
    
    // Calculate minimum height needed for all blocks
    const requiredHeight = codeLines * estimatedBlockHeight + 300; // +300 for title, buttons, etc
    
    // Use the larger of available height or required height
    const gameHeight = Math.max(availableHeight, requiredHeight);
    const gameWidth = containerRef.current.clientWidth || (window.innerWidth - 40);

    console.log("Dynamic sizing:", {
      codeLines,
      availableHeight,
      requiredHeight,
      finalHeight: gameHeight,
      finalWidth: gameWidth
    });

    const config = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: gameWidth,
      height: gameHeight,
      scene: CodeBlockSceneWithData,
      backgroundColor: "#1a1a2e",
      scale: {
        mode: Phaser.Scale.NONE, // Don't auto-scale, allow natural scrolling
        autoCenter: Phaser.Scale.NO_CENTER,
      },
      physics: {
        default: "arcade",
        arcade: { debug: false },
      },
    };

    console.log("🟢 Creating Phaser Game with dynamic height");
    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Also set on game object for backward compatibility
    game.codeBlockData = sceneData;
    game.onValidateCodeBlock = handleValidation;

    console.log("🟢 Game created with height:", gameHeight);

    // Setup exit handler
    game.events.once("shutdown", () => {
      onExit?.();
    });

    // Cleanup on unmount ONLY
    return () => {
      console.log("🟢 Cleaning up Phaser game");
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []); // EMPTY dependency array - run only once!

  /**
   * Handle validation from Phaser scene
   */
  const handleValidation = (result) => {
    setAttemptCount((prev) => prev + 1);
    setValidationFeedback(result);

    // Show feedback for 4 seconds
    const timer = setTimeout(() => {
      setValidationFeedback(null);
    }, 4000);

    return () => clearTimeout(timer);
  };

  /**
   * Submit activity solution
   */
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      // Prepare checkpoint data with validation results
      const checkpointData = {
        submissionType: "codeblock",
        correct: validationFeedback?.correct || false,
        score: validationFeedback?.score || 0,
        attemptCount: attemptCount,
        timeSpent: timeSpent,
        errors: validationFeedback?.errors || [],
        feedback: validationFeedback?.feedback || "",
        analytics: validationFeedback?.analytics || {},
      };

      // Submit to backend using correct endpoint
      const response = await fetch(`http://localhost:5000/api/activity/${activityId}/submission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          submission_text: JSON.stringify(checkpointData),
          checkpoint_data: JSON.stringify(checkpointData),
        }),
      });

      if (!response.ok) {
        throw new Error(`Submission failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log("Submission successful:", result);

      // Notify parent component
      if (onSubmit) {
        onSubmit({
          activityId,
          status: validationFeedback?.correct ? "completed" : "attempted",
          score: validationFeedback?.score || 0,
          timeSpent,
          attempts: attemptCount,
          submissionId: result.submission_id,
        });
      }

      // Show success message and disable further attempts if completed
      if (validationFeedback?.correct) {
        alert("🎉 Activity completed successfully! Your submission has been saved.");
        // Optionally redirect or disable the activity
        onExit?.();
      }
    } catch (error) {
      console.error("Error submitting activity:", error);
      alert("❌ Failed to submit activity. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Format time spent
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="codeblock-activity-view">
      {/* Enhanced Header */}
      <div className="activity-header">
        <div className="header-left">
          <div className="activity-icon">🧩</div>
          <div className="activity-info">
            <h2>{activityData?.title || "Code Block Activity"}</h2>
            <p>{activityData?.description || "Arrange code blocks in the correct order"}</p>
          </div>
        </div>

        <div className="activity-stats">
          <div className="stat-card">
            <span className="stat-icon">📝</span>
            <div className="stat-content">
              <span className="stat-label">Language</span>
              <span className="stat-value">{activityData?.language?.toUpperCase() || 'UNKNOWN'}</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⏱️</span>
            <div className="stat-content">
              <span className="stat-label">Time</span>
              <span className="stat-value">{formatTime(timeSpent)}</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🔄</span>
            <div className="stat-content">
              <span className="stat-label">Attempts</span>
              <span className="stat-value">{attemptCount}</span>
            </div>
          </div>
        </div>

        <button
          className="btn-exit"
          onClick={onExit}
          title="Exit activity"
        >
          ✕
        </button>
      </div>

      {/* Game Container */}
      <div className="game-container">
        <div ref={containerRef} className="phaser-game" />
      </div>

      {/* Enhanced Validation Feedback */}
      {validationFeedback && (
        <div className={`validation-feedback ${validationFeedback.correct ? 'success' : 'error'}`}>
          <div className="feedback-backdrop" onClick={() => setValidationFeedback(null)}></div>
          <div className="feedback-card">
            <div className="feedback-header">
              <div className="feedback-icon">
                {validationFeedback.correct ? '✅' : '❌'}
              </div>
              <div className="feedback-title-section">
                <h3>{validationFeedback.correct ? 'Perfect! ✓' : 'Not Quite Right'}</h3>
                <p className="feedback-subtitle">
                  {validationFeedback.correct 
                    ? 'Your solution is correct!' 
                    : 'Review the errors below and try again'}
                </p>
              </div>
            </div>

            <div className="feedback-body">
              <p className="feedback-message">{validationFeedback.feedback}</p>

              {validationFeedback.errors && validationFeedback.errors.length > 0 && (
                <div className="error-details">
                  <h4>Details:</h4>
                  <ul className="error-list">
                    {validationFeedback.errors.slice(0, 3).map((error, idx) => (
                      <li key={idx} className="error-item">
                        <span className="error-position">Position {error.position || idx + 1}</span>
                        <span className="error-message">{error.message || error}</span>
                      </li>
                    ))}
                  </ul>
                  {validationFeedback.errors.length > 3 && (
                    <p className="error-more">+{validationFeedback.errors.length - 3} more errors</p>
                  )}
                </div>
              )}

              <div className="score-display">
                <div className="score-circle">
                  <div className="score-value">{Math.round(validationFeedback.score)}</div>
                  <div className="score-label">%</div>
                </div>
              </div>
            </div>

            <div className="feedback-footer">
              <button 
                className="btn btn-tertiary" 
                onClick={() => setValidationFeedback(null)}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Footer */}
      <div className="activity-footer">
        <div className="footer-left">
          <div className="progress-info">
            {!validationFeedback?.correct ? (
              <div className="info-badge working">
                <span className="badge-icon">⚡</span>
                <span className="badge-text">Validate your code to check if it's correct</span>
              </div>
            ) : (
              <div className="info-badge success">
                <span className="badge-icon">🎯</span>
                <span className="badge-text">Solution is correct! Ready to submit.</span>
              </div>
            )}
          </div>
        </div>

        <div className="footer-actions">
          <button
            className="btn btn-secondary"
            onClick={onExit}
            title="Exit without submitting"
          >
            ← Exit
          </button>

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!validationFeedback?.correct || isSubmitting}
            title={!validationFeedback?.correct ? 'Validate your solution first' : 'Submit your solution'}
          >
            {isSubmitting ? '⏳ Submitting...' : '✓ Submit Solution'}
          </button>
        </div>
      </div>
    </div>
  );
}