-- Migration: Post-lesson automation feature (2026-01-25)
-- Enables tutors to automatically send follow-up messages to students after lessons complete

-- ============================================================================
-- Table: automation_rules
-- Stores tutor automation configurations
-- ============================================================================

CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Post-lesson follow-up',
  trigger_type TEXT NOT NULL DEFAULT 'lesson_completed',
  audience_type TEXT NOT NULL DEFAULT 'all_students' CHECK (audience_type IN ('all_students', 'specific_student')),
  target_student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  message_body TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tutor_id, trigger_type)
);

-- Index for quickly finding active rules by tutor
CREATE INDEX idx_automation_rules_active ON automation_rules(tutor_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- Tutors can only manage their own rules
CREATE POLICY "Tutors manage own automation rules"
  ON automation_rules FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- ============================================================================
-- Table: automation_events
-- Lightweight trigger output, processed by server cron
-- ============================================================================

CREATE TABLE automation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'skipped', 'failed')),
  skipped_reason TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Index for finding pending events to process
CREATE INDEX idx_automation_events_pending ON automation_events(status) WHERE status = 'pending';

-- Index for tutor activity list
CREATE INDEX idx_automation_events_tutor ON automation_events(tutor_id, created_at DESC);

-- Enable RLS
ALTER TABLE automation_events ENABLE ROW LEVEL SECURITY;

-- Tutors can view their own events (read-only for tutors, server uses service role)
CREATE POLICY "Tutors view own automation events"
  ON automation_events FOR SELECT
  USING (tutor_id = auth.uid());

-- ============================================================================
-- Table: automation_cooldowns
-- Per-student cooldown tracking (prevents duplicate messages)
-- ============================================================================

CREATE TABLE automation_cooldowns (
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tutor_id, student_id, rule_id)
);

-- Enable RLS
ALTER TABLE automation_cooldowns ENABLE ROW LEVEL SECURITY;

-- Tutors can view their own cooldowns
CREATE POLICY "Tutors view own cooldowns"
  ON automation_cooldowns FOR SELECT
  USING (tutor_id = auth.uid());

-- ============================================================================
-- Trigger Function: queue_automation_event
-- Queues events when booking status changes to 'completed'
-- ============================================================================

CREATE OR REPLACE FUNCTION queue_automation_event()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id UUID;
BEGIN
  -- Only trigger when status changes TO 'completed' (not from)
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Skip if no student on the booking
    IF NEW.student_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Resolve booking student to a students.id (supports legacy user_id mapping)
    SELECT s.id
    INTO v_student_id
    FROM students s
    WHERE s.tutor_id = NEW.tutor_id
      AND (s.id = NEW.student_id OR s.user_id = NEW.student_id)
    LIMIT 1;

    -- If no matching student record, do not enqueue
    IF v_student_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Queue automation event for each matching active rule
    INSERT INTO automation_events (tutor_id, student_id, booking_id, rule_id, status)
    SELECT
      NEW.tutor_id,
      v_student_id,
      NEW.id,
      r.id,
      'pending'
    FROM automation_rules r
    WHERE r.tutor_id = NEW.tutor_id
      AND r.is_active = true
      AND r.trigger_type = 'lesson_completed'
      AND (r.audience_type = 'all_students' OR r.target_student_id = v_student_id);
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'queue_automation_event failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- Trigger: on_booking_completed
-- Fires when a booking is updated
-- ============================================================================

CREATE TRIGGER on_booking_completed
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION queue_automation_event();

-- ============================================================================
-- Updated at trigger for automation_rules
-- ============================================================================

CREATE TRIGGER set_automation_rules_updated_at
  BEFORE UPDATE ON automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
