-- ============================================================================
-- TUTOR ACCOUNT STATUS
-- Adds account status management for admin suspension/deactivation
-- ============================================================================

-- Add status columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active'
    CHECK (account_status IN ('active', 'suspended', 'deactivated', 'pending_review')),
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

-- Create index for quick status filtering
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles (account_status);

-- ============================================================================
-- TUTOR STATUS HISTORY TABLE
-- Track all status changes for audit trail
-- ============================================================================

CREATE TABLE IF NOT EXISTS tutor_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  reason TEXT,
  changed_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tutor_status_history_profile ON tutor_status_history (profile_id, changed_at DESC);

-- Enable RLS
ALTER TABLE tutor_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages tutor_status_history"
  ON tutor_status_history FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- FUNCTION TO LOG STATUS CHANGES
-- Automatically tracks status changes in history table
-- ============================================================================

CREATE OR REPLACE FUNCTION log_tutor_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if account_status actually changed
  IF OLD.account_status IS DISTINCT FROM NEW.account_status THEN
    INSERT INTO tutor_status_history (
      profile_id,
      previous_status,
      new_status,
      reason,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.account_status,
      NEW.account_status,
      NEW.suspension_reason,
      NEW.suspended_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_tutor_status_change ON profiles;
CREATE TRIGGER trg_log_tutor_status_change
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_tutor_status_change();
