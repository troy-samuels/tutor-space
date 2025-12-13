-- Migration: Add atomic booking creation helper to prevent double-booking under load
-- SECURITY: Uses advisory lock + overlap check inside a single transaction

-- Ensure helper function for time ranges exists
CREATE OR REPLACE FUNCTION booking_time_range(scheduled_at timestamptz, duration_minutes integer)
RETURNS tstzrange LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT tstzrange(scheduled_at, scheduled_at + (duration_minutes || ' minutes')::interval, '[)');
$$;

-- Replace any prior version of the atomic booking helper
DROP FUNCTION IF EXISTS create_booking_atomic(
  uuid, uuid, uuid, timestamptz, integer, text, text, text, integer, text, text
);

CREATE OR REPLACE FUNCTION create_booking_atomic(
  p_tutor_id uuid,
  p_student_id uuid,
  p_service_id uuid,
  p_scheduled_at timestamptz,
  p_duration_minutes integer,
  p_timezone text,
  p_status text,
  p_payment_status text,
  p_payment_amount integer,
  p_currency text,
  p_student_notes text
)
RETURNS TABLE (id uuid, created_at timestamptz) AS $$
DECLARE
  v_start timestamptz := p_scheduled_at;
  v_end timestamptz := p_scheduled_at + (p_duration_minutes || ' minutes')::interval;
BEGIN
  -- Serialize booking creation per tutor to avoid race conditions
  IF NOT pg_try_advisory_xact_lock(hashtext(p_tutor_id::text)) THEN
    RAISE EXCEPTION USING errcode = '55P03', message = 'Could not acquire booking lock for tutor';
  END IF;

  -- Reject if overlapping active booking already exists
  PERFORM 1
  FROM bookings b
  WHERE b.tutor_id = p_tutor_id
    AND b.status IN ('pending', 'confirmed')
    AND booking_time_range(b.scheduled_at, b.duration_minutes) &&
        booking_time_range(p_scheduled_at, p_duration_minutes)
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION USING errcode = 'P0001', message = 'Time slot conflict for tutor';
  END IF;

  -- Reject if blocked time overlaps
  PERFORM 1
  FROM blocked_times bt
  WHERE bt.tutor_id = p_tutor_id
    AND bt.start_time < v_end
    AND bt.end_time > v_start
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION USING errcode = 'P0002', message = 'Time slot is blocked for tutor';
  END IF;

  RETURN QUERY
  INSERT INTO bookings (
    tutor_id,
    student_id,
    service_id,
    scheduled_at,
    duration_minutes,
    timezone,
    status,
    payment_status,
    payment_amount,
    currency,
    student_notes
  )
  VALUES (
    p_tutor_id,
    p_student_id,
    p_service_id,
    p_scheduled_at,
    p_duration_minutes,
    p_timezone,
    p_status,
    p_payment_status,
    p_payment_amount,
    p_currency,
    p_student_notes
  )
  RETURNING id, created_at;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Restrict execution to the service role by default
REVOKE ALL ON FUNCTION create_booking_atomic(uuid, uuid, uuid, timestamptz, integer, text, text, text, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_booking_atomic(uuid, uuid, uuid, timestamptz, integer, text, text, text, integer, text, text) TO service_role;
