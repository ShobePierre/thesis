-- ============================================
-- SUPER ADMIN USER SETUP
-- ============================================
-- Run this SQL to create/update the super admin user
-- Password: password123

-- First, check if superadmin exists
-- SELECT * FROM users WHERE username = 'superadmin';

-- Option 1: If user doesn't exist, INSERT:
INSERT INTO `users` (`role_id`, `username`, `email`, `password`, `created_at`, `updated_at`) 
VALUES (1, 'superadmin', 'admin@example.com', '$2b$10$jDe4B4.DSsnCE0oz1VDsUetUyVR/QrfUSLqy6E0vpWUfUSG2piG7S', NOW(), NOW());

-- Option 2: If user exists, UPDATE the password:
-- UPDATE users SET password = '$2b$10$jDe4B4.DSsnCE0oz1VDsUetUyVR/QrfUSLqy6E0vpWUfUSG2piG7S' WHERE username = 'superadmin';

-- Verify the user was created:
-- SELECT user_id, username, email, role_id FROM users WHERE username = 'superadmin';
