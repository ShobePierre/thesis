import React from 'react';

/**
 * CodeBlockSubmissionViewer
 * Displays codeblock submission data in a formatted, professional way
 */
export const CodeBlockSubmissionViewer = ({ submissionText }) => {
  const [submissionData, setSubmissionData] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    try {
      const data = typeof submissionText === 'string' 
        ? JSON.parse(submissionText) 
        : submissionText;
      
      // Check if this is a codeblock submission
      if (data.submissionType === 'codeblock') {
        setSubmissionData(data);
      } else {
        setError('Not a codeblock submission');
      }
    } catch (err) {
      setError('Invalid JSON format');
    }
  }, [submissionText]);

  if (error) {
    // If not a codeblock submission, show raw text
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-700 whitespace-pre-wrap break-all">{submissionText}</p>
      </div>
    );
  }

  if (!submissionData) {
    return <div className="p-4 text-gray-500 text-sm">Loading submission...</div>;
  }

  const { correct, score, attemptCount, timeSpent, errors, feedback, analytics } = submissionData;

  return (
    <div className="space-y-4">
      {/* Header with Status */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold ${
            correct 
              ? 'bg-green-100 text-green-600' 
              : 'bg-yellow-100 text-yellow-600'
          }`}>
            {correct ? '✓' : '○'}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {correct ? 'Submission Accepted' : 'Submission Incomplete'}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {correct ? 'All code blocks are correctly placed' : 'Review the feedback below'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-indigo-600">{score}</p>
          <p className="text-xs text-gray-600">/100 points</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Attempts */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Attempts</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{attemptCount}</p>
          <p className="text-xs text-gray-500 mt-1">Total submissions</p>
        </div>

        {/* Time Spent */}
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Time Spent</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{timeSpent}s</p>
          <p className="text-xs text-gray-500 mt-1">{Math.round(timeSpent / 60)} min</p>
        </div>

        {/* Status */}
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Status</p>
          <p className={`text-2xl font-bold mt-1 ${correct ? 'text-green-600' : 'text-yellow-600'}`}>
            {correct ? 'Complete' : 'Pending'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Submission status</p>
        </div>
      </div>

      {/* Feedback Section */}
      {feedback && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Feedback</p>
          <p className="text-sm text-gray-800">{feedback}</p>
        </div>
      )}

      {/* Errors Section */}
      {errors && errors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Issues Found</p>
          <div className="space-y-2">
            {errors.map((error, idx) => (
              <div key={idx} className="flex gap-2 text-sm">
                <span className="text-red-500 font-bold">•</span>
                <span className="text-gray-800">{error}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Section */}
      {analytics && Object.keys(analytics).length > 0 && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Analytics</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(analytics).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-600 capitalize">{key}:</span>
                <span className="font-semibold text-gray-800">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Data Toggle (for debugging) */}
      <details className="group">
        <summary className="cursor-pointer p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">
          ➕ View Raw Data
        </summary>
        <div className="mt-2 p-4 bg-gray-100 border border-gray-300 rounded-lg">
          <pre className="text-xs text-gray-800 overflow-auto max-h-40 whitespace-pre-wrap break-all">
            {JSON.stringify(submissionData, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
};

export default CodeBlockSubmissionViewer;
