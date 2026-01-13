/**
 * Backend API Endpoints for Code Block Activities
 * Implementation guide for Node.js/Express backend
 */

// ============================================
// DATABASE SCHEMA UPDATES
// ============================================

/*
Add these columns to the activities table:

ALTER TABLE activities ADD COLUMN (
  code LONGTEXT COMMENT 'The source code',
  language VARCHAR(50) COMMENT 'Programming language (python, javascript, etc)',
  blocks JSON COMMENT 'Parsed code blocks array',
  hiddenBlockIds JSON COMMENT 'Array of block IDs that are hidden',
  difficulty VARCHAR(20) COMMENT 'Activity difficulty level',
  hints JSON COMMENT 'Hints for hidden blocks',
  activity_type VARCHAR(50) DEFAULT 'standard' COMMENT 'Type: standard, codeblock, dragdrop',
  INDEX idx_activity_type (activity_type)
);

Add these columns to activity_submissions table:

ALTER TABLE activity_submissions ADD COLUMN (
  attemptCount INT DEFAULT 1 COMMENT 'Number of validation attempts',
  timeSpent INT COMMENT 'Time spent in seconds',
  validationResult JSON COMMENT 'Last validation result'
);
*/

// ============================================
// ENDPOINTS
// ============================================

/**
 * POST /api/activity
 * Create a new code-block activity
 */
const createCodeBlockActivity = async (req, res) => {
  try {
    const {
      title,
      description,
      code,
      language,
      blocks,
      hiddenBlockIds,
      difficulty,
      hints,
      subject_id,
      instructor_id
    } = req.body;

    // Validate required fields
    if (!title || !code || !language || !blocks || hiddenBlockIds.length === 0) {
      return res.status(400).json({
        message: "Missing required fields: title, code, language, blocks, hiddenBlockIds"
      });
    }

    // Validate at least one block is hidden
    if (hiddenBlockIds.length === 0) {
      return res.status(400).json({
        message: "At least one block must be marked as hidden"
      });
    }

    const query = `
      INSERT INTO activities (
        title, description, code, language, blocks, hiddenBlockIds, 
        difficulty, hints, activity_type, subject_id, instructor_id, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    db.query(query, [
      title,
      description,
      code,
      language,
      JSON.stringify(blocks),
      JSON.stringify(hiddenBlockIds),
      difficulty || 'easy',
      JSON.stringify(hints || {}),
      'codeblock',
      subject_id,
      instructor_id
    ], (error, results) => {
      if (error) {
        console.error('Error creating activity:', error);
        return res.status(500).json({
          message: 'Error creating activity',
          error: error.message
        });
      }

      res.status(201).json({
        message: 'Code-block activity created successfully',
        activityId: results.insertId
      });
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * PUT /api/activity/:activityId
 * Update a code-block activity
 */
const updateCodeBlockActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const {
      title,
      description,
      code,
      language,
      blocks,
      hiddenBlockIds,
      difficulty,
      hints
    } = req.body;

    const query = `
      UPDATE activities SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        code = COALESCE(?, code),
        language = COALESCE(?, language),
        blocks = COALESCE(?, blocks),
        hiddenBlockIds = COALESCE(?, hiddenBlockIds),
        difficulty = COALESCE(?, difficulty),
        hints = COALESCE(?, hints),
        updated_at = NOW()
      WHERE activity_id = ? AND activity_type = 'codeblock'
    `;

    db.query(query, [
      title,
      description,
      code,
      language,
      blocks ? JSON.stringify(blocks) : null,
      hiddenBlockIds ? JSON.stringify(hiddenBlockIds) : null,
      difficulty,
      hints ? JSON.stringify(hints) : null,
      activityId
    ], (error) => {
      if (error) {
        console.error('Error updating activity:', error);
        return res.status(500).json({
          message: 'Error updating activity',
          error: error.message
        });
      }

      res.json({
        message: 'Code-block activity updated successfully'
      });
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * GET /api/activity/:activityId
 * Get code-block activity details
 */
const getCodeBlockActivity = async (req, res) => {
  try {
    const { activityId } = req.params;

    const query = `
      SELECT 
        activity_id,
        title,
        description,
        code,
        language,
        blocks,
        hiddenBlockIds,
        difficulty,
        hints,
        activity_type,
        subject_id,
        instructor_id,
        created_at,
        updated_at
      FROM activities
      WHERE activity_id = ? AND activity_type = 'codeblock'
    `;

    db.query(query, [activityId], (error, results) => {
      if (error) {
        console.error('Error fetching activity:', error);
        return res.status(500).json({
          message: 'Error fetching activity',
          error: error.message
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: 'Code-block activity not found'
        });
      }

      const activity = results[0];
      // Parse JSON fields
      activity.blocks = JSON.parse(activity.blocks || '[]');
      activity.hiddenBlockIds = JSON.parse(activity.hiddenBlockIds || '[]');
      activity.hints = JSON.parse(activity.hints || '{}');

      res.json(activity);
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * GET /api/activities/subject/:subjectId/codeblock
 * Get all code-block activities for a subject
 */
const getCodeBlockActivitiesBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const query = `
      SELECT 
        activity_id,
        title,
        description,
        language,
        difficulty,
        created_at,
        updated_at
      FROM activities
      WHERE subject_id = ? AND activity_type = 'codeblock'
      ORDER BY created_at DESC
    `;

    db.query(query, [subjectId], (error, results) => {
      if (error) {
        console.error('Error fetching activities:', error);
        return res.status(500).json({
          message: 'Error fetching activities',
          error: error.message
        });
      }

      res.json({
        activities: results
      });
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * POST /api/activity/:activityId/submission
 * Submit a code-block activity solution
 */
const submitCodeBlockSolution = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { attemptCount, timeSpent, validationResult } = req.body;
    const userId = req.user.user_id;

    // Get activity details
    const activityQuery = 'SELECT * FROM activities WHERE activity_id = ?';
    
    db.query(activityQuery, [activityId], (error, activityResults) => {
      if (error || activityResults.length === 0) {
        return res.status(404).json({ message: 'Activity not found' });
      }

      const activity = activityResults[0];

      // Insert submission
      const submissionQuery = `
        INSERT INTO activity_submissions (
          user_id, activity_id, submission_type, submission_content,
          attemptCount, timeSpent, validationResult, score, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      db.query(submissionQuery, [
        userId,
        activityId,
        'codeblock',
        JSON.stringify({ validationResult }),
        attemptCount,
        timeSpent,
        JSON.stringify(validationResult),
        validationResult?.score || 0
      ], (error, results) => {
        if (error) {
          console.error('Error saving submission:', error);
          return res.status(500).json({
            message: 'Error saving submission',
            error: error.message
          });
        }

        // Log audit entry if superadmin
        if (req.user.role_id === 1) {
          const auditQuery = `
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address)
            VALUES (?, ?, ?, ?, ?)
          `;
          db.query(auditQuery, [
            userId,
            'SUBMIT_CODEBLOCK',
            'activity',
            activityId,
            req.ip
          ]);
        }

        res.json({
          message: 'Solution submitted successfully',
          submissionId: results.insertId,
          feedback: validationResult
        });
      });
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * GET /api/activity/:activityId/submissions
 * Get all submissions for an activity (instructor view)
 */
const getActivitySubmissions = async (req, res) => {
  try {
    const { activityId } = req.params;

    const query = `
      SELECT 
        s.submission_id,
        s.user_id,
        u.username,
        u.email,
        s.score,
        s.attemptCount,
        s.timeSpent,
        s.validationResult,
        s.created_at
      FROM activity_submissions s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.activity_id = ? AND s.submission_type = 'codeblock'
      ORDER BY s.created_at DESC
    `;

    db.query(query, [activityId], (error, results) => {
      if (error) {
        console.error('Error fetching submissions:', error);
        return res.status(500).json({
          message: 'Error fetching submissions',
          error: error.message
        });
      }

      // Parse JSON fields
      const submissions = results.map(s => ({
        ...s,
        validationResult: JSON.parse(s.validationResult || '{}')
      }));

      res.json({
        submissions
      });
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * DELETE /api/activity/:activityId
 * Delete a code-block activity
 */
const deleteCodeBlockActivity = async (req, res) => {
  try {
    const { activityId } = req.params;

    const query = `
      DELETE FROM activities 
      WHERE activity_id = ? AND activity_type = 'codeblock'
    `;

    db.query(query, [activityId], (error) => {
      if (error) {
        console.error('Error deleting activity:', error);
        return res.status(500).json({
          message: 'Error deleting activity',
          error: error.message
        });
      }

      res.json({
        message: 'Code-block activity deleted successfully'
      });
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// EXPORTS FOR ACTIVITY ROUTER
// ============================================

module.exports = {
  createCodeBlockActivity,
  updateCodeBlockActivity,
  getCodeBlockActivity,
  getCodeBlockActivitiesBySubject,
  submitCodeBlockSolution,
  getActivitySubmissions,
  deleteCodeBlockActivity
};

// ============================================
// INTEGRATION INTO activity.routes.js
// ============================================

/*
Add these routes to backend/routes/activity.routes.js:

router.post('/', createActivity); // Existing - update to handle codeblock type
router.put('/:activityId', updateActivity); // Existing - update to handle codeblock type
router.get('/:activityId', getActivity); // Existing - update to handle codeblock type
router.delete('/:activityId', deleteActivity); // Existing - update to handle codeblock type

// Code-block specific
router.get('/subject/:subjectId/codeblock', getCodeBlockActivitiesBySubject);
router.post('/:activityId/submission', submitCodeBlockSolution);
router.get('/:activityId/submissions', getActivitySubmissions);
*/
