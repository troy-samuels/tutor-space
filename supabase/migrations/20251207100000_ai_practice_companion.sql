-- AI Practice Companion Migration
-- Enables AI-powered language practice for students between human tutor sessions

-- ============================================
-- 1. Practice Scenarios (Tutor-created templates)
-- ============================================

CREATE TABLE IF NOT EXISTS practice_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  description TEXT,
  language TEXT NOT NULL,
  level TEXT CHECK (level IS NULL OR level IN ('beginner', 'intermediate', 'advanced', 'all')),
  topic TEXT,

  -- AI Configuration
  system_prompt TEXT NOT NULL,
  vocabulary_focus TEXT[] DEFAULT '{}',
  grammar_focus TEXT[] DEFAULT '{}',
  example_conversation JSONB,

  -- Settings
  max_messages INTEGER DEFAULT 20,
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT FALSE, -- Share with other tutors in future

  -- Stats
  times_used INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for tutor lookup
CREATE INDEX IF NOT EXISTS idx_practice_scenarios_tutor
  ON practice_scenarios(tutor_id);

-- ============================================
-- 2. Practice Assignments (Tutor assigns to student)
-- ============================================

CREATE TABLE IF NOT EXISTS practice_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES practice_scenarios(id) ON DELETE SET NULL,

  -- Assignment details
  title TEXT NOT NULL,
  instructions TEXT,

  -- Status tracking
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
  due_date TIMESTAMPTZ,

  -- Completion
  completed_at TIMESTAMPTZ,
  sessions_completed INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_practice_assignments_tutor
  ON practice_assignments(tutor_id);
CREATE INDEX IF NOT EXISTS idx_practice_assignments_student
  ON practice_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_practice_assignments_status
  ON practice_assignments(status);

-- ============================================
-- 3. Practice Sessions (Actual conversations)
-- ============================================

CREATE TABLE IF NOT EXISTS student_practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES practice_assignments(id) ON DELETE SET NULL,
  scenario_id UUID REFERENCES practice_scenarios(id) ON DELETE SET NULL,

  -- Context
  language TEXT NOT NULL,
  level TEXT,
  topic TEXT,

  -- Session stats
  message_count INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  estimated_cost_cents INTEGER DEFAULT 0,
  duration_seconds INTEGER,

  -- AI Feedback (generated at end of session)
  ai_feedback JSONB, -- {vocabulary_used: [], grammar_issues: [], suggestions: [], overall_rating: number}

  -- Student rating
  student_rating INTEGER CHECK (student_rating IS NULL OR student_rating BETWEEN 1 AND 5),

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_practice_sessions_student
  ON student_practice_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_tutor
  ON student_practice_sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_assignment
  ON student_practice_sessions(assignment_id);

-- ============================================
-- 4. Practice Messages
-- ============================================

CREATE TABLE IF NOT EXISTS student_practice_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES student_practice_sessions(id) ON DELETE CASCADE,

  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- AI analysis (for assistant messages)
  corrections JSONB, -- [{original: string, corrected: string, explanation: string}]
  vocabulary_used TEXT[],

  -- Token tracking
  tokens_used INTEGER,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for session lookup
CREATE INDEX IF NOT EXISTS idx_practice_messages_session
  ON student_practice_messages(session_id);

-- ============================================
-- 5. Student Subscription Tracking
-- ============================================

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS ai_practice_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_practice_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS ai_practice_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS ai_practice_current_period_end TIMESTAMPTZ;

-- ============================================
-- 6. Learning Stats Enhancement
-- ============================================

ALTER TABLE learning_stats
  ADD COLUMN IF NOT EXISTS practice_sessions_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS practice_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS practice_messages_sent INTEGER DEFAULT 0;

-- ============================================
-- 7. Row Level Security
-- ============================================

ALTER TABLE practice_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_practice_messages ENABLE ROW LEVEL SECURITY;

-- Tutors manage their own scenarios
CREATE POLICY "Tutors manage own scenarios"
  ON practice_scenarios FOR ALL
  USING (tutor_id = auth.uid());

-- Tutors manage assignments for their students
CREATE POLICY "Tutors manage own assignments"
  ON practice_assignments FOR ALL
  USING (tutor_id = auth.uid());

-- Service role manages all practice data (for API routes)
CREATE POLICY "Service role manages practice sessions"
  ON student_practice_sessions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Tutors view student sessions"
  ON student_practice_sessions FOR SELECT
  USING (tutor_id = auth.uid());

CREATE POLICY "Service role manages practice messages"
  ON student_practice_messages FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 8. Triggers
-- ============================================

-- Update scenario usage count
CREATE OR REPLACE FUNCTION increment_scenario_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.scenario_id IS NOT NULL THEN
    UPDATE practice_scenarios
    SET times_used = COALESCE(times_used, 0) + 1,
        updated_at = NOW()
    WHERE id = NEW.scenario_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS practice_session_scenario_usage ON student_practice_sessions;
CREATE TRIGGER practice_session_scenario_usage
  AFTER INSERT ON student_practice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION increment_scenario_usage();

-- Update learning_stats when session ends
CREATE OR REPLACE FUNCTION update_practice_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    -- Session just ended, update stats
    UPDATE learning_stats
    SET practice_sessions_completed = COALESCE(practice_sessions_completed, 0) + 1,
        practice_minutes = COALESCE(practice_minutes, 0) + COALESCE(NEW.duration_seconds, 0) / 60,
        practice_messages_sent = COALESCE(practice_messages_sent, 0) + COALESCE(NEW.message_count, 0),
        updated_at = NOW()
    WHERE student_id = NEW.student_id
      AND tutor_id = NEW.tutor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS practice_session_stats_update ON student_practice_sessions;
CREATE TRIGGER practice_session_stats_update
  AFTER UPDATE ON student_practice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_practice_stats();

-- Update assignment status when session completed
CREATE OR REPLACE FUNCTION update_assignment_on_session_end()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL AND NEW.assignment_id IS NOT NULL THEN
    UPDATE practice_assignments
    SET sessions_completed = COALESCE(sessions_completed, 0) + 1,
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.assignment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS practice_session_assignment_update ON student_practice_sessions;
CREATE TRIGGER practice_session_assignment_update
  AFTER UPDATE ON student_practice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_assignment_on_session_end();

-- ============================================
-- 9. Updated_at Triggers
-- ============================================

CREATE OR REPLACE FUNCTION update_practice_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS practice_scenarios_updated_at ON practice_scenarios;
CREATE TRIGGER practice_scenarios_updated_at
  BEFORE UPDATE ON practice_scenarios
  FOR EACH ROW
  EXECUTE FUNCTION update_practice_timestamps();

DROP TRIGGER IF EXISTS practice_assignments_updated_at ON practice_assignments;
CREATE TRIGGER practice_assignments_updated_at
  BEFORE UPDATE ON practice_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_practice_timestamps();

-- ============================================
-- 10. Default Scenarios (Starter templates)
-- ============================================

-- These will be created by tutors, but we could add system defaults here
-- For now, leaving this for the tutor to create custom scenarios

-- ============================================
-- 11. Comments
-- ============================================

COMMENT ON TABLE practice_scenarios IS
  'AI conversation practice templates created by tutors. Students can practice with these scenarios between lessons.';

COMMENT ON TABLE practice_assignments IS
  'Tutor-assigned practice tasks for specific students, similar to homework but for AI conversation practice.';

COMMENT ON TABLE student_practice_sessions IS
  'Individual AI practice conversation sessions. Tracks messages, duration, and generates feedback.';

COMMENT ON TABLE student_practice_messages IS
  'Messages within a practice session. Includes AI corrections and vocabulary tracking.';

COMMENT ON COLUMN students.ai_practice_enabled IS
  'Whether student has active AI Practice subscription ($6/month, 25% platform share).';
