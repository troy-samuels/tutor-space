-- Add timezone field to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Add comment for documentation
COMMENT ON COLUMN profiles.timezone IS 'User preferred timezone for displaying dates and times';

