-- Add connection_status column to students table
-- Tracks whether a student-tutor connection is pending approval or approved

ALTER TABLE students
ADD COLUMN IF NOT EXISTS connection_status TEXT
DEFAULT 'approved'
CHECK (connection_status IN ('pending', 'approved'));

-- Add index for efficient filtering by connection status
CREATE INDEX IF NOT EXISTS idx_students_connection_status
ON students(connection_status);

-- Backfill: Set existing students to 'approved' (they were created via the old flow)
UPDATE students SET connection_status = 'approved' WHERE connection_status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN students.connection_status IS 'Tracks student-tutor connection approval status: pending (awaiting tutor approval) or approved (can send messages)';
