import React, { useMemo } from 'react';

const SimPCSubmissionViewer = ({ submission, studentName }) => {
  const performanceData = useMemo(() => {
    if (!submission) return null;

    try {
      // Try to parse performance_data if it's a string
      if (submission.performance_data) {
        const data = typeof submission.performance_data === 'string' 
          ? JSON.parse(submission.performance_data) 
          : submission.performance_data;
        return data;
      }

      // Try to parse performance_report
      if (submission.performance_report) {
        const report = typeof submission.performance_report === 'string' 
          ? JSON.parse(submission.performance_report) 
          : submission.performance_report;
        return report;
      }

      return null;
    } catch (e) {
      console.error('Failed to parse performance data:', e);
      return null;
    }
  }, [submission]);

  if (!submission) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-600">No submission data available</p>
      </div>
    );
  }

  const score = submission.performance_score || submission.overall_score || 0;
  const percentageValue = submission.performance_score || submission.overall_percentage || 0;
  const percentage = parseFloat(percentageValue) || 0;
  const grade = submission.performance_grade || submission.letter_grade || 'N/A';
  const passingScore = 60;
  const passed = percentage >= passingScore;

  console.log('SimPCSubmissionViewer - Data:', {
    score,
    percentageValue,
    percentage,
    grade,
    passed,
    submission
  });

  // Grade color mapping
  const getGradeColor = (g) => {
    if (!g) return 'text-gray-600';
    const upper = g.toUpperCase();
    if (upper === 'A') return 'text-green-600';
    if (upper === 'B') return 'text-blue-600';
    if (upper === 'C') return 'text-amber-600';
    if (upper === 'D') return 'text-orange-600';
    if (upper === 'F') return 'text-red-600';
    return 'text-gray-600';
  };

  const getGradeBg = (g) => {
    if (!g) return 'bg-gray-100';
    const upper = g.toUpperCase();
    if (upper === 'A') return 'bg-green-100';
    if (upper === 'B') return 'bg-blue-100';
    if (upper === 'C') return 'bg-amber-100';
    if (upper === 'D') return 'bg-orange-100';
    if (upper === 'F') return 'bg-red-100';
    return 'bg-gray-100';
  };

  return (
    <div className="space-y-4">
      {/* Header - Simple performance summary */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
        <h3 className="text-lg font-bold mb-4">🖥️ Sim PC Activity</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Student Info */}
          <div>
            <p className="text-purple-100 text-sm mb-1">Student</p>
            <p className="text-lg font-semibold">{studentName}</p>
          </div>
          
          {/* Performance Score */}
          <div className="text-right">
            <p className="text-purple-100 text-sm mb-1">Performance Score</p>
            <p className="text-4xl font-bold">{percentage.toFixed(1)}%</p>
          </div>
        </div>

        {/* Grade and Status */}
        <div className="mt-4 pt-4 border-t border-purple-400 flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-xs uppercase mb-1">Letter Grade</p>
            <p className={`text-3xl font-bold ${getGradeColor(grade)}`}>{grade}</p>
          </div>
          <div className={`px-4 py-2 rounded-full font-semibold ${
            passed 
              ? 'bg-green-400 text-green-900' 
              : 'bg-red-400 text-red-900'
          }`}>
            {passed ? '✓ PASSED' : '✗ FAILED'}
          </div>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <p className="text-purple-600 text-sm font-semibold">Completion</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">
            {submission.completion_status || 'N/A'}
          </p>
        </div>
        <div className={`rounded-lg p-4 text-center border-2 ${getGradeBg(grade)} border-current`}>
          <p className={`text-sm font-semibold ${getGradeColor(grade)}`}>
            Grade
          </p>
          <p className={`text-2xl font-bold mt-1 ${getGradeColor(grade)}`}>
            {grade}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-600 text-sm font-semibold">Time Taken</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            {submission.time_taken_seconds && submission.time_taken_seconds < 3600000 ? Math.round(submission.time_taken_seconds / 60) : 0}m
          </p>
        </div>
      </div>

      {/* Detailed Performance Breakdown */}
      {performanceData && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <p className="font-semibold text-gray-800 mb-4">📊 Performance Breakdown</p>
          
          {/* Component Scores if available */}
          {(submission.cpu_score !== null || submission.cmos_score !== null || submission.ram_score !== null) && (
            <div className="grid grid-cols-3 gap-2">
              {submission.cpu_score !== null && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-xs text-blue-600 font-semibold">CPU</p>
                  <p className="text-lg font-bold text-blue-900 mt-1">{submission.cpu_score}%</p>
                </div>
              )}
              {submission.cmos_score !== null && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-xs text-green-600 font-semibold">CMOS</p>
                  <p className="text-lg font-bold text-green-900 mt-1">{submission.cmos_score}%</p>
                </div>
              )}
              {submission.ram_score !== null && (
                <div className="bg-orange-50 border border-orange-200 rounded p-3">
                  <p className="text-xs text-orange-600 font-semibold">RAM</p>
                  <p className="text-lg font-bold text-orange-900 mt-1">{submission.ram_score}%</p>
                </div>
              )}
            </div>
          )}

          {/* Attempt Statistics */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
            {submission.total_correct_attempts !== null && (
              <div className="flex justify-between p-2 bg-green-50 rounded">
                <span className="text-sm text-gray-700">Correct Attempts:</span>
                <span className="font-semibold text-green-700">{submission.total_correct_attempts}</span>
              </div>
            )}
            {submission.total_wrong_attempts !== null && (
              <div className="flex justify-between p-2 bg-red-50 rounded">
                <span className="text-sm text-gray-700">Wrong Attempts:</span>
                <span className="font-semibold text-red-700">{submission.total_wrong_attempts}</span>
              </div>
            )}
            {submission.sequence_followed !== null && (
              <div className={`flex justify-between p-2 rounded ${submission.sequence_followed ? 'bg-green-50' : 'bg-amber-50'}`}>
                <span className="text-sm text-gray-700">Sequence Followed:</span>
                <span className={`font-semibold ${submission.sequence_followed ? 'text-green-700' : 'text-amber-700'}`}>
                  {submission.sequence_followed ? '✓ Yes' : '✗ No'}
                </span>
              </div>
            )}
            {submission.total_drag_operations !== null && (
              <div className="flex justify-between p-2 bg-blue-50 rounded">
                <span className="text-sm text-gray-700">Drag Operations:</span>
                <span className="font-semibold text-blue-700">{submission.total_drag_operations}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-sm text-purple-800">
          <span className="font-semibold">ℹ️ Auto-Scored:</span> This Sim PC activity was automatically scored based on performance metrics. You can adjust the grade and add feedback below if needed.
        </p>
      </div>
    </div>
  );
};

export default SimPCSubmissionViewer;
