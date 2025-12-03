-- ============================================================================
-- HOMEWORK-PRACTICE INTEGRATION
-- Links homework assignments to practice assignments for optional AI practice
-- ============================================================================

-- Add topic field to homework for practice context
ALTER TABLE homework_assignments
  ADD COLUMN IF NOT EXISTS topic TEXT,
  ADD COLUMN IF NOT EXISTS practice_assignment_id UUID REFERENCES practice_assignments(id) ON DELETE SET NULL;

-- Add homework link to practice assignments (bidirectional reference)
ALTER TABLE practice_assignments
  ADD COLUMN IF NOT EXISTS homework_assignment_id UUID REFERENCES homework_assignments(id) ON DELETE SET NULL;

-- Add homework context to practice sessions
ALTER TABLE student_practice_sessions
  ADD COLUMN IF NOT EXISTS homework_assignment_id UUID REFERENCES homework_assignments(id) ON DELETE SET NULL;

-- Track practice reminder sent for homework
ALTER TABLE homework_assignments
  ADD COLUMN IF NOT EXISTS practice_reminder_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS practice_reminder_sent_at TIMESTAMPTZ;

-- Index for reminder queries (homework due in 24h with linked practice and reminder not sent)
CREATE INDEX IF NOT EXISTS idx_homework_practice_reminder
  ON homework_assignments(due_date, practice_reminder_sent, practice_assignment_id)
  WHERE practice_assignment_id IS NOT NULL AND practice_reminder_sent = FALSE;

-- Index for looking up practice by homework
CREATE INDEX IF NOT EXISTS idx_practice_assignments_homework
  ON practice_assignments(homework_assignment_id)
  WHERE homework_assignment_id IS NOT NULL;

-- Index for sessions by homework
CREATE INDEX IF NOT EXISTS idx_practice_sessions_homework
  ON student_practice_sessions(homework_assignment_id)
  WHERE homework_assignment_id IS NOT NULL;

-- Comments
COMMENT ON COLUMN homework_assignments.topic IS 'Topic for AI practice context (e.g., "Past tense verbs", "Restaurant vocabulary")';
COMMENT ON COLUMN homework_assignments.practice_assignment_id IS 'Optional linked practice assignment for extra AI reinforcement';
COMMENT ON COLUMN homework_assignments.practice_reminder_sent IS 'Whether 24h reminder for extra practice was sent';
COMMENT ON COLUMN practice_assignments.homework_assignment_id IS 'Optional linked homework this practice reinforces';
COMMENT ON COLUMN student_practice_sessions.homework_assignment_id IS 'Homework context for this practice session';
