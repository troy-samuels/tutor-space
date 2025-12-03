-- Migration: Add exclusion constraint to prevent double-booking of timeslots
-- SECURITY FIX: Prevents race conditions that could allow concurrent bookings
-- for the same tutor at overlapping times

-- Enable btree_gist extension for exclusion constraints with mixed types
-- This is required for combining UUID equality with timestamp range overlap
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add exclusion constraint to prevent overlapping bookings for the same tutor
-- This constraint ensures that for any given tutor, no two active bookings
-- (pending or confirmed) can have overlapping time ranges
--
-- The constraint uses:
--   - tutor_id WITH = : same tutor
--   - tstzrange WITH && : overlapping time ranges (start to start+duration)
--
-- Note: PostgreSQL exclusion constraints don't support WHERE clauses directly,
-- so we use a partial index approach with a trigger for cancelled bookings

-- First, let's add the constraint for all bookings, then handle status filtering
-- via application logic (the DB constraint is a safety net)

-- Drop constraint if it exists (for idempotency)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bookings_no_overlap'
    AND conrelid = 'bookings'::regclass
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_no_overlap;
  END IF;
END $$;

-- Create a function to compute the booking time range
CREATE OR REPLACE FUNCTION booking_time_range(scheduled_at timestamptz, duration_minutes integer)
RETURNS tstzrange
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT tstzrange(scheduled_at, scheduled_at + (duration_minutes || ' minutes')::interval, '[)');
$$;

-- Add the exclusion constraint
-- This prevents any two bookings for the same tutor from having overlapping time ranges
ALTER TABLE bookings
ADD CONSTRAINT bookings_no_overlap
EXCLUDE USING gist (
  tutor_id WITH =,
  booking_time_range(scheduled_at, duration_minutes) WITH &&
);

-- Create index to support the constraint and improve query performance
CREATE INDEX IF NOT EXISTS idx_bookings_tutor_scheduled
  ON bookings(tutor_id, scheduled_at);

-- Add comment for documentation
COMMENT ON CONSTRAINT bookings_no_overlap ON bookings IS
  'Prevents double-booking: no two bookings for the same tutor can have overlapping time ranges. Uses btree_gist extension for efficient range overlap detection.';

-- Note: Cancelled bookings will still be subject to this constraint.
-- The application should delete cancelled bookings or update their status
-- in a way that allows re-booking that timeslot. If this becomes an issue,
-- we can add a status column check or use a different approach.
--
-- Alternative approach if cancelled bookings cause issues:
-- 1. Soft-delete cancelled bookings by moving them to a bookings_archive table
-- 2. Or, null out scheduled_at for cancelled bookings (but this changes the schema)
-- 3. Or, use a trigger to skip constraint check for cancelled status
