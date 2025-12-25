-- Add mode column to student_practice_sessions
-- Enforces text-only or audio-only sessions

ALTER TABLE student_practice_sessions
ADD COLUMN mode TEXT CHECK (mode IN ('text', 'audio')) DEFAULT 'text';

-- Add index for querying sessions by mode
CREATE INDEX idx_student_practice_sessions_mode
ON student_practice_sessions(mode);

-- Comment for documentation
COMMENT ON COLUMN student_practice_sessions.mode IS
'Practice session mode: text (typing only) or audio (speaking only). Set at session start, cannot be changed.';
