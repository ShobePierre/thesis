-- Add login restriction column to users table
ALTER TABLE `users` ADD COLUMN `is_locked` BOOLEAN DEFAULT FALSE AFTER `profile_picture`;
ALTER TABLE `users` ADD COLUMN `locked_at` DATETIME DEFAULT NULL;
ALTER TABLE `users` ADD COLUMN `locked_reason` VARCHAR(255) DEFAULT NULL;

-- Optional: Add index for faster queries
ALTER TABLE `users` ADD INDEX `idx_is_locked` (`is_locked`);
