-- ============================================================================
-- STUDENT PROGRESS TRACKING
-- Tables for tracking student learning progress and goals
-- ============================================================================

-- Learning goals table
CREATE TABLE IF NOT EXISTS learning_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Goal details
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,

  -- Progress
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_goals_student ON learning_goals(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_goals_tutor ON learning_goals(tutor_id);
CREATE INDEX IF NOT EXISTS idx_learning_goals_status ON learning_goals(status);

-- Proficiency assessments
CREATE TABLE IF NOT EXISTS proficiency_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Assessment details
  skill_area TEXT NOT NULL CHECK (skill_area IN ('speaking', 'listening', 'reading', 'writing', 'vocabulary', 'grammar', 'pronunciation', 'overall')),
  level TEXT NOT NULL CHECK (level IN ('beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'proficient')),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  notes TEXT,

  assessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proficiency_student ON proficiency_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_proficiency_tutor ON proficiency_assessments(tutor_id);
CREATE INDEX IF NOT EXISTS idx_proficiency_skill ON proficiency_assessments(skill_area);
CREATE INDEX IF NOT EXISTS idx_proficiency_assessed_at ON proficiency_assessments(assessed_at DESC);

-- Lesson notes/feedback
CREATE TABLE IF NOT EXISTS lesson_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Lesson summary
  topics_covered TEXT[],
  vocabulary_introduced TEXT[],
  grammar_points TEXT[],
  homework TEXT,

  -- Feedback
  strengths TEXT,
  areas_to_improve TEXT,
  tutor_notes TEXT, -- Private notes for tutor
  student_visible_notes TEXT, -- Notes visible to student

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_notes_booking ON lesson_notes(booking_id);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_student ON lesson_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_tutor ON lesson_notes(tutor_id);

-- Learning streaks and stats
CREATE TABLE IF NOT EXISTS learning_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Cumulative stats
  total_lessons INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  lessons_this_month INTEGER DEFAULT 0,
  minutes_this_month INTEGER DEFAULT 0,

  -- Streaks
  current_streak INTEGER DEFAULT 0, -- Current week streak
  longest_streak INTEGER DEFAULT 0,
  last_lesson_at TIMESTAMPTZ,

  -- Engagement
  messages_sent INTEGER DEFAULT 0,
  homework_completed INTEGER DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_id, tutor_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_stats_student ON learning_stats(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_stats_tutor ON learning_stats(tutor_id);

-- Enable RLS
ALTER TABLE learning_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proficiency_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_stats ENABLE ROW LEVEL SECURITY;

-- Tutors can manage goals for their students
CREATE POLICY "Tutors manage learning_goals"
  ON learning_goals FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Students can view their own goals
CREATE POLICY "Students view own learning_goals"
  ON learning_goals FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Tutors manage assessments
CREATE POLICY "Tutors manage proficiency_assessments"
  ON proficiency_assessments FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Students view own assessments
CREATE POLICY "Students view own proficiency_assessments"
  ON proficiency_assessments FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Tutors manage lesson notes
CREATE POLICY "Tutors manage lesson_notes"
  ON lesson_notes FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Students view their visible lesson notes
CREATE POLICY "Students view own lesson_notes"
  ON lesson_notes FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Tutors manage learning stats
CREATE POLICY "Tutors manage learning_stats"
  ON learning_stats FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Students view own stats
CREATE POLICY "Students view own learning_stats"
  ON learning_stats FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Service role policies
CREATE POLICY "Service role manages learning_goals"
  ON learning_goals FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages proficiency_assessments"
  ON proficiency_assessments FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages lesson_notes"
  ON lesson_notes FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages learning_stats"
  ON learning_stats FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Function to update learning stats after a booking
CREATE OR REPLACE FUNCTION update_learning_stats_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update on completed bookings
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO learning_stats (student_id, tutor_id, total_lessons, total_minutes, last_lesson_at)
    VALUES (NEW.student_id, NEW.tutor_id, 1, NEW.duration_minutes, NOW())
    ON CONFLICT (student_id, tutor_id) DO UPDATE SET
      total_lessons = learning_stats.total_lessons + 1,
      total_minutes = learning_stats.total_minutes + NEW.duration_minutes,
      last_lesson_at = NOW(),
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_learning_stats ON bookings;
CREATE TRIGGER trg_update_learning_stats
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_learning_stats_on_booking();
