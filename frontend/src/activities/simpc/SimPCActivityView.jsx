import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import PhaserSimulator from "../../features/DragDrop/components/PhaserSimulator";
import SimPCLecture from "./SimPCLecture";

// ============================================
// GRADING CONFIGURATION
// ============================================
const GRADING_CONFIG = {
  // Benchmark times for each component (in seconds)
  benchmarkTimes: {
    cpu: 45,   // Expected time to complete CPU
    cmos: 30,  // Expected time to complete CMOS
    ram: 40,   // Expected time to complete RAM
  },
  
  // Scoring weights
  weights: {
    accuracy: 0.40,      // 40% - Getting it right
    efficiency: 0.30,    // 30% - Speed and attempts
    process: 0.20,       // 20% - Following correct procedure
    completion: 0.10,    // 10% - Finishing all tasks
  },
  
  // Penalties
  penalties: {
    wrongDrop: 2,        // Points deducted per wrong drop
    excessTime: 1,       // Points per 10 seconds over benchmark
    maxPenalty: 30,      // Maximum penalty points
  },
  
  // Score ranges for letter grades
  gradeRanges: {
    A: 90,
    B: 80,
    C: 70,
    D: 60,
    F: 0,
  },
};

// ============================================
// PERFORMANCE TRACKER CLASS
// ============================================
class PerformanceTracker {
  constructor() {
    this.metrics = {
      // Per-component tracking
      components: {
        cpu: this.createComponentMetrics(),
        cmos: this.createComponentMetrics(),
        ram: this.createComponentMetrics(),
      },
      
      // Overall metrics
      overall: {
        totalWrongAttempts: 0,
        totalCorrectAttempts: 0,
        totalDragOperations: 0,
        sessionStartTime: new Date(),
        sessionEndTime: null,
        totalIdleTime: 0,
        sequenceFollowed: true,
        helpRequested: 0,
      },
      
      // Timeline of events
      eventLog: [],
    };
    
    this.lastActivityTime = new Date();
    this.idleTimer = null;
  }
  
  createComponentMetrics() {
    return {
      startTime: null,
      endTime: null,
      duration: 0,
      wrongAttempts: 0,
      correctAttempt: false,
      dragCount: 0,
      openedCount: 0,
      firstTrySuccess: false,
      completed: false,
      timestamp: null,
    };
  }
  
  // Track component started
  componentStarted(componentName) {
    const comp = this.metrics.components[componentName];
    if (!comp.startTime) {
      comp.startTime = new Date();
      comp.openedCount++;
      this.logEvent('component_started', componentName);
    }
  }
  
  // Track drag operation
  dragOperation(componentName, isCorrect) {
    const comp = this.metrics.components[componentName];
    comp.dragCount++;
    this.metrics.overall.totalDragOperations++;
    
    if (isCorrect) {
      this.metrics.overall.totalCorrectAttempts++;
      comp.correctAttempt = true;
      if (comp.wrongAttempts === 0) {
        comp.firstTrySuccess = true;
      }
      this.logEvent('correct_drop', componentName);
    } else {
      comp.wrongAttempts++;
      this.metrics.overall.totalWrongAttempts++;
      this.logEvent('wrong_drop', componentName);
    }
    
    this.updateActivityTime();
  }
  
  // Track component completed
  componentCompleted(componentName, progress, isCompleted) {
    const comp = this.metrics.components[componentName];
    
    if (isCompleted && !comp.completed) {
      comp.endTime = new Date();
      comp.duration = (comp.endTime - comp.startTime) / 1000; // in seconds
      comp.completed = true;
      comp.timestamp = comp.endTime.toISOString();
      this.logEvent('component_completed', componentName, { duration: comp.duration });
    }
  }
  
  // Track idle time
  updateActivityTime() {
    const now = new Date();
    const idleSeconds = (now - this.lastActivityTime) / 1000;
    
    // Count as idle if more than 5 seconds between actions
    if (idleSeconds > 5) {
      this.metrics.overall.totalIdleTime += idleSeconds;
    }
    
    this.lastActivityTime = now;
  }
  
  // Log event
  logEvent(eventType, component, data = {}) {
    this.metrics.eventLog.push({
      timestamp: new Date().toISOString(),
      eventType,
      component,
      ...data,
    });
  }
  
  // Calculate component score
  calculateComponentScore(componentName) {
    const comp = this.metrics.components[componentName];
    const benchmark = GRADING_CONFIG.benchmarkTimes[componentName];
    
    if (!comp.completed) return 0;
    
    let score = 100;
    
    // Accuracy penalty
    score -= comp.wrongAttempts * GRADING_CONFIG.penalties.wrongDrop;
    
    // Efficiency penalty (time)
    if (comp.duration > benchmark) {
      const excessTime = Math.floor((comp.duration - benchmark) / 10);
      score -= excessTime * GRADING_CONFIG.penalties.excessTime;
    }
    
    // Bonus for first-try success
    if (comp.firstTrySuccess) {
      score += 10;
    }
    
    // Ensure score doesn't go below 0 or above 100
    return Math.max(0, Math.min(100, score));
  }
  
  // Calculate overall score
  calculateOverallScore() {
    const { weights } = GRADING_CONFIG;
    
    // Check if all components are completed - if yes, award high score
    const completedCount = Object.values(this.metrics.components)
      .filter(c => c.completed).length;
    const totalComponents = Object.keys(this.metrics.components).length;
    const allCompleted = completedCount === totalComponents;

    console.log("=== CALCULATING OVERALL SCORE ===");
    console.log("Completed Components:", completedCount, "of", totalComponents);
    console.log("All Completed:", allCompleted);

    if (allCompleted) {
      // All components completed successfully = 100%
      // Deduct points only if sequence was not followed or major issues detected
      let score = 100;
      
      // Only deduct if sequence was NOT followed correctly
      if (!this.metrics.overall.sequenceFollowed) {
        score -= 5;
        console.log("- 5% deduction for incorrect sequence");
      }
      
      console.log("Final Score (completion-based):", score);
      return Math.max(0, Math.min(100, score)); // Return between 0-100
    }

    // If not all completed, use weighted calculation
    // Accuracy score (0-100)
    const totalAttempts = this.metrics.overall.totalCorrectAttempts + 
                          this.metrics.overall.totalWrongAttempts;
    const accuracyScore = totalAttempts > 0 
      ? (this.metrics.overall.totalCorrectAttempts / totalAttempts) * 100 
      : 0;
    
    console.log("Accuracy Score:", accuracyScore);
    console.log("  - Total Attempts:", totalAttempts);
    console.log("  - Correct:", this.metrics.overall.totalCorrectAttempts);
    
    // Efficiency score (0-100)
    const componentScores = Object.keys(this.metrics.components).map(name => 
      this.calculateComponentScore(name)
    );
    const efficiencyScore = componentScores.reduce((a, b) => a + b, 0) / componentScores.length;
    
    console.log("Efficiency Score:", efficiencyScore);
    console.log("Component Scores:", componentScores);
    
    // Process score (0-100)
    const processScore = this.metrics.overall.sequenceFollowed ? 100 : 70;
    console.log("Process Score:", processScore, "(Sequence:", this.metrics.overall.sequenceFollowed, ")");
    
    // Completion score (0-100)
    const completionScore = (completedCount / totalComponents) * 100;
    console.log("Completion Score:", completionScore);
    
    // Weighted total
    const totalScore = 
      (accuracyScore * weights.accuracy) +
      (efficiencyScore * weights.efficiency) +
      (processScore * weights.process) +
      (completionScore * weights.completion);
    
    console.log("Weighted Total:", totalScore);
    console.log("Weights:", weights);
    console.log("=====================================");
    
    return Math.round(totalScore);
  }
  
  // Get letter grade
  getLetterGrade() {
    const score = this.calculateOverallScore();
    const { gradeRanges } = GRADING_CONFIG;
    
    if (score >= gradeRanges.A) return 'A';
    if (score >= gradeRanges.B) return 'B';
    if (score >= gradeRanges.C) return 'C';
    if (score >= gradeRanges.D) return 'D';
    return 'F';
  }
  
  // Generate performance report
  generateReport() {
    const overallScore = this.calculateOverallScore();
    const letterGrade = this.getLetterGrade();
    
    // Log for debugging
    console.log("=== GRADING REPORT GENERATED ===");
    console.log("Overall Score:", overallScore);
    console.log("Letter Grade:", letterGrade);
    console.log("Metrics.overall:", this.metrics.overall);
    console.log("Metrics.components:", this.metrics.components);
    console.log("=====================================");
    
    return {
      overallScore,
      letterGrade,
      componentScores: {
        cpu: this.calculateComponentScore('cpu'),
        cmos: this.calculateComponentScore('cmos'),
        ram: this.calculateComponentScore('ram'),
      },
      accuracy: {
        totalAttempts: this.metrics.overall.totalCorrectAttempts + 
                       this.metrics.overall.totalWrongAttempts,
        correctAttempts: this.metrics.overall.totalCorrectAttempts,
        wrongAttempts: this.metrics.overall.totalWrongAttempts,
        accuracyRate: this.metrics.overall.totalCorrectAttempts / 
                      (this.metrics.overall.totalCorrectAttempts + 
                       this.metrics.overall.totalWrongAttempts) * 100,
      },
      efficiency: {
        cpu: {
          duration: this.metrics.components.cpu.duration,
          benchmark: GRADING_CONFIG.benchmarkTimes.cpu,
          performance: this.getPerformanceLabel('cpu'),
        },
        cmos: {
          duration: this.metrics.components.cmos.duration,
          benchmark: GRADING_CONFIG.benchmarkTimes.cmos,
          performance: this.getPerformanceLabel('cmos'),
        },
        ram: {
          duration: this.metrics.components.ram.duration,
          benchmark: GRADING_CONFIG.benchmarkTimes.ram,
          performance: this.getPerformanceLabel('ram'),
        },
      },
      summary: {
        totalTime: this.getTotalTime(),
        idleTime: Math.round(this.metrics.overall.totalIdleTime),
        dragOperations: this.metrics.overall.totalDragOperations,
      },
      strengths: this.identifyStrengths(),
      improvements: this.identifyImprovements(),
    };
  }
  
  getPerformanceLabel(componentName) {
    const comp = this.metrics.components[componentName];
    const benchmark = GRADING_CONFIG.benchmarkTimes[componentName];
    
    if (!comp.completed) return 'Incomplete';
    
    const ratio = comp.duration / benchmark;
    if (ratio <= 0.8) return 'Excellent';
    if (ratio <= 1.0) return 'Good';
    if (ratio <= 1.5) return 'Average';
    return 'Needs Improvement';
  }
  
  getTotalTime() {
    const durations = Object.values(this.metrics.components)
      .filter(c => c.completed)
      .map(c => c.duration);
    return Math.round(durations.reduce((a, b) => a + b, 0));
  }
  
  identifyStrengths() {
    const strengths = [];
    
    // Check first-try successes
    const firstTries = Object.values(this.metrics.components)
      .filter(c => c.firstTrySuccess);
    if (firstTries.length >= 2) {
      strengths.push('Excellent accuracy - minimal mistakes');
    }
    
    // Check speed
    const fastComponents = Object.entries(this.metrics.components)
      .filter(([name, comp]) => {
        const benchmark = GRADING_CONFIG.benchmarkTimes[name];
        return comp.completed && comp.duration < benchmark * 0.8;
      });
    if (fastComponents.length >= 2) {
      strengths.push('Very efficient - completed tasks quickly');
    }
    
    return strengths.length > 0 ? strengths : ['Completed all required tasks'];
  }
  
  identifyImprovements() {
    const improvements = [];
    
    // Check wrong attempts
    if (this.metrics.overall.totalWrongAttempts > 5) {
      improvements.push('Focus on component identification - reduce wrong attempts');
    }
    
    // Check slow components
    const slowComponents = Object.entries(this.metrics.components)
      .filter(([name, comp]) => {
        const benchmark = GRADING_CONFIG.benchmarkTimes[name];
        return comp.completed && comp.duration > benchmark * 1.5;
      })
      .map(([name]) => name.toUpperCase());
    
    if (slowComponents.length > 0) {
      improvements.push(`Improve speed on: ${slowComponents.join(', ')}`);
    }
    
    return improvements.length > 0 ? improvements : ['Keep up the good work!'];
  }
  
  // Export metrics for database
  exportMetrics() {
    return {
      ...this.metrics,
      report: this.generateReport(),
    };
  }
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function SimPCActivityView({ activity, onBack, onSubmit }) {
  const [showLecture, setShowLecture] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionTime, setCompletionTime] = useState(0);
  const [startTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentComponent, setCurrentComponent] = useState(null);
  const [checkpoints, setCheckpoints] = useState({
    cpu: { completed: false, progress: 0, timestamp: null },
    cmos: { completed: false, progress: 0, timestamp: null },
    ram: { completed: false, progress: 0, timestamp: null },
  });
  const [overallProgress, setOverallProgress] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [performanceReport, setPerformanceReport] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState(null); // 'preparing', 'uploading', 'processing', 'success', 'error'
  const [submissionMessage, setSubmissionMessage] = useState('');
  
  const token = localStorage.getItem("token");
  const trackerRef = useRef(new PerformanceTracker());

  // Load saved checkpoints
  useEffect(() => {
    const loadSavedCheckpoints = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/activity/${activity.activity_id}/my-submission`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data?.checkpoint_data) {
          setCheckpoints(JSON.parse(res.data.checkpoint_data));
        }
      } catch (err) {
        console.log("No saved checkpoints found");
      }
    };

    if (token && activity.activity_id) loadSavedCheckpoints();
  }, [activity.activity_id, token]);

  // Update overall progress
  useEffect(() => {
    const completed = Object.values(checkpoints).filter((c) => c.completed).length;
    setOverallProgress((completed / Object.keys(checkpoints).length) * 100);
  }, [checkpoints]);

  // Track elapsed time
  useEffect(() => {
    if (isCompleted) return;

    const timer = setInterval(() => {
      setCompletionTime(Math.floor((new Date() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted, startTime]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Enhanced checkpoint save with performance tracking
  const saveCheckpoint = useCallback(async (componentName, progress, isCompleted) => {
    try {
      console.log("saveCheckpoint called:", { componentName, progress, isCompleted });
      
      // Track completion in performance tracker
      trackerRef.current.componentCompleted(componentName, progress, isCompleted);
      
      const updatedCheckpoints = {
        ...checkpoints,
        [componentName]: {
          completed: isCompleted,
          progress,
          timestamp: new Date().toISOString(),
        },
      };
      
      setCheckpoints(updatedCheckpoints);

      // Include performance metrics in checkpoint save
      const performanceMetrics = trackerRef.current.exportMetrics();

      const response = await axios.post(
        `http://localhost:5000/api/activity/${activity.activity_id}/checkpoint`,
        {
          component: componentName,
          progress,
          isCompleted,
          checkpointData: JSON.stringify(updatedCheckpoints),
          performanceData: JSON.stringify(performanceMetrics),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("Checkpoint saved successfully:", response.data);
    } catch (err) {
      console.error("Failed to save checkpoint:", err);
    }
  }, [checkpoints, activity.activity_id, token]);

  const handleCompleteActivity = async () => {
    if (overallProgress < 100) {
      alert("Please complete all components before submitting.");
      return;
    }

    // Generate performance report
    const report = trackerRef.current.generateReport();
    setPerformanceReport(report);
    setShowReport(true);
    setIsCompleted(true);
    setIsSubmitting(true);

    try {
      // Step 1: Preparing data
      setSubmissionStatus('preparing');
      setSubmissionMessage('Preparing submission data...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const performanceMetrics = trackerRef.current.exportMetrics();
      
      // Save to checkpoint first with performance data
      try {
        await axios.post(
          `http://localhost:5000/api/activity/${activity.activity_id}/checkpoint`,
          {
            component: 'overall',
            progress: 100,
            isCompleted: true,
            checkpointData: JSON.stringify(checkpoints),
            performanceData: JSON.stringify(performanceMetrics),
            performanceScore: report.overallScore,
            performanceGrade: report.letterGrade,
            performanceReport: JSON.stringify(report),
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Performance data saved to checkpoint");
      } catch (checkpointErr) {
        console.error("Failed to save performance checkpoint:", checkpointErr);
      }

      const submissionData = {
        activity_id: activity.activity_id,
        submission_text: `SimPC activity completed. Time: ${formatTime(completionTime)} | Score: ${report.overallScore}/100 | Grade: ${report.letterGrade}`,
        completion_status: "completed",
        checkpoint_data: JSON.stringify(checkpoints),
        performance_data: JSON.stringify(performanceMetrics),
        performance_score: report.overallScore,
        performance_grade: report.letterGrade,
        performance_report: JSON.stringify(report),
        score: report.overallScore,
        grade: report.letterGrade,
      };

      const formData = new FormData();
      Object.keys(submissionData).forEach(key => {
        formData.append(key, submissionData[key]);
      });

      if (!token) {
        setSubmissionStatus('error');
        setSubmissionMessage('Authentication error: Please login and try again.');
        setTimeout(() => {
          alert('You are not logged in. Please login and try again.');
          setIsSubmitting(false);
          setIsCompleted(false);
          setSubmissionStatus(null);
        }, 2000);
        return;
      }

      // Step 2: Uploading submission
      setSubmissionStatus('uploading');
      setSubmissionMessage('Uploading submission to server...');
      
      const API_BASE_URL = "http://localhost:5000/api";
      const response = await axios.post(
        `${API_BASE_URL}/activity/${activity.activity_id}/submission`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}`, 'x-access-token': token },
        }
      );

      // Step 3: Processing
      setSubmissionStatus('processing');
      setSubmissionMessage('Processing your submission...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Success
      setSubmissionStatus('success');
      setSubmissionMessage('Submission successful!');

      if (onSubmit) {
        onSubmit(submissionData);
      }

      // Show report for 5 seconds before redirecting
      setTimeout(() => {
        onBack();
      }, 5000);
    } catch (error) {
      console.error("Error submitting SimPC activity:", error);
      setSubmissionStatus('error');
      setSubmissionMessage(`Submission failed: ${error.response?.data?.message || error.message || 'Unknown error'}`);
      
      setTimeout(() => {
        setIsCompleted(false);
        setShowReport(false);
        setSubmissionStatus(null);
        setSubmissionMessage('');
        setIsSubmitting(false);
      }, 3000);
    }
  };

  // Track component interactions
  const handleComponentStarted = useCallback((componentName) => {
    setCurrentComponent(componentName);
    trackerRef.current.componentStarted(componentName);
  }, []);

  const handleDragOperation = useCallback((componentName, isCorrect) => {
    trackerRef.current.dragOperation(componentName, isCorrect);
  }, []);

  // Show lecture modal first if needed
  if (showLecture) {
    return <SimPCLecture activity={activity} onStart={() => setShowLecture(false)} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 w-screen h-screen">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      {/* Premium Header with All Info */}
      <div className="relative bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 text-white px-6 py-5 border-b border-blue-700/50 z-10 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          {/* Left: Title & Task Status */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <span className="text-xl">🖥️</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold truncate bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-200">
                {activity.title || "PC Building Simulator"}
              </h2>
              {currentComponent && !showLecture ? (
                <p className="text-xs text-yellow-300 font-semibold mt-0.5">
                  ⚡ Working on: <span className="uppercase">{currentComponent}</span>
                </p>
              ) : (
                activity.instructions && (
                  <p className="text-xs text-blue-100/70 mt-0.5 line-clamp-1">
                    {activity.instructions}
                  </p>
                )
              )}
            </div>
          </div>

          {/* Center: Progress Bar */}
          <div className="flex items-center gap-3 px-5 py-2 bg-black/30 rounded-lg border border-blue-600/30">
            <span className="text-sm font-bold text-blue-300 whitespace-nowrap">{overallProgress.toFixed(0)}%</span>
            <div className="w-32 h-2.5 bg-gray-700/50 rounded-full overflow-hidden border border-blue-600/30">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-500 transition-all duration-300 shadow-lg shadow-emerald-500/50"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <div className="text-xs font-semibold text-blue-300 whitespace-nowrap">
              {Object.keys(checkpoints).filter(k => checkpoints[k].completed).length}/3
            </div>
          </div>

          {/* Right: Component Status & Timer */}
          <div className="flex items-center gap-3">
            {/* Component Status */}
            <div className="hidden sm:flex gap-2 px-3 py-1.5 bg-black/30 rounded-lg border border-blue-600/30">
              {Object.entries(checkpoints).map(([name]) => (
                <div key={name} className="flex items-center gap-1">
                  <span className={`w-4 h-4 flex items-center justify-center rounded-full text-xs font-bold transition-all ${
                    checkpoints[name].completed ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' : 'bg-gray-700/50 text-gray-400'
                  }`}>
                    {checkpoints[name].completed ? '✓' : '○'}
                  </span>
                </div>
              ))}
            </div>

            {/* Timer */}
            <div className="text-center px-4 py-2 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg border border-cyan-500/50 shadow-lg shadow-cyan-500/30">
              <div className="text-lg font-mono font-bold text-cyan-100">{formatTime(completionTime)}</div>
              <div className="text-xs font-semibold text-cyan-200">Time</div>
            </div>
            
            {/* Exit Button */}
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 border border-red-600/50 hover:border-red-500 text-red-300 hover:text-red-200 transition-all duration-200 transform hover:scale-110 active:scale-95 font-bold text-base"
              title="Exit Activity"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Simulator Container */}
      <div className="flex-1 overflow-hidden relative w-full h-full">
        <PhaserSimulator
          onCheckpointComplete={saveCheckpoint}
          savedCheckpoints={checkpoints}
          onComponentStarted={handleComponentStarted}
          onDragOperation={handleDragOperation}
        />

        {/* Submission Loading Overlay */}
        {isSubmitting && submissionStatus && (
          <div className="absolute inset-0 bg-gradient-to-br from-black/95 via-blue-900/50 to-black/95 backdrop-blur-xl flex items-center justify-center z-50 p-4 flex flex-col justify-center">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-700/50 text-center">
              {/* Loading Spinner */}
              {submissionStatus !== 'error' && submissionStatus !== 'success' && (
                <div className="mb-8 flex justify-center">
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-700/50"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin"></div>
                  </div>
                </div>
              )}
              
              {/* Success Icon */}
              {submissionStatus === 'success' && (
                <div className="mb-8 flex justify-center">
                  <div className="text-6xl animate-bounce">✅</div>
                </div>
              )}
              
              {/* Error Icon */}
              {submissionStatus === 'error' && (
                <div className="mb-8 flex justify-center">
                  <div className="text-6xl animate-pulse">⚠️</div>
                </div>
              )}
              
              {/* Status Message */}
              <h3 className={`text-2xl font-bold mb-3 ${
                submissionStatus === 'error' ? 'text-red-400' :
                submissionStatus === 'success' ? 'text-green-400' :
                'text-blue-300'
              }`}>
                {submissionStatus === 'preparing' && '📦 Preparing Submission'}
                {submissionStatus === 'uploading' && '📤 Uploading Data'}
                {submissionStatus === 'processing' && '⚙️ Processing'}
                {submissionStatus === 'success' && '🎉 Submission Successful'}
                {submissionStatus === 'error' && '❌ Submission Failed'}
              </h3>
              
              {/* Detail Message */}
              <p className={`text-sm mb-6 ${
                submissionStatus === 'error' ? 'text-red-300' :
                submissionStatus === 'success' ? 'text-green-300' :
                'text-gray-300'
              }`}>
                {submissionMessage}
              </p>
              
              {/* Progress Indicator */}
              {submissionStatus !== 'error' && submissionStatus !== 'success' && (
                <div className="space-y-3">
                  <div className="flex gap-2 justify-center">
                    <div className={`h-2 w-10 rounded-full transition-all ${
                      submissionStatus === 'preparing' ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/50' : 'bg-gray-700/50'
                    }`}></div>
                    <div className={`h-2 w-10 rounded-full transition-all ${
                      submissionStatus === 'uploading' ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/50' : 'bg-gray-700/50'
                    }`}></div>
                    <div className={`h-2 w-10 rounded-full transition-all ${
                      submissionStatus === 'processing' ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/50' : 'bg-gray-700/50'
                    }`}></div>
                  </div>
                  <p className="text-xs text-gray-400 font-medium">Please wait...</p>
                </div>
              )}
              
              {/* Retry Button (Error only) */}
              {submissionStatus === 'error' && (
                <button
                  onClick={() => {
                    setSubmissionStatus(null);
                    setSubmissionMessage('');
                    handleCompleteActivity();
                  }}
                  className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  🔄 Retry Submission
                </button>
              )}
            </div>
          </div>
        )}

        {/* Performance Report Overlay */}
        {showReport && performanceReport && !submissionStatus && (
          <div className="absolute inset-0 bg-gradient-to-br from-black/95 via-blue-900/50 to-black/95 backdrop-blur-xl flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-gray-700/50 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="mb-4 text-7xl animate-bounce">
                  {performanceReport.letterGrade === 'A' && '🏆'}
                  {performanceReport.letterGrade === 'B' && '⭐'}
                  {performanceReport.letterGrade === 'C' && '👍'}
                  {performanceReport.letterGrade === 'D' && '📚'}
                  {performanceReport.letterGrade === 'F' && '💪'}
                </div>
                <h3 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300 mb-4">Activity Completed!</h3>
                <div className="flex items-center justify-center gap-6 mb-6 p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-600/30">
                  <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{performanceReport.overallScore}</div>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-blue-200">/ 100</div>
                    <div className="text-lg font-bold text-purple-300 mt-1">Grade: <span className="text-yellow-300">{performanceReport.letterGrade}</span></div>
                  </div>
                </div>
                <p className="text-blue-300 font-semibold">⏱️ Time Taken: {formatTime(completionTime)}</p>
              </div>

              {/* Component Scores */}
              <div className="mb-8">
                <h4 className="font-bold text-blue-300 mb-4 flex items-center gap-2">
                  <span>📊</span> Component Performance
                </h4>
                <div className="space-y-3">
                  {Object.entries(performanceReport.componentScores).map(([name, score]) => (
                    <div key={name} className="flex items-center gap-4">
                      <span className="text-sm font-bold text-gray-300 uppercase w-16">{name}</span>
                      <div className="flex-1 h-6 bg-gray-700/50 rounded-full overflow-hidden border border-gray-600/30">
                        <div
                          className={`h-full transition-all duration-500 ${
                            score >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/50' :
                            score >= 80 ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/50' :
                            score >= 70 ? 'bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg shadow-yellow-500/50' : 
                            'bg-gradient-to-r from-red-500 to-pink-500 shadow-lg shadow-red-500/50'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-300 w-12 text-right">{score}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accuracy Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 p-4 rounded-lg border border-green-600/30">
                  <div className="text-sm text-green-300 mb-2 font-semibold">✓ Accuracy Rate</div>
                  <div className="text-3xl font-bold text-green-300">
                    {performanceReport.accuracy.accuracyRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-green-400/70 mt-1">
                    {performanceReport.accuracy.correctAttempts} correct / {performanceReport.accuracy.totalAttempts} total
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-900/40 to-pink-900/40 p-4 rounded-lg border border-red-600/30">
                  <div className="text-sm text-red-300 mb-2 font-semibold">⚠️ Wrong Attempts</div>
                  <div className="text-3xl font-bold text-red-300">
                    {performanceReport.accuracy.wrongAttempts}
                  </div>
                  <div className="text-xs text-red-400/70 mt-1">
                    Mistakes to learn from
                  </div>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <h4 className="font-bold text-green-300 mb-3 flex items-center gap-2">
                    <span>🌟</span> Strengths
                  </h4>
                  <ul className="text-sm text-gray-300 space-y-2">
                    {performanceReport.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2 p-2 bg-green-900/20 rounded border border-green-600/30">
                        <span className="text-green-400 mt-0.5 font-bold">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-orange-300 mb-3 flex items-center gap-2">
                    <span>📈</span> Areas to Improve
                  </h4>
                  <ul className="text-sm text-gray-300 space-y-2">
                    {performanceReport.improvements.map((improvement, idx) => (
                      <li key={idx} className="flex items-start gap-2 p-2 bg-orange-900/20 rounded border border-orange-600/30">
                        <span className="text-orange-400 mt-0.5 font-bold">→</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-6 border-t border-gray-700/50">
                <p className="text-gray-400 text-sm mb-4 font-medium">✓ Your submission has been recorded successfully.</p>
                <div className="inline-block px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold shadow-lg shadow-green-500/50 animate-pulse">
                  Redirecting in 5 seconds...
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Premium Footer */}
      <div className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm text-white px-6 py-4 border-t border-gray-700/50 flex justify-end gap-3 z-40 shadow-2xl">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2.5 bg-gradient-to-r from-red-600/20 to-red-700/20 hover:from-red-600/40 hover:to-red-700/40 border border-red-600/50 text-red-300 hover:text-red-200 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
        >
          Exit Activity
        </button>
        <button
          onClick={handleCompleteActivity}
          disabled={isCompleted || isSubmitting || overallProgress < 100}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all transform ${
            isCompleted || isSubmitting || overallProgress < 100
              ? "bg-green-600/40 text-green-300 border border-green-600/50 cursor-not-allowed opacity-60"
              : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 border border-blue-500/50"
          }`}
        >
          {isSubmitting ? "⏳ Submitting..." : isCompleted ? "✓ Submitted" : "🚀 Submit Activity"}
        </button>
      </div>
    </div>
  );
}