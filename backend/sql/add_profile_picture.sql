-- Add profile_picture column to users table
ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255) NULL DEFAULT NULL AFTER password;

-- If you need to make it a LONGTEXT for storing full paths:
-- ALTER TABLE users MODIFY COLUMN profile_picture VARCHAR(500) NULL DEFAULT NULL;
