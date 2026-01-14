-- Migration: Add is_correct column to activity_submissions table
-- Purpose: Track which codeblock submissions are correct to prevent re-attempts

ALTER TABLE `activity_submissions` ADD COLUMN `is_correct` TINYINT(1) DEFAULT 0 AFTER `checkpoint_data`;

-- Optionally update existing correct submissions based on checkpoint_data
-- This would require parsing JSON in checkpoint_data to find "correct": true
-- For now, all existing submissions default to 0 (not marked as correct)

-- Verify the column was added
SHOW COLUMNS FROM `activity_submissions` WHERE Field = 'is_correct';
