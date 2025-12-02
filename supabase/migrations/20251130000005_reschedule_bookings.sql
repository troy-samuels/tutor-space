-- ============================================================================
-- BOOKING RESCHEDULE FUNCTIONALITY
-- Adds reschedule tracking and history to bookings
-- ============================================================================

-- Add reschedule columns to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS original_scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reschedule_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reschedule_requested_by TEXT CHECK (reschedule_requested_by IN ('tutor', 'student')),
  ADD COLUMN IF NOT EXISTS reschedule_reason TEXT,
  ADD COLUMN IF NOT EXISTS reschedule_count INTEGER DEFAULT 0;

-- Create reschedule history table for audit trail
CREATE TABLE IF NOT EXISTS booking_reschedule_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  previous_scheduled_at TIMESTAMPTZ NOT NULL,
  new_scheduled_at TIMESTAMPTZ NOT NULL,
  requested_by TEXT NOT NULL CHECK (requested_by IN ('tutor', 'student')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_reschedule_history_booking ON booking_reschedule_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_reschedule_history_tutor ON booking_reschedule_history(tutor_id);

-- Enable RLS
ALTER TABLE booking_reschedule_history ENABLE ROW LEVEL SECURITY;

-- Tutors can view reschedule history for their bookings
CREATE POLICY "Tutors view own reschedule history"
  ON booking_reschedule_history FOR SELECT
  USING (tutor_id = auth.uid());

-- Service role can manage all history
CREATE POLICY "Service role manages reschedule_history"
  ON booking_reschedule_history FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Students can view their own reschedule history
CREATE POLICY "Students view own reschedule history"
  ON booking_reschedule_history FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Function to track reschedules
CREATE OR REPLACE FUNCTION log_booking_reschedule()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if scheduled_at actually changed
  IF OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at THEN
    -- Store original if this is first reschedule
    IF NEW.original_scheduled_at IS NULL THEN
      NEW.original_scheduled_at := OLD.scheduled_at;
    END IF;

    -- Increment reschedule count
    NEW.reschedule_count := COALESCE(OLD.reschedule_count, 0) + 1;

    -- Insert history record
    INSERT INTO booking_reschedule_history (
      booking_id,
      tutor_id,
      student_id,
      previous_scheduled_at,
      new_scheduled_at,
      requested_by,
      reason
    ) VALUES (
      NEW.id,
      NEW.tutor_id,
      NEW.student_id,
      OLD.scheduled_at,
      NEW.scheduled_at,
      COALESCE(NEW.reschedule_requested_by, 'tutor'),
      NEW.reschedule_reason
    );

    -- Clear the request fields after logging
    NEW.reschedule_requested_at := NULL;
    NEW.reschedule_requested_by := NULL;
    NEW.reschedule_reason := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_booking_reschedule_log ON bookings;
CREATE TRIGGER trg_booking_reschedule_log
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_reschedule();
