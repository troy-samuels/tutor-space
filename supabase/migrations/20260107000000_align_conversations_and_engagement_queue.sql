-- ============================================================================
-- ALIGN CONVERSATIONS + BATCHED ENGAGEMENT SCORING
-- ============================================================================

-- ============================================================================
-- 1. Conversation schema alignment for app usage
-- ============================================================================

ALTER TABLE conversation_threads
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;

UPDATE conversation_threads
SET last_message_at = COALESCE(updated_at, created_at, NOW())
WHERE last_message_at IS NULL;

ALTER TABLE conversation_threads
  ALTER COLUMN last_message_at SET DEFAULT NOW();

ALTER TABLE conversation_messages
  ADD COLUMN IF NOT EXISTS tutor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS read_by_tutor BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS read_by_student BOOLEAN DEFAULT FALSE;

UPDATE conversation_messages
SET body = content
WHERE body IS NULL AND content IS NOT NULL;

UPDATE conversation_messages m
SET tutor_id = ct.tutor_id,
    student_id = ct.student_id
FROM conversation_threads ct
WHERE m.thread_id = ct.id
  AND (m.tutor_id IS NULL OR m.student_id IS NULL);

UPDATE conversation_messages
SET read_by_tutor = COALESCE(read_by_tutor, false),
    read_by_student = COALESCE(read_by_student, false)
WHERE read_by_tutor IS NULL OR read_by_student IS NULL;

DROP INDEX IF EXISTS idx_conversation_threads_tutor_updated;
CREATE INDEX IF NOT EXISTS idx_conversation_threads_tutor_last_message_at
  ON conversation_threads(tutor_id, last_message_at DESC);

-- ============================================================================
-- 2. Fix onboarding default template resolution
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

  SELECT id INTO v_template_id
  FROM student_onboarding_templates
  WHERE tutor_id = p_tutor_id
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_template_id IS NOT NULL THEN
    UPDATE student_onboarding_templates
    SET is_default = true
    WHERE id = v_template_id;
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
  WHERE tutor_id = p_tutor_id
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_template_id IS NOT NULL THEN
    UPDATE student_onboarding_templates
    SET is_default = true
    WHERE id = v_template_id;
  END IF;

  RETURN v_template_id;
END;
$$;

-- ============================================================================
-- 3. Engagement refresh queue (batched processing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_engagement_score_queue (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, tutor_id)
);

CREATE INDEX IF NOT EXISTS idx_engagement_score_queue_queued_at
  ON student_engagement_score_queue(queued_at);

ALTER TABLE student_engagement_score_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access engagement queue" ON student_engagement_score_queue;
CREATE POLICY "Service role full access engagement queue"
  ON student_engagement_score_queue FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE OR REPLACE FUNCTION queue_student_engagement_refresh(
  p_student_id UUID,
  p_tutor_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO student_engagement_score_queue (student_id, tutor_id, reason, queued_at)
  VALUES (p_student_id, p_tutor_id, p_reason, NOW())
  ON CONFLICT (student_id, tutor_id) DO UPDATE
  SET queued_at = EXCLUDED.queued_at,
      reason = EXCLUDED.reason;
END;
$$;

CREATE OR REPLACE FUNCTION process_engagement_score_queue(p_limit INTEGER DEFAULT 100)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  processed INTEGER := 0;
BEGIN
  FOR r IN
    SELECT id, student_id, tutor_id
    FROM student_engagement_score_queue
    ORDER BY queued_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  LOOP
    PERFORM upsert_student_engagement_score(r.student_id, r.tutor_id);
    DELETE FROM student_engagement_score_queue WHERE id = r.id;
    processed := processed + 1;
  END LOOP;

  RETURN processed;
END;
$$;

-- ============================================================================
-- 4. Override refresh triggers to queue (lightweight)
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
      PERFORM queue_student_engagement_refresh(NEW.student_id, NEW.tutor_id, 'booking_completed');
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status
      AND (NEW.status = 'completed' OR OLD.status = 'completed') THEN
      PERFORM queue_student_engagement_refresh(NEW.student_id, NEW.tutor_id, 'booking_status_change');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION refresh_engagement_on_homework_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  PERFORM queue_student_engagement_refresh(NEW.student_id, NEW.tutor_id, 'homework_change');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION refresh_engagement_on_practice_session()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM queue_student_engagement_refresh(NEW.student_id, NEW.tutor_id, 'practice_session');

  UPDATE students
  SET last_activity_at = COALESCE(NEW.ended_at, NEW.started_at, NOW())
  WHERE id = NEW.student_id AND tutor_id = NEW.tutor_id;

  RETURN NEW;
END;
$$;

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

  PERFORM queue_student_engagement_refresh(v_thread.student_id, v_thread.tutor_id, 'message');

  RETURN NEW;
END;
$$;
