/**
 * Integration Example: How to use Code Block Activities
 * This file demonstrates both instructor and student workflows
 */

import React, { useState } from "react";
import CodeBlockActivityBuilder from "./CodeBlockActivityBuilder";
import CodeBlockActivityView from "./CodeBlockActivityView";

/**
 * Instructor Workflow
 */
export function InstructorCodeBlockWorkflow() {
  const [activityData, setActivityData] = useState(null);
  const [savedActivityId, setSavedActivityId] = useState(null);

  const handleActivitySave = (data) => {
    console.log("Activity saved:", data);
    setActivityData(data);
    // In real app, this ID would come from backend
    setSavedActivityId(Math.random());
  };

  return (
    <div>
      <CodeBlockActivityBuilder 
        activityId={savedActivityId}
        onSave={handleActivitySave}
        initialData={activityData}
      />
    </div>
  );
}

/**
 * Student Workflow
 */
export function StudentCodeBlockWorkflow({ activityId }) {
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submissionStatus, setSubmissionStatus] = useState(null);

  // Load activity on mount
  React.useEffect(() => {
    const loadActivity = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:5000/api/activity/${activityId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        setActivityData(data);
      } catch (error) {
        console.error("Failed to load activity:", error);
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, [activityId]);

  const handleSubmit = async (submissionData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/activity/submission",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(submissionData),
        }
      );

      if (response.ok) {
        setSubmissionStatus({
          type: "success",
          message: "Activity submitted successfully!",
        });
      } else {
        setSubmissionStatus({
          type: "error",
          message: "Failed to submit activity",
        });
      }
    } catch (error) {
      setSubmissionStatus({
        type: "error",
        message: error.message,
      });
    }
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading activity...</div>;
  }

  if (!activityData) {
    return <div style={{ padding: "20px", color: "red" }}>Activity not found</div>;
  }

  return (
    <div>
      <CodeBlockActivityView 
        activityId={activityId}
        activityData={activityData}
        onSubmit={handleSubmit}
        onExit={() => window.history.back()}
      />
      {submissionStatus && (
        <div style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          padding: "15px 20px",
          background: submissionStatus.type === "success" ? "#00ff88" : "#ff6464",
          color: "#000",
          borderRadius: "6px",
          fontWeight: "bold",
        }}>
          {submissionStatus.message}
        </div>
      )}
    </div>
  );
}

/**
 * Example Activity Data Structure
 */
export const EXAMPLE_ACTIVITY_DATA = {
  // Simple Python Activity
  pythonSimple: {
    title: "Complete the Variable Assignment",
    description: "Drag the missing parts to complete the assignment",
    language: "python",
    code: `x = 10
y = 20
z = x + y
print(z)`,
    blocks: [
      { id: "block_0", content: "x", type: "VARIABLE", lineIndex: 0 },
      { id: "block_1", content: "=", type: "OPERATOR", lineIndex: 0 },
      { id: "block_2", content: "10", type: "LITERAL", lineIndex: 0 },
      { id: "block_3", content: "y", type: "VARIABLE", lineIndex: 1 },
      { id: "block_4", content: "=", type: "OPERATOR", lineIndex: 1 },
      { id: "block_5", content: "20", type: "LITERAL", lineIndex: 1 },
      { id: "block_6", content: "z", type: "VARIABLE", lineIndex: 2 },
      { id: "block_7", content: "=", type: "OPERATOR", lineIndex: 2 },
      { id: "block_8", content: "x + y", type: "LITERAL", lineIndex: 2 },
      { id: "block_9", content: "print", type: "FUNCTION", lineIndex: 3 },
      { id: "block_10", content: "z", type: "VARIABLE", lineIndex: 3 },
    ],
    hiddenBlockIds: ["block_8", "block_10"],
    difficulty: "easy",
    hints: {
      "block_8": "The result of adding x and y",
      "block_10": "What should be printed?"
    }
  },

  // JavaScript For Loop
  javascriptLoop: {
    title: "Complete the For Loop",
    description: "Fill in the loop initialization and condition",
    language: "javascript",
    code: `for (let i = 0; i < 10; i++) {
    console.log(i);
}`,
    blocks: [
      { id: "block_0", content: "for", type: "KEYWORD", lineIndex: 0 },
      { id: "block_1", content: "let i = 0", type: "STATEMENT", lineIndex: 0 },
      { id: "block_2", content: "i < 10", type: "CONDITION", lineIndex: 0 },
      { id: "block_3", content: "i++", type: "OPERATOR", lineIndex: 0 },
      { id: "block_4", content: "console.log", type: "FUNCTION", lineIndex: 1 },
      { id: "block_5", content: "i", type: "VARIABLE", lineIndex: 1 },
    ],
    hiddenBlockIds: ["block_1", "block_2"],
    difficulty: "medium",
    hints: {
      "block_1": "Start with i = 0",
      "block_2": "Loop while i is less than 10"
    }
  },

  // Python If-Else
  pythonIfElse: {
    title: "Complete the Conditional",
    description: "Fill in the condition and output values",
    language: "python",
    code: `x = 15
if x > 10:
    print("Greater than 10")
else:
    print("Less than or equal to 10")`,
    blocks: [
      { id: "block_0", content: "x", type: "VARIABLE", lineIndex: 0 },
      { id: "block_1", content: "=", type: "OPERATOR", lineIndex: 0 },
      { id: "block_2", content: "15", type: "LITERAL", lineIndex: 0 },
      { id: "block_3", content: "if", type: "KEYWORD", lineIndex: 1 },
      { id: "block_4", content: "x > 10", type: "CONDITION", lineIndex: 1 },
      { id: "block_5", content: "Greater than 10", type: "LITERAL", lineIndex: 2 },
      { id: "block_6", content: "else", type: "KEYWORD", lineIndex: 3 },
      { id: "block_7", content: "Less than or equal to 10", type: "LITERAL", lineIndex: 4 },
    ],
    hiddenBlockIds: ["block_4", "block_5", "block_7"],
    difficulty: "hard",
    hints: {
      "block_4": "Check if x is greater than 10",
      "block_5": "What to print if condition is true?",
      "block_7": "What to print if condition is false?"
    }
  },

  // JavaScript Function Definition
  javascriptFunction: {
    title: "Complete the Function",
    description: "Fill in the function parameter and return statement",
    language: "javascript",
    code: `function add(a, b) {
    return a + b;
}`,
    blocks: [
      { id: "block_0", content: "function", type: "KEYWORD", lineIndex: 0 },
      { id: "block_1", content: "add", type: "FUNCTION", lineIndex: 0 },
      { id: "block_2", content: "a, b", type: "STATEMENT", lineIndex: 0 },
      { id: "block_3", content: "return", type: "KEYWORD", lineIndex: 1 },
      { id: "block_4", content: "a + b", type: "LITERAL", lineIndex: 1 },
    ],
    hiddenBlockIds: ["block_2", "block_4"],
    difficulty: "hard",
    hints: {
      "block_2": "Function parameters separated by comma",
      "block_4": "The sum of the two parameters"
    }
  }
};

/**
 * Sample Usage in Activity Component
 */
export function CodeBlockActivityExample() {
  const [mode, setMode] = useState("select"); // select, instructor, student
  const [selectedExample, setSelectedExample] = useState(null);
  const [activityId, setActivityId] = useState(null);

  const handleSelectExample = (key) => {
    setSelectedExample(key);
    setActivityId(Math.random());
    setMode("instructor");
  };

  if (mode === "select") {
    return (
      <div style={{
        padding: "40px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        minHeight: "100vh",
        color: "white"
      }}>
        <h1 style={{ textAlign: "center", marginBottom: "40px" }}>Code Block Activity Examples</h1>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          {Object.entries(EXAMPLE_ACTIVITY_DATA).map(([key, data]) => (
            <div
              key={key}
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                padding: "20px",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                border: "2px solid transparent"
              }}
              onClick={() => handleSelectExample(key)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.borderColor = "#00d4ff";
                e.currentTarget.style.transform = "translateY(-5px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <h3>{data.title}</h3>
              <p>{data.description}</p>
              <p style={{ marginTop: "10px", fontSize: "12px", opacity: 0.7 }}>
                Language: <strong>{data.language}</strong> | Difficulty: <strong>{data.difficulty}</strong>
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "instructor") {
    return (
      <div>
        <button 
          onClick={() => setMode("select")}
          style={{
            position: "fixed",
            top: "20px",
            left: "20px",
            padding: "10px 20px",
            background: "#667eea",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            zIndex: 1000
          }}
        >
          ← Back
        </button>
        <CodeBlockActivityBuilder 
          activityId={activityId}
          initialData={selectedExample ? EXAMPLE_ACTIVITY_DATA[selectedExample] : null}
          onSave={() => {
            alert("Activity saved! Now you can test it as a student.");
            setMode("student");
          }}
        />
      </div>
    );
  }

  if (mode === "student") {
    return (
      <div>
        <button 
          onClick={() => setMode("select")}
          style={{
            position: "fixed",
            top: "20px",
            left: "20px",
            padding: "10px 20px",
            background: "#667eea",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            zIndex: 1000
          }}
        >
          ← Back
        </button>
        <CodeBlockActivityView 
          activityId={activityId}
          activityData={selectedExample ? EXAMPLE_ACTIVITY_DATA[selectedExample] : null}
          onSubmit={(result) => {
            console.log("Activity submitted:", result);
            alert(`Activity completed! Score: ${result.score}`);
            setMode("select");
          }}
          onExit={() => setMode("select")}
        />
      </div>
    );
  }
}

export default CodeBlockActivityExample;
