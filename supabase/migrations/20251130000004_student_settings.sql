-- ============================================================================
-- STUDENT SETTINGS & PREFERENCES
-- Tables for student account settings and preferences
-- ============================================================================

-- Student preferences table (extends student user accounts)
CREATE TABLE IF NOT EXISTS student_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone TEXT DEFAULT 'UTC',
  preferred_language TEXT DEFAULT 'en',
  notification_sound BOOLEAN DEFAULT TRUE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_student_preferences_user ON student_preferences (user_id);

-- Add email preference columns to students table
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS email_booking_reminders BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_lesson_updates BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_marketing BOOLEAN DEFAULT FALSE;

-- Enable RLS
ALTER TABLE student_preferences ENABLE ROW LEVEL SECURITY;

-- Students can manage their own preferences
CREATE POLICY "Students manage own preferences"
  ON student_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role can manage all preferences
CREATE POLICY "Service role manages student_preferences"
  ON student_preferences FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_student_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_student_preferences_set_updated_at ON student_preferences;
CREATE TRIGGER trg_student_preferences_set_updated_at
  BEFORE UPDATE ON student_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_student_preferences_updated_at();

-- Function to ensure student preferences exist
CREATE OR REPLACE FUNCTION ensure_student_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO student_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
