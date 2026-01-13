import React, { useState, useEffect } from "react";
import QuizBuilder from "../../../activities/Quiz/QuizBuilder";
import { CodeBlockParser } from "../../../features/DragDrop/utils/codeBlockParser";

function ActivityBuilder({
  isOpen,
  onClose,
  activityName,
  setActivityName,
  openDateTime,
  setOpenDateTime,
  dueDateTime,
  setDueDateTime,
  title,
  setTitle,
  instructions,
  setInstructions,
  isCreatingActivity,
  onCreateActivity,
  onReset,
}) {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [linkedQuizId, setLinkedQuizId] = useState(null);
  
  // Code Block Activity states
  const [codeBlockLanguage, setCodeBlockLanguage] = useState("python");
  const [codeBlockCode, setCodeBlockCode] = useState("");
  const [codeBlockDifficulty, setCodeBlockDifficulty] = useState("easy");
  const [codeBlockBlocks, setCodeBlockBlocks] = useState([]);
  const [codeBlockHiddenIds, setCodeBlockHiddenIds] = useState([]);
  const [codeBlockHints, setCodeBlockHints] = useState({});
  const [parseError, setParseError] = useState("");
  
  const fileInputRef = React.useRef(null);

  // Parse code blocks when code changes
  const parseCodeBlocks = (code) => {
    if (!code.trim()) {
      setCodeBlockBlocks([]);
      setParseError("");
      return;
    }
    
    try {
      const parser = new CodeBlockParser();
      const blocks = parser.parseCode(code, { language: codeBlockLanguage });
      setCodeBlockBlocks(blocks);
      setParseError("");
    } catch (error) {
      setParseError(error.message || "Failed to parse code");
      setCodeBlockBlocks([]);
    }
  };

  const handleCodeChange = (newCode) => {
    setCodeBlockCode(newCode);
    parseCodeBlocks(newCode);
  };

  const toggleHiddenBlock = (blockId) => {
    setCodeBlockHiddenIds(prev => 
      prev.includes(blockId) 
        ? prev.filter(id => id !== blockId)
        : [...prev, blockId]
    );
  };

  const updateHint = (blockId, hint) => {
    setCodeBlockHints(prev => ({
      ...prev,
      [blockId]: hint || undefined
    }));
  };

  useEffect(() => {
    if (!isOpen) {
      attachments.forEach((a) => {
        if (a.preview) URL.revokeObjectURL(a.preview);
      });
      setAttachments([]);
      setSelectedActivity(null);
      setShowQuizBuilder(false);
      setLinkedQuizId(null);
      setCodeBlockCode("");
      setCodeBlockBlocks([]);
      setCodeBlockHiddenIds([]);
      setCodeBlockHints({});
      setParseError("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (title && typeof title === "string") {
      const parts = title.split(",").map((p) => p.trim()).filter(Boolean);
      const first = parts.length ? parts[0] : null;
      if (first !== selectedActivity) {
        setSelectedActivity(first);
      }
    } else if (!title && selectedActivity) {
      setSelectedActivity(null);
    }
  }, [title]);

  const handleActivityToggle = (activity) => {
    setSelectedActivity((prev) => {
      const next = prev === activity ? null : activity;
      setTitle(next ? next : "");
      
      // Reset activity-specific states
      if (activity === "Quiz" && next !== "Quiz") {
        setShowQuizBuilder(false);
        setLinkedQuizId(null);
      }
      if (activity === "Code Block Activity" && next !== "Code Block Activity") {
        setCodeBlockCode("");
        setCodeBlockBlocks([]);
        setCodeBlockHiddenIds([]);
        setCodeBlockHints({});
        setParseError("");
      }
      
      return next;
    });
  };

  const handleQuizCreated = (quizId) => {
    setLinkedQuizId(quizId);
    setShowQuizBuilder(false);
  };

  if (!isOpen) return null;

  // If quiz builder is open, show it in the modal
  if (showQuizBuilder && selectedActivity === "Quiz") {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowQuizBuilder(false);
        }}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 my-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-200 z-10">
            <h2 className="text-xl font-semibold text-gray-800">Create Quiz</h2>
            <button
              onClick={() => setShowQuizBuilder(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              ✕
            </button>
          </div>
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <QuizBuilder
              onQuizCreated={handleQuizCreated}
              onQuizSelected={() => setShowQuizBuilder(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-200 rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-gray-800">Create Activity</h2>
          </div>
        </div>

        <div className="p-6 space-y-8 max-h-[calc(100vh-180px)] overflow-y-auto">
          {/* Step 1: Activity Name */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                1
              </span>
              <h3 className="text-lg font-semibold text-gray-800">
                Enter the name.
              </h3>
            </div>
            <div>
              <input
                type="text"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                placeholder="Activity name*"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              />
            </div>
          </div>

          {/* Step 2: Activity Type - moved here */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                2
              </span>
              <h3 className="text-lg font-semibold text-gray-800">
                Set the activity you want for student.
              </h3>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Activity Type *
            </label>
            <div className="flex flex-wrap gap-3">
              {["Sim Pc", "Quiz", "Code Block Activity", "DIY Activity"].map((activity) => {
                const selected = selectedActivity === activity;
                return (
                  <button
                    type="button"
                    key={activity}
                    onClick={() => handleActivityToggle(activity)}
                    className={`px-4 py-2 rounded-lg font-medium transition inline-flex items-center gap-2 ${
                      selected
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {activity}
                  </button>
                );
              })}
            </div>

            {/* Activity Type Descriptions */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              {selectedActivity && (
                <div className="space-y-2">
                  {(() => {
                    const activity = selectedActivity;
                    const descriptions = {
                      "Sim Pc": "Interactive PC building simulator where students learn hardware components by dragging parts to correct slots. A hands-on learning experience for computer architecture.",
                      "Quiz": "Multiple choice or short answer questions to test student knowledge.",
                      "Code Block Activity": "Drag-and-drop code block activity inspired by MIT App Inventor. Students arrange code blocks to complete programs while learning programming concepts.",
                      "DIY Activity": "Hands-on DIY activities for students to conduct and observe outcomes.",
                    };
                    return (
                      <div key={activity} className="text-sm">
                        <span className="font-semibold text-blue-900">{activity}:</span>
                        <p className="text-blue-800">{descriptions[activity]}</p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Quiz-Specific Section */}
            {selectedActivity === "Quiz" && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                {linkedQuizId ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-green-900">✓ Linked Quiz: (ID: {linkedQuizId})</p>
                      <p className="text-xs text-green-700 mt-1">Your quiz is ready to be published with this activity.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLinkedQuizId(null);
                        setShowQuizBuilder(true);
                      }}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                      Change Quiz
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowQuizBuilder(true)}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    + Create New Quiz
                  </button>
                )}
              </div>
            )}

            {/* Code Block Activity Section */}
            {selectedActivity === "Code Block Activity" && (
              <div className="mt-6 space-y-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                {/* Language Selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Programming Language *
                  </label>
                  <select
                    value={codeBlockLanguage}
                    onChange={(e) => {
                      setCodeBlockLanguage(e.target.value);
                      parseCodeBlocks(codeBlockCode);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>

                {/* Code Editor */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Source Code *
                  </label>
                  <textarea
                    value={codeBlockCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder={`Paste your ${codeBlockLanguage.charAt(0).toUpperCase() + codeBlockLanguage.slice(1)} code here...`}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm text-gray-800 resize-none"
                  />
                  {parseError && (
                    <p className="mt-2 text-sm text-red-600">⚠️ {parseError}</p>
                  )}
                </div>

                {/* Block Preview */}
                {codeBlockBlocks.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Code Blocks ({codeBlockBlocks.length} found)
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {codeBlockBlocks.map((block, idx) => {
                        const isHidden = codeBlockHiddenIds.includes(block.id);
                        const blockTypeColors = {
                          VARIABLE: "bg-green-100 border-green-300",
                          FUNCTION: "bg-blue-100 border-blue-300",
                          KEYWORD: "bg-yellow-100 border-yellow-300",
                          OPERATOR: "bg-orange-100 border-orange-300",
                          LITERAL: "bg-red-100 border-red-300",
                          STATEMENT: "bg-indigo-100 border-indigo-300",
                          CONDITION: "bg-pink-100 border-pink-300",
                          LOOP: "bg-cyan-100 border-cyan-300",
                        };
                        
                        return (
                          <div key={block.id} className={`p-3 rounded-lg border-2 ${blockTypeColors[block.type] || "bg-gray-100"}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-600">{block.type}</p>
                                <p className="text-sm text-gray-800 font-mono break-words">{block.content}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleHiddenBlock(block.id)}
                                className={`px-2 py-1 text-xs font-semibold rounded whitespace-nowrap transition ${
                                  isHidden
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                                }`}
                              >
                                {isHidden ? "Hidden" : "Show"}
                              </button>
                            </div>

                            {/* Hint Input for Hidden Blocks */}
                            {isHidden && (
                              <div className="mt-2 pt-2 border-t border-gray-300">
                                <textarea
                                  value={codeBlockHints[block.id] || ""}
                                  onChange={(e) => updateHint(block.id, e.target.value)}
                                  placeholder="Add a hint for students (optional)..."
                                  rows={2}
                                  maxLength={200}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-purple-400 text-gray-700 resize-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  {(codeBlockHints[block.id] || "").length}/200 characters
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-sm text-purple-700">
                      📝 Hidden blocks: {codeBlockHiddenIds.length} / {codeBlockBlocks.length}
                    </p>
                  </div>
                )}

                {/* Difficulty Level */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <div className="flex gap-2">
                    {["easy", "medium", "hard"].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setCodeBlockDifficulty(level)}
                        className={`px-4 py-2 rounded-lg font-medium capitalize transition ${
                          codeBlockDifficulty === level
                            ? "bg-purple-600 text-white"
                            : "bg-white border border-gray-300 text-gray-700 hover:border-purple-400"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <p className="mt-3 text-xs text-gray-500">*Required</p>
          </div>

          {/* Add Attachment - only for DIY Activity (no step number) */}
          {selectedActivity === "DIY Activity" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Add Attachment.
              </h3>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  Add attachment
                </button>
                <p className="text-sm text-gray-500">You can add files that students will use for this activity.</p>
              </div>

              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {attachments.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.preview ? (
                          <img src={item.preview} alt={item.file.name} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded text-sm text-gray-600">{item.file.name.split('.').pop()}</div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm text-gray-600 truncate">{item.file.name}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (item.preview) URL.revokeObjectURL(item.preview);
                          setAttachments((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files ? Array.from(e.target.files) : [];
                  if (files.length) {
                    const items = files.map((f) => ({
                      file: f,
                      preview: f.type && f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
                    }));
                    setAttachments((prev) => [...prev, ...items]);
                  }
                  e.target.value = null;
                }}
              />
            </div>
          </div>
          )}

          {/* Step 4 (or 3 if not Experiment): Time Restrictions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                {selectedActivity === "DIY Activity" ? "4" : "3"}
              </span>
              <h3 className="text-lg font-semibold text-gray-800">
                Set the time restrictions for your activity.
              </h3>
            </div>
            <div className="space-y-6">
              {/* Open date and time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Open date and time*
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={openDateTime}
                    onChange={(e) => setOpenDateTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  />
                  <svg
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  This will be the date and time when your students can start the activity.
                </p>
              </div>

              {/* Due date and time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due date and time*
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={dueDateTime}
                    onChange={(e) => setDueDateTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  />
                  <svg
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  This will be the date and time when your students cannot access the activity anymore.
                </p>
              </div>
            </div>
          </div>

          {/* Step 5 (or 4 if not Experiment): Instructions Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                {selectedActivity === "DIY Activity" ? "5" : "4"}
              </span>
              <h3 className="text-lg font-semibold text-gray-800">
                Add instructions for your activity.
              </h3>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions (optional)
            </label>
            <div className="border border-gray-300 rounded-lg">
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Instructions (optional)"
                rows={8}
                className="w-full px-4 py-3 border-0 rounded-t-lg focus:outline-none text-gray-800 resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                onReset();
                onClose();
              }}
              className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={() => onCreateActivity(
                attachments.map((a) => a.file), 
                linkedQuizId,
                selectedActivity === "Code Block Activity" ? {
                  code: codeBlockCode,
                  language: codeBlockLanguage,
                  blocks: codeBlockBlocks,
                  hiddenBlockIds: codeBlockHiddenIds,
                  hints: codeBlockHints,
                  difficulty: codeBlockDifficulty,
                } : null
              )}
              disabled={
                !activityName ||
                !openDateTime ||
                !dueDateTime ||
                !title ||
                (selectedActivity === "Quiz" && !linkedQuizId) ||
                (selectedActivity === "Code Block Activity" && (!codeBlockCode || codeBlockBlocks.length === 0)) ||
                isCreatingActivity
              }
              className={`px-6 py-2 rounded-lg font-medium transition ${
                activityName &&
                openDateTime &&
                dueDateTime &&
                title &&
                (selectedActivity !== "Quiz" || linkedQuizId) &&
                (selectedActivity !== "Code Block Activity" || (codeBlockCode && codeBlockBlocks.length > 0)) &&
                !isCreatingActivity
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isCreatingActivity ? "Creating..." : "Create Activity"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActivityBuilder;
