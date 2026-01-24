-- ============================================================================
-- AUTOMATION EXPANSION
-- Adds support for new trigger types: student_inactive, package_low_balance,
-- trial_completed_no_purchase
-- Includes retry logic, scheduled execution, and enterprise improvements
-- ============================================================================

-- ============================================================================
-- 1. ADD TRIGGER SETTINGS TO AUTOMATION_RULES
-- ============================================================================

ALTER TABLE automation_rules
  ADD COLUMN IF NOT EXISTS trigger_settings JSONB DEFAULT '{}';

-- Comment explaining trigger_settings structure per trigger type:
-- lesson_completed: { cooldown_hours: 24 }
-- student_inactive: { days_inactive: 14, cooldown_hours: 720 }
-- package_low_balance: { threshold_minutes: 60, cooldown_hours: 168 }
-- trial_completed_no_purchase: { delay_hours: 24, check_for_package: true, check_for_subscription: true }

COMMENT ON COLUMN automation_rules.trigger_settings IS
  'JSON configuration specific to each trigger type. See migration comments for schema.';

-- ============================================================================
-- 2. ADD SCHEDULED EXECUTION SUPPORT TO AUTOMATION_EVENTS
-- ============================================================================

ALTER TABLE automation_events
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS requires_condition_check BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS condition_check_data JSONB,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3;

-- Make booking_id nullable for non-booking triggers (inactive students, etc.)
ALTER TABLE automation_events
  ALTER COLUMN booking_id DROP NOT NULL;

COMMENT ON COLUMN automation_events.scheduled_for IS
  'When this event should be processed. Defaults to NOW() for immediate processing.';
COMMENT ON COLUMN automation_events.requires_condition_check IS
  'If true, condition must be re-verified at send time (e.g., check if student purchased).';
COMMENT ON COLUMN automation_events.condition_check_data IS
  'Data needed for condition checking at send time.';
COMMENT ON COLUMN automation_events.retry_count IS
  'Number of retry attempts made for this event.';
COMMENT ON COLUMN automation_events.next_retry_at IS
  'When to retry this event after a failure.';

-- ============================================================================
-- 3. UPDATE INDEX FOR SCHEDULED PROCESSING
-- ============================================================================

DROP INDEX IF EXISTS idx_automation_events_pending;
CREATE INDEX idx_automation_events_pending_scheduled
  ON automation_events(status, scheduled_for)
  WHERE status = 'pending';

-- Index for retry processing
CREATE INDEX idx_automation_events_retry
  ON automation_events(status, next_retry_at)
  WHERE status = 'failed' AND next_retry_at IS NOT NULL;

-- ============================================================================
-- 4. ADJUST UNIQUE CONSTRAINT FOR SINGLE-INSTANCE TRIGGERS
-- ============================================================================

-- Drop the existing unique constraint (preparing for multi-instance triggers)
ALTER TABLE automation_rules
  DROP CONSTRAINT IF EXISTS automation_rules_tutor_id_trigger_type_key;

-- Add a partial index instead to prevent duplicates only for single-instance triggers
CREATE UNIQUE INDEX idx_automation_rules_single_instance
  ON automation_rules(tutor_id, trigger_type)
  WHERE trigger_type IN ('lesson_completed', 'student_inactive', 'package_low_balance', 'trial_completed_no_purchase');

-- ============================================================================
-- 5. ADD CONTEXT_KEY TO COOLDOWNS FOR PACKAGE-SPECIFIC COOLDOWNS
-- ============================================================================

ALTER TABLE automation_cooldowns
  ADD COLUMN IF NOT EXISTS context_key TEXT;

-- Backfill if the column already existed with null values
UPDATE automation_cooldowns
SET context_key = ''
WHERE context_key IS NULL;

ALTER TABLE automation_cooldowns
  ALTER COLUMN context_key SET DEFAULT '',
  ALTER COLUMN context_key SET NOT NULL;

-- Drop existing primary key and recreate with context_key
ALTER TABLE automation_cooldowns
  DROP CONSTRAINT IF EXISTS automation_cooldowns_pkey;

ALTER TABLE automation_cooldowns
  ADD PRIMARY KEY (tutor_id, student_id, rule_id, context_key);

COMMENT ON COLUMN automation_cooldowns.context_key IS
  'Optional context for cooldown (e.g., package_id for low-balance alerts).';

-- ============================================================================
-- 6. UPDATE QUEUE_AUTOMATION_EVENT FOR TRIAL LESSONS
-- ============================================================================

CREATE OR REPLACE FUNCTION queue_automation_event()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id UUID;
  v_service_offer_type TEXT;
  v_rule RECORD;
  v_delay_hours INTEGER;
  v_scheduled_for TIMESTAMPTZ;
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

    -- Check if this is a trial lesson
    SELECT offer_type INTO v_service_offer_type
    FROM services
    WHERE id = NEW.service_id;

    -- Queue automation events for matching active rules
    FOR v_rule IN
      SELECT r.*
      FROM automation_rules r
      WHERE r.tutor_id = NEW.tutor_id
        AND r.is_active = true
        AND (
          -- lesson_completed triggers immediately
          (r.trigger_type = 'lesson_completed' AND (r.audience_type = 'all_students' OR r.target_student_id = v_student_id))
          OR
          -- trial_completed_no_purchase triggers after delay (only for trial lessons)
          (r.trigger_type = 'trial_completed_no_purchase'
            AND v_service_offer_type = 'trial'
            AND (r.audience_type = 'all_students' OR r.target_student_id = v_student_id))
        )
    LOOP
      -- Calculate scheduled time based on trigger type
      IF v_rule.trigger_type = 'trial_completed_no_purchase' THEN
        v_delay_hours := COALESCE((v_rule.trigger_settings->>'delay_hours')::INTEGER, 24);
        v_scheduled_for := NOW() + (v_delay_hours || ' hours')::INTERVAL;

        INSERT INTO automation_events (
          tutor_id, student_id, booking_id, rule_id, status,
          scheduled_for, requires_condition_check, condition_check_data
        ) VALUES (
          NEW.tutor_id,
          v_student_id,
          NEW.id,
          v_rule.id,
          'pending',
          v_scheduled_for,
          true,
          jsonb_build_object(
            'check_for_package', COALESCE((v_rule.trigger_settings->>'check_for_package')::BOOLEAN, true),
            'check_for_subscription', COALESCE((v_rule.trigger_settings->>'check_for_subscription')::BOOLEAN, true),
            'trial_booking_id', NEW.id
          )
        );
      ELSE
        -- Standard immediate trigger (lesson_completed)
        INSERT INTO automation_events (
          tutor_id, student_id, booking_id, rule_id, status, scheduled_for
        ) VALUES (
          NEW.tutor_id,
          v_student_id,
          NEW.id,
          v_rule.id,
          'pending',
          NOW()
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'queue_automation_event failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 7. HEALTH MONITORING VIEW
-- ============================================================================

CREATE OR REPLACE VIEW automation_health_stats AS
SELECT
  tutor_id,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'sent' AND processed_at > NOW() - INTERVAL '24 hours') as sent_24h,
  COUNT(*) FILTER (WHERE status = 'skipped' AND processed_at > NOW() - INTERVAL '24 hours') as skipped_24h,
  COUNT(*) FILTER (WHERE status = 'failed' AND processed_at > NOW() - INTERVAL '24 hours') as failed_24h,
  COUNT(*) FILTER (WHERE status = 'failed' AND retry_count >= max_retries) as permanently_failed,
  AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) FILTER (WHERE processed_at IS NOT NULL) as avg_processing_seconds
FROM automation_events
GROUP BY tutor_id;

-- Grant access to authenticated users
GRANT SELECT ON automation_health_stats TO authenticated;

-- ============================================================================
-- 8. DEFAULT TRIGGER SETTINGS FOR EXISTING RULES
-- ============================================================================

UPDATE automation_rules
SET trigger_settings = '{"cooldown_hours": 24}'::JSONB
WHERE trigger_type = 'lesson_completed'
  AND trigger_settings = '{}'::JSONB;

-- ============================================================================
-- 9. ADD TRIGGER TYPE CHECK CONSTRAINT
-- ============================================================================

ALTER TABLE automation_rules
  DROP CONSTRAINT IF EXISTS automation_rules_trigger_type_check;

ALTER TABLE automation_rules
  ADD CONSTRAINT automation_rules_trigger_type_check
  CHECK (trigger_type IN (
    'lesson_completed',
    'student_inactive',
    'package_low_balance',
    'trial_completed_no_purchase'
  ));
