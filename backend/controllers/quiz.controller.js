const db = require('../config/db');

// ✅ CREATE QUIZ
exports.createQuiz = (req, res) => {
  try {
    const { title, description, time_limit_minutes, passing_score, shuffle_questions, shuffle_choices } = req.body;
    const instructor_id = req.userId;

    if (!title) {
      return res.status(400).json({ message: "Quiz title is required" });
    }

    const sql = `INSERT INTO quizzes (instructor_id, title, description, time_limit_minutes, passing_score, shuffle_questions, shuffle_choices, is_published)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 0)`;

    db.query(sql, [instructor_id, title, description || null, time_limit_minutes || null, passing_score || 60, shuffle_questions ? 1 : 0, shuffle_choices ? 1 : 0], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: "Failed to create quiz", error: err.message });
      }

      const quiz_id = result.insertId;
      res.status(201).json({
        message: "Quiz Created Successfully ✔",
        quiz_id,
        title,
        instructor_id
      });
    });
  } catch (error) {
    console.error('Error in createQuiz:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ ADD QUESTION TO QUIZ
exports.addQuestion = (req, res) => {
  try {
    const { quiz_id, question_text, question_type, points, order } = req.body;

    if (!quiz_id || !question_text || !question_type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate question type
    const validTypes = ['multiple_choice', 'checkbox', 'short_answer'];
    if (!validTypes.includes(question_type)) {
      return res.status(400).json({ message: "Invalid question type" });
    }

    const sql = `INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, \`order\`)
                 VALUES (?, ?, ?, ?, ?)`;

    db.query(sql, [quiz_id, question_text, question_type, points || 1, order || 0], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: "Failed to add question", error: err.message });
      }

      const question_id = result.insertId;
      res.status(201).json({
        message: "Question added successfully",
        question_id,
        quiz_id,
        question_text,
        question_type,
        points: points || 1
      });
    });
  } catch (error) {
    console.error('Error in addQuestion:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ ADD CHOICE TO QUESTION (for MCQ/Checkbox)
exports.addChoice = (req, res) => {
  try {
    const { question_id, choice_text, is_correct, order } = req.body;

    if (!question_id || !choice_text) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const sql = `INSERT INTO quiz_question_choices (question_id, choice_text, is_correct, \`order\`)
                 VALUES (?, ?, ?, ?)`;

    db.query(sql, [question_id, choice_text, is_correct ? 1 : 0, order || 0], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: "Failed to add choice", error: err.message });
      }

      const choice_id = result.insertId;
      res.status(201).json({
        message: "Choice added successfully",
        choice_id,
        question_id,
        choice_text,
        is_correct: is_correct ? 1 : 0
      });
    });
  } catch (error) {
    console.error('Error in addChoice:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ SET SHORT ANSWER
exports.setShortAnswer = (req, res) => {
  try {
    const { question_id, correct_answer_text, case_sensitive, exact_match_required } = req.body;

    if (!question_id || !correct_answer_text) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const sql = `INSERT INTO quiz_answers (question_id, correct_answer_text, case_sensitive, exact_match_required)
                 VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE correct_answer_text = ?, case_sensitive = ?, exact_match_required = ?`;

    db.query(sql, [question_id, correct_answer_text, case_sensitive ? 1 : 0, exact_match_required ? 1 : 0, correct_answer_text, case_sensitive ? 1 : 0, exact_match_required ? 1 : 0], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: "Failed to set answer", error: err.message });
      }

      res.status(201).json({
        message: "Answer set successfully",
        question_id,
        correct_answer_text
      });
    });
  } catch (error) {
    console.error('Error in setShortAnswer:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ GET QUIZ (with all questions and choices)
exports.getQuiz = (req, res) => {
  try {
    const quiz_id = req.params.id;

    if (!quiz_id) {
      return res.status(400).json({ message: "Quiz ID is required" });
    }

    const sql = `SELECT * FROM quizzes WHERE quiz_id = ?`;

    db.query(sql, [quiz_id], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: "Failed to fetch quiz", error: err.message });
      }

      if (!rows || rows.length === 0) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const quiz = rows[0];

      // Get all questions
      const qSql = `SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY \`order\``;
      db.query(qSql, [quiz_id], (qErr, questions) => {
        if (qErr) {
          console.error('Database error:', qErr);
          return res.status(500).json({ message: "Failed to fetch questions", error: qErr.message });
        }

        // For each question, get choices or answer
        let questionsProcessed = 0;
        questions.forEach((question, index) => {
          if (question.question_type === 'multiple_choice' || question.question_type === 'checkbox') {
            // Get choices
            const cSql = `SELECT * FROM quiz_question_choices WHERE question_id = ? ORDER BY \`order\``;
            db.query(cSql, [question.question_id], (cErr, choices) => {
              if (!cErr && choices) {
                question.choices = choices;
              }
              questionsProcessed++;
              if (questionsProcessed === questions.length) {
                // compute total points from questions and include it in the returned quiz
                const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
                const quizWithPoints = { ...quiz, total_points: totalPoints, questions };
                res.json({ quiz: quizWithPoints });
              }
            });
          } else if (question.question_type === 'short_answer') {
            // Get answer
            const aSql = `SELECT * FROM quiz_answers WHERE question_id = ?`;
            db.query(aSql, [question.question_id], (aErr, answers) => {
              if (!aErr && answers && answers.length > 0) {
                question.answer = answers[0];
              }
              questionsProcessed++;
              if (questionsProcessed === questions.length) {
                const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
                const quizWithPoints = { ...quiz, total_points: totalPoints, questions };
                res.json({ quiz: quizWithPoints });
              }
            });
          } else {
            questionsProcessed++;
            if (questionsProcessed === questions.length) {
              const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
              const quizWithPoints = { ...quiz, total_points: totalPoints, questions };
              res.json({ quiz: quizWithPoints });
            }
          }
        });

        if (questions.length === 0) {
          const quizWithPoints = { ...quiz, total_points: 0, questions: [] };
          res.json({ quiz: quizWithPoints });
        }
      });
    });
  } catch (error) {
    console.error('Error in getQuiz:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ GET ALL QUIZZES FOR INSTRUCTOR
exports.getInstructorQuizzes = (req, res) => {
  try {
    const instructor_id = req.userId;

    const sql = `SELECT quiz_id, title, description, is_published, total_points, created_at, updated_at FROM quizzes WHERE instructor_id = ? ORDER BY created_at DESC`;

    db.query(sql, [instructor_id], (err, quizzes) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: "Failed to fetch quizzes", error: err.message });
      }

      res.json({ quizzes: quizzes || [] });
    });
  } catch (error) {
    console.error('Error in getInstructorQuizzes:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ UPDATE QUIZ
exports.updateQuiz = (req, res) => {
  try {
    const quiz_id = req.params.id;
    const { title, description, time_limit_minutes, passing_score, shuffle_questions, shuffle_choices } = req.body;
    const instructor_id = req.userId;

    if (!quiz_id) {
      return res.status(400).json({ message: "Quiz ID is required" });
    }

    // Verify instructor owns this quiz
    const verifySql = `SELECT instructor_id FROM quizzes WHERE quiz_id = ?`;
    db.query(verifySql, [quiz_id], (err, rows) => {
      if (err || !rows || rows.length === 0) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      if (rows[0].instructor_id !== instructor_id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const sql = `UPDATE quizzes SET title = ?, description = ?, time_limit_minutes = ?, passing_score = ?, shuffle_questions = ?, shuffle_choices = ?, updated_at = NOW() WHERE quiz_id = ?`;

      db.query(sql, [title || null, description || null, time_limit_minutes || null, passing_score || 60, shuffle_questions ? 1 : 0, shuffle_choices ? 1 : 0, quiz_id], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: "Failed to update quiz", error: err.message });
        }

        res.json({ message: "Quiz updated successfully", quiz_id });
      });
    });
  } catch (error) {
    console.error('Error in updateQuiz:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ UPDATE QUESTION
exports.updateQuestion = (req, res) => {
  try {
    const question_id = req.params.id;
    const { question_text, question_type, points, order } = req.body;

    if (!question_id) {
      return res.status(400).json({ message: "Question ID is required" });
    }

    const sql = `UPDATE quiz_questions SET question_text = ?, question_type = ?, points = ?, \`order\` = ?, updated_at = NOW() WHERE question_id = ?`;

    db.query(sql, [question_text, question_type, points || 1, order || 0, question_id], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: "Failed to update question", error: err.message });
      }

      res.json({ message: "Question updated successfully", question_id });
    });
  } catch (error) {
    console.error('Error in updateQuestion:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ DELETE QUESTION
exports.deleteQuestion = (req, res) => {
  try {
    const question_id = req.params.id;

    if (!question_id) {
      return res.status(400).json({ message: "Question ID is required" });
    }

    const sql = `DELETE FROM quiz_questions WHERE question_id = ?`;

    db.query(sql, [question_id], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: "Failed to delete question", error: err.message });
      }

      res.json({ message: "Question deleted successfully" });
    });
  } catch (error) {
    console.error('Error in deleteQuestion:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ DELETE CHOICE
exports.deleteChoice = (req, res) => {
  try {
    const choice_id = req.params.id;

    if (!choice_id) {
      return res.status(400).json({ message: "Choice ID is required" });
    }

    const sql = `DELETE FROM quiz_question_choices WHERE choice_id = ?`;

    db.query(sql, [choice_id], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: "Failed to delete choice", error: err.message });
      }

      res.json({ message: "Choice deleted successfully" });
    });
  } catch (error) {
    console.error('Error in deleteChoice:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ PUBLISH QUIZ
exports.publishQuiz = (req, res) => {
  try {
    const quiz_id = req.params.id;
    const instructor_id = req.userId;

    if (!quiz_id) {
      return res.status(400).json({ message: "Quiz ID is required" });
    }

    // Verify instructor owns this quiz
    const verifySql = `SELECT instructor_id FROM quizzes WHERE quiz_id = ?`;
    db.query(verifySql, [quiz_id], (err, rows) => {
      if (err || !rows || rows.length === 0) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      if (rows[0].instructor_id !== instructor_id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const sql = `UPDATE quizzes SET is_published = 1, updated_at = NOW() WHERE quiz_id = ?`;

      db.query(sql, [quiz_id], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: "Failed to publish quiz", error: err.message });
        }

        res.json({ message: "Quiz published successfully", quiz_id });
      });
    });
  } catch (error) {
    console.error('Error in publishQuiz:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ START QUIZ ATTEMPT
exports.startQuizAttempt = (req, res) => {
  try {
    const { quiz_id, activity_id } = req.body;
    const student_id = req.userId;

    if (!quiz_id) {
      return res.status(400).json({ message: "Quiz ID is required" });
    }

    const sql = `INSERT INTO quiz_attempts (quiz_id, student_id, activity_id, started_at)
                 VALUES (?, ?, ?, NOW())`;

    db.query(sql, [quiz_id, student_id, activity_id || null], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: "Failed to start quiz attempt", error: err.message });
      }

      const attempt_id = result.insertId;
      res.status(201).json({
        message: "Quiz attempt started",
        attempt_id,
        quiz_id,
        student_id
      });
    });
  } catch (error) {
    console.error('Error in startQuizAttempt:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ SUBMIT QUIZ ATTEMPT
exports.submitQuizAttempt = (req, res) => {
  try {
    const { attempt_id, quiz_id, answers } = req.body;
    const student_id = req.userId;

    if (!attempt_id || !quiz_id || !answers) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Verify attempt belongs to student
    const verifySql = `SELECT * FROM quiz_attempts WHERE attempt_id = ? AND student_id = ?`;
    db.query(verifySql, [attempt_id, student_id], (err, rows) => {
      if (err || !rows || rows.length === 0) {
        return res.status(403).json({ message: "Invalid attempt" });
      }

      const attempt = rows[0];

      // Calculate score
      let totalScore = 0;
      let totalPoints = 0;
      let answersProcessed = 0;

      // Get all questions to know total points
      const qSql = `SELECT question_id, points FROM quiz_questions WHERE quiz_id = ?`;
      db.query(qSql, [quiz_id], (qErr, questions) => {
        if (qErr) {
          return res.status(500).json({ message: "Failed to process quiz", error: qErr.message });
        }

        totalPoints = questions.reduce((sum, q) => sum + Number(q.points || 0), 0);
        console.log('Quiz submission - Questions:', questions);
        console.log('Quiz submission - Total Points calculated:', totalPoints);

        // Process each answer
        answers.forEach((answer, index) => {
          const { question_id, student_answer } = answer;
          
          // Find the question
          const question = questions.find(q => q.question_id === question_id);
          if (!question) {
            answersProcessed++;
            if (answersProcessed === answers.length) {
              finializeSubmission();
            }
            return;
          }

          let isCorrect = false;
          let pointsEarned = 0;

          // Get question type and check correctness
          const cSql = `SELECT question_type FROM quiz_questions WHERE question_id = ?`;
          db.query(cSql, [question_id], (cErr, qTypes) => {
            if (!cErr && qTypes && qTypes.length > 0) {
              const questionType = qTypes[0].question_type;

              if (questionType === 'multiple_choice' || questionType === 'checkbox') {
                // Check if answer is in correct choices
                const ckSql = `SELECT choice_id FROM quiz_question_choices WHERE question_id = ? AND is_correct = 1`;
                db.query(ckSql, [question_id], (ckErr, correctChoices) => {
                    if (questionType === 'multiple_choice' && correctChoices && correctChoices.length > 0) {
                    isCorrect = correctChoices.some(c => c.choice_id === parseInt(student_answer));
                    pointsEarned = isCorrect ? Number(question.points || 0) : 0;
                  } else if (questionType === 'checkbox') {
                    // For checkbox, check if all selected match correct answers
                    const selectedIds = Array.isArray(student_answer) ? student_answer.map(id => parseInt(id)) : [parseInt(student_answer)];
                    const correctIds = correctChoices.map(c => c.choice_id);
                    isCorrect = selectedIds.length === correctIds.length && selectedIds.every(id => correctIds.includes(id));
                    pointsEarned = isCorrect ? Number(question.points || 0) : 0;
                  }

                  totalScore += pointsEarned;
                  saveAnswer();
                });
              } else if (questionType === 'short_answer') {
                // Check short answer
                const aSql = `SELECT correct_answer_text, case_sensitive, exact_match_required FROM quiz_answers WHERE question_id = ?`;
                db.query(aSql, [question_id], (aErr, answers) => {
                  if (!aErr && answers && answers.length > 0) {
                    const answer = answers[0];
                    let studentAns = student_answer;
                    let correctAns = answer.correct_answer_text;

                    if (!answer.case_sensitive) {
                      studentAns = studentAns.toLowerCase();
                      correctAns = correctAns.toLowerCase();
                    }

                    if (answer.exact_match_required) {
                      isCorrect = studentAns.trim() === correctAns.trim();
                    } else {
                      isCorrect = studentAns.includes(correctAns) || correctAns.includes(studentAns);
                    }

                    pointsEarned = isCorrect ? Number(question.points || 0) : 0;
                  }

                  totalScore += pointsEarned;
                  saveAnswer();
                });
              } else {
                saveAnswer();
              }
            } else {
              saveAnswer();
            }

            function saveAnswer() {
              const aSql = `INSERT INTO quiz_attempt_answers (attempt_id, question_id, student_answer, is_correct, points_earned)
                           VALUES (?, ?, ?, ?, ?)`;
              db.query(aSql, [attempt_id, question_id, JSON.stringify(student_answer), isCorrect ? 1 : 0, pointsEarned], (aErr) => {
                answersProcessed++;
                if (answersProcessed === answers.length) {
                  finializeSubmission();
                }
              });
            }
          });
        });

        function finializeSubmission() {
          const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
          const passed = percentage >= (attempt.passing_score || 60) ? 1 : 0;
          const timeTaken = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000);

          console.log('Quiz finalization - totalScore:', totalScore, 'totalPoints:', totalPoints, 'percentage:', percentage);
          console.log('Quiz finalization - Rounding: ', Math.round(percentage * 100) / 100);

          const updateSql = `UPDATE quiz_attempts SET score = ?, percentage = ?, passed = ?, submitted_at = NOW(), time_taken_seconds = ?, is_completed = 1 WHERE attempt_id = ?`;
          db.query(updateSql, [totalScore, percentage, passed, timeTaken, attempt_id], (err) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ message: "Failed to finalize submission", error: err.message });
            }

            // Update student_scores
            const scoreSql = `INSERT INTO student_scores (quiz_id, student_id, activity_id, best_score, best_percentage, best_attempt_id, attempt_count, passed)
                             VALUES (?, ?, ?, ?, ?, ?, 1, ?)
                             ON DUPLICATE KEY UPDATE 
                             best_score = GREATEST(best_score, ?),
                             best_percentage = GREATEST(best_percentage, ?),
                             best_attempt_id = IF(? > best_score, ?, best_attempt_id),
                             attempt_count = attempt_count + 1,
                             passed = ? OR passed,
                             last_attempt_date = NOW()`;

            db.query(scoreSql, [quiz_id, student_id, attempt.activity_id || null, totalScore, percentage, attempt_id, passed, totalScore, percentage, totalScore, attempt_id, passed], (scoreErr) => {
                // Also store a short submission record for the activity so instructors can see the student's quiz percentage
                try {
                  const activityId = attempt.activity_id || null;
                  if (activityId) {
                    const percentText = `${Math.round(percentage * 100) / 100}% | ${totalScore}/${totalPoints}`;
                    const findSql = `SELECT submission_id FROM activity_submissions WHERE activity_id = ? AND student_id = ? LIMIT 1`;
                    db.query(findSql, [activityId, student_id], (fErr, fRows) => {
                      if (fErr) {
                        console.error('Failed to lookup activity submission for quiz result:', fErr);
                      } else if (fRows && fRows.length > 0) {
                        const subId = fRows[0].submission_id;
                        const updSql = `UPDATE activity_submissions SET submission_text = ?, updated_at = NOW(), grade = ? WHERE submission_id = ?`;
                        db.query(updSql, [percentText, Math.round(percentage * 100) / 100, subId], (uErr) => {
                          if (uErr) console.error('Failed to update activity submission with quiz result:', uErr);
                        });
                      } else {
                        const insSql = `INSERT INTO activity_submissions (activity_id, student_id, submission_text, submitted_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`;
                        db.query(insSql, [activityId, student_id, percentText], (iErr) => {
                          if (iErr) console.error('Failed to insert activity submission for quiz result:', iErr);
                        });
                      }
                    });
                  }
                } catch (e) {
                  console.error('Error saving quiz result to activity_submissions:', e);
                }

                res.json({
                  message: "Quiz submitted successfully",
                  attempt_id,
                  score: totalScore,
                  percentage: Math.round(percentage * 100) / 100,
                  passed: passed ? true : false
                });
            });
          });
        }
      });
    });
  } catch (error) {
    console.error('Error in submitQuizAttempt:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ GET QUIZ ATTEMPT DETAILS
exports.getAttemptDetails = (req, res) => {
  try {
    const attempt_id = req.params.id;
    const student_id = req.userId;

    if (!attempt_id) {
      return res.status(400).json({ message: "Attempt ID is required" });
    }

    // Get attempt info
    const sql = `SELECT * FROM quiz_attempts WHERE attempt_id = ? AND student_id = ?`;

    db.query(sql, [attempt_id, student_id], (err, rows) => {
      if (err || !rows || rows.length === 0) {
        return res.status(403).json({ message: "Attempt not found" });
      }

      const attempt = rows[0];

      // Get attempt answers
      const ansSql = `SELECT qaa.*, q.question_text, q.question_type, q.points FROM quiz_attempt_answers qaa
                      JOIN quiz_questions q ON qaa.question_id = q.question_id
                      WHERE qaa.attempt_id = ?
                      ORDER BY q.\`order\``;

      db.query(ansSql, [attempt_id], (aErr, answers) => {
        if (aErr) {
          answers = [];
        }

        res.json({
          attempt: {
            ...attempt,
            answers: answers || []
          }
        });
      });
    });
  } catch (error) {
    console.error('Error in getAttemptDetails:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ GET student's latest attempt for a quiz/activity (if any)
exports.getActiveAttempt = (req, res) => {
  try {
    const quiz_id = req.params.id;
    const student_id = req.userId;
    const activity_id = req.query.activity_id || null;

    if (!quiz_id) return res.status(400).json({ message: 'Quiz ID is required' });

    const sql = `SELECT * FROM quiz_attempts WHERE quiz_id = ? AND student_id = ? ${activity_id ? 'AND activity_id = ?' : ''} ORDER BY started_at DESC LIMIT 1`;
    const params = activity_id ? [quiz_id, student_id, activity_id] : [quiz_id, student_id];

    db.query(sql, params, (err, rows) => {
      if (err) {
        console.error('Database error in getActiveAttempt:', err);
        return res.status(500).json({ message: 'Failed to fetch attempt', error: err.message });
      }

      if (!rows || rows.length === 0) return res.json({ attempt: null });

      // Return the latest attempt row (frontend can call /attempts/:id/details to get answers)
      res.json({ attempt: rows[0] });
    });
  } catch (error) {
    console.error('Error in getActiveAttempt:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ GET STUDENT'S BEST SCORE FOR QUIZ
exports.getStudentScore = (req, res) => {
  try {
    const quiz_id = req.params.id;
    const student_id = req.userId;

    if (!quiz_id) {
      return res.status(400).json({ message: "Quiz ID is required" });
    }

    const sql = `SELECT * FROM student_scores WHERE quiz_id = ? AND student_id = ?`;

    db.query(sql, [quiz_id, student_id], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: "Failed to fetch score", error: err.message });
      }

      if (!rows || rows.length === 0) {
        return res.json({ score: null });
      }

      res.json({ score: rows[0] });
    });
  } catch (error) {
    console.error('Error in getStudentScore:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ GET ALL ATTEMPTS FOR A QUIZ (Instructor)
exports.getQuizAttempts = (req, res) => {
  try {
    const quiz_id = req.params.id;
    const instructor_id = req.userId;

    if (!quiz_id) {
      return res.status(400).json({ message: "Quiz ID is required" });
    }

    // Verify instructor owns this quiz
    const verifySql = `SELECT instructor_id FROM quizzes WHERE quiz_id = ?`;
    db.query(verifySql, [quiz_id], (err, rows) => {
      if (err || !rows || rows.length === 0) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      if (rows[0].instructor_id !== instructor_id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const sql = `SELECT qa.*, u.username, u.email FROM quiz_attempts qa
                   JOIN users u ON qa.student_id = u.user_id
                   WHERE qa.quiz_id = ?
                   ORDER BY qa.started_at DESC`;

      db.query(sql, [quiz_id], (err, attempts) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: "Failed to fetch attempts", error: err.message });
        }

        res.json({ attempts: attempts || [] });
      });
    });
  } catch (error) {
    console.error('Error in getQuizAttempts:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ DELETE QUIZ
exports.deleteQuiz = (req, res) => {
  try {
    const quiz_id = req.params.id;
    const instructor_id = req.userId;

    if (!quiz_id) {
      return res.status(400).json({ message: "Quiz ID is required" });
    }

    // Verify instructor owns this quiz
    const verifySql = `SELECT instructor_id FROM quizzes WHERE quiz_id = ?`;
    db.query(verifySql, [quiz_id], (err, rows) => {
      if (err || !rows || rows.length === 0) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      if (rows[0].instructor_id !== instructor_id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const sql = `DELETE FROM quizzes WHERE quiz_id = ?`;

      db.query(sql, [quiz_id], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: "Failed to delete quiz", error: err.message });
        }

        res.json({ message: "Quiz deleted successfully" });
      });
    });
  } catch (error) {
    console.error('Error in deleteQuiz:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ GET attempt details for instructor grading (no student_id check)
exports.getAttemptDetailsForInstructor = (req, res) => {
  try {
    const attempt_id = req.params.attemptId;
    const instructor_id = req.userId;

    if (!attempt_id) {
      return res.status(400).json({ message: "Attempt ID is required" });
    }

    // Get attempt info - verify instructor owns the quiz
    const sql = `SELECT qa.* FROM quiz_attempts qa
                 JOIN users u ON qa.student_id = u.user_id
                 JOIN quizzes q ON qa.quiz_id = q.quiz_id
                 WHERE qa.attempt_id = ? AND q.instructor_id = ?`;

    db.query(sql, [attempt_id, instructor_id], (err, rows) => {
      if (err || !rows || rows.length === 0) {
        console.error('Error fetching attempt:', err);
        return res.status(403).json({ message: "Attempt not found or unauthorized" });
      }

      const attempt = rows[0];
      console.log('Attempt data for instructor - Full row:', JSON.stringify(attempt, null, 2));
      console.log('Score field:', attempt.score);
      console.log('Percentage field:', attempt.percentage);

      // Get attempt answers
      const ansSql = `SELECT qaa.*, q.question_text, q.question_type, q.points FROM quiz_attempt_answers qaa
                      JOIN quiz_questions q ON qaa.question_id = q.question_id
                      WHERE qaa.attempt_id = ?
                      ORDER BY q.\`order\``;

      db.query(ansSql, [attempt_id], (aErr, answers) => {
        if (aErr) {
          console.error('Error fetching answers:', aErr);
          answers = [];
        }

        console.log('Returning attempt with score:', attempt.score, 'percentage:', attempt.percentage);
        res.json({
          attempt: {
            ...attempt,
            answers: answers || []
          }
        });
      });
    });
  } catch (error) {
    console.error('Error in getAttemptDetailsForInstructor:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
