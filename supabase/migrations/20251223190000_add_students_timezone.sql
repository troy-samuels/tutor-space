-- =============================================================================
-- ADD MISSING TIMEZONE COLUMN TO STUDENTS TABLE
-- Created: 2025-12-23
--
-- This migration adds the missing 'timezone' column to the students table.
-- The column is used in various queries throughout the application.
-- =============================================================================

-- Add timezone column to students table if it doesn't exist
ALTER TABLE students ADD COLUMN IF NOT EXISTS timezone TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN students.timezone IS 'Student timezone for scheduling (e.g., America/New_York)';
