-- ============================================================================
-- TUTOR INACTIVITY TRACKING
-- Adds login tracking and re-engagement email history for churn reduction
-- ============================================================================

-- Add last_login_at to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Index for efficient querying of inactive tutors
CREATE INDEX IF NOT EXISTS idx_profiles_last_login_at
  ON profiles (last_login_at)
  WHERE role = 'tutor';

-- Composite index for inactive tutor queries (role + last_login_at)
CREATE INDEX IF NOT EXISTS idx_profiles_tutor_activity
  ON profiles (role, last_login_at DESC NULLS LAST)
  WHERE role = 'tutor';

-- ============================================================================
-- TUTOR RE-ENGAGEMENT EMAILS TABLE
-- Track when re-engagement emails are sent to avoid spamming tutors
-- ============================================================================

CREATE TABLE IF NOT EXISTS tutor_reengagement_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  template_id TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT tutor_reengagement_emails_template_check
    CHECK (template_id IN ('friendly_checkin', 'feature_highlight', 'account_status'))
);

-- Index for querying re-engagement emails by tutor (most recent first)
CREATE INDEX IF NOT EXISTS idx_tutor_reengagement_emails_tutor
  ON tutor_reengagement_emails (tutor_id, sent_at DESC);

-- Index for querying by template type
CREATE INDEX IF NOT EXISTS idx_tutor_reengagement_emails_template
  ON tutor_reengagement_emails (template_id, sent_at DESC);

-- Index for admin audit queries
CREATE INDEX IF NOT EXISTS idx_tutor_reengagement_emails_admin
  ON tutor_reengagement_emails (admin_user_id, sent_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE tutor_reengagement_emails ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by admin APIs)
CREATE POLICY "Service role manages tutor_reengagement_emails"
  ON tutor_reengagement_emails FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN profiles.last_login_at IS 'Timestamp of tutor''s most recent login, updated on each successful authentication';

COMMENT ON TABLE tutor_reengagement_emails IS 'Tracks re-engagement emails sent to inactive tutors to prevent spam and enable audit trails';

COMMENT ON COLUMN tutor_reengagement_emails.template_id IS 'Email template used: friendly_checkin (soft touch), feature_highlight (value prop), account_status (urgency)';

COMMENT ON COLUMN tutor_reengagement_emails.metadata IS 'Additional context like days_since_login at time of send';
