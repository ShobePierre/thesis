const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const superAdminController = require('../controllers/superadmin.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// All routes require Super Admin role and authentication
router.use(authMiddleware.verifyToken);
router.use(authMiddleware.isSuperAdmin);

// ==================== USER MANAGEMENT ====================
router.get('/users', authMiddleware.logAudit('user', 'view_all_users'), superAdminController.getAllUsers);
router.get('/users/:userId', authMiddleware.logAudit('user', 'view_user'), superAdminController.getUserById);
router.post('/users', upload.single('profile_picture'), authMiddleware.logAudit('user', 'create_user'), superAdminController.createUser);
router.put('/users/:userId', upload.single('profile_picture'), authMiddleware.logAudit('user', 'update_user'), superAdminController.updateUser);
router.delete('/users/:userId', authMiddleware.logAudit('user', 'delete_user'), superAdminController.deleteUser);

// ==================== SUBMISSIONS MANAGEMENT ====================
router.get('/submissions', authMiddleware.logAudit('submission', 'view_submissions'), superAdminController.getAllSubmissions);

// ==================== DATA EXPORT ====================
router.get('/export', authMiddleware.logAudit('export', 'export_data'), superAdminController.exportData);

// ==================== AUDIT LOGS ====================
router.get('/audit-logs', authMiddleware.logAudit('audit', 'view_audit_logs'), superAdminController.getAuditLogs);

// ==================== SYSTEM CONFIGURATION ====================
router.get('/config', authMiddleware.logAudit('config', 'view_system_config'), superAdminController.getSystemConfig);
router.put('/config', authMiddleware.logAudit('config', 'update_system_config'), superAdminController.updateSystemConfig);

// ==================== DATABASE MANAGEMENT ====================
router.post('/database/reset', authMiddleware.logAudit('database', 'reset_database'), superAdminController.resetDatabase);
router.post('/database/backup', authMiddleware.logAudit('database', 'backup_database'), superAdminController.backupDatabase);

module.exports = router;
