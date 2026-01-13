// GET student's own submission for an activity (with grade/feedback)
exports.getMySubmission = (req, res) => {
  try {
    const activity_id = req.params.id;
    const student_id = req.userId;
    
    if (!activity_id || !student_id) {
      return res.status(400).json({ message: "Missing activity_id or student_id" });
    }
    
    const sql = `SELECT submission_id, activity_id, student_id, submission_text, submitted_at, updated_at, grade, feedback FROM activity_submissions WHERE activity_id = ? AND student_id = ? LIMIT 1`;
    
    db.query(sql, [activity_id, student_id], (err, rows) => {
      if (err) {
        console.error('Database error in getMySubmission:', err.code, err.sqlMessage || err.message);
        console.error('SQL:', sql);
        console.error('Params:', [activity_id, student_id]);
        // Gracefully return null for any DB error on submission fetch
        return res.json({ submission: null });
      }
      
      if (!rows || rows.length === 0) {
        return res.json({ submission: null });
      }

      const submission = rows[0];
      // fetch any attachments for this submission
      const attachSql = `SELECT attachment_id, submission_id, original_name, stored_name, file_path, mime_type, file_size, uploaded_at FROM activity_submission_attachments WHERE submission_id = ? ORDER BY uploaded_at DESC`;
      db.query(attachSql, [submission.submission_id], (aErr, attachments) => {
        if (aErr) {
          console.error('Failed to fetch submission attachments:', aErr);
          submission.attachments = [];
        } else if (attachments && attachments.length > 0) {
          submission.attachments = attachments.map((att) => ({
            ...att,
            url: att.file_path,
          }));
        } else {
          submission.attachments = [];
        }

        return res.json({ submission });
      });
    });
  } catch (error) {
    console.error('Error in getMySubmission:', error);
    res.json({ submission: null });
  }
};
const db = require('../config/db');
const path = require('path');
const fs = require('fs');
const realtime = require('../realtime');

// Helper: Create notifications for all students in a subject
const createNotificationsForSubject = (subjectId, message, type) => {
  return new Promise((resolve, reject) => {
    // Get all students enrolled in this subject
    const getSql = `SELECT ss.student_id FROM student_subjects ss WHERE ss.subject_id = ?`;
    db.query(getSql, [subjectId], (err, students) => {
      if (err) {
        console.error('Failed to get students for notifications:', err);
        return reject(err);
      }

      if (!students || students.length === 0) {
        return resolve(); // No students to notify
      }

      // Create notification for each student
      const insertSql = `INSERT INTO notifications (user_id, type, message, is_read, created_at) VALUES (?, ?, ?, 0, NOW())`;
      const promises = students.map((student) =>
        new Promise((res, rej) => {
          db.query(insertSql, [student.student_id, type, message], (insertErr) => {
            if (insertErr) {
              console.error('Failed to create notification for student:', insertErr);
              rej(insertErr);
            } else {
              res();
            }
          });
        })
      );

      Promise.all(promises)
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  });
};



// ✅ CREATE Activity
exports.createActivity = (req, res) => {
  try {
    const { subject_id, activity_name, title, instructions, open_date_time, due_date_time, time_limit, language, code, blocks, hiddenBlockIds, difficulty, hints, type } = req.body;
    const instructor_id = req.userId;

    console.log("=== CREATE ACTIVITY REQUEST ===");
    console.log("Body received:", req.body);
    console.log("Code Block fields:", { language, code, blocks, hiddenBlockIds, difficulty, hints });
    console.log("===============================");

    if (!subject_id || !activity_name || !title) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Store activity types and scheduling info in config_json
    // Also include Code Block Activity data if present
    const config_json = {
      activity_name,
      instructions: instructions || null,
      open_date_time,
      due_date_time,
      time_limit,
      // Code Block Activity fields (if provided)
      ...(language && { language }),
      ...(code && { code }),
      ...(blocks && { blocks: typeof blocks === 'string' ? JSON.parse(blocks) : blocks }),
      ...(hiddenBlockIds && { hiddenBlockIds: typeof hiddenBlockIds === 'string' ? JSON.parse(hiddenBlockIds) : hiddenBlockIds }),
      ...(difficulty && { difficulty }),
      ...(hints && { hints: typeof hints === 'string' ? JSON.parse(hints) : hints }),
      ...(type && { type })
    };

    console.log("Config JSON to store:", config_json);

    // Map UI activity_name to DB `type` enum
    const typeMap = {
      'Sim Pc': 'dragdrop',
      'CodeLab': 'coding',
      'Quiz': 'quiz',
      'Experiment': 'other'
    };
    const activityType = typeMap[activity_name] || 'other';

    const sql = `INSERT INTO activities (subject_id, instructor_id, title, description, type, config_json, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`;

    db.query(sql, [subject_id, instructor_id, title, activity_name, activityType, JSON.stringify(config_json)], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: "Failed to create activity", error: err.message });
      }
      const activityId = result.insertId;

      // If files were uploaded via multer, save their metadata in activities_classwork
      const files = req.files || [];
      if (files.length > 0) {
         const attachSql = `INSERT INTO activities_classwork (activity_id, asset_type, original_name, stored_name, file_path, open_date_time, due_date_time, mime_type, file_size, uploaded_by, uploaded_at)
           VALUES ?`;
        // Use forward slashes for URLs (not path.join which adds backslashes on Windows)
        const values = files.map((f) => [activityId, 'FILE', f.originalname, f.filename, `/uploads/activity_files/${f.filename}`, open_date_time || null, due_date_time || null, f.mimetype, f.size, instructor_id || null, new Date()]);

        db.query(attachSql, [values], (aErr, aRes) => {
          if (aErr) {
            console.error('Failed to save classwork attachment metadata:', aErr);
            // return activity created, but warn about attachments
            return res.status(201).json({
              message: 'Activity created, but failed to save attachments',
              activity_id: activityId,
              activity: {
                activity_id: activityId,
                subject_id,
                instructor_id,
                title,
                description: activity_name,
                config_json,
                attachments: files.map(f => ({ original_name: f.originalname, stored_name: f.filename }))
              }
            });
          }

          // Return created activity including attachments metadata
          const attachmentsMeta = files.map((f) => ({
            original_name: f.originalname,
            stored_name: f.filename,
            file_path: `/uploads/activity_files/${f.filename}`,
            url: `/uploads/activity_files/${f.filename}`,
            mime_type: f.mimetype,
            file_size: f.size,
          }));

              const activityPayload = {
                message: 'Activity created successfully',
                activity_id: activityId,
                activity: {
                  activity_id: activityId,
                  subject_id,
                  instructor_id,
                  title,
                  description: activity_name,
                  type: activityType,
                  config_json,
                  attachments: attachmentsMeta,
                }
              };

              // Create notifications for all students in this subject
              createNotificationsForSubject(subject_id, `New activity: ${title}`, 'activity').catch((err) => {
                console.error('Failed to create notifications:', err);
              });

              try {
                realtime.broadcastToSubject(subject_id, { action: 'created', type: 'activity', activity: activityPayload.activity });
              } catch (e) {
                console.error('Failed to broadcast activity creation:', e && e.message);
              }

              return res.status(201).json(activityPayload);
        });
      } else {
        // No attachments
        const actPayload = {
          message: "Activity created successfully",
          activity_id: activityId,
          activity: {
            activity_id: activityId,
            subject_id,
            instructor_id,
            title,
            description: activity_name,
            type: activityType,
            config_json
          }
        };

        // Create notifications for all students in this subject
        createNotificationsForSubject(subject_id, `New activity: ${title}`, 'activity').catch((err) => {
          console.error('Failed to create notifications:', err);
        });

        try {
          realtime.broadcastToSubject(subject_id, { action: 'created', type: 'activity', activity: actPayload.activity });
        } catch (e) {
          console.error('Failed to broadcast activity creation:', e && e.message);
        }

        res.status(201).json(actPayload);
      }
    });
  } catch (error) {
    console.error('Error in createActivity:', error);
    res.status(500).json({ message: "Failed to create activity", error: error.message });
  }
};

// ✅ READ All Activities
exports.getActivities = (req, res) => {
  const sql = `SELECT * FROM activities`;
  db.query(sql, (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: "Failed to fetch activities", error: err.message });
    }
    // Parse config_json for each row so frontend receives an object
    const parsed = (rows || []).map((r) => {
      let cfg = r.config_json;
      if (typeof cfg === 'string') {
        try {
          cfg = JSON.parse(cfg);
        } catch (e) {
          cfg = {};
        }
      }
      return { ...r, config_json: cfg };
    });
    res.json(parsed);
  });
};

// ✅ READ Activity by ID
exports.getActivityById = (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM activities WHERE activity_id = ?`;
  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: "Failed to fetch activity", error: err.message });
    }
    if (rows.length === 0) {
      return res.status(404).json({ message: "Activity not found" });
    }
    const row = rows[0];
    let cfg = row.config_json;
    if (typeof cfg === 'string') {
      try {
        cfg = JSON.parse(cfg);
      } catch (e) {
        cfg = {};
      }
    }
    row.config_json = cfg;
    res.json(row);
  });
};

// ✅ READ Attachments for an activity (from activities_classwork)
exports.getActivityAttachments = (req, res) => {
  const { id } = req.params;
  const sql = `SELECT id, activity_id, asset_type, original_name, stored_name, file_path, open_date_time, due_date_time, mime_type, file_size, uploaded_by, uploaded_at FROM activities_classwork WHERE activity_id = ? ORDER BY uploaded_at DESC`;
  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: "Failed to fetch attachments", error: err.message });
    }
    res.json(rows || []);
  });
};

// ✅ GET Linked Quiz for an Activity
exports.getLinkedQuiz = (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ message: "Missing activity_id" });
  }

  const sql = `SELECT quiz_id FROM activity_quiz_links WHERE activity_id = ? LIMIT 1`;
  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error('Database error in getLinkedQuiz:', err);
      return res.status(500).json({ message: "Failed to fetch linked quiz", error: err.message });
    }
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "No quiz linked to this activity" });
    }
    
    res.json({ quiz_id: rows[0].quiz_id });
  });
};

// ✅ CREATE Link Between Activity and Quiz
exports.linkQuizToActivity = (req, res) => {
  // Allow activity_id to be provided either in the request body or as the URL param (:id)
  const activity_id = req.body.activity_id || req.params.id;
  const { quiz_id } = req.body;

  if (!activity_id || !quiz_id) {
    return res.status(400).json({ message: "Missing activity_id or quiz_id" });
  }

  // First check if link already exists
  const checkSql = `SELECT link_id FROM activity_quiz_links WHERE activity_id = ?`;
  db.query(checkSql, [activity_id], (checkErr, checkRows) => {
    if (checkErr) {
      console.error('Database error checking existing link:', checkErr);
      return res.status(500).json({ message: "Failed to check existing link", error: checkErr.message });
    }

    if (checkRows && checkRows.length > 0) {
      // Link already exists, update it
      const updateSql = `UPDATE activity_quiz_links SET quiz_id = ? WHERE activity_id = ?`;
      db.query(updateSql, [quiz_id, activity_id], (updateErr, updateRes) => {
        if (updateErr) {
          console.error('Database error updating link:', updateErr);
          return res.status(500).json({ message: "Failed to update quiz link", error: updateErr.message });
        }
        res.json({ message: "Quiz link updated successfully", activity_id, quiz_id });
      });
    } else {
      // Create new link
      const sql = `INSERT INTO activity_quiz_links (activity_id, quiz_id) VALUES (?, ?)`;
      db.query(sql, [activity_id, quiz_id], (err, result) => {
        if (err) {
          console.error('Database error in linkQuizToActivity:', err);
          return res.status(500).json({ message: "Failed to link quiz to activity", error: err.message });
        }
        
        res.status(201).json({ 
          message: "Quiz linked to activity successfully", 
          link_id: result.insertId,
          activity_id, 
          quiz_id 
        });
      });
    }
  });
};

// ✅ UPDATE Activity
exports.updateActivity = (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  // config_json may be sent as a string or object
  let config_json = req.body.config_json || req.body.config || null;
  try {
    if (typeof config_json === 'string' && config_json.trim() !== '') {
      config_json = JSON.parse(config_json);
    }
  } catch (e) {
    // leave as string if parse fails
  }

  // Update activity metadata first
  const sql = `UPDATE activities SET title=?, description=?, config_json=?, updated_at=NOW() WHERE activity_id=?`;
  db.query(sql, [title, description, JSON.stringify(config_json), id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: "Failed to update activity", error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Activity not found" });
    }

    // Now handle attachments: remove those not kept, insert newly uploaded files
    const open_date_time = (config_json && config_json.open_date_time) || req.body.open_date_time || null;
    const keepIdsRaw = req.body.keepAttachmentIds || req.body.keep_attachments || '';
    const keepIds = keepIdsRaw ? keepIdsRaw.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const files = req.files || [];

    const uploadDir = path.join(__dirname, '..', 'uploads', 'activity_files');

    const processAttachments = async () => {
      try {
        // Delete attachments that are NOT in keepIds
        if (keepIds.length > 0) {
          const placeholders = keepIds.map(() => '?').join(',');
          const selSql = `SELECT id, stored_name FROM activities_classwork WHERE activity_id = ? AND id NOT IN (${placeholders})`;
          db.query(selSql, [id, ...keepIds], (sErr, rows) => {
            if (!sErr && rows && rows.length > 0) {
              rows.forEach((r) => {
                try {
                  const filePath = path.join(uploadDir, r.stored_name);
                  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                } catch (unlinkErr) {
                  console.error('Failed to unlink file', unlinkErr);
                }
              });
            }
            const delSql = `DELETE FROM activities_classwork WHERE activity_id = ? AND id NOT IN (${placeholders})`;
            db.query(delSql, [id, ...keepIds], (dErr) => {
              if (dErr) console.error('Failed to delete old attachments', dErr);
              // Insert any newly uploaded files
              if (files.length > 0) {
                const values = files.map((f) => [id, 'FILE', f.originalname, f.filename, `/uploads/activity_files/${f.filename}`, open_date_time || null, /*due_date_time*/ null, f.mimetype, f.size, req.userId || null, new Date()]);
                const attachSql = `INSERT INTO activities_classwork (activity_id, asset_type, original_name, stored_name, file_path, open_date_time, due_date_time, mime_type, file_size, uploaded_by, uploaded_at) VALUES ?`;
                db.query(attachSql, [values], (aErr) => {
                  if (aErr) console.error('Failed to save new attachments', aErr);
                  // Return updated attachments list
                  const listSql = `SELECT id, activity_id, asset_type, original_name, stored_name, file_path, open_date_time, due_date_time, mime_type, file_size, uploaded_by, uploaded_at FROM activities_classwork WHERE activity_id = ? ORDER BY uploaded_at DESC`;
                  db.query(listSql, [id], (lErr, atts) => {
                    if (lErr) {
                      console.error('Failed to fetch attachments', lErr);
                      return res.json({ message: 'Activity updated, but failed to fetch attachments' });
                    }
                    return res.json({ message: 'Activity updated successfully', attachments: atts || [] });
                  });
                });
              } else {
                // No new files, just return updated list
                const listSql = `SELECT id, activity_id, asset_type, original_name, stored_name, file_path, open_date_time, due_date_time, mime_type, file_size, uploaded_by, uploaded_at FROM activities_classwork WHERE activity_id = ? ORDER BY uploaded_at DESC`;
                db.query(listSql, [id], (lErr, atts) => {
                  if (lErr) {
                    console.error('Failed to fetch attachments', lErr);
                    return res.json({ message: 'Activity updated, but failed to fetch attachments' });
                  }
                  return res.json({ message: 'Activity updated successfully', attachments: atts || [] });
                });
              }
            });
          });
        } else {
          // No keepIds: remove all existing attachments for this activity
          const selSql = `SELECT id, stored_name FROM activities_classwork WHERE activity_id = ?`;
          db.query(selSql, [id], (sErr, rows) => {
            if (!sErr && rows && rows.length > 0) {
              rows.forEach((r) => {
                try {
                  const filePath = path.join(uploadDir, r.stored_name);
                  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                } catch (unlinkErr) {
                  console.error('Failed to unlink file', unlinkErr);
                }
              });
            }
            const delSql = `DELETE FROM activities_classwork WHERE activity_id = ?`;
            db.query(delSql, [id], (dErr) => {
              if (dErr) console.error('Failed to delete old attachments', dErr);
              // Insert new files if any
              if (files.length > 0) {
                const values = files.map((f) => [id, 'FILE', f.originalname, f.filename, `/uploads/activity_files/${f.filename}`, open_date_time || null, /*due_date_time*/ null, f.mimetype, f.size, req.userId || null, new Date()]);
                const attachSql = `INSERT INTO activities_classwork (activity_id, asset_type, original_name, stored_name, file_path, open_date_time, due_date_time, mime_type, file_size, uploaded_by, uploaded_at) VALUES ?`;
                db.query(attachSql, [values], (aErr) => {
                  if (aErr) console.error('Failed to save new attachments', aErr);
                  const listSql = `SELECT id, activity_id, asset_type, original_name, stored_name, file_path, open_date_time, due_date_time, mime_type, file_size, uploaded_by, uploaded_at FROM activities_classwork WHERE activity_id = ? ORDER BY uploaded_at DESC`;
                  db.query(listSql, [id], (lErr, atts) => {
                    if (lErr) {
                      console.error('Failed to fetch attachments', lErr);
                      return res.json({ message: 'Activity updated, but failed to fetch attachments' });
                    }
                    return res.json({ message: 'Activity updated successfully', attachments: atts || [] });
                  });
                });
              } else {
                const listSql = `SELECT id, activity_id, asset_type, original_name, stored_name, file_path, open_date_time, due_date_time, mime_type, file_size, uploaded_by, uploaded_at FROM activities_classwork WHERE activity_id = ? ORDER BY uploaded_at DESC`;
                db.query(listSql, [id], (lErr, atts) => {
                  if (lErr) {
                    console.error('Failed to fetch attachments', lErr);
                    return res.json({ message: 'Activity updated, but failed to fetch attachments' });
                  }
                  return res.json({ message: 'Activity updated successfully', attachments: atts || [] });
                });
              }
            });
          });
        }
      } catch (procErr) {
        console.error('Error processing attachments during activity update', procErr);
        return res.status(500).json({ message: 'Activity updated but failed processing attachments', error: procErr.message });
      }
    };

    processAttachments();
  });
};

// ✅ DELETE Activity
exports.deleteActivity = (req, res) => {
  const { id } = req.params;

  // First, get the subject_id so we can broadcast to subscribers after deletion
  const subjectFetchSql = `SELECT subject_id FROM activities WHERE activity_id = ? LIMIT 1`;
  db.query(subjectFetchSql, [id], (sErr, sRows) => {
    if (sErr) {
      console.error('Failed to fetch subject for activity delete:', sErr);
      // continue with deletion but we won't broadcast
    }
    const subjectIdForBroadcast = (sRows && sRows[0]) ? sRows[0].subject_id : null;

    // Step 1: Find all quizzes linked to this activity
    const findLinksSQL = `SELECT quiz_id FROM activity_quiz_links WHERE activity_id = ?`;
    db.query(findLinksSQL, [id], (findErr, links) => {
      if (findErr) {
        console.error('Database error finding links:', findErr);
        return res.status(500).json({ message: "Failed to delete activity", error: findErr.message });
      }

      const quizIds = links.map(l => l.quiz_id);

      // Step 2: Delete all quizzes and their content (questions, choices, answers, attempts, etc.)
      if (quizIds.length > 0) {
        const placeholders = quizIds.map(() => '?').join(',');
        const deleteQuizzesSQL = `DELETE FROM quizzes WHERE quiz_id IN (${placeholders})`;

        db.query(deleteQuizzesSQL, quizIds, (delQuizErr) => {
          if (delQuizErr) {
            console.error('Database error deleting quizzes:', delQuizErr);
            return res.status(500).json({ message: "Failed to delete quizzes", error: delQuizErr.message });
          }

          // Step 3: Delete the activity itself (this cascades to delete activity_quiz_links, activity_submissions, etc.)
          const deleteActivitySQL = `DELETE FROM activities WHERE activity_id = ?`;
          db.query(deleteActivitySQL, [id], (delActErr, result) => {
            if (delActErr) {
              console.error('Database error deleting activity:', delActErr);
              return res.status(500).json({ message: "Failed to delete activity", error: delActErr.message });
            }

            if (result.affectedRows === 0) {
              return res.status(404).json({ message: "Activity not found" });
            }

            try {
              if (subjectIdForBroadcast) realtime.broadcastToSubject(subjectIdForBroadcast, { action: 'deleted', type: 'activity', activityId: id });
            } catch (e) {
              console.error('Failed to broadcast activity deletion:', e && e.message);
            }

            res.json({ message: "Activity and all linked quiz content deleted successfully" });
          });
        });
      } else {
        // No linked quizzes, just delete the activity
        const deleteActivitySQL = `DELETE FROM activities WHERE activity_id = ?`;
        db.query(deleteActivitySQL, [id], (delActErr, result) => {
          if (delActErr) {
            console.error('Database error deleting activity:', delActErr);
            return res.status(500).json({ message: "Failed to delete activity", error: delActErr.message });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Activity not found" });
          }

          try {
            if (subjectIdForBroadcast) realtime.broadcastToSubject(subjectIdForBroadcast, { action: 'deleted', type: 'activity', activityId: id });
          } catch (e) {
            console.error('Failed to broadcast activity deletion:', e && e.message);
          }

          res.json({ message: "Activity deleted successfully" });
        });
      }
    });
  });
};

// ✅ SUBMIT Activity - Student submits work
exports.submitActivity = (req, res) => {
  try {
    const { id } = req.params;
    const student_id = req.userId;
    const { submission_text, checkpoint_data } = req.body;

    if (!id || !student_id) {
      return res.status(400).json({ message: "Missing activity_id or student_id" });
    }

    // First check whether the student already has a submission for this activity
    const checkSql = `SELECT submission_id FROM activity_submissions WHERE activity_id = ? AND student_id = ? LIMIT 1`;
    // Determine whether submission is late by checking activity's config_json.due_date_time
    const activitySql = `SELECT config_json FROM activities WHERE activity_id = ? LIMIT 1`;
    db.query(activitySql, [id], (aErr, aRows) => {
      if (aErr) {
        console.error('Failed to fetch activity for lateness check:', aErr);
        // fallback to insert without is_late
        db.query(submissionSql, [id, student_id, submission_text || ''], (err, result) => {
          if (err) {
            console.error('Failed to insert submission:', err);
            return res.status(500).json({ message: "Failed to submit activity", error: err.message });
          }

          const submissionId = result.insertId;
          const files = req.files || [];
          if (files.length > 0) {
            const attachSql = `INSERT INTO activity_submission_attachments (submission_id, original_name, stored_name, file_path, mime_type, file_size, uploaded_at)
                               VALUES ?`;
            const values = files.map((f) => [submissionId, f.originalname, f.filename, `/uploads/activity_files/${f.filename}`, f.mimetype, f.size, new Date()]);

            db.query(attachSql, [values], (aErr2, aRes) => {
              if (aErr2) {
                console.error('Failed to save submission attachment metadata:', aErr2);
                return res.status(201).json({
                  message: 'Submission created, but failed to save attachments',
                  submission_id: submissionId,
                  activity_id: id,
                  student_id
                });
              }

              return res.status(201).json({
                message: 'Submission submitted successfully',
                submission_id: submissionId,
                activity_id: id,
                student_id
              });
            });
          } else {
            res.status(201).json({
              message: 'Submission submitted successfully',
              submission_id: submissionId,
              activity_id: id,
              student_id
            });
          }
        });
        return;
      }

      // Check open_date_time first: if open_date_time exists and now is earlier, prevent submissions
      try {
        if (cfg && cfg.open_date_time) {
          const openAt = new Date(cfg.open_date_time);
          const now = new Date();
          if (now < openAt) {
            // Activity not open yet
            return res.status(403).json({ message: `Activity not open yet. It opens at ${openAt.toISOString()}` });
          }
        }
      } catch (openChkErr) {
        // ignore parse errors and continue to due-date check
      }

      let isLate = 0;
      try {
        const cfg = JSON.parse(aRows[0].config_json || '{}');
        if (cfg && cfg.due_date_time) {
          const due = new Date(cfg.due_date_time);
          const now = new Date();
          if (now > due) isLate = 1;
        }
      } catch (parseErr) {
        // ignore parse errors
      }

      // Now check for existing submission to support resubmission (update)
      db.query(checkSql, [id, student_id], (cErr, cRows) => {
        if (cErr) {
          console.error('Failed to check existing submission:', cErr);
          return res.status(500).json({ message: 'Failed to submit activity', error: cErr.message });
        }

        const files = req.files || [];

        if (cRows && cRows.length > 0) {
          // Update existing submission
          const existingSubmissionId = cRows[0].submission_id;
          const updateSql = `UPDATE activity_submissions SET submission_text = ?, checkpoint_data = ?, updated_at = NOW() WHERE submission_id = ?`;
          db.query(updateSql, [submission_text || '', checkpoint_data || null, existingSubmissionId], (uErr, uRes) => {
            if (uErr) {
              console.error('Failed to update submission:', uErr);
              return res.status(500).json({ message: 'Failed to submit activity', error: uErr.message });
            }

            // add any newly uploaded attachments (append to existing ones)
            if (files.length > 0) {
              const attachSql = `INSERT INTO activity_submission_attachments (submission_id, original_name, stored_name, file_path, mime_type, file_size, uploaded_at) VALUES ?`;
              const values = files.map((f) => [existingSubmissionId, f.originalname, f.filename, `/uploads/activity_files/${f.filename}`, f.mimetype, f.size, new Date()]);
              db.query(attachSql, [values], (aErr) => {
                if (aErr) {
                  console.error('Failed to save submission attachment metadata (on update):', aErr);
                  return res.status(200).json({ message: 'Submission updated, but failed to save attachments', submission_id: existingSubmissionId, activity_id: id, student_id });
                }
                return res.status(200).json({ message: 'Submission updated successfully', submission_id: existingSubmissionId, activity_id: id, student_id });
              });
            } else {
              return res.status(200).json({ message: 'Submission updated successfully', submission_id: existingSubmissionId, activity_id: id, student_id });
            }
          });
        } else {
          // Insert new submission record
          const submissionSqlWithLate = `INSERT INTO activity_submissions (activity_id, student_id, submission_text, checkpoint_data, submitted_at)
                           VALUES (?, ?, ?, ?, NOW())`;

          db.query(submissionSqlWithLate, [id, student_id, submission_text || '', checkpoint_data || null], (err, result) => {
            if (err) {
              console.error('Failed to insert submission:', err);
              return res.status(500).json({ message: 'Failed to submit activity', error: err.message });
            }

            const submissionId = result.insertId;

            // If files were uploaded via multer, save their metadata in activity_submission_attachments
            if (files.length > 0) {
              const attachSql = `INSERT INTO activity_submission_attachments (submission_id, original_name, stored_name, file_path, mime_type, file_size, uploaded_at)
                             VALUES ?`;
              const values = files.map((f) => [submissionId, f.originalname, f.filename, `/uploads/activity_files/${f.filename}`, f.mimetype, f.size, new Date()]);

              db.query(attachSql, [values], (aErr, aRes) => {
                if (aErr) {
                  console.error('Failed to save submission attachment metadata:', aErr);
                  // return submission created, but warn about attachments
                  return res.status(201).json({ message: 'Submission created, but failed to save attachments', submission_id: submissionId, activity_id: id, student_id });
                }

                return res.status(201).json({ message: 'Submission submitted successfully', submission_id: submissionId, activity_id: id, student_id });
              });
            } else {
              // No attachments
              return res.status(201).json({ message: 'Submission submitted successfully', submission_id: submissionId, activity_id: id, student_id });
            }
          });
        }
      });
    });
  } catch (error) {
    console.error('Error in submitActivity:', error);
    res.status(500).json({ message: "Failed to submit activity", error: error.message });
  }
};

// ✅ GET Submissions for an activity (Instructor view)
exports.getActivitySubmissions = (req, res) => {
  try {
    const { id } = req.params;
    const instructor_id = req.userId;

    if (!id) {
      return res.status(400).json({ message: "Missing activity_id" });
    }

    // First, verify this activity belongs to the instructor
    const verifySql = `SELECT instructor_id FROM activities WHERE activity_id = ?`;
    db.query(verifySql, [id], (vErr, vRes) => {
      if (vErr) {
        console.error('Database error:', vErr);
        return res.status(500).json({ message: "Failed to verify activity", error: vErr.message });
      }

      if (vRes.length === 0) {
        return res.status(404).json({ message: "Activity not found" });
      }

      if (vRes[0].instructor_id !== instructor_id) {
        return res.status(403).json({ message: "Unauthorized: You are not the instructor for this activity" });
      }

      // Fetch all submissions for this activity with student info
      const submissionSql = `
        SELECT 
          asu.submission_id,
          asu.activity_id,
          asu.student_id,
          asu.submission_text,
          asu.submitted_at,
          asu.updated_at,
          asu.grade,
          asu.feedback,
          u.username,
          u.email,
          COUNT(asaa.attachment_id) as attachment_count
        FROM activity_submissions asu
        LEFT JOIN users u ON asu.student_id = u.user_id
        LEFT JOIN activity_submission_attachments asaa ON asu.submission_id = asaa.submission_id
        WHERE asu.activity_id = ?
        GROUP BY asu.submission_id, asu.activity_id, asu.student_id, asu.submission_text, asu.submitted_at, asu.updated_at, asu.grade, asu.feedback, u.username, u.email
        ORDER BY asu.submitted_at DESC
      `;

      db.query(submissionSql, [id], (err, submissions) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: "Failed to fetch submissions", error: err.message });
        }

        // For each submission, fetch the attachments
        if (submissions.length === 0) {
          return res.json({ submissions: [] });
        }

        let processedCount = 0;
        const submissionsWithAttachments = submissions.map((sub) => ({
          submission_id: sub.submission_id,
          activity_id: sub.activity_id,
          student_id: sub.student_id,
          submission_text: sub.submission_text,
          submitted_at: sub.submitted_at,
          updated_at: sub.updated_at,
          grade: sub.grade,
          feedback: sub.feedback,
          username: sub.username,
          email: sub.email,
          attachments: []
        }));

        submissions.forEach((submission, idx) => {
          const attachmentSql = `
            SELECT attachment_id, submission_id, original_name, stored_name, file_path, mime_type, file_size, uploaded_at
            FROM activity_submission_attachments
            WHERE submission_id = ?
            ORDER BY uploaded_at DESC
          `;

          db.query(attachmentSql, [submission.submission_id], (aErr, attachments) => {
            if (!aErr && attachments.length > 0) {
              submissionsWithAttachments[idx].attachments = attachments.map((att) => ({
                ...att,
                url: att.file_path  // Return just the relative path, frontend will construct full URL
              }));
            }

            processedCount++;
            if (processedCount === submissions.length) {
              res.json({ submissions: submissionsWithAttachments });
            }
          });
        });
      });
    });
  } catch (error) {
    console.error('Error in getActivitySubmissions:', error);
    res.status(500).json({ message: "Failed to fetch submissions", error: error.message });
  }
};

// ✅ SAVE Grade for a submission (Instructor view)
exports.saveGrade = (req, res) => {
  try {
    const { submission_id } = req.params;
    const instructor_id = req.userId;
    const { grade, feedback } = req.body;

    if (!submission_id) {
      return res.status(400).json({ message: "Missing submission_id" });
    }

    if (grade === null && !feedback) {
      return res.status(400).json({ message: "Please provide either a grade or feedback" });
    }

    // First, verify this submission belongs to an activity taught by this instructor
    const verifySql = `
      SELECT a.instructor_id 
      FROM activity_submissions asu
      JOIN activities a ON asu.activity_id = a.activity_id
      WHERE asu.submission_id = ?
    `;

    db.query(verifySql, [submission_id], (vErr, vRes) => {
      if (vErr) {
        console.error('Database error:', vErr);
        return res.status(500).json({ message: "Failed to verify submission", error: vErr.message });
      }

      if (vRes.length === 0) {
        return res.status(404).json({ message: "Submission not found" });
      }

      if (vRes[0].instructor_id !== instructor_id) {
        return res.status(403).json({ message: "Unauthorized: You are not the instructor for this submission" });
      }

      // Update the submission with grade and feedback
      const updateSql = `
        UPDATE activity_submissions 
        SET grade = ?, feedback = ?, updated_at = NOW()
        WHERE submission_id = ?
      `;

      db.query(updateSql, [grade || null, feedback || null, submission_id], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: "Failed to save grade", error: err.message });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Submission not found" });
        }

        res.json({ message: "Grade saved successfully", submission_id, grade, feedback });

        // Create a notification for the student to let them know their submission was graded.
        try {
          const notifSql = `
            SELECT asu.student_id, asu.activity_id, a.subject_id, a.title, a.instructor_id, u.username as instructor_username,
              (SELECT file_path FROM user_avatars ua WHERE ua.user_id = a.instructor_id AND ua.is_current = 1 ORDER BY ua.uploaded_at DESC LIMIT 1) AS instructor_avatar_url
            FROM activity_submissions asu
            JOIN activities a ON asu.activity_id = a.activity_id
            JOIN users u ON a.instructor_id = u.user_id
            WHERE asu.submission_id = ? LIMIT 1
          `;
          db.query(notifSql, [submission_id], (nErr, nRows) => {
            if (nErr || !nRows || nRows.length === 0) return;
            const row = nRows[0];
            const student_id = row.student_id;
            const activity_id = row.activity_id;
            const subject_id = row.subject_id;
            const activityTitle = row.title || 'Activity';
            const instructor_id = row.instructor_id;
            const instructor_username = row.instructor_username || 'Instructor';
            const instructor_avatar_url = row.instructor_avatar_url || null;
            const message = `Your submission for "${activityTitle}" was graded: ${grade !== null && grade !== undefined ? grade : 'graded'}`;

            const insertSql = `INSERT INTO notifications (user_id, message, type, is_read, created_at) VALUES (?, ?, 'feedback', 0, NOW())`;
            db.query(insertSql, [student_id, message], (iErr, iRes) => {
              if (iErr) {
                console.error('Failed to create grade notification:', iErr);
              } else {
                // Broadcast real-time notification to the student if connected
                try {
                  const payload = {
                    action: 'created',
                    type: 'feedback',
                    feedback: {
                      notification_id: iRes && iRes.insertId ? iRes.insertId : null,
                      submission_id: submission_id,
                      activity_id: activity_id,
                      subject_id: subject_id,
                      student_id: student_id,
                      grade: grade !== null && grade !== undefined ? grade : null,
                      feedback: feedback || null,
                      instructor_id: instructor_id,
                      instructor_username: instructor_username,
                      instructor_avatar_url: instructor_avatar_url,
                      message: message,
                      created_at: new Date().toISOString(),
                    }
                  };
                  realtime.broadcastToUser(String(student_id), payload);
                } catch (bErr) {
                  console.error('Failed to broadcast grade notification:', bErr);
                }
              }
            });
          });
        } catch (e) {
          console.error('Notification creation skipped due to error', e && e.message);
        }
      });
    });
  } catch (error) {
    console.error('Error in saveGrade:', error);
    res.status(500).json({ message: "Failed to save grade", error: error.message });
  }
};

// ✅ SAVE Checkpoint for an activity (DragDrop game progress)
// ✅ SAVE Checkpoint for an activity + Performance metrics (DragDrop game progress + Grading)
exports.saveCheckpoint = (req, res) => {
  try {
    const { id } = req.params;
    const student_id = req.userId;
    const { component, progress, isCompleted, checkpointData, performanceData, performanceScore, performanceGrade, performanceReport } = req.body;

    if (!id || !student_id) {
      return res.status(400).json({ message: "Missing activity_id or student_id" });
    }

    // Parse performance data if provided
    let parsedPerformanceData = null;
    let parsedPerformanceReport = null;
    
    if (performanceData) {
      try {
        parsedPerformanceData = typeof performanceData === 'string' ? JSON.parse(performanceData) : performanceData;
      } catch (e) {
        console.error('Failed to parse performanceData:', e);
      }
    }

    if (performanceReport) {
      try {
        parsedPerformanceReport = typeof performanceReport === 'string' ? JSON.parse(performanceReport) : performanceReport;
      } catch (e) {
        console.error('Failed to parse performanceReport:', e);
      }
    }

    // First check whether the student already has a submission for this activity
    const checkSql = `SELECT submission_id FROM activity_submissions WHERE activity_id = ? AND student_id = ? LIMIT 1`;
    
    db.query(checkSql, [id, student_id], (cErr, cRows) => {
      if (cErr) {
        console.error('Failed to check existing submission:', cErr);
        return res.status(500).json({ message: 'Failed to save checkpoint', error: cErr.message });
      }

      if (cRows && cRows.length > 0) {
        // Update existing submission with checkpoint data and performance metrics
        const existingSubmissionId = cRows[0].submission_id;
        const updateSql = `UPDATE activity_submissions 
          SET checkpoint_data = ?, 
              performance_data = ?, 
              performance_score = ?, 
              performance_grade = ?, 
              performance_report = ?, 
              grade = ?, 
              updated_at = NOW() 
          WHERE submission_id = ?`;
        
        db.query(updateSql, [
          checkpointData, 
          JSON.stringify(parsedPerformanceData),
          performanceScore || null,
          performanceGrade || null,
          JSON.stringify(parsedPerformanceReport),
          performanceScore || null,  // Also update grade field for consistency
          existingSubmissionId
        ], (uErr, uRes) => {
          if (uErr) {
            console.error('Failed to update checkpoint:', uErr);
            return res.status(500).json({ message: 'Failed to save checkpoint', error: uErr.message });
          }

          // Save to dragdrop_attempts table if performance data provided
          if (parsedPerformanceData && isCompleted) {
            saveDragdropAttempt(id, student_id, existingSubmissionId, parsedPerformanceData, parsedPerformanceReport, performanceScore, performanceGrade);
          }

          return res.status(200).json({ 
            message: 'Checkpoint saved successfully', 
            submission_id: existingSubmissionId,
            component, 
            progress, 
            isCompleted,
            performance_score: performanceScore,
            performance_grade: performanceGrade 
          });
        });
      } else {
        // Insert new submission record with checkpoint data
        const submissionSql = `INSERT INTO activity_submissions (activity_id, student_id, checkpoint_data, performance_data, performance_score, performance_grade, performance_report, grade, submitted_at)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

        db.query(submissionSql, [
          id, 
          student_id, 
          checkpointData,
          JSON.stringify(parsedPerformanceData),
          performanceScore || null,
          performanceGrade || null,
          JSON.stringify(parsedPerformanceReport),
          performanceScore || null  // Also set grade field
        ], (err, result) => {
          if (err) {
            console.error('Failed to insert submission with checkpoint:', err);
            return res.status(500).json({ message: 'Failed to save checkpoint', error: err.message });
          }

          const submissionId = result.insertId;

          // Save to dragdrop_attempts table if performance data provided
          if (parsedPerformanceData && isCompleted) {
            saveDragdropAttempt(id, student_id, submissionId, parsedPerformanceData, parsedPerformanceReport, performanceScore, performanceGrade);
          }

          return res.status(201).json({ 
            message: 'Checkpoint saved successfully', 
            submission_id: submissionId,
            component, 
            progress, 
            isCompleted,
            performance_score: performanceScore,
            performance_grade: performanceGrade
          });
        });
      }
    });
  } catch (error) {
    console.error('Error in saveCheckpoint:', error);
    res.status(500).json({ message: "Failed to save checkpoint", error: error.message });
  }
};

// Helper: Save dragdrop attempt details to dragdrop_attempts table
const saveDragdropAttempt = (activityId, studentId, submissionId, performanceData, performanceReport, overallScore, letterGrade) => {
  try {
    const report = performanceReport || {};
    const metrics = performanceData.metrics || {};
    const componentScores = report.componentScores || {};
    const efficiency = report.efficiency || {};
    const accuracy = report.accuracy || {};
    const summary = report.summary || {};

    const insertSql = `INSERT INTO dragdrop_attempts (
      activity_id, student_id, submission_id, started_at, submitted_at, time_taken_seconds,
      overall_score, overall_percentage, letter_grade, completion_status,
      cpu_score, cmos_score, ram_score,
      cpu_duration, cmos_duration, ram_duration,
      total_wrong_attempts, total_correct_attempts, total_drag_operations, total_idle_seconds,
      cpu_wrong_attempts, cmos_wrong_attempts, ram_wrong_attempts,
      cpu_first_try_success, cmos_first_try_success, ram_first_try_success,
      full_report, event_log
    ) VALUES (
      ?, ?, ?, NOW(), NOW(), ?,
      ?, ?, ?, 'completed',
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?
    )`;

    const componentMetrics = metrics.components || {};
    
    db.query(insertSql, [
      activityId,
      studentId,
      submissionId,
      summary.totalTime || 0,
      overallScore || report.overallScore || 0,
      report.overallScore || 0,
      letterGrade || report.letterGrade || 'F',
      componentScores.cpu || 0,
      componentScores.cmos || 0,
      componentScores.ram || 0,
      efficiency.cpu?.duration || 0,
      efficiency.cmos?.duration || 0,
      efficiency.ram?.duration || 0,
      metrics.overall?.totalWrongAttempts || 0,
      metrics.overall?.totalCorrectAttempts || 0,
      metrics.overall?.totalDragOperations || 0,
      metrics.overall?.totalIdleTime || 0,
      componentMetrics.cpu?.wrongAttempts || 0,
      componentMetrics.cmos?.wrongAttempts || 0,
      componentMetrics.ram?.wrongAttempts || 0,
      componentMetrics.cpu?.firstTrySuccess ? 1 : 0,
      componentMetrics.cmos?.firstTrySuccess ? 1 : 0,
      componentMetrics.ram?.firstTrySuccess ? 1 : 0,
      JSON.stringify(performanceReport),
      JSON.stringify(metrics.eventLog || [])
    ], (err, result) => {
      if (err) {
        console.error('Failed to save dragdrop attempt:', err);
      } else {
        console.log('Dragdrop attempt saved successfully:', result.insertId);
        // Update dragdrop_scores with best score tracking
        updateDragdropScores(activityId, studentId, overallScore || report.overallScore, letterGrade || report.letterGrade);
      }
    });
  } catch (error) {
    console.error('Error in saveDragdropAttempt:', error);
  }
};

// Helper: Update dragdrop_scores with best score tracking
const updateDragdropScores = (activityId, studentId, score, letterGrade) => {
  try {
    const upsertSql = `INSERT INTO dragdrop_scores (
      activity_id, student_id, component_type, best_score, best_percentage, attempt_count, completed, best_letter_grade, last_attempt_date
    ) VALUES (?, ?, 'overall', ?, ?, 1, 1, ?, NOW())
    ON DUPLICATE KEY UPDATE
      best_score = GREATEST(best_score, ?),
      best_percentage = GREATEST(best_percentage, ?),
      attempt_count = attempt_count + 1,
      completed = 1,
      best_letter_grade = ?,
      last_attempt_date = NOW()`;

    db.query(upsertSql, [
      activityId,
      studentId,
      score || 0,
      score || 0,
      letterGrade || 'F',
      score || 0,
      score || 0,
      letterGrade || 'F'
    ], (err, result) => {
      if (err) {
        console.error('Failed to update dragdrop scores:', err);
      } else {
        console.log('Dragdrop scores updated successfully');
      }
    });
  } catch (error) {
    console.error('Error in updateDragdropScores:', error);
  }
};

// ✅ GET DRAGDROP SCORES - Instructor view (all students' performance)
exports.getDragdropScores = (req, res) => {
  try {
    const { id } = req.params;
    const instructor_id = req.userId;

    if (!id) {
      return res.status(400).json({ message: "Missing activity_id" });
    }

    // Verify this activity belongs to the instructor
    const verifySql = `SELECT instructor_id, title FROM activities WHERE activity_id = ?`;
    db.query(verifySql, [id], (vErr, vRes) => {
      if (vErr) {
        console.error('Database error:', vErr);
        return res.status(500).json({ message: "Failed to verify activity", error: vErr.message });
      }

      if (vRes.length === 0) {
        return res.status(404).json({ message: "Activity not found" });
      }

      if (vRes[0].instructor_id !== instructor_id) {
        return res.status(403).json({ message: "Unauthorized: You are not the instructor for this activity" });
      }

      // Get all dragdrop scores for this activity
      const scoresSql = `
        SELECT 
          ds.score_id,
          ds.student_id,
          ds.component_type,
          ds.best_score,
          ds.best_percentage,
          ds.attempt_count,
          ds.completed,
          ds.best_letter_grade,
          ds.last_attempt_date,
          u.username,
          u.email
        FROM dragdrop_scores ds
        LEFT JOIN users u ON ds.student_id = u.user_id
        WHERE ds.activity_id = ?
        ORDER BY ds.last_attempt_date DESC, u.username ASC
      `;

      db.query(scoresSql, [id], (err, scores) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: "Failed to fetch dragdrop scores", error: err.message });
        }

        // Group scores by student
        const scoresByStudent = {};
        scores.forEach((score) => {
          if (!scoresByStudent[score.student_id]) {
            scoresByStudent[score.student_id] = {
              student_id: score.student_id,
              username: score.username,
              email: score.email,
              scores: []
            };
          }
          scoresByStudent[score.student_id].scores.push(score);
        });

        const result = Object.values(scoresByStudent).map(student => ({
          ...student,
          overall: student.scores.find(s => s.component_type === 'overall') || null,
          components: student.scores.filter(s => s.component_type !== 'overall')
        }));

        res.json({ 
          activity_id: id,
          activity_title: vRes[0].title,
          dragdrop_scores: result,
          total_students: result.length 
        });
      });
    });
  } catch (error) {
    console.error('Error in getDragdropScores:', error);
    res.status(500).json({ message: "Failed to fetch dragdrop scores", error: error.message });
  }
};

// ✅ GET DRAGDROP SUBMISSIONS - Instructor view (all students' submissions with performance data)
exports.getDragdropSubmissions = (req, res) => {
  try {
    const { id } = req.params;
    const instructor_id = req.userId;

    if (!id) {
      return res.status(400).json({ message: "Missing activity_id" });
    }

    // Verify this activity belongs to the instructor
    const verifySql = `SELECT instructor_id, title FROM activities WHERE activity_id = ?`;
    db.query(verifySql, [id], (vErr, vRes) => {
      if (vErr) {
        console.error('Database error:', vErr);
        return res.status(500).json({ message: "Failed to verify activity", error: vErr.message });
      }

      if (vRes.length === 0) {
        return res.status(404).json({ message: "Activity not found" });
      }

      if (vRes[0].instructor_id !== instructor_id) {
        return res.status(403).json({ message: "Unauthorized: You are not the instructor for this activity" });
      }

      // Get all submissions with dragdrop performance data
      const submissionsSql = `
        SELECT 
          asu.submission_id,
          asu.activity_id,
          asu.student_id,
          asu.submission_text,
          asu.grade,
          asu.feedback,
          asu.performance_score,
          asu.performance_grade,
          asu.performance_data,
          asu.performance_report,
          asu.submitted_at,
          asu.updated_at,
          u.username,
          u.email,
          COUNT(asaa.attachment_id) as attachment_count
        FROM activity_submissions asu
        LEFT JOIN users u ON asu.student_id = u.user_id
        LEFT JOIN activity_submission_attachments asaa ON asu.submission_id = asaa.submission_id
        WHERE asu.activity_id = ?
        GROUP BY asu.submission_id, asu.activity_id, asu.student_id, asu.submission_text, asu.grade, asu.feedback, 
                 asu.performance_score, asu.performance_grade, asu.performance_data, asu.performance_report, 
                 asu.submitted_at, asu.updated_at, u.username, u.email
        ORDER BY asu.submitted_at DESC
      `;

      db.query(submissionsSql, [id], (err, submissions) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: "Failed to fetch submissions", error: err.message });
        }

        // Parse performance reports
        const formattedSubmissions = submissions.map((sub) => ({
          submission_id: sub.submission_id,
          student_id: sub.student_id,
          username: sub.username,
          email: sub.email,
          submission_text: sub.submission_text,
          grade: sub.grade,
          feedback: sub.feedback,
          performance_score: sub.performance_score,
          performance_grade: sub.performance_grade,
          performance_report: sub.performance_report ? JSON.parse(sub.performance_report) : null,
          submitted_at: sub.submitted_at,
          updated_at: sub.updated_at,
          attachment_count: sub.attachment_count
        }));

        res.json({ 
          activity_id: id,
          activity_title: vRes[0].title,
          submissions: formattedSubmissions,
          total_submissions: formattedSubmissions.length 
        });
      });
    });
  } catch (error) {
    console.error('Error in getDragdropSubmissions:', error);
    res.status(500).json({ message: "Failed to fetch dragdrop submissions", error: error.message });
  }
};

// ✅ GET DRAGDROP ATTEMPT DETAILS - Detailed performance breakdown for one attempt
exports.getDragdropAttemptDetails = (req, res) => {
  try {
    const { attemptId } = req.params;
    const student_id = req.userId;

    if (!attemptId) {
      return res.status(400).json({ message: "Missing attemptId" });
    }

    const sql = `
      SELECT 
        da.*,
        u.username,
        u.email,
        a.title as activity_title
      FROM dragdrop_attempts da
      LEFT JOIN users u ON da.student_id = u.user_id
      LEFT JOIN activities a ON da.activity_id = a.activity_id
      WHERE da.attempt_id = ? AND da.student_id = ?
    `;

    db.query(sql, [attemptId, student_id], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: "Failed to fetch attempt details", error: err.message });
      }

      if (rows.length === 0) {
        return res.status(404).json({ message: "Attempt not found" });
      }

      const attempt = rows[0];
      const report = attempt.full_report ? JSON.parse(attempt.full_report) : null;
      const eventLog = attempt.event_log ? JSON.parse(attempt.event_log) : [];

      res.json({
        attempt_id: attempt.attempt_id,
        activity_title: attempt.activity_title,
        student: {
          student_id: attempt.student_id,
          username: attempt.username,
          email: attempt.email
        },
        performance: {
          overall_score: attempt.overall_score,
          overall_percentage: attempt.overall_percentage,
          letter_grade: attempt.letter_grade,
          time_taken_seconds: attempt.time_taken_seconds,
          completion_status: attempt.completion_status,
          started_at: attempt.started_at,
          submitted_at: attempt.submitted_at
        },
        component_scores: {
          cpu: attempt.cpu_score,
          cmos: attempt.cmos_score,
          ram: attempt.ram_score
        },
        component_details: {
          cpu: {
            duration: attempt.cpu_duration,
            wrong_attempts: attempt.cpu_wrong_attempts,
            first_try_success: attempt.cpu_first_try_success
          },
          cmos: {
            duration: attempt.cmos_duration,
            wrong_attempts: attempt.cmos_wrong_attempts,
            first_try_success: attempt.cmos_first_try_success
          },
          ram: {
            duration: attempt.ram_duration,
            wrong_attempts: attempt.ram_wrong_attempts,
            first_try_success: attempt.ram_first_try_success
          }
        },
        overall_metrics: {
          total_wrong_attempts: attempt.total_wrong_attempts,
          total_correct_attempts: attempt.total_correct_attempts,
          total_drag_operations: attempt.total_drag_operations,
          total_idle_seconds: attempt.total_idle_seconds,
          sequence_followed: attempt.sequence_followed
        },
        full_report: report,
        event_log: eventLog
      });
    });
  } catch (error) {
    console.error('Error in getDragdropAttemptDetails:', error);
    res.status(500).json({ message: "Failed to fetch attempt details", error: error.message });
  }
};

