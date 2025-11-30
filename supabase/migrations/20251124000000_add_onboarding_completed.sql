-- Add onboarding_completed field to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add onboarding_step to track current progress (for analytics)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed
ON profiles(onboarding_completed)
WHERE onboarding_completed = FALSE;

-- Comment for documentation
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether the user has completed the 5-step guided onboarding flow';
COMMENT ON COLUMN profiles.onboarding_step IS 'Last completed onboarding step (0-5) for analytics';
