import React, { useState, useEffect } from 'react';
import { Clock, Zap, CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react';

/**
 * Premium UI Overlay for DragDrop Activities
 * Modern, sleek design with smooth animations
 */
const DragDropUIOverlay = ({ 
  currentComponent = null, 
  completedComponents = [], 
  totalComponents = 3,
  elapsed = 0,
  onHintClick = null 
}) => {
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  const hints = {
    cpu: [
      "Click the CPU socket to open it",
      "Drag the CPU from the tray to the socket",
      "Align it properly and release",
      "The socket will close automatically"
    ],
    cmos: [
      "Locate the CMOS battery slot",
      "Carefully drag the battery component",
      "Position it in the designated slot",
      "Release to secure it in place"
    ],
    ram: [
      "Find the RAM slot on the motherboard",
      "Drag a RAM module from the tray",
      "Align with the slot notch",
      "Press down until it clicks into place"
    ],
  };

  const components = [
    { name: 'CPU', icon: '🔌', color: 'from-purple-500 to-purple-600', glow: 'purple', order: 1 },
    { name: 'CMOS', icon: '⚙️', color: 'from-blue-500 to-blue-600', glow: 'blue', order: 2 },
    { name: 'RAM', icon: '📦', color: 'from-green-500 to-green-600', glow: 'green', order: 3 },
  ];

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const display = `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    return display;
  };

  const progress = (completedComponents.length / totalComponents) * 100;
  const isComplete = completedComponents.length === totalComponents;

  const currentHints = hints[currentComponent?.toLowerCase()] || [];

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* Left Panel - Current Task & Instructions */}
      <div className="absolute top-6 left-6 pointer-events-auto">
        <div className="w-80 bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <p className="text-xs font-bold text-blue-100 uppercase tracking-widest">Task Status</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {currentComponent ? (
              <div className="space-y-4">
                {/* Component Display */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-700/30 border border-gray-600/30">
                  <div className="text-5xl">{components.find(c => c.name.toLowerCase() === currentComponent.toLowerCase())?.icon}</div>
                  <div>
                    <p className="text-sm text-gray-400">Currently Working On</p>
                    <p className="text-2xl font-bold text-white capitalize">{currentComponent}</p>
                  </div>
                </div>

                {/* Hint Section */}
                {currentHints.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowHint(!showHint)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-amber-600/40 to-orange-600/40 hover:from-amber-600/60 hover:to-orange-600/60 border border-amber-600/50 transition-all duration-200"
                    >
                      <span className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                        <Lightbulb className="w-4 h-4" />
                        {showHint ? 'Hide' : 'Show'} Hint
                      </span>
                      <span className="text-xs font-bold text-amber-200 bg-black/30 px-2 py-1 rounded">{hintIndex + 1}/{currentHints.length}</span>
                    </button>

                    {showHint && (
                      <div className="mt-3 p-4 rounded-xl bg-blue-900/30 border border-blue-600/50 space-y-3 animate-in fade-in duration-200">
                        <p className="text-sm text-blue-100 leading-relaxed">{currentHints[hintIndex]}</p>
                        {currentHints.length > 1 && (
                          <div className="flex gap-2 justify-between">
                            <button
                              onClick={() => setHintIndex(Math.max(0, hintIndex - 1))}
                              disabled={hintIndex === 0}
                              className="flex-1 px-2 py-1 text-xs font-semibold rounded bg-blue-600/50 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                            >
                              ← Prev
                            </button>
                            <button
                              onClick={() => setHintIndex(Math.min(currentHints.length - 1, hintIndex + 1))}
                              disabled={hintIndex === currentHints.length - 1}
                              className="flex-1 px-2 py-1 text-xs font-semibold rounded bg-blue-600/50 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                            >
                              Next →
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">👇</div>
                <p className="text-gray-400 text-sm">Click on a component to begin</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Timer */}
      <div className="absolute top-6 right-6 pointer-events-auto">
        <div className="w-56 bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden backdrop-blur-xl">
          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-cyan-100" />
            <p className="text-xs font-bold text-cyan-100 uppercase tracking-widest">Time Elapsed</p>
          </div>
          
          <div className="p-8 text-center">
            <p className="text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">{formatTime(elapsed)}</p>
            <p className="text-xs text-gray-400 mt-3 font-medium">Stay focused & work efficiently</p>
          </div>
        </div>
      </div>

      {/* Bottom-Right Panel - Progress & Components (Compact) */}
      <div className="absolute bottom-6 right-6 pointer-events-auto">
        <div className="w-72 bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-100" />
              <p className="text-xs font-bold text-emerald-100 uppercase tracking-widest">Progress</p>
            </div>
            <p className="text-sm font-bold text-emerald-100">{completedComponents.length}/{totalComponents}</p>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="relative h-2.5 bg-gray-700/50 rounded-full overflow-hidden border border-gray-600/30 shadow-inner">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 transition-all duration-500 ease-out shadow-lg shadow-emerald-500/50"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 font-medium">{progress.toFixed(0)}% Complete</p>
            </div>

            {/* Component Status Badges - Vertical Stack */}
            <div className="space-y-2">
              {components.map((comp) => {
                const isCompleted = completedComponents.includes(comp.name.toLowerCase());
                const isCurrent = currentComponent?.toLowerCase() === comp.name.toLowerCase();
                
                return (
                  <div
                    key={comp.name}
                    className={`relative p-3 rounded-lg border-2 transition-all duration-300 flex items-center gap-3 ${
                      isCompleted
                        ? `bg-gradient-to-br from-emerald-900/40 to-green-900/40 border-emerald-500/60 shadow-lg shadow-emerald-500/20`
                        : isCurrent
                        ? `bg-gradient-to-br ${comp.color.replace('500', '600').replace('600', '500')} border-${comp.glow}-400 shadow-2xl shadow-${comp.glow}-500/40 animate-pulse`
                        : `bg-gray-700/30 border-gray-600/30 opacity-70`
                    }`}
                  >
                    <p className="text-2xl">{comp.icon}</p>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white">{comp.name}</p>
                      <p className="text-xs mt-0.5">
                        {isCompleted ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Installed
                          </span>
                        ) : isCurrent ? (
                          <span className="text-yellow-300 font-bold flex items-center gap-1">
                            <Zap className="w-3 h-3 animate-spin" /> Working
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Pending</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Completion Banner */}
            {completedComponents.length === totalComponents && (
              <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 p-0.5">
                <div className="bg-gray-900 rounded-md p-2 text-center">
                  <p className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                    🎉 All Done!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DragDropUIOverlay;
