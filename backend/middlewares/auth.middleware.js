const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.verifyToken = (req, res, next) => {
  // DEBUG: log incoming Authorization header to help debug 401s during development
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const xAccessToken = req.headers['x-access-token'];
  const tokenFromQuery = req.query && req.query.token;
  const tokenFromBody = req.body && req.body.token;

  

  // Prefer Authorization Bearer token, fallback to x-access-token, query, or body
  let token = null;
  if (typeof authHeader === 'string' && authHeader.split(' ').length > 1) {
    token = authHeader.split(' ')[1];
  } else if (typeof xAccessToken === 'string') {
    token = xAccessToken;
  } else if (tokenFromQuery) {
    token = tokenFromQuery;
  } else if (tokenFromBody) {
    token = tokenFromBody;
  }

  if (!token) return res.status(403).send({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
    if (err) {
      // Don't spam logs for routine token-expiration errors; they are expected when
      // clients continue to present an expired token. Only log other verification errors.
      if (err.name && err.name === 'TokenExpiredError') {
        return res.status(401).send({ message: 'Token expired' });
      }

      if (process.env.NODE_ENV !== 'production') {
        console.warn('verifyToken - jwt.verify error:', err && err.message);
      }
      return res.status(401).send({ message: 'Invalid or expired token' });
    }
    req.userId = decoded.id;
    req.userRoleId = decoded.role_id;
    req.username = decoded.username;
    // Ensure backward compatibility for handlers expecting req.user.id
    req.user = {
      id: decoded.id,
      roleId: decoded.role_id,
      username: decoded.username,
    };
    next();
  });
};

exports.authorizeRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.userRoleId)) {
      return res.status(403).send({ message: 'Access denied: insufficient role' });
    }
    next();
  };
};

// Enhanced: Check specific permissions instead of just roles
exports.authorizePermission = (permission) => {
  return async (req, res, next) => {
    try {
      // Query role_permissions to check if user's role has this permission
      const query = `
        SELECT rp.* FROM role_permissions rp
        INNER JOIN permissions p ON rp.permission_id = p.permission_id
        WHERE rp.role_id = ? AND p.permission_name = ?
      `;
      
      db.query(query, [req.userRoleId, permission], (err, results) => {
        if (err) {
          console.error('Permission check error:', err);
          return res.status(500).send({ message: 'Permission check failed' });
        }
        
        if (results.length === 0) {
          return res.status(403).send({ message: `Access denied: ${permission} permission required` });
        }
        
        next();
      });
    } catch (err) {
      console.error('Authorization error:', err);
      return res.status(500).send({ message: 'Authorization error' });
    }
  };
};

// Check if user is Super Admin
exports.isSuperAdmin = (req, res, next) => {
  if (req.userRoleId !== 1) {
    return res.status(403).send({ message: 'Access denied: Super Admin role required' });
  }
  next();
};

// Check if user is Admin or Super Admin
exports.isAdmin = (req, res, next) => {
  if (![1, 2].includes(req.userRoleId)) {
    return res.status(403).send({ message: 'Access denied: Admin role required' });
  }
  next();
};

// Log audit trail
exports.logAudit = (entityType, action) => {
  return (req, res, next) => {
    // Capture the IP and user agent
    req.auditData = {
      user_id: req.userId,
      action,
      entity_type: entityType,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('user-agent'),
    };
    
    // Store original send to intercept response
    const originalSend = res.send;
    res.send = function (data) {
      res.send = originalSend;
      
      // Log to database asynchronously
      if (req.auditData.user_id) {
        const insertQuery = `
          INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent, created_at)
          VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        db.query(insertQuery, [
          req.auditData.user_id,
          req.auditData.action,
          req.auditData.entity_type,
          req.auditData.entity_id || null,
          req.auditData.ip_address,
          req.auditData.user_agent,
        ], (err) => {
          if (err) console.error('Audit log error:', err);
        });
      }
      
      return res.send(data);
    };
    
    next();
  };
};
