-- Migration: Fix booking exclusion constraint
-- BUG FIX: Allow rebooking cancelled timeslots
-- SAFETY: Pre-check with actionable conflict IDs

-- PRE-FLIGHT: Check for overlapping active bookings with IDs
DO $$
DECLARE
  overlap_count INTEGER;
  overlap_ids TEXT;
BEGIN
  SELECT COUNT(*), string_agg(b1.id::text || ' <-> ' || b2.id::text, ', ' ORDER BY b1.scheduled_at)
  INTO overlap_count, overlap_ids
  FROM bookings b1
  JOIN bookings b2 ON b1.tutor_id = b2.tutor_id
    AND b1.id < b2.id
    AND b1.status IN ('pending', 'confirmed')
    AND b2.status IN ('pending', 'confirmed')
  WHERE tstzrange(b1.scheduled_at, b1.scheduled_at + (b1.duration_minutes || ' minutes')::interval, '[)') &&
        tstzrange(b2.scheduled_at, b2.scheduled_at + (b2.duration_minutes || ' minutes')::interval, '[)');

  IF overlap_count > 0 THEN
    RAISE EXCEPTION E'DEPLOYMENT BLOCKED: % overlapping active booking pairs found.\n\nConflicting IDs: %\n\nTo fix, cancel one booking from each pair:\nUPDATE bookings SET status = ''cancelled'' WHERE id = ''<id>'';',
      overlap_count, overlap_ids;
  END IF;
END $$;

-- 1. Drop existing constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap;

-- 2. Create helper function
CREATE OR REPLACE FUNCTION booking_time_range(scheduled_at timestamptz, duration_minutes integer)
RETURNS tstzrange LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT tstzrange(scheduled_at, scheduled_at + (duration_minutes || ' minutes')::interval, '[)');
$$;

-- 3. Create partial index
CREATE INDEX IF NOT EXISTS idx_bookings_active_overlap
  ON bookings USING gist (tutor_id, booking_time_range(scheduled_at, duration_minutes))
  WHERE status IN ('pending', 'confirmed');

-- 4. Add exclusion constraint (only active bookings)
ALTER TABLE bookings
ADD CONSTRAINT bookings_no_overlap
EXCLUDE USING gist (
  tutor_id WITH =,
  booking_time_range(scheduled_at, duration_minutes) WITH &&
)
WHERE (status IN ('pending', 'confirmed'));

COMMENT ON CONSTRAINT bookings_no_overlap ON bookings IS
  'Prevents double-booking for active (pending/confirmed) bookings only.';
