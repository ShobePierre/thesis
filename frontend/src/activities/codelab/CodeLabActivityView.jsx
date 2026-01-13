import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";
import Split from "react-split";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

export default function CodeLabActivityView({ activity, onBack, onSubmit }) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionTime, setCompletionTime] = useState(0);
  const [startTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFooter, setShowFooter] = useState(true);
  const [activityDescription, setActivityDescription] = useState("");
  const token = localStorage.getItem("token");
  const API_BASE_URL = "http://localhost:5000";

  // Compiler state
  const [language, setLanguage] = useState("python3");
  const [code, setCode] = useState("# Write your code here\n");
  const [theme, setTheme] = useState("vs-dark");
  const [isRunning, setIsRunning] = useState(false);

  // Submission tracking
  const [submissionId, setSubmissionId] = useState(null);
  const [savedIndicator, setSavedIndicator] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState("in_progress");

  // WebSocket & Terminal refs
  const terminalRef = useRef(null);
  const termInstance = useRef(null);
  const wsRef = useRef(null);
  const sessionActiveRef = useRef(false);
  const fitAddonRef = useRef(null);
  const inputBufferRef = useRef("");
  const finalOutputRef = useRef("");

  // Track elapsed time
  useEffect(() => {
    if (isCompleted) return;

    const timer = setInterval(() => {
      setCompletionTime(Math.floor((new Date() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted, startTime]);

  // Initialize terminal on mount
  useEffect(() => {
    // First fetch or create submission, then init terminal
    const initializeSubmission = async () => {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/codelab/activity/${activity.activity_id}/submission`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setSubmissionId(response.data.submission_id);
        setCode(response.data.submitted_code || "# Write your code here\n");
        setSubmissionStatus(response.data.status);

        // Fetch CodeLab activity details to get description and language
        try {
          const codelabResponse = await axios.get(
            `${API_BASE_URL}/codelab/activity/${activity.activity_id}/codelab`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setLanguage(codelabResponse.data.language || "python3");
          setActivityDescription(codelabResponse.data.activity_description || "");
        } catch (err) {
          console.warn("Could not fetch CodeLab activity details");
        }
      } catch (error) {
        console.error("Error initializing submission:", error);
      }
    };

    initializeSubmission();
    const timer = setTimeout(() => initTerminal(), 500);

    return () => {
      clearTimeout(timer);
      if (wsRef.current) wsRef.current.close();
      if (termInstance.current) termInstance.current.dispose();
    };
  }, [activity.activity_id]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Initialize terminal with XTerm
  const initTerminal = () => {
    if (!terminalRef.current) return;

    if (termInstance.current) termInstance.current.dispose();
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) wsRef.current.close();

    termInstance.current = new Terminal({
      cols: 120,
      rows: 25,
      cursorBlink: true,
      theme: { background: "#0f172a", foreground: "#ffffff" },
      scrollback: 1000,
      fontSize: 13,
      allowTransparency: true,
      fontFamily: "Courier New, monospace",
    });

    fitAddonRef.current = new FitAddon();
    termInstance.current.loadAddon(fitAddonRef.current);
    termInstance.current.open(terminalRef.current);

    try {
      fitAddonRef.current.fit();
    } catch (e) {
      console.warn("Terminal fit error:", e);
    }

    termInstance.current.focus();

    // Connect to WebSocket
    wsRef.current = new WebSocket("ws://localhost:5001");

    wsRef.current.onopen = () => {
      console.log("✓ Connected to compiler server");
      termInstance.current.write("\r\n\x1b[32m▶ Ready to run code...\x1b[0m\r\n");
    };

    wsRef.current.onmessage = (event) => {
      if (!termInstance.current) return;

      let data = event.data;
      data = data.replace(/\r?\n/g, "\r\n");
      termInstance.current.write(data);
      finalOutputRef.current += data;

      if (event.data.includes("[Session") && event.data.includes("started")) {
        sessionActiveRef.current = true;
      }

      if (
        event.data.includes("[Container stopped]") ||
        event.data.includes("[Session ended]")
      ) {
        sessionActiveRef.current = false;
      }
    };

    wsRef.current.onerror = (err) => {
      console.error("WebSocket error:", err);
      if (termInstance.current) {
        termInstance.current.write(
          `\r\n\x1b[31m✗ Connection error\x1b[0m\r\n`
        );
      }
    };

    wsRef.current.onclose = () => {
      console.log("Connection closed");
      sessionActiveRef.current = false;
    };

    // Terminal input handling
    termInstance.current.onData((data) => {
      const charCode = data.charCodeAt(0);

      // Ctrl+C
      if (data === "\x03") {
        if (
          sessionActiveRef.current &&
          wsRef.current?.readyState === WebSocket.OPEN
        ) {
          wsRef.current.send(JSON.stringify({ type: "interrupt" }));
        }
        return;
      }

      // Ctrl+D
      if (data === "\x04") {
        if (
          sessionActiveRef.current &&
          wsRef.current?.readyState === WebSocket.OPEN
        ) {
          wsRef.current.send(JSON.stringify({ type: "eof" }));
        }
        return;
      }

      if (
        !sessionActiveRef.current ||
        wsRef.current?.readyState !== WebSocket.OPEN
      ) {
        return;
      }

      if (data === "\r") {
        termInstance.current.write("\r\n");
        wsRef.current.send(inputBufferRef.current + "\n");
        inputBufferRef.current = "";
        return;
      }

      if (data === "\u007F") {
        if (inputBufferRef.current.length > 0) {
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          termInstance.current.write("\b \b");
        }
        return;
      }

      if (charCode >= 32 || data === "\t") {
        inputBufferRef.current += data;
        termInstance.current.write(data);
        return;
      }
    });

    // Handle terminal resize
    const handleResize = () => {
      if (fitAddonRef.current && termInstance.current) {
        try {
          fitAddonRef.current.fit();
          const { cols, rows } = termInstance.current;

          if (
            sessionActiveRef.current &&
            wsRef.current?.readyState === WebSocket.OPEN
          ) {
            wsRef.current.send(JSON.stringify({ type: "resize", cols, rows }));
          }
        } catch (e) {
          console.warn("Resize error:", e);
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  };

  const getDefaultCode = (lang) => {
    const templates = {
      python3: "# Write your code here\nprint('Hello, World!')",
      c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
      cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
      java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
    };
    return templates[lang] || templates.python3;
  };

  const runCode = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      if (termInstance.current) {
        termInstance.current.write("\r\n\x1b[31m✗ WebSocket not connected\x1b[0m\r\n");
      }
      return;
    }

    if (!code.trim()) {
      if (termInstance.current) {
        termInstance.current.write("\r\n\x1b[31m✗ Code cannot be empty\x1b[0m\r\n");
      }
      return;
    }

    sessionActiveRef.current = false;
    inputBufferRef.current = "";
    finalOutputRef.current = "";
    setIsRunning(true);

    if (termInstance.current) {
      termInstance.current.clear();
      termInstance.current.write("\x1b[36m⏳ Starting new session...\x1b[0m\r\n");
    }

    console.log("Starting execution...");
    wsRef.current.send(
      JSON.stringify({
        type: "start",
        language,
        code,
      })
    );
  };

  const handleSubmitActivity = async () => {
    setIsCompleted(true);
    setIsRunning(false);
    setIsSubmitting(true);

    try {
      if (!token || !submissionId) {
        alert("Session error. Please try again.");
        setIsSubmitting(false);
        setIsCompleted(false);
        return;
      }

      // Submit the final code and output
      const submitResponse = await axios.put(
        `${API_BASE_URL}/codelab/submission/${submissionId}/submit`,
        {
          submitted_code: code,
          execution_output: finalOutputRef.current,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!submitResponse.data.success) {
        throw new Error("Failed to submit");
      }

      // Also update the legacy activity_submissions table for compatibility
      const submissionData = {
        activity_id: activity.activity_id,
        submission_text: `CodeLab activity completed. Time taken: ${formatTime(completionTime)}\n\n--- Code Submitted ---\n${code}\n\n--- Terminal Output ---\n${finalOutputRef.current}`,
        completion_status: "completed",
      };

      const formData = new FormData();
      formData.append("activity_id", activity.activity_id);
      formData.append("submission_text", submissionData.submission_text);

      await axios.post(
        `${API_BASE_URL}/activity/${activity.activity_id}/submission`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}`, "x-access-token": token },
        }
      );

      if (onSubmit) {
        onSubmit({ submission_id: submissionId, ...submissionData });
      }

      // Show success message for 2 seconds before redirecting
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error("Error submitting CodeLab activity:", error);
      alert("Error submitting activity. Please try again.");
      setIsCompleted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-save code every 30 seconds
  useEffect(() => {
    if (!submissionId || isCompleted) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        await axios.put(
          `${API_BASE_URL}/codelab/submission/${submissionId}`,
          {
            submitted_code: code,
            execution_output: finalOutputRef.current,
            status: "in_progress",
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSavedIndicator("✓ Saved");
        setTimeout(() => setSavedIndicator(null), 2000);
      } catch (error) {
        console.warn("Auto-save failed:", error);
        setSavedIndicator("✗ Save failed");
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [submissionId, code, token, isCompleted]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900">
      {/* Header - Compact */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-2 border-b border-gray-700 flex justify-between items-center z-10">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold truncate">{activity.title || "Code Lab"}</h2>
          {activity.instructions && (
            <p className="text-xs text-gray-300 mt-0.5 line-clamp-1">
              {activity.instructions}
            </p>
          )}
        </div>

        {/* Timer - Compact */}
        <div className="text-right ml-3 flex-shrink-0">
          <div className="text-2xl font-mono font-bold text-blue-400">{formatTime(completionTime)}</div>
          <div className="text-xs text-gray-400">Elapsed</div>
        </div>
      </div>

      {/* Compiler Container */}
      <div className="flex-1 overflow-hidden relative flex flex-col bg-gray-950">
        {/* Toolbar - Clean and Modern */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-850 border-b border-gray-700 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-400">Code Editor</div>
            {savedIndicator && (
              <span className={`text-xs px-2 py-1 rounded ${
                savedIndicator.includes("✓") ? "text-green-400" : "text-red-400"
              }`}>
                {savedIndicator}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => {
                const newLang = e.target.value;
                setLanguage(newLang);
                if (!code.trim() || code.trim() === getDefaultCode(language)) {
                  setCode(getDefaultCode(newLang));
                }
              }}
              className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer hover:bg-gray-600 transition"
            >
              <option value="python3">🐍 Python</option>
              <option value="c">⚙️ C</option>
              <option value="cpp">⚙️ C++</option>
              <option value="java">☕ Java</option>
            </select>

            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer hover:bg-gray-600 transition"
            >
              <option value="vs-dark">🌙 Dark</option>
              <option value="light">☀️ Light</option>
            </select>

            <button
              onClick={runCode}
              disabled={isRunning}
              className={`${
                isRunning
                  ? "bg-gray-600 cursor-not-allowed text-gray-400"
                  : "bg-blue-600 hover:bg-blue-700 cursor-pointer text-white shadow-md hover:shadow-lg"
              } font-medium px-5 py-1.5 rounded transition-all text-sm flex items-center gap-2`}
            >
              {isRunning ? "⏳ Running..." : "▶ Run"}
            </button>
          </div>
        </div>

        {/* Activity Description Panel */}
        {activityDescription && (
          <div className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-b border-blue-700/30 px-4 py-3">
            <div className="max-w-full">
              <h3 className="text-sm font-semibold text-blue-300 mb-1.5">📋 Activity Instructions</h3>
              <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{activityDescription}</p>
            </div>
          </div>
        )}

        {/* Split Panel: Code Editor | Terminal Output */}
        <div className="flex-1 overflow-hidden flex">
          <Split className="flex flex-row w-full" sizes={[60, 40]} minSize={250} gutterSize={4}>
            {/* Monaco Code Editor */}
            <div className="h-full overflow-hidden border-r border-gray-700">
              <Editor
                height="100%"
                language={language === "python3" ? "python" : language}
                theme={theme}
                value={code}
                onChange={(val) => setCode(val || "")}
                options={{
                  fontSize: 15,
                  fontFamily: "'Fira Code', 'Monaco', monospace",
                  minimap: { enabled: false },
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  renderWhitespace: "none",
                  smoothScrolling: true,
                  padding: { top: 16, bottom: 16 },
                  lineHeight: 1.6,
                  wordWrap: "on",
                  formatOnPaste: true,
                }}
              />
            </div>

            {/* Terminal Output Section */}
            <div className="flex flex-col h-full bg-gray-950 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 to-gray-850 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-300">📤 Terminal Output</h2>
              </div>
              <div
                ref={terminalRef}
                className="flex-1 overflow-auto bg-black rounded m-2"
              />
            </div>
          </Split>
        </div>

        {/* Toggle Footer Button */}
        <button
          onClick={() => setShowFooter(!showFooter)}
          className="absolute bottom-4 right-4 z-40 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded transition"
          title={showFooter ? "Hide Controls" : "Show Controls"}
        >
          {showFooter ? "▼ Hide" : "▲ Show"}
        </button>

        {/* Completion Overlay */}
        {isCompleted && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="mb-4 text-5xl">✓</div>
              <h3 className="text-2xl font-bold text-green-600 mb-4">Activity Completed!</h3>
              <p className="text-gray-700 mb-2 text-lg">Time Taken: {formatTime(completionTime)}</p>
              <p className="text-gray-500 mb-6">Your submission has been recorded successfully.</p>
              <div className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium">
                Redirecting...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Toggleable */}
      {showFooter && (
        <div className="bg-gray-800 text-white px-4 py-2 border-t border-gray-700 flex justify-end gap-2">
          <button
            onClick={onBack}
            disabled={isSubmitting}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Exit
          </button>
          <button
            onClick={handleSubmitActivity}
            disabled={isCompleted || isSubmitting}
            className={`px-4 py-1 rounded text-sm font-medium transition ${
              isCompleted || isSubmitting
                ? "bg-green-600 text-white cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? "Submitting..." : isCompleted ? "✓ Submitted" : "Submit Activity"}
          </button>
        </div>
      )}
    </div>
  );
}
