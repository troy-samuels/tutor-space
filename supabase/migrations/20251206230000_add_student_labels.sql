-- Add labels column to students table for tutor organization
ALTER TABLE students ADD COLUMN IF NOT EXISTS labels text[] DEFAULT '{}';

-- Add index for label filtering
CREATE INDEX IF NOT EXISTS idx_students_labels ON students USING GIN (labels);
