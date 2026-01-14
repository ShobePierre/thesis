import React, { useState, useEffect } from "react";
import QuizBuilder from "../../../activities/Quiz/QuizBuilder";
import AnswerSequenceEditor from "../../../features/DragDrop/components/AnswerSequenceEditor";
import { CodeBlockParser } from "../../../features/DragDrop/utils/codeBlockParser";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SaveIcon from "@mui/icons-material/Save";

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
  const [activityStatus, setActivityStatus] = useState("draft");
  const [autoSaveStatus, setAutoSaveStatus] = useState("");
  const [dragOverIndex, setDragOverIndex] = useState(null);
  
  // Code Block Activity states
  const [codeBlockLanguage, setCodeBlockLanguage] = useState("python");
  const [codeBlockCode, setCodeBlockCode] = useState("");
  const [codeBlockDifficulty, setCodeBlockDifficulty] = useState("easy");
  const [codeBlockBlocks, setCodeBlockBlocks] = useState([]);
  const [codeBlockHiddenIds, setCodeBlockHiddenIds] = useState([]);
  const [codeBlockHints, setCodeBlockHints] = useState({});
  const [codeBlockCorrectOrder, setCodeBlockCorrectOrder] = useState([]);
  const [parseError, setParseError] = useState("");
  
  // Enhanced features
  const [activityDescription, setActivityDescription] = useState("");
  const [activityTags, setActivityTags] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [tagInput, setTagInput] = useState("");
  
  const fileInputRef = React.useRef(null);
  const dragOverRef = React.useRef(null);

  // Auto-save effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activityName || instructions || selectedActivity) {
        setAutoSaveStatus("✓ Saved as draft");
        setTimeout(() => setAutoSaveStatus(""), 2000);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [activityName, instructions, selectedActivity]);

  // Calculate completion percentage
  const calculateCompletion = () => {
    let completed = 0;
    let total = 5;
    
    if (activityName) completed++;
    if (selectedActivity) completed++;
    if (openDateTime && dueDateTime) completed += 2;
    if (instructions) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const completionPercentage = calculateCompletion();
  const completionSteps = [
    { name: "Activity Name", done: !!activityName },
    { name: "Activity Type", done: !!selectedActivity },
    { name: "Time Restrictions", done: !!(openDateTime && dueDateTime) },
    { name: "Instructions", done: !!instructions },
    { name: "Publish", done: false },
  ];

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

  const addTag = () => {
    if (tagInput.trim() && !activityTags.includes(tagInput.trim())) {
      setActivityTags([...activityTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setActivityTags(activityTags.filter(t => t !== tag));
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
      setShowPreview(false);
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
      
      if (activity === "Quiz" && next !== "Quiz") {
        setShowQuizBuilder(false);
        setLinkedQuizId(null);
      }
      if (activity === "Code Block Activity" && next !== "Code Block Activity") {
        setCodeBlockCode("");
        setCodeBlockBlocks([]);
        setCodeBlockHiddenIds([]);
        setCodeBlockCorrectOrder([]);
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

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOverIndex(0);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOverIndex(null);
    const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    if (files.length && selectedActivity === "DIY Activity") {
      const items = files.map((f) => ({
        file: f,
        preview: f.type && f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
      }));
      setAttachments((prev) => [...prev, ...items]);
    }
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-between p-6 rounded-t-2xl z-10 shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition text-white"
            >
              <svg
                className="w-5 h-5"
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
            <h2 className="text-2xl font-bold text-white">Create Activity</h2>
          </div>
          <div className="flex items-center gap-3">
            {autoSaveStatus && (
              <span className="text-sm text-white/80 flex items-center gap-1">
                <SaveIcon sx={{ fontSize: 16 }} /> {autoSaveStatus}
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
              activityStatus === "draft" ? "bg-yellow-500" :
              activityStatus === "scheduled" ? "bg-blue-400" :
              "bg-green-500"
            }`}>
              {activityStatus.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 pt-6 pb-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Progress</h3>
            <span className="text-sm font-bold text-blue-600">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
            {completionSteps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {step.done ? (
                  <CheckCircleIcon sx={{ fontSize: 18, color: "#10b981" }} />
                ) : (
                  <RadioButtonUncheckedIcon sx={{ fontSize: 18, color: "#d1d5db" }} />
                )}
                <span className={`text-xs font-medium ${step.done ? "text-green-700" : "text-gray-500"}`}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-8 max-h-[calc(100vh-280px)] overflow-y-auto">
          {/* Step 1: Activity Name & Description */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">1</span>
              <h3 className="text-lg font-semibold text-gray-800">Activity Details</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Activity Name *</label>
                <input
                  type="text"
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  placeholder="e.g., Building a React Component, Python Basics Quiz"
                  maxLength={100}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
                <p className="text-xs text-gray-500 mt-1">{activityName.length}/100</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description (optional)</label>
                <textarea
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  placeholder="Brief summary of what students will learn"
                  rows={2}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">{activityDescription.length}/200</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (optional)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="Add tags... (press Enter)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activityTags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-2">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-blue-900">✕</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Activity Type */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">2</span>
              <h3 className="text-lg font-semibold text-gray-800">Activity Type *</h3>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Choose activity type:</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {[
                { name: "Sim Pc", emoji: "💻", desc: "Hardware simulation" },
                { name: "Quiz", emoji: "❓", desc: "Assessment & testing" },
                { name: "Code Block Activity", emoji: "🧩", desc: "Visual coding" },
                { name: "DIY Activity", emoji: "🔧", desc: "Hands-on project" },
              ].map((activity) => {
                const selected = selectedActivity === activity.name;
                return (
                  <button
                    type="button"
                    key={activity.name}
                    onClick={() => handleActivityToggle(activity.name)}
                    className={`p-4 rounded-xl font-semibold transition transform hover:scale-105 border-2 ${
                      selected
                        ? "bg-blue-600 text-white border-blue-700 shadow-lg"
                        : "bg-white text-gray-700 border-gray-200 hover:border-blue-400"
                    }`}
                  >
                    <div className="text-2xl mb-2">{activity.emoji}</div>
                    <div className="font-bold">{activity.name}</div>
                    <div className={`text-xs ${selected ? "text-blue-100" : "text-gray-500"}`}>{activity.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Activity Type Descriptions */}
            {selectedActivity && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="space-y-2">
                  {(() => {
                    const activity = selectedActivity;
                    const descriptions = {
                      "Sim Pc": "Interactive PC building simulator where students learn hardware components by dragging parts to correct slots. Perfect for computer architecture courses.",
                      "Quiz": "Assessment tool with multiple choice and short answer questions. Track student knowledge and generate detailed analytics.",
                      "Code Block Activity": "Drag-and-drop visual coding inspired by MIT App Inventor. Students arrange code blocks to complete programs.",
                      "DIY Activity": "Hands-on projects where students conduct experiments and submit their work.",
                    };
                    return (
                      <div key={activity}>
                        <p className="font-semibold text-blue-900 text-sm">{activity}</p>
                        <p className="text-blue-800 text-sm mt-1">{descriptions[activity]}</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Quiz-Specific Section */}
            {selectedActivity === "Quiz" && (
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                {linkedQuizId ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-purple-900">✓ Quiz Linked</p>
                      <p className="text-xs text-purple-700 mt-1">Quiz ID: {linkedQuizId}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLinkedQuizId(null);
                        setShowQuizBuilder(true);
                      }}
                      className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                    >
                      Edit Quiz
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowQuizBuilder(true)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition"
                  >
                    + Create New Quiz
                  </button>
                )}
              </div>
            )}

            {/* Code Block Activity Section */}
            {selectedActivity === "Code Block Activity" && (
              <div className="mt-6 space-y-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Programming Language *</label>
                  <select
                    value={codeBlockLanguage}
                    onChange={(e) => {
                      setCodeBlockLanguage(e.target.value);
                      parseCodeBlocks(codeBlockCode);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800 font-medium"
                  >
                    <option value="python">🐍 Python</option>
                    <option value="javascript">📜 JavaScript</option>
                    <option value="java">☕ Java</option>
                    <option value="cpp">⚙️ C++</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Source Code *</label>
                  <textarea
                    value={codeBlockCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder={`Paste your ${codeBlockLanguage.charAt(0).toUpperCase() + codeBlockLanguage.slice(1)} code here...`}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm text-gray-800 resize-none bg-gray-900 text-white"
                  />
                  {parseError && (
                    <p className="mt-2 text-sm text-red-600 font-semibold">⚠️ {parseError}</p>
                  )}
                </div>

                {codeBlockBlocks.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        Code Blocks ({codeBlockBlocks.length})
                      </label>
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-bold">
                        {codeBlockHiddenIds.length} Hidden
                      </span>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {codeBlockBlocks.map((block, idx) => {
                        const isHidden = codeBlockHiddenIds.includes(block.id);
                        const blockTypeColors = {
                          VARIABLE: "bg-green-100 border-green-400",
                          FUNCTION: "bg-blue-100 border-blue-400",
                          KEYWORD: "bg-yellow-100 border-yellow-400",
                          OPERATOR: "bg-orange-100 border-orange-400",
                          LITERAL: "bg-red-100 border-red-400",
                          STATEMENT: "bg-indigo-100 border-indigo-400",
                          CONDITION: "bg-pink-100 border-pink-400",
                          LOOP: "bg-cyan-100 border-cyan-400",
                        };
                        
                        return (
                          <div key={block.id} className={`p-3 rounded-lg border-2 transition ${blockTypeColors[block.type] || "bg-gray-100"}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-700">{block.type}</p>
                                <p className="text-sm text-gray-800 font-mono break-words">{block.content}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleHiddenBlock(block.id)}
                                className={`px-3 py-1 text-xs font-bold rounded whitespace-nowrap transition ${
                                  isHidden
                                    ? "bg-red-500 text-white hover:bg-red-600"
                                    : "bg-green-400 text-white hover:bg-green-500"
                                }`}
                              >
                                {isHidden ? "Hidden" : "Visible"}
                              </button>
                            </div>

                            {isHidden && (
                              <div className="mt-3 pt-3 border-t border-gray-300">
                                <textarea
                                  value={codeBlockHints[block.id] || ""}
                                  onChange={(e) => updateHint(block.id, e.target.value)}
                                  placeholder="Add a hint for students..."
                                  rows={2}
                                  maxLength={150}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-400 text-gray-700 resize-none"
                                />
                                <p className="text-xs text-gray-600 mt-1">{(codeBlockHints[block.id] || "").length}/150</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty Level</label>
                  <div className="flex gap-3">
                    {["easy", "medium", "hard"].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setCodeBlockDifficulty(level)}
                        className={`flex-1 px-4 py-2 rounded-lg font-bold capitalize transition ${
                          codeBlockDifficulty === level
                            ? "bg-green-600 text-white shadow-lg"
                            : "bg-white border-2 border-green-300 text-gray-700 hover:border-green-400"
                        }`}
                      >
                        {level === "easy" ? "🟢" : level === "medium" ? "🟡" : "🔴"} {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Answer Sequence Configuration */}
                {codeBlockHiddenIds.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">✓ Configure Correct Answer Sequence</h3>
                    <p className="text-sm text-blue-800 mb-4">
                      Drag hidden blocks to set the correct order students must arrange them in.
                    </p>
                    <AnswerSequenceEditor 
                      blocks={codeBlockBlocks}
                      hiddenBlockIds={codeBlockHiddenIds}
                      initialSequence={codeBlockCorrectOrder}
                      onSequenceSet={setCodeBlockCorrectOrder}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Attachments - only for DIY Activity */}
          {selectedActivity === "DIY Activity" && (
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">3</span>
                <h3 className="text-lg font-semibold text-gray-800">Add Resources</h3>
              </div>

              <div
                ref={dragOverRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
                  dragOverIndex === 0
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300 bg-gray-50 hover:border-blue-400"
                }`}
              >
                <CloudUploadIcon sx={{ fontSize: 48, color: dragOverIndex === 0 ? "#2563eb" : "#9ca3af", marginBottom: 1 }} />
                <p className="font-semibold text-gray-700 mb-2">Drag files here or click to browse</p>
                <p className="text-sm text-gray-500 mb-4">Images, documents, videos, and more</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Browse Files
                </button>
              </div>

              {attachments.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-700 mb-3">{attachments.length} file(s) attached</h4>
                  <div className="space-y-2">
                    {attachments.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:shadow-sm transition">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {item.preview ? (
                            <img src={item.preview} alt={item.file.name} className="w-10 h-10 object-cover rounded" />
                          ) : (
                            <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded font-bold text-blue-600 text-xs">
                              {item.file.name.split('.').pop().toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">{item.file.name}</div>
                            <div className="text-xs text-gray-500">{(item.file.size / 1024 / 1024).toFixed(2)} MB</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (item.preview) URL.revokeObjectURL(item.preview);
                            setAttachments((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="px-3 py-1 text-sm font-semibold text-red-600 hover:bg-red-50 rounded transition"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
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
          )}

          {/* Time Restrictions */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">
                {selectedActivity === "DIY Activity" ? "4" : "3"}
              </span>
              <h3 className="text-lg font-semibold text-gray-800">Schedule Availability *</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Open Date & Time</label>
                <input
                  type="datetime-local"
                  value={openDateTime}
                  onChange={(e) => setOpenDateTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 font-medium"
                />
                <p className="text-xs text-gray-600 mt-2">When students can start</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date & Time</label>
                <input
                  type="datetime-local"
                  value={dueDateTime}
                  onChange={(e) => setDueDateTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 font-medium"
                />
                <p className="text-xs text-gray-600 mt-2">When it's no longer accessible</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">
                {selectedActivity === "DIY Activity" ? "5" : "4"}
              </span>
              <h3 className="text-lg font-semibold text-gray-800">Instructions for Students</h3>
            </div>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Provide clear, detailed instructions for students. Include learning objectives, steps, and expectations."
                rows={10}
                className="w-full px-4 py-3 border-0 focus:outline-none text-gray-800 resize-none font-medium"
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">💡 Tip: Clear instructions help students understand what's expected</p>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-300 p-6 shadow-md">
              <h3 className="text-lg font-bold text-blue-900 mb-4">📋 Activity Preview</h3>
              <div className="bg-white rounded-lg p-6 space-y-4">
                <div>
                  <p className="text-xs text-gray-600 font-bold uppercase">Activity Name</p>
                  <p className="text-lg font-bold text-gray-900">{activityName || "Untitled Activity"}</p>
                </div>
                {activityDescription && (
                  <div>
                    <p className="text-xs text-gray-600 font-bold uppercase">Description</p>
                    <p className="text-sm text-gray-700">{activityDescription}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-600 font-bold uppercase">Type</p>
                  <p className="text-sm font-semibold text-blue-600">{selectedActivity || "Not selected"}</p>
                </div>
                {activityTags.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-600 font-bold uppercase mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {activityTags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between gap-3 p-6 border-t border-gray-200 rounded-b-2xl shadow-md">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 text-gray-700 font-semibold hover:bg-gray-100 rounded-lg transition"
          >
            {showPreview ? "Hide Preview" : "Preview"}
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => {
                onReset();
                onClose();
              }}
              className="px-6 py-2 text-gray-700 font-semibold hover:bg-gray-100 rounded-lg transition"
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
                  correctBlockOrder: codeBlockCorrectOrder,
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
                (selectedActivity === "Code Block Activity" && (!codeBlockCode || codeBlockBlocks.length === 0 || codeBlockCorrectOrder.length === 0)) ||
                isCreatingActivity
              }
              className={`px-8 py-2 rounded-lg font-bold transition transform ${
                activityName &&
                openDateTime &&
                dueDateTime &&
                title &&
                (selectedActivity !== "Quiz" || linkedQuizId) &&
                (selectedActivity !== "Code Block Activity" || (codeBlockCode && codeBlockBlocks.length > 0 && codeBlockCorrectOrder.length > 0)) &&
                !isCreatingActivity
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-lg hover:scale-105"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
