-- ============================================================================
-- Add soft delete support for progress-related tables
-- ============================================================================

ALTER TABLE homework_assignments
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE homework_submissions
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE learning_goals
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_homework_assignments_deleted_at
  ON homework_assignments(deleted_at);

CREATE INDEX IF NOT EXISTS idx_homework_submissions_deleted_at
  ON homework_submissions(deleted_at);

CREATE INDEX IF NOT EXISTS idx_learning_goals_deleted_at
  ON learning_goals(deleted_at);
