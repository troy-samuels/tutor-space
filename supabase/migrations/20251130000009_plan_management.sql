-- ============================================================================
-- TUTOR PLAN MANAGEMENT
-- Tables for managing tutor subscription plan overrides
-- ============================================================================

-- Plan overrides table
CREATE TABLE IF NOT EXISTS plan_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Override type
  override_type TEXT NOT NULL CHECK (override_type IN ('upgrade', 'downgrade', 'extend_trial', 'custom_limit', 'feature_grant')),

  -- Plan details
  plan_name TEXT, -- 'professional', 'growth', 'studio'
  original_plan TEXT,

  -- Feature overrides (if custom)
  max_students INTEGER,
  features_enabled TEXT[], -- List of feature keys

  -- Validity
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,

  -- Reason and audit
  reason TEXT,
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_overrides_tutor ON plan_overrides(tutor_id);
CREATE INDEX IF NOT EXISTS idx_plan_overrides_active ON plan_overrides(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_plan_overrides_expires ON plan_overrides(expires_at) WHERE expires_at IS NOT NULL;

-- Plan change history
CREATE TABLE IF NOT EXISTS plan_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  previous_plan TEXT,
  new_plan TEXT,
  change_type TEXT NOT NULL CHECK (change_type IN ('subscription', 'admin_override', 'trial_end', 'cancellation', 'renewal')),
  changed_by UUID, -- admin_users id if admin action
  notes TEXT,
  stripe_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_change_history_tutor ON plan_change_history(tutor_id);
CREATE INDEX IF NOT EXISTS idx_plan_change_history_created_at ON plan_change_history(created_at DESC);

-- Enable RLS
ALTER TABLE plan_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_change_history ENABLE ROW LEVEL SECURITY;

-- Service role can manage all
CREATE POLICY "Service role manages plan_overrides"
  ON plan_overrides FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages plan_change_history"
  ON plan_change_history FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Tutors can view their own overrides
CREATE POLICY "Tutors view own plan_overrides"
  ON plan_overrides FOR SELECT
  USING (tutor_id = auth.uid());

CREATE POLICY "Tutors view own plan_change_history"
  ON plan_change_history FOR SELECT
  USING (tutor_id = auth.uid());

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_plan_overrides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_plan_overrides_updated_at ON plan_overrides;
CREATE TRIGGER trg_plan_overrides_updated_at
  BEFORE UPDATE ON plan_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_plan_overrides_updated_at();

-- Function to get effective plan for a tutor
CREATE OR REPLACE FUNCTION get_effective_plan(p_tutor_id UUID)
RETURNS TABLE (
  plan_name TEXT,
  max_students INTEGER,
  is_override BOOLEAN,
  override_expires_at TIMESTAMPTZ
) AS $$
DECLARE
  v_override RECORD;
  v_profile RECORD;
BEGIN
  -- Check for active override first
  SELECT * INTO v_override
  FROM plan_overrides
  WHERE tutor_id = p_tutor_id
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND AND v_override.plan_name IS NOT NULL THEN
    RETURN QUERY SELECT
      v_override.plan_name,
      COALESCE(v_override.max_students,
        CASE v_override.plan_name
          WHEN 'professional' THEN 20
          WHEN 'growth' THEN 999999
          WHEN 'studio' THEN 999999
          ELSE 20
        END),
      TRUE,
      v_override.expires_at;
    RETURN;
  END IF;

  -- No override, return actual plan from profile
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_tutor_id;

  IF FOUND THEN
    RETURN QUERY SELECT
      COALESCE(v_profile.plan, 'professional')::TEXT,
      CASE COALESCE(v_profile.plan, 'professional')
        WHEN 'professional' THEN 20
        WHEN 'growth' THEN 999999
        WHEN 'studio' THEN 999999
        ELSE 20
      END,
      FALSE,
      NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Default fallback
  RETURN QUERY SELECT 'professional'::TEXT, 20, FALSE, NULL::TIMESTAMPTZ;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
