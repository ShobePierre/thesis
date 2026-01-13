import React, { useState, useEffect } from 'react';
import API from '../../api';

const API_URL = 'http://localhost:5000/api/quiz';

const QuizBuilder = ({ onQuizCreated, onQuizSelected, quizId = null }) => {
  const [mode, setMode] = useState(quizId ? 'edit' : 'create');
  const [quiz, setQuiz] = useState({
    title: '',
    description: '',
    time_limit_minutes: null,
    passing_score: 60,
    shuffle_questions: false,
    shuffle_choices: false,
  });
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (quizId && mode === 'edit') {
      loadQuiz(quizId);
    }
  }, [quizId, mode]);

  const loadQuiz = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/${id}`);
      const quizData = response.data.quiz;
      setQuiz({
        title: quizData.title,
        description: quizData.description,
        time_limit_minutes: quizData.time_limit_minutes,
        passing_score: quizData.passing_score,
        shuffle_questions: quizData.shuffle_questions,
        shuffle_choices: quizData.shuffle_choices,
      });
      setQuestions(quizData.questions || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load quiz');
      setLoading(false);
    }
  };

  const handleQuizChange = (e) => {
    const { name, value, type, checked } = e.target;
    setQuiz({
      ...quiz,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleAddQuestion = (type) => {
    const newQuestion = {
      id: Date.now(),
      question_text: '',
      question_type: type,
      points: 1,
      choices: type !== 'short_answer' ? [] : null,
      answer: null,
    };
    setCurrentQuestion(newQuestion);
    setEditingQuestionId(newQuestion.id);
  };

  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    setCurrentQuestion({
      ...currentQuestion,
      [name]: name === 'points' ? parseFloat(value) : value,
    });
  };

  const handleAddChoice = () => {
    if (!currentQuestion) return;
    const newChoice = {
      id: Date.now(),
      choice_text: '',
      is_correct: false,
    };
    setCurrentQuestion({
      ...currentQuestion,
      choices: [...(currentQuestion.choices || []), newChoice],
    });
  };

  const handleChoiceChange = (choiceId, field, value) => {
    if (!currentQuestion) return;
    setCurrentQuestion({
      ...currentQuestion,
      choices: currentQuestion.choices.map((choice) =>
        choice.id === choiceId ? { ...choice, [field]: value } : choice
      ),
    });
  };

  const handleRemoveChoice = (choiceId) => {
    if (!currentQuestion) return;
    setCurrentQuestion({
      ...currentQuestion,
      choices: currentQuestion.choices.filter((choice) => choice.id !== choiceId),
    });
  };

  const handleSetAnswer = (text) => {
    if (!currentQuestion) return;
    setCurrentQuestion({
      ...currentQuestion,
      answer: { correct_answer_text: text, case_sensitive: false, exact_match_required: true },
    });
  };

  const handleSaveQuestion = () => {
    if (!currentQuestion || !currentQuestion.question_text.trim()) {
      setError('Question text is required');
      return;
    }

    if (currentQuestion.question_type !== 'short_answer' && (!currentQuestion.choices || currentQuestion.choices.length === 0)) {
      setError('At least one choice is required');
      return;
    }

    if (currentQuestion.question_type !== 'short_answer' && !currentQuestion.choices.some((c) => c.is_correct)) {
      setError('At least one correct answer must be marked');
      return;
    }

    if (currentQuestion.question_type === 'short_answer' && !currentQuestion.answer) {
      setError('Correct answer is required');
      return;
    }

    const existingIndex = questions.findIndex((q) => q.id === currentQuestion.id);
    if (existingIndex >= 0) {
      const updatedQuestions = [...questions];
      updatedQuestions[existingIndex] = currentQuestion;
      setQuestions(updatedQuestions);
    } else {
      setQuestions([...questions, currentQuestion]);
    }

    setCurrentQuestion(null);
    setEditingQuestionId(null);
    setError('');
    setSuccess('Question saved ✓');
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleEditQuestion = (questionId) => {
    const question = questions.find((q) => q.id === questionId);
    if (question) {
      setCurrentQuestion({ ...question });
      setEditingQuestionId(questionId);
    }
  };

  const handleDeleteQuestion = (questionId) => {
    setQuestions(questions.filter((q) => q.id !== questionId));
  };

  const handleReorderQuestions = (fromIndex, toIndex) => {
    const newQuestions = [...questions];
    const [movedQuestion] = newQuestions.splice(fromIndex, 1);
    newQuestions.splice(toIndex, 0, movedQuestion);
    setQuestions(newQuestions);
  };

  const handleSaveQuiz = async () => {
    try {
      if (!quiz.title.trim()) {
        setError('Quiz title is required');
        return;
      }

      if (questions.length === 0) {
        setError('At least one question is required');
        return;
      }

      setLoading(true);

      let quizId;
      if (mode === 'edit') {
        await API.put(`/quiz/${quizId}`, quiz);
      } else {
        const response = await API.post('/quiz', quiz);
        quizId = response.data.quiz_id;
      }

      for (let question of questions) {
        if (!question.question_id) {
          const qResponse = await API.post(`/quiz/${quizId}/questions`, {
            quiz_id: quizId,
            question_text: question.question_text,
            question_type: question.question_type,
            points: question.points,
            order: questions.indexOf(question),
          });

          const questionId = qResponse.data.question_id;

          if (question.question_type !== 'short_answer' && question.choices) {
            for (let choice of question.choices) {
              if (!choice.choice_id) {
                await API.post(`/quiz/questions/${questionId}/choices`, {
                  question_id: questionId,
                  choice_text: choice.choice_text,
                  is_correct: choice.is_correct,
                  order: question.choices.indexOf(choice),
                });
              }
            }
          } else if (question.question_type === 'short_answer' && question.answer) {
            await API.post(`/quiz/questions/${questionId}/answer`, {
              question_id: questionId,
              correct_answer_text: question.answer.correct_answer_text,
              case_sensitive: question.answer.case_sensitive,
              exact_match_required: question.answer.exact_match_required,
            });
          }
        }
      }

      setSuccess('Quiz Created Successfully ✓');
      setLoading(false);
      if (onQuizCreated) {
        onQuizCreated(quizId);
      }
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save quiz');
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setCurrentQuestion(null);
    setEditingQuestionId(null);
    setError('');
  };

  return (
    <div className="w-full bg-white rounded-lg overflow-hidden flex flex-col max-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-2xl font-bold text-gray-900">{mode === 'create' ? 'Create New Quiz' : 'Edit Quiz'}</h2>
        {mode === 'preview' && <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">Preview</span>}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Alerts */}
        {error && <div className="p-3 rounded border-l-4 border-red-500 bg-red-50 text-red-800 text-sm">{error}</div>}
        {success && <div className="p-3 rounded border-l-4 border-green-500 bg-green-50 text-green-800 text-sm">{success}</div>}

        {/* Quiz Settings */}
        <div className="space-y-4 border-b pb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Quiz Title *</label>
            <input
              type="text"
              name="title"
              value={quiz.title}
              onChange={handleQuizChange}
              disabled={mode === 'preview'}
              placeholder="Enter quiz title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-gray-900 placeholder-gray-400 autofill:bg-white autofill:text-gray-900"
              style={{
                WebkitAutofillTextFillColor: '#111827',
                WebkitAutofillBackgroundColor: '#ffffff',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
            <textarea
              name="description"
              value={quiz.description}
              onChange={handleQuizChange}
              disabled={mode === 'preview'}
              placeholder="Enter quiz description"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 disabled:bg-gray-100 text-gray-900 placeholder-gray-400"
              style={{
                WebkitAutofillTextFillColor: '#111827',
                WebkitAutofillBackgroundColor: '#ffffff',
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Time Limit (minutes)</label>
              <input
                type="number"
                name="time_limit_minutes"
                value={quiz.time_limit_minutes || ''}
                onChange={handleQuizChange}
                disabled={mode === 'preview'}
                placeholder="No limit"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-gray-900 placeholder-gray-400"
                style={{
                  WebkitAutofillTextFillColor: '#111827',
                  WebkitAutofillBackgroundColor: '#ffffff',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Passing Score (%)</label>
              <input
                type="number"
                name="passing_score"
                value={quiz.passing_score}
                onChange={handleQuizChange}
                disabled={mode === 'preview'}
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-gray-900"
                style={{
                  WebkitAutofillTextFillColor: '#111827',
                  WebkitAutofillBackgroundColor: '#ffffff',
                }}
              />
            </div>
          </div>

          <div className="flex gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="shuffle_questions"
                checked={quiz.shuffle_questions}
                onChange={handleQuizChange}
                disabled={mode === 'preview'}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Shuffle Questions</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="shuffle_choices"
                checked={quiz.shuffle_choices}
                onChange={handleQuizChange}
                disabled={mode === 'preview'}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Shuffle Choices</span>
            </label>
          </div>
        </div>

        {/* Questions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions ({questions.length})</h3>

          {questions.length === 0 && !editingQuestionId && (
            <p className="text-gray-500 text-sm italic py-8 text-center bg-gray-50 rounded">No questions yet. Add one to get started.</p>
          )}

          {questions.map((question, index) => (
            <div key={question.id} className="mb-3 p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-blue-50 transition">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex gap-2 items-center mb-2">
                    <span className="inline-block font-bold text-white bg-blue-600 px-2 py-0.5 rounded text-sm">Q{index + 1}</span>
                    <span className="inline-block text-xs bg-gray-300 text-gray-800 px-2 py-0.5 rounded font-medium">{question.question_type.replace('_', ' ')}</span>
                    <span className="text-sm font-semibold text-gray-700">{question.points} pts</span>
                  </div>
                  <p className="text-gray-900 font-medium text-sm leading-snug">{question.question_text}</p>
                  {question.choices && (
                    <div className="mt-2 ml-4 space-y-1">
                      {question.choices.slice(0, 2).map((choice, cIndex) => (
                        <div key={choice.id} className={`text-xs ${choice.is_correct ? 'text-green-700 font-semibold' : 'text-gray-600'}`}>
                          {String.fromCharCode(65 + cIndex)}) {choice.choice_text} {choice.is_correct && <span className="text-green-600">✓</span>}
                        </div>
                      ))}
                      {question.choices.length > 2 && <div className="text-xs text-gray-500 font-medium">+{question.choices.length - 2} more</div>}
                    </div>
                  )}
                  {question.answer && (
                    <div className="mt-2 text-xs text-green-700 font-medium">
                      <strong>Answer:</strong> {question.answer.correct_answer_text}
                    </div>
                  )}
                </div>
                {mode !== 'preview' && (
                  <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                    <button onClick={() => handleEditQuestion(question.id)} className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 transition">Edit</button>
                    <button onClick={() => handleDeleteQuestion(question.id)} className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 transition">Delete</button>
                    {index > 0 && <button onClick={() => handleReorderQuestions(index, index - 1)} className="px-2 py-1 bg-gray-600 text-white text-xs font-medium rounded hover:bg-gray-700 transition">↑</button>}
                    {index < questions.length - 1 && <button onClick={() => handleReorderQuestions(index, index + 1)} className="px-2 py-1 bg-gray-600 text-white text-xs font-medium rounded hover:bg-gray-700 transition">↓</button>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Question Editor */}
        {editingQuestionId && currentQuestion && (
          <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-4">
              {editingQuestionId === questions.find((q) => q.id === editingQuestionId)?.id ? 'Edit' : 'Add'} Question
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Question Text *</label>
                <textarea
                  name="question_text"
                  value={currentQuestion.question_text}
                  onChange={handleQuestionChange}
                  placeholder="Enter the question"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 text-gray-900 placeholder-gray-400"
                  style={{
                    WebkitAutofillTextFillColor: '#111827',
                    WebkitAutofillBackgroundColor: '#ffffff',
                  }}
                />
              </div>

              <div className="w-32">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Points *</label>
                <input type="number" name="points" value={currentQuestion.points} onChange={handleQuestionChange} min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" style={{
                  WebkitAutofillTextFillColor: '#111827',
                  WebkitAutofillBackgroundColor: '#ffffff',
                }} />
              </div>

              {/* Multiple Choice / Checkbox */}
              {currentQuestion.question_type !== 'short_answer' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Answer Choices *</label>
                  <div className="space-y-2 mb-3">
                    {currentQuestion.choices?.map((choice, idx) => (
                      <div key={choice.id} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={choice.choice_text}
                          onChange={(e) => handleChoiceChange(choice.id, 'choice_text', e.target.value)}
                          placeholder={`Choice ${String.fromCharCode(65 + idx)}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 placeholder-gray-400"
                          style={{
                            WebkitAutofillTextFillColor: '#111827',
                            WebkitAutofillBackgroundColor: '#ffffff',
                          }}
                        />
                        <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                          <input
                            type={currentQuestion.question_type === 'multiple_choice' ? 'radio' : 'checkbox'}
                            name={`correct_${currentQuestion.id}`}
                            checked={choice.is_correct}
                            onChange={(e) => {
                              if (currentQuestion.question_type === 'multiple_choice') {
                                const updated = currentQuestion.choices.map((c) => ({
                                  ...c,
                                  is_correct: c.id === choice.id,
                                }));
                                setCurrentQuestion({
                                  ...currentQuestion,
                                  choices: updated,
                                });
                              } else {
                                handleChoiceChange(choice.id, 'is_correct', e.target.checked);
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-700 font-medium">Correct</span>
                        </label>
                        <button onClick={() => handleRemoveChoice(choice.id)} className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">Remove</button>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleAddChoice} className="w-full py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-medium text-sm">
                    + Add Choice
                  </button>
                </div>
              )}

              {/* Short Answer */}
              {currentQuestion.question_type === 'short_answer' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Correct Answer *</label>
                  <input
                    type="text"
                    value={currentQuestion.answer?.correct_answer_text || ''}
                    onChange={(e) => handleSetAnswer(e.target.value)}
                    placeholder="Enter the correct answer"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 text-gray-900 placeholder-gray-400"
                    style={{
                      WebkitAutofillTextFillColor: '#111827',
                      WebkitAutofillBackgroundColor: '#ffffff',
                    }}
                  />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentQuestion.answer?.case_sensitive || false}
                      onChange={(e) => {
                        setCurrentQuestion({
                          ...currentQuestion,
                          answer: { ...currentQuestion.answer, case_sensitive: e.target.checked },
                        });
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">Case Sensitive</span>
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={handleSaveQuestion} className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold">
                  Save Question
                </button>
                <button onClick={handleCancelEdit} className="flex-1 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-semibold">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Question Buttons */}
        {!editingQuestionId && (
          <div className="grid grid-cols-3 gap-3 border-t pt-6">
            <button onClick={() => handleAddQuestion('multiple_choice')} className="py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 disabled:opacity-50 font-semibold text-sm" disabled={mode === 'preview'}>
              + Multiple Choice
            </button>
            <button onClick={() => handleAddQuestion('checkbox')} className="py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 disabled:opacity-50 font-semibold text-sm" disabled={mode === 'preview'}>
              + Checkbox
            </button>
            <button onClick={() => handleAddQuestion('short_answer')} className="py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 disabled:opacity-50 font-semibold text-sm" disabled={mode === 'preview'}>
              + Short Answer
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
        {mode !== 'preview' && (
          <>
            <button onClick={handleSaveQuiz} className="flex-1 py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700 disabled:opacity-50 transition" disabled={loading}>
              {loading ? 'Saving...' : 'Save Quiz'}
            </button>
            <button onClick={onQuizSelected} className="flex-1 py-3 bg-gray-500 text-white font-bold rounded hover:bg-gray-600 transition">
              Cancel
            </button>
          </>
        )}
        {mode === 'preview' && (
          <button onClick={() => setMode('edit')} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition">
            Edit Quiz
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizBuilder;
