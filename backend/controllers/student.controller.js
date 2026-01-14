const axios = require('axios');

exports.getDashboard = (req, res) => {
  res.send({ message: 'Welcome to Dashboard!' });
};

exports.getCompiler = async (req, res) => {
  const { language, code, stdin } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: "Language and code are required." });
  }

  try {
    const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
      language,
      version: "*",
      files: [{ name: "main." + language, content: code }],
      stdin: stdin || "",
    });

    res.json({
      message: "Execution successful",
      output: response.data.run.output,
      status: response.data.run.code,
    });
  } catch (error) {
    console.error("Piston API Error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Code execution failed",
      details: error.response?.data || error.message,
    });
  }
};

exports.getDragDropActivity = (req, res) => {
  res.send({ message: 'Drag and Drop!' });
};

exports.getTodo = (req, res) => {
  const db = require('../config/db');
  const studentId = req.userId;

  // Query activities for subjects the student is enrolled in
  // Exclude activities where the student already has a submission (they've already submitted)
  const sql = `
    SELECT a.*, s.title AS subject_title, s.subject_id
    FROM activities a
    JOIN subjects s ON a.subject_id = s.subject_id
    JOIN student_subjects ss ON ss.subject_id = s.subject_id
    LEFT JOIN activity_submissions sub ON sub.activity_id = a.activity_id AND sub.student_id = ?
    WHERE ss.student_id = ? AND sub.submission_id IS NULL
    ORDER BY a.created_at DESC
  `;

  db.query(sql, [studentId, studentId], (err, results) => {
    if (err) {
      console.error('DB error while fetching todo activities:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    // parse config_json where needed
    const parsed = (results || []).map((r) => {
      let config = r.config_json;
      if (typeof config === 'string') {
        try {
          config = JSON.parse(config);
        } catch (e) {
          config = {};
        }
      }
      return { ...r, config_json: config };
    });

    return res.json({ activities: parsed });
  });
};

exports.getQuiz = (req, res) => {
  res.send({ message: 'You can now take the quiz!' });
};

exports.getArchived = (req, res) => {
  const db = require('../config/db');
  const studentId = req.userId;

  const runQuery = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.query(sql, params, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

  // 1) Get archived subjects the student is enrolled in
  const subjectsSql = `
    SELECT s.subject_id, s.title, s.description, s.class_code, s.created_at, s.instructor_id, u.username as instructor_name
    FROM student_subjects ss
    JOIN subjects s ON ss.subject_id = s.subject_id
    JOIN users u ON s.instructor_id = u.user_id
    WHERE ss.student_id = ? AND s.is_archived = 1
    ORDER BY ss.joined_at DESC
  `;

  runQuery(subjectsSql, [studentId])
    .then(async (subjects) => {
      if (!subjects || subjects.length === 0) {
        return res.json({ message: 'No archived subjects.', archived: [] });
      }

      // For each subject, fetch announcements (newsfeed) and activities (classwork)
      const enriched = await Promise.all(
        subjects.map(async (sub) => {
          try {
            const announcements = await runQuery(
              `SELECT a.*, u.username AS instructor_name
               FROM announcements a
               LEFT JOIN users u ON a.instructor_id = u.user_id
               WHERE a.subject_id = ?
               ORDER BY a.created_at DESC`,
              [sub.subject_id]
            );

            // Get attachments for announcements if any
            let announcementsPayload = [];
            if (announcements && announcements.length > 0) {
              const ids = announcements.map((a) => a.announcement_id);
              const attachments = await runQuery(
                `SELECT posting_id AS attachment_id, announcement_id, asset_type, original_name AS file_name,
                        stored_name, file_path, mime_type, file_size, uploaded_at
                   FROM Posting_teacher
                  WHERE announcement_id IN (?)`,
                [ids]
              );

              const attachmentsByAnnouncement = (attachments || []).reduce((acc, record) => {
                if (!acc[record.announcement_id]) acc[record.announcement_id] = [];
                acc[record.announcement_id].push(record);
                return acc;
              }, {});

              announcementsPayload = announcements.map((row) => ({
                ...row,
                attachments: attachmentsByAnnouncement[row.announcement_id] || [],
              }));
            }

            // Fetch activities (classwork) for the subject
            const activities = await runQuery(
              `SELECT * FROM activities WHERE subject_id = ? ORDER BY created_at DESC`,
              [sub.subject_id]
            );

            // Parse config_json if stored as string
            const parsedActivities = (activities || []).map((r) => {
              let config = r.config_json;
              if (typeof config === 'string') {
                try {
                  config = JSON.parse(config);
                } catch (e) {
                  config = {};
                }
              }
              return { ...r, config_json: config };
            });

            return {
              ...sub,
              announcements: announcementsPayload,
              activities: parsedActivities,
            };
          } catch (err) {
            console.error('Error enriching archived subject:', err);
            return { ...sub, announcements: [], activities: [] };
          }
        })
      );

      return res.json({ message: 'Archived subjects retrieved.', archived: enriched });
    })
    .catch((err) => {
      console.error('DB error while fetching archived subjects for student:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    });
};

const db = require('../config/db');
const path = require('path');

// GET /student/setting - return user basic info and current avatar
exports.getSetting = (req, res) => {
  const userId = req.userId;
  const sql = `SELECT u.user_id, u.username, u.email, u.profile_picture,
    ua.file_path AS avatar_path, ua.stored_name, ua.original_name, ua.mime_type, ua.uploaded_at
    FROM users u
    LEFT JOIN user_avatars ua ON ua.user_id = u.user_id AND ua.is_current = 1
    WHERE u.user_id = ? LIMIT 1`;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error('Failed to fetch student setting:', err);
      return res.status(500).json({ message: 'Failed to load settings' });
    }
    const row = rows && rows[0] ? rows[0] : null;
    if (!row) return res.status(404).json({ message: 'User not found' });

    // Prefer user_avatars table, fallback to users.profile_picture
    const avatarPath = row.avatar_path || row.profile_picture || null;

    return res.json({
      message: 'Student settings',
      user: {
        user_id: row.user_id,
        username: row.username,
        email: row.email,
        avatar: avatarPath,
      },
    });
  });
};


// PUT /student/setting - accept avatar file upload or avatar_path/username in body
exports.updateSetting = (req, res) => {
  const userId = req.userId;

  // If a file was uploaded, persist to user_avatars table and mark previous as not current
  if (req.file) {
    const { originalname, filename, mimetype, size } = req.file;
    const filePath = `/uploads/avatars/${filename}`;

    const updateSql = 'UPDATE user_avatars SET is_current = 0 WHERE user_id = ?';
    db.query(updateSql, [userId], (uErr) => {
      if (uErr) console.warn('Failed to unset previous avatars:', uErr);

      const insertSql = `INSERT INTO user_avatars (user_id, original_name, stored_name, file_path, mime_type, file_size, is_current, uploaded_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`;
      db.query(insertSql, [userId, originalname, filename, filePath, mimetype, size], (iErr, result) => {
        if (iErr) {
          console.error('Failed to insert avatar record:', iErr);
          return res.status(500).json({ message: 'Failed to save avatar' });
        }
        // Update the users.profile_picture field with the new avatar path
        const updateProfilePicSql = 'UPDATE users SET profile_picture = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?';
        db.query(updateProfilePicSql, [filePath, userId], (ppErr) => {
          if (ppErr) console.error('Failed to update profile_picture:', ppErr);
          
          // If a username was submitted with the multipart form, update users.username as well
          const bodyUsername = req.body && req.body.username ? String(req.body.username).trim() : null;
          if (bodyUsername) {
            const updateUserSql = 'UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?';
            db.query(updateUserSql, [bodyUsername, userId], (uErr) => {
              if (uErr) console.error('Failed to update username after avatar upload:', uErr);
              return res.json({ message: 'Avatar uploaded', avatar: { file_path: filePath, stored_name: filename }, username: bodyUsername });
            });
            return;
          }

          return res.json({ message: 'Avatar uploaded', avatar: { file_path: filePath, stored_name: filename } });
        });
      });
    });
    return;
  }

  const { username, avatar_path } = req.body || {};

  // If avatar_path is provided, mark matching user_avatars row as current (or insert if not found)
  if (avatar_path) {
    let pathValue = String(avatar_path || '');
    try {
      if (pathValue.startsWith('http')) {
        const u = new URL(pathValue);
        pathValue = u.pathname;
      }
    } catch (e) {}

    const unsetSql = 'UPDATE user_avatars SET is_current = 0 WHERE user_id = ?';
    db.query(unsetSql, [userId], (uErr) => {
      if (uErr) console.warn('Failed to unset previous avatars', uErr);

      const findSql = 'SELECT avatar_id FROM user_avatars WHERE user_id = ? AND file_path = ? LIMIT 1';
      db.query(findSql, [userId, pathValue], (fErr, rows) => {
        if (fErr) {
          console.error('Failed to query user_avatars', fErr);
          return res.status(500).json({ message: 'Failed to set avatar' });
        }

        if (rows && rows.length > 0) {
          const avatarId = rows[0].avatar_id;
          const setSql = 'UPDATE user_avatars SET is_current = 1, uploaded_at = NOW() WHERE avatar_id = ?';
          db.query(setSql, [avatarId], (sErr) => {
            if (sErr) {
              console.error('Failed to mark avatar current', sErr);
              return res.status(500).json({ message: 'Failed to set avatar' });
            }
            // Update the users.profile_picture field with the new avatar path
            const updateProfilePicSql = 'UPDATE users SET profile_picture = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?';
            db.query(updateProfilePicSql, [pathValue, userId], (ppErr) => {
              if (ppErr) console.error('Failed to update profile_picture:', ppErr);
              
              // If a username was provided along with avatar_path, update it on the users table
              const bodyUsername = req.body && req.body.username ? String(req.body.username).trim() : null;
              if (bodyUsername) {
                const updateUserSql = 'UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?';
                db.query(updateUserSql, [bodyUsername, userId], (uErr) => {
                  if (uErr) {
                    console.error('Failed to update username when setting avatar by path:', uErr);
                  }
                  return res.json({ message: 'Avatar updated', avatar: { file_path: pathValue }, username: bodyUsername });
                });
                return;
              }

              return res.json({ message: 'Avatar updated', avatar: { file_path: pathValue } });
            });
          });
          return;
        }

        // Do not store username or filename in original_name/stored_name when mime_type is NULL.
        // The users table already contains the canonical username, so keep these fields NULL.
        const insertSql = `INSERT INTO user_avatars (user_id, original_name, stored_name, file_path, mime_type, file_size, is_current, uploaded_at)
          VALUES (?, NULL, NULL, ?, NULL, NULL, 1, NOW())`;
        db.query(insertSql, [userId, pathValue], (iErr, result) => {
          if (iErr) {
            console.error('Failed to insert avatar record for path', iErr);
            return res.status(500).json({ message: 'Failed to save avatar' });
          }
          // Update the users.profile_picture field with the new avatar path
          const updateProfilePicSql = 'UPDATE users SET profile_picture = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?';
          db.query(updateProfilePicSql, [pathValue, userId], (ppErr) => {
            if (ppErr) console.error('Failed to update profile_picture:', ppErr);
            
            // update username if provided
            const bodyUsername = req.body && req.body.username ? String(req.body.username).trim() : null;
            if (bodyUsername) {
              const updateUserSql = 'UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?';
              db.query(updateUserSql, [bodyUsername, userId], (uErr) => {
                if (uErr) console.error('Failed to update username when inserting avatar path:', uErr);
                return res.json({ message: 'Avatar updated', avatar: { file_path: pathValue }, username: bodyUsername });
              });
              return;
            }

            return res.json({ message: 'Avatar updated', avatar: { file_path: pathValue } });
          });
        });
      });
    });
    return;
  }

  // Otherwise update username if provided
  if (username) {
    const trimmed = String(username).trim();
    const updateUserSql = 'UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?';
    db.query(updateUserSql, [trimmed, userId], (err, result) => {
      if (err) {
        console.error('Failed to update username:', err);
        return res.status(500).json({ message: 'Failed to update profile' });
      }
      return res.json({ message: 'Profile updated', username: trimmed });
    });
    return;
  }

  return res.status(400).json({ message: 'No valid payload provided' });
};

exports.getActiveClasses = (req, res) => {
  const db = require('../config/db');
  const studentId = req.userId;

  const sql = `
    SELECT s.subject_id, s.title, s.description, s.class_code, s.created_at, s.instructor_id, u.username as instructor_name
    FROM student_subjects ss
    JOIN subjects s ON ss.subject_id = s.subject_id
    JOIN users u ON s.instructor_id = u.user_id
    WHERE ss.student_id = ? AND s.is_archived = 0
    ORDER BY ss.joined_at DESC
  `;

  db.query(sql, [studentId], (err, results) => {
    if (err) {
      console.error('DB error while fetching active classes:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    return res.json({ activeClasses: results || [] });
  });
};

exports.getSubject = (req, res) => {
  const db = require('../config/db');
  const subjectId = req.params.subjectId;
  const classCode = req.query.class_code;

  if (!subjectId && !classCode) {
    return res.status(400).json({ message: 'subjectId or class_code is required' });
  }

  let sql, params;
  if (subjectId) {
    sql = `SELECT s.*, u.username as instructor_name FROM subjects s JOIN users u ON s.instructor_id = u.user_id WHERE s.subject_id = ? LIMIT 1`;
    params = [subjectId];
  } else {
    sql = `SELECT s.*, u.username as instructor_name FROM subjects s JOIN users u ON s.instructor_id = u.user_id WHERE s.class_code = ? LIMIT 1`;
    params = [classCode];
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('DB error while fetching subject:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    return res.json({ subject: results[0] });
  });
};

exports.joinClass = (req, res) => {
  const db = require('../config/db');
  const studentId = req.userId;
  const { classCode } = req.body;

  if (!classCode) {
    return res.status(400).json({ message: 'classCode is required' });
  }

  // Find subject by class_code
  const findSql = 'SELECT * FROM subjects WHERE class_code = ? LIMIT 1';
  db.query(findSql, [classCode], (err, results) => {
    if (err) {
      console.error('DB error while finding subject:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const subject = results[0];

    // Check if student already joined
    const checkSql = 'SELECT * FROM student_subjects WHERE student_id = ? AND subject_id = ? LIMIT 1';
    db.query(checkSql, [studentId, subject.subject_id], (err2, rows2) => {
      if (err2) {
        console.error('DB error while checking student_subjects:', err2);
        return res.status(500).json({ message: 'Database error' });
      }

      if (rows2 && rows2.length > 0) {
        // already joined
        return res.json({ message: 'Already joined', subject });
      }

      // Insert into student_subjects
      const insertSql = 'INSERT INTO student_subjects (student_id, subject_id) VALUES (?, ?)';
      db.query(insertSql, [studentId, subject.subject_id], (err3, insertRes) => {
        if (err3) {
          console.error('DB error while inserting student_subjects:', err3);
          return res.status(500).json({ message: 'Database error' });
        }

        return res.json({ message: 'Joined class successfully', subject });
      });
    });
  });
};

exports.leaveClass = (req, res) => {
  const db = require('../config/db');
  const studentId = req.userId;
  const { subjectId } = req.body;

  if (!subjectId) {
    return res.status(400).json({ message: 'subjectId is required' });
  }

  const checkSql = 'SELECT * FROM student_subjects WHERE student_id = ? AND subject_id = ? LIMIT 1';
  db.query(checkSql, [studentId, subjectId], (err, rows) => {
    if (err) {
      console.error('DB error while checking enrollment:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    const deleteSql = 'DELETE FROM student_subjects WHERE student_id = ? AND subject_id = ?';
    db.query(deleteSql, [studentId, subjectId], (err2, delRes) => {
      if (err2) {
        console.error('DB error while deleting enrollment:', err2);
        return res.status(500).json({ message: 'Database error' });
      }

      return res.json({ message: 'Unenrolled successfully' });
    });
  });
};

exports.getAnnouncements = (req, res) => {
  const db = require('../config/db');
  const studentId = req.userId;
  const subjectId = req.query.subject_id;

  if (!subjectId) {
    return res.status(400).json({ message: 'subject_id is required' });
  }

  // verify student is enrolled in subject
  const checkSql = 'SELECT * FROM student_subjects WHERE student_id = ? AND subject_id = ? LIMIT 1';
  db.query(checkSql, [studentId, subjectId], async (err, rows) => {
    if (err) {
      console.error('DB error while checking enrollment for announcements:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!rows || rows.length === 0) {
      return res.status(403).json({ message: 'Access denied or not enrolled in this class' });
    }

    try {
      // reuse the attachment logic similar to instructor controller
      const runQuery = (sql, params = []) =>
        new Promise((resolve, reject) => {
          db.query(sql, params, (e, results) => {
            if (e) return reject(e);
            resolve(results);
          });
        });

      const announcements = await runQuery(
        `SELECT a.*, u.username AS instructor_name
           FROM announcements a
           LEFT JOIN users u ON a.instructor_id = u.user_id
          WHERE a.subject_id = ?
          ORDER BY a.created_at DESC`,
        [subjectId]
      );

      if (!announcements || announcements.length === 0) {
        return res.json({ message: 'No announcements found.', announcements: [] });
      }

      const ids = announcements.map((a) => a.announcement_id);
      const attachments = await runQuery(
        `SELECT posting_id AS attachment_id, announcement_id, asset_type, original_name AS file_name,
                stored_name, file_path, mime_type, file_size, uploaded_at
           FROM Posting_teacher
          WHERE announcement_id IN (?)`,
        [ids]
      );

      const attachmentsByAnnouncement = attachments.reduce((acc, record) => {
        if (!acc[record.announcement_id]) acc[record.announcement_id] = [];
        acc[record.announcement_id].push(record);
        return acc;
      }, {});

      const payload = announcements.map((row) => ({
        ...row,
        attachments: attachmentsByAnnouncement[row.announcement_id] || [],
      }));

      return res.json({ message: 'Announcements retrieved successfully.', announcements: payload });
    } catch (error) {
      console.error('Error fetching announcements for student:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
};

// ✅ READ Activities for Student (read-only, filtered by subject)
exports.getActivities = (req, res) => {
  const db = require('../config/db');
  const studentId = req.userId;
  const subjectId = req.query.subject_id;

  if (!subjectId) {
    return res.status(400).json({ message: 'subject_id is required' });
  }

  // verify student is enrolled in subject
  const checkSql = 'SELECT * FROM student_subjects WHERE student_id = ? AND subject_id = ? LIMIT 1';
  db.query(checkSql, [studentId, subjectId], (err, rows) => {
    if (err) {
      console.error('DB error while checking enrollment for activities:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!rows || rows.length === 0) {
      return res.status(403).json({ message: 'Access denied or not enrolled in this class' });
    }

    const sql = 'SELECT * FROM activities WHERE subject_id = ? ORDER BY created_at DESC';
    db.query(sql, [subjectId], (e, results) => {
      if (e) {
        console.error('DB error while fetching activities for student:', e);
        return res.status(500).json({ message: 'Database error' });
      }

      // parse config_json if stored as string
      const parsed = (results || []).map((r) => {
        let config = r.config_json;
        if (typeof config === 'string') {
          try {
            config = JSON.parse(config);
          } catch (parseErr) {
            config = {};
          }
        }
        return { ...r, config_json: config };
      });

      return res.json(parsed);
    });
  });
};

// GET /student/class-members/:subjectId
// Fetch all students (including current user) enrolled in a specific class
exports.getClassMembers = (req, res) => {
  const db = require('../config/db');
  const studentId = req.userId;
  const { subjectId } = req.params;

  if (!subjectId) {
    return res.status(400).json({ message: "Subject ID is required." });
  }

  // Verify student is enrolled in this subject
  const verifySql = `
    SELECT ss.id FROM student_subjects ss 
    WHERE ss.student_id = ? AND ss.subject_id = ?
  `;

  db.query(verifySql, [studentId, subjectId], (verifyErr, verifyResults) => {
    if (verifyErr) {
      console.error("Error verifying enrollment:", verifyErr);
      return res.status(500).json({ message: "Database error." });
    }

    if (verifyResults.length === 0) {
      return res.status(403).json({ message: "You are not enrolled in this class." });
    }

    // Fetch all students enrolled in this subject
    const studentsSql = `
      SELECT u.user_id, u.username, u.email, u.role_id, ss.joined_at
      FROM users u
      INNER JOIN student_subjects ss ON u.user_id = ss.student_id
      WHERE u.role_id = 3 AND ss.subject_id = ?
      ORDER BY ss.joined_at DESC
    `;

    db.query(studentsSql, [subjectId], (studentsErr, studentsRows) => {
      if (studentsErr) {
        console.error("Error fetching class members:", studentsErr);
        return res.status(500).json({ message: "Failed to fetch class members." });
      }

      res.json({
        message: "Class members retrieved successfully.",
        count: studentsRows.length,
        members: studentsRows || [],
      });
    });
  });
};

