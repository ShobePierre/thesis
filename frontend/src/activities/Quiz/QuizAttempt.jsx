import React, { useState, useEffect } from 'react';
import API from '../../api';

const API_URL = 'http://localhost:5000/api/quiz';

const QuizAttempt = ({ quizId, activityId, onSubmit }) => {
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [attemptId, setAttemptId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [showProgress, setShowProgress] = useState(true);

  // Load quiz and start attempt
  useEffect(() => {
    loadQuizAndStart();
  }, [quizId]);

  // Timer
  useEffect(() => {
    if (!timeLeft || timeLeft <= 0 || submitted) return;

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, submitted]);

  // Auto-submit if time is up
  useEffect(() => {
    if (timeLeft === 0 && !submitted) {
      handleSubmitQuiz();
    }
  }, [timeLeft, submitted]);

  const loadQuizAndStart = async () => {
    try {
      setLoading(true);

      // Fetch quiz
      const quizResponse = await API.get(`/quiz/${quizId}`);
      const quizData = quizResponse.data.quiz;
      setQuiz(quizData);
      setQuestions(quizData.questions || []);

      if (quizData.time_limit_minutes) {
        setTimeLeft(quizData.time_limit_minutes * 60);
      }

      // Check for an existing attempt for this student + quiz + activity
      try {
        const activeRes = await API.get(`/quiz/${quizId}/attempts/active`, {
          params: { activity_id: activityId || null },
        });

        const existing = activeRes.data?.attempt || null;
        if (existing) {
          setAttemptId(existing.attempt_id || existing.attemptId || existing.id);

          // If attempt already completed, fetch details and show submitted view
          if (existing.is_completed || existing.submitted_at) {
            // fetch attempt details to get answers
            try {
              const detailsRes = await API.get(`/quiz/attempts/${existing.attempt_id}/details`);
              const attempt = detailsRes.data?.attempt || null;
              if (attempt) {
                // Map answers into answers state so UI can show selected options in review
                const map = {};
                (attempt.answers || []).forEach((a) => {
                  try {
                    const ans = JSON.parse(a.student_answer);
                    map[a.question_id] = ans;
                  } catch (e) {
                    map[a.question_id] = a.student_answer;
                  }
                });
                setAnswers(map);
              }
            } catch (e) {
              // ignore errors fetching details
            }

            // If server stored score fields, set them so submitted UI shows
            const normalized = {
              score: existing.score || existing.score_value || null,
              percentage: existing.percentage || null,
              passed: existing.passed === 1 || existing.passed === true,
            };
            setScore(normalized);
            setSubmitted(true);
            setLoading(false);
            return;
          }

          // If we have an in-progress attempt, reuse it (do not start a new one)
          setLoading(false);
          return;
        }
      } catch (e) {
        // If the check fails, fall back to starting a new attempt
        console.error('Failed to check existing attempt:', e);
      }

      // Start attempt (no existing attempt found)
      const attemptResponse = await API.post('/quiz/attempts/start', {
        quiz_id: quizId,
        activity_id: activityId || null,
      });

      setAttemptId(attemptResponse.data.attempt_id);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quiz');
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    // Normalize numeric answers so comparisons (checked === choice_id) work correctly
    let val = answer;
    if (typeof val === 'string' && /^\d+$/.test(val)) {
      val = Number(val);
    }
    setAnswers((prev) => ({
      ...prev,
      [questionId]: val,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleJumpToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  const handleSubmitQuiz = async () => {
    try {
      if (!attemptId) return;

      setLoading(true);

      // Prepare answers
      const submittedAnswers = questions.map((question) => ({
        question_id: question.question_id,
        student_answer: answers[question.question_id] || null,
      }));

      const submitResponse = await API.post('/quiz/attempts/submit', {
        attempt_id: attemptId,
        quiz_id: quizId,
        answers: submittedAnswers,
      });

      // Log response for debugging and normalize shape expected by UI
      console.log('Quiz submit response:', submitResponse.data);
      const data = submitResponse.data || {};
      const normalized = {
        score: typeof data.score !== 'undefined' ? data.score : data?.result?.score || null,
        percentage: typeof data.percentage !== 'undefined' ? data.percentage : data?.result?.percentage || null,
        passed: typeof data.passed !== 'undefined' ? data.passed : data?.result?.passed || false,
        attempt_id: data.attempt_id || data?.result?.attempt_id || attemptId,
      };

      setScore(normalized);
      setSubmitted(true);
      setLoading(false);

      if (onSubmit) {
        onSubmit(submitResponse.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quiz');
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'No limit';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="w-full bg-white rounded-lg p-8 text-center text-gray-600">Loading quiz...</div>;
  }

  if (error) {
    return <div className="w-full bg-white rounded-lg p-8 text-center text-red-600 font-semibold">Error: {error}</div>;
  }

  if (!quiz || !questions.length) {
    return <div className="w-full bg-white rounded-lg p-8 text-center text-red-600 font-semibold">Quiz not found or has no questions</div>;
  }

  // NOTE: When a student has already submitted, we still render the full quiz UI
  // in read-only mode so they can review their answers. We will show the
  // submission score next to Progress and disable inputs and submit actions.

  const currentQuestion = questions[currentQuestionIndex];
  const answeredQuestions = Object.keys(answers).length;
  const allAnswered = answeredQuestions === questions.length;

  return (
    <div className="w-full bg-white rounded-lg overflow-hidden flex flex-col max-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{quiz.title}</h2>
            {quiz.description && <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>}
          </div>
          <div className="flex gap-4">
            {timeLeft !== null && !submitted && (
              <div className={`px-4 py-2 rounded-lg font-bold text-center flex flex-col items-center ${timeLeft < 60 ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                <span className="text-xs font-semibold mb-1">Time Left</span>
                <span className="text-lg">{formatTime(timeLeft)}</span>
              </div>
            )}

            {/* Score box shown when attempt already submitted */}
            {submitted && score && (
              <div className="px-3 py-2 rounded-lg bg-gray-100 text-gray-900 text-center flex flex-col items-center">
                <span className="text-xs font-semibold mb-1">Score</span>
                <span className="text-lg font-bold">{Math.round(score.score * 100) / 100}</span>
              </div>
            )}

            <div className="px-4 py-2 rounded-lg bg-gray-200 text-gray-900 text-center flex flex-col items-center">
              <span className="text-xs font-semibold mb-1">Progress</span>
              <span className="text-lg font-bold">{answeredQuestions}/{questions.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Question Panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Question {currentQuestionIndex + 1} of {questions.length}
              </h3>
              <span className="inline-block px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">{currentQuestion.question_type.replace('_', ' ')}</span>
            </div>
            <p className="text-lg text-gray-900 font-semibold leading-relaxed">{currentQuestion.question_text}</p>
          </div>

          {/* Multiple Choice */}
          {currentQuestion.question_type === 'multiple_choice' && (
            <div className="space-y-3">
              {currentQuestion.choices?.map((choice, index) => (
                <label key={choice.choice_id} className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition">
                  <input
                    type="radio"
                    name={`question_${currentQuestion.question_id}`}
                    value={choice.choice_id}
                    checked={String(answers[currentQuestion.question_id]) === String(choice.choice_id)}
                    onChange={(e) => handleAnswerChange(currentQuestion.question_id, e.target.value)}
                    className="w-5 h-5 mt-1 accent-blue-600"
                    disabled={submitted}
                  />
                  <span className="text-gray-900 font-medium">
                    <span className="font-bold text-blue-600">{String.fromCharCode(65 + index)})</span> {choice.choice_text}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* Checkbox (Multiple Answers) */}
          {currentQuestion.question_type === 'checkbox' && (
            <div className="space-y-3">
              {currentQuestion.choices?.map((choice, index) => (
                <label key={choice.choice_id} className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition">
                    <input
                      type="checkbox"
                      value={choice.choice_id}
                      checked={
                        Array.isArray(answers[currentQuestion.question_id])
                          ? answers[currentQuestion.question_id].map(String).includes(String(choice.choice_id))
                          : false
                      }
                      onChange={(e) => {
                        const current = Array.isArray(answers[currentQuestion.question_id]) ? answers[currentQuestion.question_id] : [];
                        if (e.target.checked) {
                          handleAnswerChange(currentQuestion.question_id, [...current, choice.choice_id]);
                        } else {
                          handleAnswerChange(currentQuestion.question_id, current.filter((id) => id !== choice.choice_id));
                        }
                      }}
                      className="w-5 h-5 mt-1 accent-blue-600 rounded"
                      disabled={submitted}
                    />
                  <span className="text-gray-900 font-medium">
                    <span className="font-bold text-blue-600">{String.fromCharCode(65 + index)})</span> {choice.choice_text}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* Short Answer */}
          {currentQuestion.question_type === 'short_answer' && (
            <div>
              <input
                type="text"
                value={answers[currentQuestion.question_id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.question_id, e.target.value)}
                placeholder="Enter your answer here..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                style={{
                  WebkitAutofillTextFillColor: '#111827',
                  WebkitAutofillBackgroundColor: '#ffffff',
                }}
              />
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition"
            >
              ← Previous
            </button>

            <div className="flex-1 flex items-center justify-center text-gray-600 font-medium">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>

            {currentQuestionIndex < questions.length - 1 ? (
              <button onClick={handleNextQuestion} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition">
                Next →
              </button>
            ) : (
              submitted ? (
                <button disabled className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold cursor-not-allowed">
                  Already Submitted
                </button>
              ) : (
                <button onClick={handleSubmitQuiz} disabled={!allAnswered} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition">
                  Submit Quiz
                </button>
              )
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-56 border-l border-gray-200 bg-gray-50 overflow-hidden flex flex-col">
          <button onClick={() => setShowProgress(!showProgress)} className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 font-bold text-gray-900 text-sm transition text-left">
            {showProgress ? '✕' : '☰'} Questions
          </button>

          {showProgress && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <h4 className="font-bold text-gray-900 text-sm">Progress</h4>
              <div className="grid grid-cols-4 gap-2">
                {questions.map((question, index) => (
                  <button
                    key={question.question_id}
                    onClick={() => handleJumpToQuestion(index)}
                    className={`aspect-square flex items-center justify-center rounded-lg font-bold text-xs transition ${
                      index === currentQuestionIndex
                        ? 'bg-blue-600 text-white border-2 border-blue-800'
                        : answers[question.question_id]
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    }`}
                    title={`Question ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <div className="space-y-2 pt-4 border-t border-gray-300">
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="w-4 h-4 bg-green-500 rounded"></span>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="w-4 h-4 bg-gray-300 rounded"></span>
                  <span>Unanswered</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="w-4 h-4 bg-blue-600 rounded border-2 border-blue-800"></span>
                  <span>Current</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizAttempt;
