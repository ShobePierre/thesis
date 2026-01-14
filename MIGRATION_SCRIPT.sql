-- ============================================
-- DATABASE MIGRATION SCRIPT
-- Add is_correct column to activity_submissions
-- ============================================

-- Check current structure
DESCRIBE activity_submissions;

-- Add the is_correct column if it doesn't exist
ALTER TABLE activity_submissions ADD COLUMN is_correct TINYINT(1) DEFAULT 0 AFTER checkpoint_data;

-- Verify column was added
SHOW COLUMNS FROM activity_submissions WHERE Field = 'is_correct';

-- Optional: Update existing submissions based on checkpoint_data
-- This finds submissions where checkpoint_data contains "correct": true
-- and marks them as correct
UPDATE activity_submissions 
SET is_correct = 1 
WHERE checkpoint_data IS NOT NULL 
  AND JSON_EXTRACT(checkpoint_data, '$.correct') = true;

-- Verify the updates
SELECT submission_id, activity_id, student_id, is_correct, checkpoint_data 
FROM activity_submissions 
WHERE is_correct = 1 
LIMIT 10;

-- Check statistics
SELECT 
  COUNT(*) as total_submissions,
  SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_submissions,
  SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as incorrect_submissions,
  ROUND(100.0 * SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) as completion_rate_percent
FROM activity_submissions;
