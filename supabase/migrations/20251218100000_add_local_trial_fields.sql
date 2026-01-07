-- ============================================================================
-- LOCAL TRIAL FIELDS
-- Used when Stripe is not configured to provide trial access
-- ============================================================================

-- Add local trial tracking columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS local_trial_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS local_trial_plan TEXT;

-- Index for efficiently checking expired trials
CREATE INDEX IF NOT EXISTS idx_profiles_local_trial_end
  ON profiles(local_trial_end)
  WHERE local_trial_end IS NOT NULL;

-- Function to check if user has active local trial
CREATE OR REPLACE FUNCTION has_active_local_trial(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id
      AND local_trial_end IS NOT NULL
      AND local_trial_end > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON COLUMN profiles.local_trial_end IS
  'Trial expiration timestamp when Stripe is not configured. NULL if using Stripe or no trial.';
COMMENT ON COLUMN profiles.local_trial_plan IS
  'Plan selected during signup for local trial. Used to prompt for payment after trial ends.';
