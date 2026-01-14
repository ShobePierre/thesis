import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import PhaserSimulator from "../../features/DragDrop/components/PhaserSimulator";

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
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionTime, setCompletionTime] = useState(0);
  const [startTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    trackerRef.current.componentStarted(componentName);
  }, []);

  const handleDragOperation = useCallback((componentName, isCorrect) => {
    trackerRef.current.dragOperation(componentName, isCorrect);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900 w-screen h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-3 border-b border-gray-700 flex justify-between items-center z-10">
        <div className="flex-1 min-w-0 flex items-center gap-6">
          <div>
            <h2 className="text-lg font-bold truncate">{activity.title || "PC Building Simulator"}</h2>
            {activity.instructions && (
              <p className="text-xs text-gray-300 mt-0.5 line-clamp-1">
                {activity.instructions}
              </p>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold whitespace-nowrap">{overallProgress.toFixed(0)}%</span>
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Components Checklist */}
          <div className="flex gap-4 text-xs text-gray-300 border-l border-gray-700 pl-4">
            {Object.entries(checkpoints).map(([name, data]) => (
              <div key={name} className="flex items-center gap-1 uppercase">
                <span className={`w-4 h-4 flex items-center justify-center rounded text-xs font-bold ${
                  data.completed ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  {data.completed ? '✓' : '○'}
                </span>
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timer */}
        <div className="text-right ml-3 flex-shrink-0">
          <div className="text-2xl font-mono font-bold text-blue-400">{formatTime(completionTime)}</div>
          <div className="text-xs text-gray-400">Elapsed</div>
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
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl text-center">
              {/* Loading Spinner */}
              {submissionStatus !== 'error' && submissionStatus !== 'success' && (
                <div className="mb-6 flex justify-center">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-600 animate-spin"></div>
                  </div>
                </div>
              )}
              
              {/* Success Icon */}
              {submissionStatus === 'success' && (
                <div className="mb-6 flex justify-center text-5xl animate-bounce">
                  ✅
                </div>
              )}
              
              {/* Error Icon */}
              {submissionStatus === 'error' && (
                <div className="mb-6 flex justify-center text-5xl">
                  ⚠️
                </div>
              )}
              
              {/* Status Message */}
              <h3 className={`text-lg font-semibold mb-2 ${
                submissionStatus === 'error' ? 'text-red-600' :
                submissionStatus === 'success' ? 'text-green-600' :
                'text-gray-800'
              }`}>
                {submissionStatus === 'preparing' && 'Preparing Submission'}
                {submissionStatus === 'uploading' && 'Uploading Data'}
                {submissionStatus === 'processing' && 'Processing'}
                {submissionStatus === 'success' && 'Submission Successful'}
                {submissionStatus === 'error' && 'Submission Failed'}
              </h3>
              
              {/* Detail Message */}
              <p className={`text-sm mb-4 ${
                submissionStatus === 'error' ? 'text-red-500' :
                submissionStatus === 'success' ? 'text-green-600' :
                'text-gray-600'
              }`}>
                {submissionMessage}
              </p>
              
              {/* Progress Indicator */}
              {submissionStatus !== 'error' && submissionStatus !== 'success' && (
                <div className="space-y-2">
                  <div className="flex gap-1 justify-center">
                    <div className={`h-1 w-8 rounded-full transition-all ${
                      submissionStatus === 'preparing' ? 'bg-blue-600' : 'bg-gray-300'
                    }`}></div>
                    <div className={`h-1 w-8 rounded-full transition-all ${
                      submissionStatus === 'uploading' ? 'bg-blue-600' : 'bg-gray-300'
                    }`}></div>
                    <div className={`h-1 w-8 rounded-full transition-all ${
                      submissionStatus === 'processing' ? 'bg-blue-600' : 'bg-gray-300'
                    }`}></div>
                  </div>
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
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                >
                  Retry Submission
                </button>
              )}
            </div>
          </div>
        )}

        {/* Performance Report Overlay */}
        {showReport && performanceReport && !submissionStatus && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="mb-4 text-6xl">
                  {performanceReport.letterGrade === 'A' && '🏆'}
                  {performanceReport.letterGrade === 'B' && '⭐'}
                  {performanceReport.letterGrade === 'C' && '👍'}
                  {performanceReport.letterGrade === 'D' && '📚'}
                  {performanceReport.letterGrade === 'F' && '💪'}
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-2">Activity Completed!</h3>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="text-5xl font-bold text-blue-600">{performanceReport.overallScore}</div>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-gray-700">/ 100</div>
                    <div className="text-lg font-semibold text-blue-600">Grade: {performanceReport.letterGrade}</div>
                  </div>
                </div>
                <p className="text-gray-600">Time Taken: {formatTime(completionTime)}</p>
              </div>

              {/* Component Scores */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Component Performance</h4>
                <div className="space-y-2">
                  {Object.entries(performanceReport.componentScores).map(([name, score]) => (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 uppercase w-16">{name}</span>
                      <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            score >= 90 ? 'bg-green-500' :
                            score >= 80 ? 'bg-blue-500' :
                            score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-700 w-12 text-right">{score}/100</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accuracy Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Accuracy Rate</div>
                  <div className="text-2xl font-bold text-green-600">
                    {performanceReport.accuracy.accuracyRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {performanceReport.accuracy.correctAttempts} correct / {performanceReport.accuracy.totalAttempts} total
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Wrong Attempts</div>
                  <div className="text-2xl font-bold text-red-600">
                    {performanceReport.accuracy.wrongAttempts}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Mistakes made
                  </div>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-1">
                    <span>✓</span> Strengths
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {performanceReport.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-1">
                    <span>📈</span> Areas to Improve
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {performanceReport.improvements.map((improvement, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-gray-500 text-sm mb-3">Your submission has been recorded successfully.</p>
                <div className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium">
                  Redirecting in 5 seconds...
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white px-4 py-2 border-t border-gray-700 flex justify-end gap-2 z-40">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Exit
        </button>
        <button
          onClick={handleCompleteActivity}
          disabled={isCompleted || isSubmitting || overallProgress < 100}
          className={`px-4 py-1 rounded text-sm font-medium transition ${
            isCompleted || isSubmitting || overallProgress < 100
              ? "bg-green-600 text-white cursor-not-allowed opacity-50"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isSubmitting ? "Submitting..." : isCompleted ? "✓ Submitted" : "Submit Activity"}
        </button>
      </div>
    </div>
  );
}