-- Add short_code column for memorable classroom URLs
-- Example codes: fluent-parrot-42, chatty-croissant-17, verb-ninja-99

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS short_code TEXT;

-- Create unique index for fast lookups by short code
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_short_code
  ON bookings(short_code)
  WHERE short_code IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN bookings.short_code IS 'Memorable short code for classroom URLs (e.g., fluent-parrot-42)';
