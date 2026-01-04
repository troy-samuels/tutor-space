-- ============================================================================
-- STUDENT CRM AUTOMATION
-- Auto-init onboarding, keep engagement scores fresh, and log message activity
-- ============================================================================

-- ============================================================================
-- 1. ONBOARDING: Ensure a default template exists per tutor
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_default_onboarding_template(p_tutor_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_id UUID;
  v_items JSONB;
BEGIN
  SELECT id INTO v_template_id
  FROM student_onboarding_templates
  WHERE tutor_id = p_tutor_id AND is_default = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_template_id IS NOT NULL THEN
    RETURN v_template_id;
  END IF;

  v_items := jsonb_build_array(
    jsonb_build_object(
      'id', gen_random_uuid(),
      'label', 'Welcome message sent',
      'description', 'Send a personalized welcome message to the student',
      'order', 0
    ),
    jsonb_build_object(
      'id', gen_random_uuid(),
      'label', 'Learning goals discussed',
      'description', 'Understand what the student wants to achieve',
      'order', 1
    ),
    jsonb_build_object(
      'id', gen_random_uuid(),
      'label', 'Proficiency level assessed',
      'description', 'Evaluate current language skills',
      'order', 2
    ),
    jsonb_build_object(
      'id', gen_random_uuid(),
      'label', 'Schedule first lesson',
      'description', 'Book the initial lesson',
      'order', 3
    ),
    jsonb_build_object(
      'id', gen_random_uuid(),
      'label', 'First lesson completed',
      'description', 'Complete the introductory lesson',
      'order', 4
    )
  );

  INSERT INTO student_onboarding_templates (tutor_id, name, is_default, items)
  VALUES (p_tutor_id, 'Default Onboarding', true, v_items)
  RETURNING id INTO v_template_id;

  RETURN v_template_id;
EXCEPTION WHEN unique_violation THEN
  SELECT id INTO v_template_id
  FROM student_onboarding_templates
  WHERE tutor_id = p_tutor_id AND is_default = true
  ORDER BY created_at ASC
  LIMIT 1;

  RETURN v_template_id;
END;
$$;

-- ============================================================================
-- 2. ONBOARDING: Auto-init progress for new students
-- ============================================================================

CREATE OR REPLACE FUNCTION init_student_onboarding_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_id UUID;
BEGIN
  v_template_id := ensure_default_onboarding_template(NEW.tutor_id);

  INSERT INTO student_onboarding_progress (
    student_id,
    tutor_id,
    template_id,
    completed_items,
    status,
    started_at,
    completed_at
  )
  VALUES (
    NEW.id,
    NEW.tutor_id,
    v_template_id,
    '{}'::TEXT[],
    'not_started',
    NULL,
    NULL
  )
  ON CONFLICT (student_id, tutor_id) DO NOTHING;

  UPDATE students
  SET onboarding_status = COALESCE(onboarding_status, 'not_started')
  WHERE id = NEW.id AND tutor_id = NEW.tutor_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS init_student_onboarding_on_insert ON students;
CREATE TRIGGER init_student_onboarding_on_insert
  AFTER INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION init_student_onboarding_progress();

-- Backfill onboarding progress for existing students
DO $$
BEGIN
  WITH tutors AS (
    SELECT DISTINCT tutor_id FROM students
  ),
  templates AS (
    SELECT tutor_id, ensure_default_onboarding_template(tutor_id) AS template_id
    FROM tutors
  ),
  missing AS (
    SELECT s.id AS student_id, s.tutor_id, t.template_id
    FROM students s
    JOIN templates t ON t.tutor_id = s.tutor_id
    LEFT JOIN student_onboarding_progress p
      ON p.student_id = s.id AND p.tutor_id = s.tutor_id
    WHERE p.id IS NULL
  )
  INSERT INTO student_onboarding_progress (
    student_id,
    tutor_id,
    template_id,
    completed_items,
    status,
    started_at,
    completed_at
  )
  SELECT
    student_id,
    tutor_id,
    template_id,
    '{}'::TEXT[],
    'not_started',
    NULL,
    NULL
  FROM missing
  ON CONFLICT (student_id, tutor_id) DO NOTHING;
END;
$$;

-- Allow students to read templates referenced by their progress
DROP POLICY IF EXISTS "Students view templates used in onboarding" ON student_onboarding_templates;
CREATE POLICY "Students view templates used in onboarding"
  ON student_onboarding_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM student_onboarding_progress p
      JOIN students s ON s.id = p.student_id
      WHERE p.template_id = student_onboarding_templates.id
        AND s.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. ENGAGEMENT: Upsert helper used by triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION upsert_student_engagement_score(
  p_student_id UUID,
  p_tutor_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score RECORD;
  v_override TEXT;
BEGIN
  SELECT * INTO v_score
  FROM compute_student_engagement_score(p_student_id, p_tutor_id);

  IF v_score IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO student_engagement_scores (
    student_id,
    tutor_id,
    score,
    lesson_frequency_score,
    response_rate_score,
    homework_completion_score,
    practice_engagement_score,
    risk_status,
    days_since_last_lesson,
    days_since_last_message,
    last_computed_at
  ) VALUES (
    p_student_id,
    p_tutor_id,
    v_score.score,
    v_score.lesson_frequency_score,
    v_score.response_rate_score,
    v_score.homework_completion_score,
    v_score.practice_engagement_score,
    v_score.risk_status,
    v_score.days_since_last_lesson,
    v_score.days_since_last_message,
    NOW()
  )
  ON CONFLICT (student_id, tutor_id) DO UPDATE SET
    score = EXCLUDED.score,
    lesson_frequency_score = EXCLUDED.lesson_frequency_score,
    response_rate_score = EXCLUDED.response_rate_score,
    homework_completion_score = EXCLUDED.homework_completion_score,
    practice_engagement_score = EXCLUDED.practice_engagement_score,
    risk_status = EXCLUDED.risk_status,
    days_since_last_lesson = EXCLUDED.days_since_last_lesson,
    days_since_last_message = EXCLUDED.days_since_last_message,
    last_computed_at = EXCLUDED.last_computed_at;

  SELECT risk_status_override INTO v_override
  FROM student_engagement_scores
  WHERE student_id = p_student_id AND tutor_id = p_tutor_id;

  UPDATE students
  SET engagement_score = v_score.score,
      risk_status = COALESCE(v_override, v_score.risk_status)
  WHERE id = p_student_id AND tutor_id = p_tutor_id;
END;
$$;

-- ============================================================================
-- 4. ENGAGEMENT: Refresh on key activity
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_engagement_on_booking_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'completed' THEN
      PERFORM upsert_student_engagement_score(NEW.student_id, NEW.tutor_id);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status
      AND (NEW.status = 'completed' OR OLD.status = 'completed') THEN
      PERFORM upsert_student_engagement_score(NEW.student_id, NEW.tutor_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refresh_engagement_on_booking_change ON bookings;
CREATE TRIGGER refresh_engagement_on_booking_change
  AFTER INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION refresh_engagement_on_booking_change();

CREATE OR REPLACE FUNCTION refresh_engagement_on_homework_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
      RETURN NEW;
    END IF;
  END IF;

  PERFORM upsert_student_engagement_score(NEW.student_id, NEW.tutor_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refresh_engagement_on_homework_change ON homework_assignments;
CREATE TRIGGER refresh_engagement_on_homework_change
  AFTER INSERT OR UPDATE OF status ON homework_assignments
  FOR EACH ROW
  EXECUTE FUNCTION refresh_engagement_on_homework_change();

CREATE OR REPLACE FUNCTION refresh_engagement_on_practice_session()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM upsert_student_engagement_score(NEW.student_id, NEW.tutor_id);

  UPDATE students
  SET last_activity_at = COALESCE(NEW.ended_at, NEW.started_at, NOW())
  WHERE id = NEW.student_id AND tutor_id = NEW.tutor_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refresh_engagement_on_practice_session ON student_practice_sessions;
CREATE TRIGGER refresh_engagement_on_practice_session
  AFTER INSERT ON student_practice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION refresh_engagement_on_practice_session();

-- ============================================================================
-- 5. TIMELINE: Log message events and refresh engagement
-- ============================================================================

CREATE OR REPLACE FUNCTION create_message_timeline_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_thread RECORD;
  v_event_type TEXT;
  v_event_title TEXT;
BEGIN
  SELECT tutor_id, student_id INTO v_thread
  FROM conversation_threads
  WHERE id = NEW.thread_id;

  IF v_thread.tutor_id IS NULL OR v_thread.student_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.sender_role = 'student' THEN
    v_event_type := 'message_received';
    v_event_title := 'Message received from student';
  ELSIF NEW.sender_role = 'tutor' THEN
    v_event_type := 'message_sent';
    v_event_title := 'Tutor sent a message';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO student_timeline_events (
    student_id,
    tutor_id,
    event_type,
    event_title,
    event_metadata,
    related_message_id,
    visible_to_student,
    is_milestone,
    event_at
  ) VALUES (
    v_thread.student_id,
    v_thread.tutor_id,
    v_event_type,
    v_event_title,
    jsonb_build_object('thread_id', NEW.thread_id, 'sender_role', NEW.sender_role),
    NEW.id,
    true,
    false,
    COALESCE(NEW.created_at, NOW())
  );

  UPDATE students
  SET last_activity_at = COALESCE(NEW.created_at, NOW())
  WHERE id = v_thread.student_id AND tutor_id = v_thread.tutor_id;

  PERFORM upsert_student_engagement_score(v_thread.student_id, v_thread.tutor_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_message_timeline_on_insert ON conversation_messages;
CREATE TRIGGER create_message_timeline_on_insert
  AFTER INSERT ON conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_timeline_event();

-- ============================================================================
-- 6. OPTIONAL: Manual bulk refresh for backfill or ops runs
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_all_engagement_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, tutor_id
    FROM students
    WHERE status IN ('active', 'trial')
  LOOP
    PERFORM upsert_student_engagement_score(r.id, r.tutor_id);
  END LOOP;
END;
$$;

-- ============================================================================
-- 7. PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_students_tutor_created_at
  ON students(tutor_id, created_at DESC);

-- Use updated_at instead of last_message_at (column doesn't exist)
CREATE INDEX IF NOT EXISTS idx_conversation_threads_tutor_updated
  ON conversation_threads(tutor_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_thread_created_at
  ON conversation_messages(thread_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_timeline_student_tutor_event_at
  ON student_timeline_events(student_id, tutor_id, event_at DESC);
