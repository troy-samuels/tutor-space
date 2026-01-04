-- ============================================================================
-- STUDENT CRM LIFECYCLE ENHANCEMENT
-- Adds onboarding checklists, engagement scoring, and activity timeline
-- ============================================================================

-- ============================================================================
-- 1. ONBOARDING TEMPLATES
-- Tutor-defined checklists for student onboarding
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_onboarding_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  is_default BOOLEAN DEFAULT false,
  items JSONB NOT NULL DEFAULT '[]',
  -- items structure: [{ id: string, label: string, description?: string, order: number }]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tutor_id, name)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_templates_tutor
  ON student_onboarding_templates(tutor_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_templates_default
  ON student_onboarding_templates(tutor_id, is_default) WHERE is_default = true;

-- ============================================================================
-- 2. ONBOARDING PROGRESS
-- Per-student progress on onboarding checklist
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES student_onboarding_templates(id) ON DELETE SET NULL,

  -- Completed items (array of template item IDs)
  completed_items TEXT[] DEFAULT '{}',

  -- Overall status
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_id, tutor_id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_student
  ON student_onboarding_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_tutor
  ON student_onboarding_progress(tutor_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_status
  ON student_onboarding_progress(tutor_id, status);

-- ============================================================================
-- 3. ENGAGEMENT SCORES
-- Automated engagement tracking with tutor override capability
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_engagement_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Computed engagement score (0-100)
  score INTEGER DEFAULT 100 CHECK (score >= 0 AND score <= 100),

  -- Component scores for transparency
  lesson_frequency_score INTEGER DEFAULT 100 CHECK (lesson_frequency_score >= 0 AND lesson_frequency_score <= 100),
  response_rate_score INTEGER DEFAULT 100 CHECK (response_rate_score >= 0 AND response_rate_score <= 100),
  homework_completion_score INTEGER DEFAULT 100 CHECK (homework_completion_score >= 0 AND homework_completion_score <= 100),
  practice_engagement_score INTEGER DEFAULT 100 CHECK (practice_engagement_score >= 0 AND practice_engagement_score <= 100),

  -- Risk status (computed from score)
  risk_status TEXT DEFAULT 'healthy' CHECK (risk_status IN ('healthy', 'at_risk', 'critical', 'churned')),

  -- Manual override
  risk_status_override TEXT CHECK (risk_status_override IN ('healthy', 'at_risk', 'critical', 'churned', NULL)),
  override_reason TEXT,
  override_at TIMESTAMPTZ,
  override_by UUID REFERENCES profiles(id),

  -- Tracking metrics
  days_since_last_lesson INTEGER,
  days_since_last_message INTEGER,
  last_computed_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_id, tutor_id)
);

CREATE INDEX IF NOT EXISTS idx_engagement_scores_student
  ON student_engagement_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_engagement_scores_tutor
  ON student_engagement_scores(tutor_id);
CREATE INDEX IF NOT EXISTS idx_engagement_scores_risk
  ON student_engagement_scores(tutor_id, risk_status);
CREATE INDEX IF NOT EXISTS idx_engagement_scores_score
  ON student_engagement_scores(tutor_id, score);

-- ============================================================================
-- 4. TIMELINE EVENTS
-- Activity timeline for student journey tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'student_created', 'onboarding_started', 'onboarding_completed', 'onboarding_item_completed',
    'booking_created', 'booking_completed', 'booking_cancelled', 'booking_rescheduled',
    'message_sent', 'message_received',
    'homework_assigned', 'homework_completed', 'homework_submitted',
    'practice_session_completed', 'drill_completed',
    'goal_created', 'goal_completed',
    'assessment_recorded',
    'payment_received', 'package_purchased', 'subscription_started',
    'status_changed', 'risk_status_changed',
    'note_added', 'label_added', 'label_removed',
    'first_lesson', 'lesson_milestone'
  )),
  event_title TEXT NOT NULL,
  event_description TEXT,
  event_metadata JSONB DEFAULT '{}',

  -- Related entities
  related_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  related_homework_id UUID REFERENCES homework_assignments(id) ON DELETE SET NULL,
  related_message_id UUID,

  -- Visibility
  visible_to_student BOOLEAN DEFAULT false,
  is_milestone BOOLEAN DEFAULT false,

  event_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_student
  ON student_timeline_events(student_id);
CREATE INDEX IF NOT EXISTS idx_timeline_tutor
  ON student_timeline_events(tutor_id);
CREATE INDEX IF NOT EXISTS idx_timeline_type
  ON student_timeline_events(event_type);
CREATE INDEX IF NOT EXISTS idx_timeline_event_at
  ON student_timeline_events(student_id, event_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_milestone
  ON student_timeline_events(student_id, is_milestone) WHERE is_milestone = true;
CREATE INDEX IF NOT EXISTS idx_timeline_student_visible
  ON student_timeline_events(student_id, visible_to_student) WHERE visible_to_student = true;

-- ============================================================================
-- 5. COLUMN ADDITIONS TO STUDENTS TABLE
-- ============================================================================

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'not_started'
    CHECK (onboarding_status IN ('not_started', 'in_progress', 'completed')),
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 100
    CHECK (engagement_score >= 0 AND engagement_score <= 100),
  ADD COLUMN IF NOT EXISTS risk_status TEXT DEFAULT 'healthy'
    CHECK (risk_status IN ('healthy', 'at_risk', 'critical', 'churned')),
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_lesson_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_students_onboarding_status
  ON students(tutor_id, onboarding_status);
CREATE INDEX IF NOT EXISTS idx_students_risk_status
  ON students(tutor_id, risk_status);
CREATE INDEX IF NOT EXISTS idx_students_engagement
  ON students(tutor_id, engagement_score);
CREATE INDEX IF NOT EXISTS idx_students_last_activity
  ON students(tutor_id, last_activity_at DESC);

-- ============================================================================
-- 6. RLS POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE student_onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_engagement_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_timeline_events ENABLE ROW LEVEL SECURITY;

-- student_onboarding_templates policies
CREATE POLICY "Tutors manage own templates"
  ON student_onboarding_templates FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Service role full access templates"
  ON student_onboarding_templates FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- student_onboarding_progress policies
CREATE POLICY "Tutors manage onboarding progress"
  ON student_onboarding_progress FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Students view own onboarding progress"
  ON student_onboarding_progress FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Service role full access progress"
  ON student_onboarding_progress FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- student_engagement_scores policies
CREATE POLICY "Tutors manage engagement scores"
  ON student_engagement_scores FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Service role full access scores"
  ON student_engagement_scores FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- student_timeline_events policies
CREATE POLICY "Tutors manage student timeline"
  ON student_timeline_events FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Students view own visible timeline"
  ON student_timeline_events FOR SELECT
  USING (
    visible_to_student = true AND
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role full access timeline"
  ON student_timeline_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 7. ENGAGEMENT SCORE COMPUTATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION compute_student_engagement_score(
  p_student_id UUID,
  p_tutor_id UUID
)
RETURNS TABLE(
  score INTEGER,
  lesson_frequency_score INTEGER,
  response_rate_score INTEGER,
  homework_completion_score INTEGER,
  practice_engagement_score INTEGER,
  days_since_last_lesson INTEGER,
  days_since_last_message INTEGER,
  risk_status TEXT
) AS $$
DECLARE
  v_last_lesson TIMESTAMPTZ;
  v_last_message TIMESTAMPTZ;
  v_days_since_lesson INTEGER;
  v_days_since_message INTEGER;
  v_lesson_score INTEGER;
  v_response_score INTEGER;
  v_homework_score INTEGER;
  v_practice_score INTEGER;
  v_total_score INTEGER;
  v_risk TEXT;
  v_homework_assigned INTEGER;
  v_homework_completed INTEGER;
  v_practice_sessions INTEGER;
BEGIN
  -- Get last completed lesson date
  SELECT MAX(scheduled_at) INTO v_last_lesson
  FROM bookings
  WHERE student_id = p_student_id
    AND tutor_id = p_tutor_id
    AND status = 'completed';

  -- Get last message date (from either party)
  SELECT MAX(cm.created_at) INTO v_last_message
  FROM conversation_messages cm
  JOIN conversation_threads ct ON cm.thread_id = ct.id
  WHERE ct.student_id = p_student_id
    AND ct.tutor_id = p_tutor_id;

  -- Calculate days since last activity
  v_days_since_lesson := COALESCE(EXTRACT(DAY FROM NOW() - v_last_lesson)::INTEGER, 365);
  v_days_since_message := COALESCE(EXTRACT(DAY FROM NOW() - v_last_message)::INTEGER, 365);

  -- Lesson frequency score: 100 if within 14 days, decreases by 3 per day after
  v_lesson_score := GREATEST(0, 100 - (GREATEST(0, v_days_since_lesson - 14) * 3));

  -- Response rate score: 100 if within 7 days, decreases by 5 per day after
  v_response_score := GREATEST(0, 100 - (GREATEST(0, v_days_since_message - 7) * 5));

  -- Homework completion score: % of assigned homework completed
  SELECT COUNT(*) INTO v_homework_assigned
  FROM homework_assignments
  WHERE student_id = p_student_id AND tutor_id = p_tutor_id;

  SELECT COUNT(*) INTO v_homework_completed
  FROM homework_assignments
  WHERE student_id = p_student_id
    AND tutor_id = p_tutor_id
    AND status IN ('completed', 'submitted');

  IF v_homework_assigned > 0 THEN
    v_homework_score := (v_homework_completed::FLOAT / v_homework_assigned * 100)::INTEGER;
  ELSE
    v_homework_score := 100; -- No homework assigned = neutral score
  END IF;

  -- Practice engagement score: Based on sessions in last 30 days
  SELECT COUNT(*) INTO v_practice_sessions
  FROM student_practice_sessions
  WHERE student_id = p_student_id
    AND tutor_id = p_tutor_id
    AND started_at > NOW() - INTERVAL '30 days';

  v_practice_score := LEAST(100, v_practice_sessions * 20); -- 5 sessions = 100%

  -- Calculate total score (weighted average)
  -- Weights: Lesson 40%, Response 25%, Homework 20%, Practice 15%
  v_total_score := (
    v_lesson_score * 40 +
    v_response_score * 25 +
    v_homework_score * 20 +
    v_practice_score * 15
  ) / 100;

  -- Determine risk status based on score
  IF v_total_score >= 70 THEN
    v_risk := 'healthy';
  ELSIF v_total_score >= 40 THEN
    v_risk := 'at_risk';
  ELSIF v_total_score >= 20 THEN
    v_risk := 'critical';
  ELSE
    v_risk := 'churned';
  END IF;

  RETURN QUERY SELECT
    v_total_score,
    v_lesson_score,
    v_response_score,
    v_homework_score,
    v_practice_score,
    v_days_since_lesson,
    v_days_since_message,
    v_risk;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. HELPER FUNCTION: Ensure only one default template per tutor
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE student_onboarding_templates
    SET is_default = false
    WHERE tutor_id = NEW.tutor_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_default_template_trigger ON student_onboarding_templates;
CREATE TRIGGER ensure_single_default_template_trigger
  BEFORE INSERT OR UPDATE ON student_onboarding_templates
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_template();

-- ============================================================================
-- 9. UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_onboarding_templates_updated_at ON student_onboarding_templates;
CREATE TRIGGER update_onboarding_templates_updated_at
  BEFORE UPDATE ON student_onboarding_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_onboarding_progress_updated_at ON student_onboarding_progress;
CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON student_onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_engagement_scores_updated_at ON student_engagement_scores;
CREATE TRIGGER update_engagement_scores_updated_at
  BEFORE UPDATE ON student_engagement_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. TIMELINE EVENT TRIGGER FOR NEW STUDENTS
-- ============================================================================

CREATE OR REPLACE FUNCTION create_student_timeline_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO student_timeline_events (
    student_id,
    tutor_id,
    event_type,
    event_title,
    event_description,
    visible_to_student,
    is_milestone,
    event_at
  ) VALUES (
    NEW.id,
    NEW.tutor_id,
    'student_created',
    'Student joined',
    'Welcome to your language learning journey!',
    true,
    true,
    NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_student_timeline_on_insert ON students;
CREATE TRIGGER create_student_timeline_on_insert
  AFTER INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION create_student_timeline_event();

-- ============================================================================
-- 11. TIMELINE EVENT TRIGGER FOR BOOKINGS
-- ============================================================================

CREATE OR REPLACE FUNCTION create_booking_timeline_event()
RETURNS TRIGGER AS $$
DECLARE
  v_event_type TEXT;
  v_event_title TEXT;
  v_is_milestone BOOLEAN := false;
  v_lesson_count INTEGER;
BEGIN
  -- Determine event type based on status change
  IF TG_OP = 'INSERT' THEN
    v_event_type := 'booking_created';
    v_event_title := 'Lesson booked';
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
      v_event_type := 'booking_completed';
      v_event_title := 'Lesson completed';

      -- Check for lesson milestones (1st, 10th, 25th, 50th, 100th)
      SELECT COUNT(*) INTO v_lesson_count
      FROM bookings
      WHERE student_id = NEW.student_id
        AND tutor_id = NEW.tutor_id
        AND status = 'completed';

      IF v_lesson_count = 1 THEN
        v_is_milestone := true;
        v_event_type := 'first_lesson';
        v_event_title := 'First lesson completed!';

        -- Update first_lesson_at on student
        UPDATE students
        SET first_lesson_at = NEW.scheduled_at
        WHERE id = NEW.student_id;
      ELSIF v_lesson_count IN (10, 25, 50, 100) THEN
        v_is_milestone := true;
        v_event_type := 'lesson_milestone';
        v_event_title := v_lesson_count || ' lessons completed!';
      END IF;
    ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
      v_event_type := 'booking_cancelled';
      v_event_title := 'Lesson cancelled';
    ELSE
      RETURN NEW; -- No relevant status change
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO student_timeline_events (
    student_id,
    tutor_id,
    event_type,
    event_title,
    event_metadata,
    related_booking_id,
    visible_to_student,
    is_milestone,
    event_at
  ) VALUES (
    NEW.student_id,
    NEW.tutor_id,
    v_event_type,
    v_event_title,
    jsonb_build_object(
      'service_id', NEW.service_id,
      'scheduled_at', NEW.scheduled_at,
      'duration_minutes', NEW.duration_minutes
    ),
    NEW.id,
    true,
    v_is_milestone,
    COALESCE(NEW.scheduled_at, NOW())
  );

  -- Update last_activity_at on student
  UPDATE students
  SET last_activity_at = NOW()
  WHERE id = NEW.student_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_booking_timeline_on_insert ON bookings;
CREATE TRIGGER create_booking_timeline_on_insert
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_booking_timeline_event();

DROP TRIGGER IF EXISTS create_booking_timeline_on_update ON bookings;
CREATE TRIGGER create_booking_timeline_on_update
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_booking_timeline_event();

-- ============================================================================
-- 12. TIMELINE EVENT TRIGGER FOR HOMEWORK
-- ============================================================================

CREATE OR REPLACE FUNCTION create_homework_timeline_event()
RETURNS TRIGGER AS $$
DECLARE
  v_event_type TEXT;
  v_event_title TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event_type := 'homework_assigned';
    v_event_title := 'Homework assigned: ' || COALESCE(NEW.title, 'New assignment');
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
      v_event_type := 'homework_completed';
      v_event_title := 'Homework completed: ' || COALESCE(NEW.title, 'Assignment');
    ELSIF NEW.status = 'submitted' AND OLD.status != 'submitted' THEN
      v_event_type := 'homework_submitted';
      v_event_title := 'Homework submitted: ' || COALESCE(NEW.title, 'Assignment');
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO student_timeline_events (
    student_id,
    tutor_id,
    event_type,
    event_title,
    event_metadata,
    related_homework_id,
    visible_to_student,
    is_milestone,
    event_at
  ) VALUES (
    NEW.student_id,
    NEW.tutor_id,
    v_event_type,
    v_event_title,
    jsonb_build_object(
      'homework_title', NEW.title,
      'due_date', NEW.due_date
    ),
    NEW.id,
    true,
    false,
    NOW()
  );

  -- Update last_activity_at
  UPDATE students
  SET last_activity_at = NOW()
  WHERE id = NEW.student_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_homework_timeline_on_insert ON homework_assignments;
CREATE TRIGGER create_homework_timeline_on_insert
  AFTER INSERT ON homework_assignments
  FOR EACH ROW
  EXECUTE FUNCTION create_homework_timeline_event();

DROP TRIGGER IF EXISTS create_homework_timeline_on_update ON homework_assignments;
CREATE TRIGGER create_homework_timeline_on_update
  AFTER UPDATE ON homework_assignments
  FOR EACH ROW
  EXECUTE FUNCTION create_homework_timeline_event();
