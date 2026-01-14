import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const QuizSubmissionViewer = ({ submission, quizId, studentName, attemptId, studentId, activityId }) => {
  const [quizData, setQuizData] = useState(null);
  const [attemptData, setAttemptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!quizId) {
        console.log('No quiz ID provided');
        setError('No quiz ID provided');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        
        // Load quiz data
        console.log('Loading quiz data for quiz ID:', quizId);
        const quizRes = await axios.get(`${API_BASE_URL}/quiz/${quizId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Quiz data loaded:', quizRes.data);
        setQuizData(quizRes.data);

        // Try to load attempt details if we have an attemptId
        if (attemptId) {
          try {
            console.log('Fetching attempt details for attemptId:', attemptId);
            const attemptRes = await axios.get(`${API_BASE_URL}/quiz/instructor/attempts/${attemptId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            console.log('Attempt data loaded:', attemptRes.data);
            setAttemptData(attemptRes.data);
          } catch (attemptErr) {
            console.warn('Failed to fetch attempt details:', attemptErr.message);
          }
        } else if (studentId && quizId) {
          // Fallback: try to find the student's latest attempt for this quiz
          try {
            console.log('Fetching attempts for quiz:', quizId);
            const attemptsRes = await axios.get(`${API_BASE_URL}/quiz/${quizId}/attempts`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            
            if (Array.isArray(attemptsRes.data.attempts)) {
              const studentAttempt = attemptsRes.data.attempts.find(a => a.student_id === studentId);
              if (studentAttempt) {
                console.log('Found student attempt:', studentAttempt.attempt_id);
                const detailsRes = await axios.get(`${API_BASE_URL}/quiz/instructor/attempts/${studentAttempt.attempt_id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                setAttemptData(detailsRes.data);
              }
            }
          } catch (fallbackErr) {
            console.warn('Failed to fetch attempts:', fallbackErr.message);
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError(`Failed to load quiz data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [quizId, attemptId, studentId, activityId, submission]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading quiz data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-600">No quiz data available</p>
      </div>
    );
  }

  const quizTitle = quizData?.quiz?.title || quizData?.title || 'Quiz';
  const passingScore = quizData?.quiz?.passing_score || 50;
  
  // Score is returned as string from database, convert to number
  const scoreValue = attemptData?.attempt?.score || attemptData?.score;
  const score = scoreValue ? parseFloat(scoreValue) : 0;
  
  // Use percentage from backend if available, otherwise calculate
  const percentageValue = attemptData?.attempt?.percentage || attemptData?.percentage;
  const percentage = percentageValue ? parseFloat(percentageValue) : 0;
  
  const totalPoints = quizData?.quiz?.questions?.reduce((sum, q) => sum + (parseFloat(q.points) || 1), 0) || 0;
  const passed = percentage >= passingScore;

  console.log('QuizSubmissionViewer - Attempt Data:', attemptData);
  console.log('QuizSubmissionViewer - Score extracted:', score);
  console.log('QuizSubmissionViewer - Total Points:', totalPoints);
  console.log('QuizSubmissionViewer - Percentage from backend:', percentage);
  console.log('QuizSubmissionViewer - Passed:', passed);

  return (
    <div className="space-y-4">
      {/* Header - Simple grade summary */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <h3 className="text-lg font-bold mb-4">📋 {quizTitle}</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Student Info */}
          <div>
            <p className="text-blue-100 text-sm mb-1">Student</p>
            <p className="text-lg font-semibold">{studentName}</p>
          </div>
          
          {/* Score */}
          <div className="text-right">
            <p className="text-blue-100 text-sm mb-1">Auto-Graded Score</p>
            <div className="flex items-baseline justify-end gap-2">
              <span className="text-4xl font-bold">{score}</span>
              <span className="text-xl font-semibold">/ {totalPoints}</span>
            </div>
          </div>
        </div>

        {/* Percentage and Status */}
        <div className="mt-4 pt-4 border-t border-blue-400 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{percentage}%</p>
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

      {/* Summary Info */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-600 text-sm font-semibold">Questions</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{quizData?.quiz?.questions?.length || 0}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <p className="text-amber-600 text-sm font-semibold">Passing Score</p>
          <p className="text-2xl font-bold text-amber-900 mt-1">{passingScore}%</p>
        </div>
        <div className={`rounded-lg p-4 text-center border-2 ${
          passed
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-sm font-semibold ${passed ? 'text-green-600' : 'text-red-600'}`}>
            Status
          </p>
          <p className={`text-2xl font-bold mt-1 ${passed ? 'text-green-900' : 'text-red-900'}`}>
            {passed ? 'PASS' : 'FAIL'}
          </p>
        </div>
      </div>

      {/* Note */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <span className="font-semibold">ℹ️ Auto-Graded:</span> This quiz was automatically graded based on correct answers. You can add feedback and finalize the grade below.
        </p>
      </div>
    </div>
  );
};

export default QuizSubmissionViewer;
