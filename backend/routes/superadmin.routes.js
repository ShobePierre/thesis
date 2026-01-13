const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superadmin.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All routes require Super Admin role and authentication
router.use(authMiddleware.verifyToken);
router.use(authMiddleware.isSuperAdmin);

// ==================== USER MANAGEMENT ====================
router.get('/users', authMiddleware.logAudit('user', 'view_all_users'), superAdminController.getAllUsers);
router.get('/users/:userId', authMiddleware.logAudit('user', 'view_user'), superAdminController.getUserById);
router.post('/users', authMiddleware.logAudit('user', 'create_user'), superAdminController.createUser);
router.put('/users/:userId', authMiddleware.logAudit('user', 'update_user'), superAdminController.updateUser);
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
