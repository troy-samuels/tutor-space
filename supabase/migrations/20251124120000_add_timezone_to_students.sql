-- Add timezone field to students table
-- This allows tutors to track each student's timezone for scheduling

ALTER TABLE students
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Add comment for documentation
COMMENT ON COLUMN students.timezone IS 'IANA timezone identifier for the student (e.g., America/New_York)';
