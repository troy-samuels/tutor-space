-- ============================================================================
-- Signup Checkout Tracking
-- Tracks paid-but-unverified signup checkout sessions for tutor subscriptions.
-- ============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS signup_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS signup_checkout_status TEXT
    CHECK (signup_checkout_status IN ('open', 'complete', 'expired', 'canceled')),
  ADD COLUMN IF NOT EXISTS signup_checkout_plan TEXT,
  ADD COLUMN IF NOT EXISTS signup_checkout_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signup_checkout_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signup_checkout_completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_signup_checkout_session_id
  ON profiles (signup_checkout_session_id);

COMMENT ON COLUMN profiles.signup_checkout_session_id IS 'Stripe Checkout session id for tutor signup flow.';
COMMENT ON COLUMN profiles.signup_checkout_status IS 'Signup checkout status: open, complete, expired, canceled.';
COMMENT ON COLUMN profiles.signup_checkout_plan IS 'Plan selected during signup checkout (pro_monthly, pro_annual, etc).';
COMMENT ON COLUMN profiles.signup_checkout_started_at IS 'Timestamp when signup checkout session was created.';
COMMENT ON COLUMN profiles.signup_checkout_expires_at IS 'Timestamp when signup checkout session expires.';
COMMENT ON COLUMN profiles.signup_checkout_completed_at IS 'Timestamp when signup checkout completed.';
