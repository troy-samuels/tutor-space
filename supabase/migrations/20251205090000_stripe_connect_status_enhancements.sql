-- Stripe Connect Status Enhancements
-- Adds additional tracking fields for Stripe Connect account requirements and status

-- Add new columns for enhanced Stripe Connect status tracking
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_disabled_reason TEXT,
ADD COLUMN IF NOT EXISTS stripe_currently_due TEXT[],
ADD COLUMN IF NOT EXISTS stripe_eventually_due TEXT[],
ADD COLUMN IF NOT EXISTS stripe_past_due TEXT[],
ADD COLUMN IF NOT EXISTS stripe_pending_verification TEXT[],
ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT FALSE;

-- Add index for querying restricted accounts
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_onboarding_status
ON profiles(stripe_onboarding_status)
WHERE stripe_onboarding_status IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN profiles.stripe_disabled_reason IS 'Reason from Stripe if Connect account is disabled (e.g., requirements.past_due, rejected.fraud)';
COMMENT ON COLUMN profiles.stripe_currently_due IS 'Array of requirements currently due for the Connect account';
COMMENT ON COLUMN profiles.stripe_eventually_due IS 'Array of requirements that will eventually be due';
COMMENT ON COLUMN profiles.stripe_past_due IS 'Array of requirements that are past due (blocking charges/payouts)';
COMMENT ON COLUMN profiles.stripe_pending_verification IS 'Array of requirements pending verification by Stripe';
COMMENT ON COLUMN profiles.stripe_details_submitted IS 'Whether the account holder has submitted their details to Stripe';
