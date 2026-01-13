const db = require('../config/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// ==================== USER MANAGEMENT ====================

exports.getAllUsers = (req, res) => {
  const { search, role_id, limit = 10, offset = 0 } = req.query;
  let query = 'SELECT u.*, r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.role_id WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (u.username LIKE ? OR u.email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (role_id) {
    query += ' AND u.role_id = ?';
    params.push(role_id);
  }

  query += ` ORDER BY u.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Get users error:', err);
      return res.status(500).send({ message: 'Error fetching users', error: err.message });
    }

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM users u WHERE 1=1';
    const countParams = [];
    if (search) {
      countQuery += ' AND (u.username LIKE ? OR u.email LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    if (role_id) {
      countQuery += ' AND u.role_id = ?';
      countParams.push(role_id);
    }

    db.query(countQuery, countParams, (countErr, countResults) => {
      if (countErr) {
        return res.status(500).send({ message: 'Error counting users' });
      }
      res.send({
        users: results,
        total: countResults[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
    });
  });
};

exports.getUserById = (req, res) => {
  const { userId } = req.params;
  const query = 'SELECT u.*, r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = ?';

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Get user error:', err);
      return res.status(500).send({ message: 'Error fetching user' });
    }

    if (results.length === 0) {
      return res.status(404).send({ message: 'User not found' });
    }

    res.send(results[0]);
  });
};

exports.createUser = (req, res) => {
  const { username, email, password, role_id } = req.body;

  // Validation
  if (!username || !email || !password || !role_id) {
    return res.status(400).send({ message: 'All fields are required' });
  }

  // Check if user exists
  db.query('SELECT email FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      console.error('Check user error:', err);
      return res.status(500).send({ message: 'Error checking user' });
    }

    if (results.length > 0) {
      return res.status(409).send({ message: 'Email already exists' });
    }

    // Hash password
    bcrypt.hash(password, 10, (hashErr, hash) => {
      if (hashErr) {
        return res.status(500).send({ message: 'Error hashing password' });
      }

      const insertQuery = 'INSERT INTO users (username, email, password, role_id) VALUES (?, ?, ?, ?)';
      db.query(insertQuery, [username, email, hash, role_id], (insertErr, insertResults) => {
        if (insertErr) {
          console.error('Create user error:', insertErr);
          return res.status(500).send({ message: 'Error creating user' });
        }

        // Log audit
        req.auditData.entity_type = 'user';
        req.auditData.entity_id = insertResults.insertId;
        req.auditData.action = 'create_user';

        res.status(201).send({
          message: 'User created successfully',
          userId: insertResults.insertId,
        });
      });
    });
  });
};

exports.updateUser = (req, res) => {
  const { userId } = req.params;
  const { username, email, role_id } = req.body;

  if (!username || !email || !role_id) {
    return res.status(400).send({ message: 'All fields are required' });
  }

  const updateQuery = 'UPDATE users SET username = ?, email = ?, role_id = ? WHERE user_id = ?';
  db.query(updateQuery, [username, email, role_id, userId], (err, results) => {
    if (err) {
      console.error('Update user error:', err);
      return res.status(500).send({ message: 'Error updating user' });
    }

    req.auditData.entity_type = 'user';
    req.auditData.entity_id = parseInt(userId);
    req.auditData.action = 'update_user';

    res.send({ message: 'User updated successfully' });
  });
};

exports.deleteUser = (req, res) => {
  const { userId } = req.params;

  // Prevent deleting own account
  if (parseInt(userId) === req.userId) {
    return res.status(400).send({ message: 'Cannot delete your own account' });
  }

  const deleteQuery = 'DELETE FROM users WHERE user_id = ?';
  db.query(deleteQuery, [userId], (err, results) => {
    if (err) {
      console.error('Delete user error:', err);
      return res.status(500).send({ message: 'Error deleting user' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).send({ message: 'User not found' });
    }

    req.auditData.entity_type = 'user';
    req.auditData.entity_id = parseInt(userId);
    req.auditData.action = 'delete_user';

    res.send({ message: 'User deleted successfully' });
  });
};

// ==================== SUBMISSIONS MANAGEMENT ====================

exports.getAllSubmissions = (req, res) => {
  const { activity_id, student_id, limit = 10, offset = 0 } = req.query;
  let query = `
    SELECT 
      acs.submission_id, acs.activity_id, acs.student_id, acs.grade, acs.submitted_at,
      a.title as activity_title, u.username, u.email
    FROM activity_submissions acs
    INNER JOIN activities a ON acs.activity_id = a.activity_id
    INNER JOIN users u ON acs.student_id = u.user_id
    WHERE 1=1
  `;
  const params = [];

  if (activity_id) {
    query += ' AND acs.activity_id = ?';
    params.push(activity_id);
  }

  if (student_id) {
    query += ' AND acs.student_id = ?';
    params.push(student_id);
  }

  query += ` ORDER BY acs.submitted_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Get submissions error:', err);
      return res.status(500).send({ message: 'Error fetching submissions' });
    }

    // Get count
    let countQuery = 'SELECT COUNT(*) as total FROM activity_submissions acs WHERE 1=1';
    const countParams = [];
    if (activity_id) {
      countQuery += ' AND acs.activity_id = ?';
      countParams.push(activity_id);
    }
    if (student_id) {
      countQuery += ' AND acs.student_id = ?';
      countParams.push(student_id);
    }

    db.query(countQuery, countParams, (countErr, countResults) => {
      if (countErr) {
        return res.status(500).send({ message: 'Error counting submissions' });
      }
      res.send({
        submissions: results,
        total: countResults[0].total,
      });
    });
  });
};

// ==================== DATA EXPORT ====================

exports.exportData = (req, res) => {
  const { type, format } = req.query; // type: users, submissions; format: csv, json

  if (!type || !format) {
    return res.status(400).send({ message: 'Type and format are required' });
  }

  let query;
  let filename;

  if (type === 'users') {
    query = 'SELECT u.*, r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.role_id';
    filename = `users_export_${new Date().toISOString().split('T')[0]}`;
  } else if (type === 'submissions') {
    query = `
      SELECT 
        acs.submission_id, acs.activity_id, acs.student_id, acs.grade, acs.submitted_at,
        a.title as activity_title, u.username, u.email
      FROM activity_submissions acs
      INNER JOIN activities a ON acs.activity_id = a.activity_id
      INNER JOIN users u ON acs.student_id = u.user_id
    `;
    filename = `submissions_export_${new Date().toISOString().split('T')[0]}`;
  } else {
    return res.status(400).send({ message: 'Invalid type' });
  }

  db.query(query, (err, results) => {
    if (err) {
      console.error('Export error:', err);
      return res.status(500).send({ message: 'Error exporting data' });
    }

    if (format === 'json') {
      req.auditData.action = `export_${type}_json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      return res.send(JSON.stringify(results, null, 2));
    } else if (format === 'csv') {
      req.auditData.action = `export_${type}_csv`;
      // Convert to CSV
      if (results.length === 0) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        return res.send('No data to export');
      }

      const headers = Object.keys(results[0]);
      let csv = headers.join(',') + '\n';
      results.forEach((row) => {
        const values = headers.map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csv += values.join(',') + '\n';
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(csv);
    }
  });
};

// ==================== AUDIT LOGS ====================

exports.getAuditLogs = (req, res) => {
  const { user_id, action, limit = 20, offset = 0 } = req.query;
  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];

  if (user_id) {
    query += ' AND user_id = ?';
    params.push(user_id);
  }

  if (action) {
    query += ' AND action LIKE ?';
    params.push(`%${action}%`);
  }

  query += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Get audit logs error:', err);
      return res.status(500).send({ message: 'Error fetching audit logs' });
    }

    let countQuery = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
    const countParams = [];
    if (user_id) {
      countQuery += ' AND user_id = ?';
      countParams.push(user_id);
    }
    if (action) {
      countQuery += ' AND action LIKE ?';
      countParams.push(`%${action}%`);
    }

    db.query(countQuery, countParams, (countErr, countResults) => {
      if (countErr) {
        return res.status(500).send({ message: 'Error counting logs' });
      }
      res.send({
        logs: results,
        total: countResults[0].total,
      });
    });
  });
};

// ==================== SYSTEM CONFIGURATION ====================

exports.getSystemConfig = (req, res) => {
  // Return system configuration (can be from database or env)
  res.send({
    system_name: process.env.SYSTEM_NAME || 'VirtuLab LMS',
    max_upload_size: process.env.MAX_UPLOAD_SIZE || '10MB',
    session_timeout: process.env.SESSION_TIMEOUT || '3600',
    enable_analytics: process.env.ENABLE_ANALYTICS === 'true',
    maintenance_mode: process.env.MAINTENANCE_MODE === 'true',
  });
};

exports.updateSystemConfig = (req, res) => {
  const { system_name, max_upload_size, session_timeout, enable_analytics, maintenance_mode } = req.body;

  req.auditData.action = 'update_system_config';
  req.auditData.new_value = JSON.stringify(req.body);

  // In production, update database. For now, just acknowledge
  res.send({
    message: 'System configuration updated successfully',
    config: {
      system_name,
      max_upload_size,
      session_timeout,
      enable_analytics,
      maintenance_mode,
    },
  });
};

// ==================== DATABASE MANAGEMENT ====================

exports.resetDatabase = (req, res) => {
  const { environment, confirm } = req.body;

  if (confirm !== true) {
    return res.status(400).send({ message: 'Reset confirmation required' });
  }

  if (!['test', 'staging'].includes(environment)) {
    return res.status(400).send({ message: 'Can only reset test or staging databases' });
  }

  // Log the action first
  req.auditData.action = 'reset_database';
  req.auditData.entity_type = 'database';
  req.auditData.new_value = environment;

  // In production, implement actual database reset logic
  // For now, simulate the operation
  console.log(`Database reset initiated for ${environment} environment by Super Admin ${req.username}`);

  res.send({
    message: `${environment} database reset initiated. This may take a few minutes.`,
    environment,
    timestamp: new Date(),
  });
};

// Database backup
exports.backupDatabase = (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_${timestamp}.sql`;

  req.auditData.action = 'backup_database';

  // In production, implement mysqldump or similar
  res.send({
    message: 'Database backup initiated',
    filename,
    timestamp: new Date(),
  });
};
