-- ============================================================================
-- HOMEWORK NOTIFICATION FIELDS
-- Add fields to track notification state for homework assignments
-- ============================================================================

-- Add notification tracking fields to homework_assignments
ALTER TABLE homework_assignments
  ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Index for finding homework needing reminders
CREATE INDEX IF NOT EXISTS idx_homework_assignments_reminder
  ON homework_assignments(due_date, reminder_sent_at)
  WHERE status NOT IN ('completed', 'cancelled');

COMMENT ON COLUMN homework_assignments.notification_sent_at IS 'Timestamp when assignment notification was sent to student';
COMMENT ON COLUMN homework_assignments.reminder_sent_at IS 'Timestamp when 24h reminder was sent to student';
