import React, { useState, useEffect } from 'react';
import API from '../../api';

const API_URL = 'http://localhost:5000/api/quiz';

const QuizResults = ({ quizId, attemptId, activityId, isInstructor = false }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [attempts, setAttempts] = useState(null); // For instructor view
  const [selectedAttempt, setSelectedAttempt] = useState(attemptId);

  useEffect(() => {
    if (isInstructor && quizId) {
      loadInstructorView();
    } else if (attemptId) {
      loadAttemptDetails();
    } else if (quizId) {
      loadStudentScore();
    }
  }, [quizId, attemptId, isInstructor]);

  const loadAttemptDetails = async () => {
    try {
      setLoading(true);
      const [attemptRes, quizRes] = await Promise.all([
        API.get(`/quiz/attempts/${selectedAttempt}/details`),
        API.get(`/quiz/${quizId}`),
      ]);

      setAttempt(attemptRes.data.attempt);
      setQuiz(quizRes.data.quiz);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attempt details');
      setLoading(false);
    }
  };

  const loadStudentScore = async () => {
    try {
      setLoading(true);
      const [scoreRes, quizRes] = await Promise.all([
        API.get(`/quiz/${quizId}/score`),
        API.get(`/quiz/${quizId}`),
      ]);

      if (scoreRes.data.score) {
        setAttempt({
          score: scoreRes.data.score.best_score,
          percentage: scoreRes.data.score.best_percentage,
          passed: scoreRes.data.score.passed,
          attempt_count: scoreRes.data.score.attempt_count,
        });
      }
      setQuiz(quizRes.data.quiz);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load score');
      setLoading(false);
    }
  };

  const loadInstructorView = async () => {
    try {
      setLoading(true);
      const [attemptsRes, quizRes] = await Promise.all([
        API.get(`/quiz/${quizId}/attempts`),
        API.get(`/quiz/${quizId}`),
      ]);

      setAttempts(attemptsRes.data.attempts);
      setQuiz(quizRes.data.quiz);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attempts');
      setLoading(false);
    }
  };

  const handleViewAttempt = async (attemptId) => {
    try {
      setLoading(true);
      const attemptRes = await API.get(`/quiz/attempts/${attemptId}/details`);
      setAttempt(attemptRes.data.attempt);
      setSelectedAttempt(attemptId);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attempt');
      setLoading(false);
    }
  };

  const toggleQuestionExpand = (questionId) => {
    setExpandedQuestions({
      ...expandedQuestions,
      [questionId]: !expandedQuestions[questionId],
    });
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'No time recorded';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  if (loading) {
    return <div className="w-full bg-white rounded-lg p-8 text-center text-gray-600">Loading results...</div>;
  }

  if (error) {
    return <div className="w-full bg-white rounded-lg p-8 text-center text-red-600 font-semibold">Error: {error}</div>;
  }

  if (!quiz) {
    return <div className="w-full bg-white rounded-lg p-8 text-center text-red-600 font-semibold">Quiz not found</div>;
  }

  // Instructor view - list of all attempts
  if (isInstructor && attempts) {
    return (
      <div className="w-full bg-white rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-2xl font-bold text-gray-900">{quiz.title} Results</h2>
          <p className="text-sm text-gray-600 mt-1">Total Submissions: {attempts.length}</p>
        </div>

        {attempts.length === 0 ? (
          <div className="p-8 text-center text-gray-500 italic bg-gray-50">No submissions yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Student</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Score</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Submitted</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attemptItem) => (
                  <tr key={attemptItem.attempt_id} className="border-b border-gray-200 hover:bg-blue-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{attemptItem.username}</p>
                        <p className="text-sm text-gray-600">{attemptItem.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div>
                        <p className="font-bold text-blue-600">{attemptItem.score || 0}/{quiz.total_points || 100}</p>
                        <p className="text-sm text-gray-600 font-semibold">{Math.round(attemptItem.percentage || 0)}%</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full font-bold text-white text-sm ${attemptItem.passed ? 'bg-green-600' : 'bg-red-600'}`}>
                        {attemptItem.passed ? '✓ Passed' : '✗ Failed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-700">
                      {new Date(attemptItem.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleViewAttempt(attemptItem.attempt_id)} className="px-4 py-1 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 transition">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {attempt && selectedAttempt && (
          <div className="p-6 border-t border-gray-200 mt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Detailed Review</h3>
            <AttemptDetailsView attempt={attempt} quiz={quiz} expandedQuestions={expandedQuestions} toggleQuestionExpand={toggleQuestionExpand} />
          </div>
        )}
      </div>
    );
  }

  // Student view - single attempt or score
  if (attempt) {
    return (
      <div className="w-full bg-white rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-2xl font-bold text-gray-900">{quiz.title}</h2>
          <p className="text-sm text-gray-600 mt-1">Quiz Results Review</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
              <h3 className="font-bold text-gray-900 mb-3">Your Score</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-blue-600">{Math.round(attempt.percentage || 0)}</span>
                <span className="text-2xl font-bold text-gray-600">%</span>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700">
                  Points: <strong className="text-gray-900">{Math.round(attempt.score * 100) / 100}</strong> / {quiz.total_points || 100}
                </p>
                <p className="text-gray-700">
                  Status:{' '}
                  <span className={`inline-block ml-1 px-3 py-1 rounded-full font-bold text-white text-xs ${attempt.passed ? 'bg-green-600' : 'bg-red-600'}`}>
                    {attempt.passed ? '✓ Passed' : '✗ Failed'}
                  </span>
                </p>
                {attempt.attempt_count && <p className="text-gray-700">Attempts: <strong>{attempt.attempt_count}</strong></p>}
                {quiz.passing_score && <p className="text-gray-700">Passing Score: <strong>{quiz.passing_score}%</strong></p>}
              </div>
            </div>

            {attempt.time_taken_seconds && (
              <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200">
                <h3 className="font-bold text-gray-900 mb-3">Time Taken</h3>
                <p className="text-3xl font-bold text-green-600">{formatTime(attempt.time_taken_seconds)}</p>
              </div>
            )}
          </div>

          {attempt.answers && attempt.answers.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Answer Review</h3>
              <AttemptDetailsView attempt={attempt} quiz={quiz} expandedQuestions={expandedQuestions} toggleQuestionExpand={toggleQuestionExpand} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return <div className="w-full bg-white rounded-lg p-8 text-center text-red-600 font-semibold">No results available</div>;
};

// Helper component to display answer details
const AttemptDetailsView = ({ attempt, quiz, expandedQuestions, toggleQuestionExpand }) => {
  if (!attempt.answers || !attempt.answers.length) {
    return <div className="p-8 text-center text-gray-500 italic bg-gray-50 rounded">No answers recorded</div>;
  }

  return (
    <div className="space-y-3">
      {attempt.answers.map((answerItem, index) => {
        const isExpanded = expandedQuestions[answerItem.question_id];
        const isCorrect = answerItem.is_correct;

        return (
          <div key={answerItem.attempt_answer_id} className={`border-2 rounded-lg overflow-hidden transition ${isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
            <button
              onClick={() => toggleQuestionExpand(answerItem.question_id)}
              className="w-full px-4 py-3 hover:opacity-90 transition text-left flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={`flex-shrink-0 w-8 h-8 rounded-full font-bold text-white flex items-center justify-center ${isCorrect ? 'bg-green-600' : 'bg-red-600'}`}>
                  {isCorrect ? '✓' : '✗'}
                </span>
                <span className="font-bold text-gray-900 flex-shrink-0">Q{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-semibold truncate">{answerItem.question_text}</p>
                  <p className="text-xs text-gray-600">{answerItem.question_type.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="font-bold text-gray-900">{Math.round(answerItem.points_earned * 100) / 100}/{answerItem.points}</p>
                </div>
                <span className="text-gray-600">{isExpanded ? '▼' : '▶'}</span>
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 py-4 bg-white border-t-2 border-inherit space-y-3">
                <div>
                  <h5 className="font-bold text-gray-900 mb-2">Your Answer:</h5>
                  <div className="p-3 bg-gray-100 rounded text-gray-700 text-sm">
                    {typeof answerItem.student_answer === 'string' && answerItem.student_answer.startsWith('[')
                      ? JSON.parse(answerItem.student_answer).join(', ')
                      : answerItem.student_answer || <em className="text-gray-500">Not answered</em>}
                  </div>
                </div>

                {!isCorrect && (
                  <div>
                    <h5 className="font-bold text-gray-900 mb-2">Correct Answer:</h5>
                    <div className="p-3 bg-green-100 rounded text-green-800 text-sm">
                      <em>Check quiz key for correct answer</em>
                    </div>
                  </div>
                )}

                {isCorrect && (
                  <div className="p-3 bg-green-100 rounded text-green-800 font-semibold text-sm">
                    ✓ Correct!
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default QuizResults;
