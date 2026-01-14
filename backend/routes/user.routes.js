const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../config/db');
const userModel = require('../models/user.models');
const messageController = require('../controllers/message.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Ensure avatars upload directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// POST /user/avatar
router.post('/avatar', verifyToken, upload.single('avatar'), (req, res) => {
  const userId = req.userId;
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const { originalname, filename, mimetype, size } = req.file;
  const filePath = `/uploads/avatars/${filename}`;

  // Start by marking existing avatars as not current
  const updateSql = 'UPDATE user_avatars SET is_current = 0 WHERE user_id = ?';
  db.query(updateSql, [userId], (uErr) => {
    if (uErr) {
      console.error('Failed to update existing avatars:', uErr);
      // continue anyway
    }

    const insertSql = `INSERT INTO user_avatars (user_id, original_name, stored_name, file_path, mime_type, file_size, is_current, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`;
    db.query(insertSql, [userId, originalname, filename, filePath, mimetype, size], (iErr, result) => {
      if (iErr) {
        console.error('Failed to insert avatar record:', iErr);
        return res.status(500).json({ message: 'Failed to save avatar metadata' });
      }

      return res.json({
        message: 'Avatar uploaded',
        avatar: {
          avatar_id: result.insertId,
          user_id: userId,
          original_name: originalname,
          stored_name: filename,
          file_path: filePath,
          mime_type: mimetype,
          file_size: size,
          is_current: 1,
        },
      });
    });
  });
});

// GET /user/:userId/avatar - return current avatar for a user
router.get('/:userId/avatar', (req, res) => {
  const userId = req.params.userId;
  const sql = 'SELECT file_path, stored_name, original_name, mime_type, file_size, uploaded_at FROM user_avatars WHERE user_id = ? AND is_current = 1 ORDER BY uploaded_at DESC LIMIT 1';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching avatar:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    if (!results || results.length === 0) return res.json({ avatar: null });
    return res.json({ avatar: results[0] });
  });
});

// GET /user/me/avatar - return current avatar for the authenticated user
router.get('/me/avatar', verifyToken, (req, res) => {
  const userId = req.userId;
  const sql = 'SELECT file_path, stored_name, original_name, mime_type, file_size, uploaded_at FROM user_avatars WHERE user_id = ? AND is_current = 1 ORDER BY uploaded_at DESC LIMIT 1';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching avatar for current user:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    if (!results || results.length === 0) return res.json({ avatar: null });
    return res.json({ avatar: results[0] });
  });
});

module.exports = router;

// GET /user/me/notifications - return notifications for the authenticated user
router.get('/me/notifications', verifyToken, (req, res) => {
  const userId = req.userId;
  const sql = 'SELECT notification_id, message, type, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching notifications:', err);
      return res.status(500).json({ message: 'Failed to fetch notifications' });
    }
    return res.json({ notifications: results.map(r => ({ id: `notif-${r.notification_id}`, message: r.message, type: r.type, is_read: !!r.is_read, time: r.created_at, created_at: r.created_at })) });
  });
});

// PATCH /user/notifications/:notificationId/read - mark a notification as read
router.patch('/notifications/:notificationId/read', verifyToken, (req, res) => {
  const userId = req.userId;
  const notificationId = req.params.notificationId;

  // Extract the actual ID from the format "notif-XXX"
  const actualId = notificationId.startsWith('notif-') ? notificationId.substring(6) : notificationId;

  const sql = 'UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?';
  db.query(sql, [actualId, userId], (err, result) => {
    if (err) {
      console.error('Error marking notification as read:', err);
      return res.status(500).json({ message: 'Failed to mark notification as read' });
    }
    return res.json({ message: 'Notification marked as read', affectedRows: result.affectedRows });
  });
});

// PUT /user/me - update current user's profile (username/email/password)
router.put('/me', verifyToken, (req, res) => {
  const userId = req.userId;
  const { username, email, password } = req.body || {};

  // Only allow updating username/email/password here (model also filters)
  const fields = {};
  if (typeof username === 'string') fields.username = username.trim();
  if (typeof email === 'string') fields.email = email.trim();
  if (typeof password === 'string') fields.password = password; // hashing should be handled elsewhere if necessary

  if (Object.keys(fields).length === 0) return res.status(400).json({ message: 'No valid fields provided' });

  userModel.updateUser(userId, fields, (err, result) => {
    if (err) {
      console.error('Failed to update user', err);
      return res.status(500).json({ message: 'Failed to update user' });
    }

    // If nothing changed, still return success with no content
    if (!result || result.affectedRows === 0) {
      return res.status(200).json({ message: 'No changes made' });
    }

    // Fetch updated record to return to caller
    userModel.findById(userId, (fErr, rows) => {
      if (fErr) {
        console.error('Failed to fetch updated user', fErr);
        return res.status(200).json({ message: 'Updated' });
      }
      const user = rows && rows[0] ? rows[0] : null;
      return res.status(200).json({ message: 'Updated', user });
    });
  });
});
// ==================== ADMIN MESSAGES ====================
// Get all messages for the logged-in user
router.get('/messages', verifyToken, messageController.getUserMessages);

// Get unread message count
router.get('/messages/unread-count', verifyToken, messageController.getUnreadMessageCount);

// Mark a message as read
router.put('/messages/:messageId/read', verifyToken, messageController.markMessageAsRead);

// Delete a message
router.delete('/messages/:messageId', verifyToken, messageController.deleteMessage);

module.exports = router;