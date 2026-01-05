-- Migration: Fix constraint collision with soft deletes
-- Problem: Unique constraints block re-use of deleted records' unique fields
-- Solution: Convert to partial unique indexes that exclude soft-deleted records

-- ============================================================================
-- 1. FIX STUDENTS CONSTRAINT: UNIQUE(tutor_id, email)
-- ============================================================================

-- Drop existing unique constraint (allows re-adding deleted student emails)
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_tutor_id_email_key;

-- Create partial unique index (only enforced for active students)
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_tutor_email_active
  ON students (tutor_id, email)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- 2. FIX BOOKINGS EXCLUSION CONSTRAINT: bookings_no_overlap
-- ============================================================================

-- Drop existing exclusion constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap;

-- Drop existing partial index
DROP INDEX IF EXISTS idx_bookings_active_overlap;

-- Recreate index with deleted_at check
CREATE INDEX idx_bookings_active_overlap
  ON bookings USING gist (tutor_id, booking_time_range(scheduled_at, duration_minutes))
  WHERE status IN ('pending', 'confirmed') AND deleted_at IS NULL;

-- Recreate exclusion constraint with deleted_at check
-- Only active, non-deleted bookings participate in overlap detection
ALTER TABLE bookings
ADD CONSTRAINT bookings_no_overlap
EXCLUDE USING gist (
  tutor_id WITH =,
  booking_time_range(scheduled_at, duration_minutes) WITH &&
)
WHERE (status IN ('pending', 'confirmed') AND deleted_at IS NULL);

COMMENT ON CONSTRAINT bookings_no_overlap ON bookings IS
  'Prevents double-booking for active (pending/confirmed) non-deleted bookings only.';
