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

      await fetch("http://localhost:5000/api/activity/submission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          activityId,
          submissionType: "codeblock",
          attemptCount,
          timeSpent,
          validationResult: validationFeedback,
        }),
      });

      if (onSubmit) {
        onSubmit({
          activityId,
          status: validationFeedback?.correct ? "completed" : "attempted",
          score: validationFeedback?.score || 0,
          timeSpent,
          attempts: attemptCount,
        });
      }
    } catch (error) {
      console.error("Error submitting activity:", error);
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
      {/* Header with activity info */}
      <div className="activity-header">
        <div className="activity-info">
          <h2>{activityData?.title || "Code Block Activity"}</h2>
          <p>{activityData?.description || "Drag blocks to complete the code"}</p>
        </div>

        <div className="activity-stats">
          <div className="stat-item">
            <span className="stat-label">Language</span>
            <span className="stat-value">{activityData?.language?.toUpperCase()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Time</span>
            <span className="stat-value">{formatTime(timeSpent)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Attempts</span>
            <span className="stat-value">{attemptCount}</span>
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

      {/* Phaser game container - SCROLLABLE */}
      <div className="game-container">
        <div ref={containerRef} className="phaser-game" />
      </div>

      {/* Validation feedback overlay */}
      {validationFeedback && (
        <div className={`validation-feedback ${validationFeedback.correct ? 'success' : 'error'}`}>
          <div className="feedback-content">
            <h3>{validationFeedback.correct ? '✓ Correct!' : '✗ Incorrect'}</h3>
            <p>{validationFeedback.feedback}</p>
            {validationFeedback.errors && validationFeedback.errors.length > 0 && (
              <ul className="error-list">
                {validationFeedback.errors.slice(0, 3).map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            )}
            <div className="feedback-score">
              Score: <strong>{validationFeedback.score}/100</strong>
            </div>
          </div>
        </div>
      )}

      {/* Bottom action bar */}
      <div className="activity-footer">
        <div className="footer-actions">
          <button
            className="btn btn-secondary"
            onClick={onExit}
          >
            Exit Activity
          </button>

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!validationFeedback?.correct || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Solution"}
          </button>
        </div>

        {!validationFeedback?.correct && (
          <div className="help-text">
            Validate your code to check if it's correct, then submit when ready.
          </div>
        )}

        {validationFeedback?.correct && (
          <div className="success-text">
            Great! Your solution is correct. Click "Submit Solution" to save your progress.
          </div>
        )}
      </div>
    </div>
  );
}