const db = require('../config/db');

// ==================== ADMIN MESSAGES ====================

exports.sendMessage = (req, res) => {
  const { user_id, title, content } = req.body;
  const admin_id = req.userId;

  if (!user_id || !title || !content) {
    return res.status(400).send({ message: 'All fields are required' });
  }

  const query = 'INSERT INTO admin_messages (admin_id, user_id, title, content) VALUES (?, ?, ?, ?)';
  db.query(query, [admin_id, user_id, title, content], (err, results) => {
    if (err) {
      console.error('Send message error:', err);
      return res.status(500).send({ message: 'Error sending message' });
    }

    if (req.auditData) {
      req.auditData.entity_id = results.insertId;
      req.auditData.action = 'send_message';
    }

    res.status(201).send({
      message: 'Message sent successfully',
      message_id: results.insertId,
    });
  });
};

exports.getUserMessages = (req, res) => {
  const user_id = req.userId;
  const { limit = 10, offset = 0 } = req.query;

  const query = `
    SELECT 
      am.message_id, am.admin_id, am.user_id, am.title, am.content,
      am.is_read, am.created_at, am.read_at,
      u.username as admin_username, u.email as admin_email
    FROM admin_messages am
    INNER JOIN users u ON am.admin_id = u.user_id
    WHERE am.user_id = ?
    ORDER BY am.created_at DESC
    LIMIT ? OFFSET ?
  `;

  db.query(query, [user_id, parseInt(limit), parseInt(offset)], (err, results) => {
    if (err) {
      console.error('Get messages error:', err);
      return res.status(500).send({ message: 'Error fetching messages' });
    }

    // Get total count
    const countQuery = 'SELECT COUNT(*) as total FROM admin_messages WHERE user_id = ?';
    db.query(countQuery, [user_id], (countErr, countResults) => {
      if (countErr) {
        return res.status(500).send({ message: 'Error counting messages' });
      }

      res.send({
        messages: results,
        total: countResults[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
    });
  });
};

exports.markMessageAsRead = (req, res) => {
  const { messageId } = req.params;
  const user_id = req.userId;

  const query = 'UPDATE admin_messages SET is_read = 1, read_at = NOW() WHERE message_id = ? AND user_id = ?';
  db.query(query, [messageId, user_id], (err, results) => {
    if (err) {
      console.error('Mark message error:', err);
      return res.status(500).send({ message: 'Error updating message' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).send({ message: 'Message not found' });
    }

    res.send({ message: 'Message marked as read' });
  });
};

exports.deleteMessage = (req, res) => {
  const { messageId } = req.params;
  const user_id = req.userId;

  const query = 'DELETE FROM admin_messages WHERE message_id = ? AND user_id = ?';
  db.query(query, [messageId, user_id], (err, results) => {
    if (err) {
      console.error('Delete message error:', err);
      return res.status(500).send({ message: 'Error deleting message' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).send({ message: 'Message not found' });
    }

    res.send({ message: 'Message deleted successfully' });
  });
};

exports.getUnreadMessageCount = (req, res) => {
  const user_id = req.userId;

  const query = 'SELECT COUNT(*) as unread_count FROM admin_messages WHERE user_id = ? AND is_read = 0';
  db.query(query, [user_id], (err, results) => {
    if (err) {
      console.error('Get unread count error:', err);
      return res.status(500).send({ message: 'Error fetching unread count' });
    }

    res.send({
      unread_count: results[0].unread_count,
    });
  });
};
