-- Student portal performance optimization indexes
-- These indexes support the common query patterns in student pages

-- Students: user_id lookup (used in getStudentSession, messages, etc.)
CREATE INDEX IF NOT EXISTS idx_students_user_id_active
  ON students (user_id)
  WHERE deleted_at IS NULL;

-- Conversation threads: student thread list sorted by last message
CREATE INDEX IF NOT EXISTS idx_conversation_threads_student_last_message
  ON conversation_threads (student_id, last_message_at DESC);

-- Homework assignments: student homework with status filter
CREATE INDEX IF NOT EXISTS idx_homework_assignments_student_status_due
  ON homework_assignments (student_id, status, due_date);

-- Homework submissions: lookup by homework_id for latest submission
CREATE INDEX IF NOT EXISTS idx_homework_submissions_homework_created
  ON homework_submissions (homework_id, created_at DESC);

-- Notifications: user notifications for student role (unread filter)
CREATE INDEX IF NOT EXISTS idx_notifications_user_role_unread
  ON notifications (user_id, user_role, read_at, created_at DESC)
  WHERE user_role = 'student';

-- Student practice sessions: recent sessions for progress
CREATE INDEX IF NOT EXISTS idx_student_practice_sessions_student_started
  ON student_practice_sessions (student_id, started_at DESC);

-- Student preferences: avatar lookup (used in getStudentAvatarUrl)
CREATE INDEX IF NOT EXISTS idx_student_preferences_user_id
  ON student_preferences (user_id);
