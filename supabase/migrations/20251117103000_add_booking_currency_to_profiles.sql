-- Add booking currency preference to profiles so tutors can choose which currency they collect in
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS booking_currency TEXT DEFAULT 'USD';

COMMENT ON COLUMN profiles.booking_currency IS 'Preferred currency for bookings (e.g., USD, EUR, GBP)';
