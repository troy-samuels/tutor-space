-- Stripe Checkout Flow Optimization Schema
-- Adds customer verification caching and enhanced plan change tracking

-- 1. Add customer verification timestamp for caching (skip Stripe API if recently verified)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id_verified_at TIMESTAMPTZ;

-- 2. Enhance plan_change_history for better tracking
ALTER TABLE plan_change_history
  ADD COLUMN IF NOT EXISTS proration_behavior TEXT,
  ADD COLUMN IF NOT EXISTS checkout_session_id TEXT;

-- 3. Add index for faster Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer
  ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- 4. Add index for plan change history lookups
CREATE INDEX IF NOT EXISTS idx_plan_change_history_tutor_created
  ON plan_change_history(tutor_id, created_at DESC);

-- 5. Update the get_effective_plan function to include verification info
CREATE OR REPLACE FUNCTION get_effective_plan(p_tutor_id UUID)
RETURNS TABLE (
  plan_name TEXT,
  max_students INTEGER,
  is_override BOOLEAN,
  override_expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  customer_verified_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(po.plan_name, p.plan, 'professional')::TEXT as plan_name,
    COALESCE(po.max_students,
      CASE
        WHEN COALESCE(po.plan_name, p.plan) IN ('studio_monthly', 'studio_annual', 'studio_life') THEN 999999
        WHEN COALESCE(po.plan_name, p.plan) IN ('pro_monthly', 'pro_annual', 'tutor_life', 'founder_lifetime', 'all_access') THEN 999999
        ELSE 3
      END
    ) as max_students,
    (po.id IS NOT NULL) as is_override,
    po.expires_at as override_expires_at,
    p.stripe_customer_id::TEXT,
    p.stripe_customer_id_verified_at as customer_verified_at
  FROM profiles p
  LEFT JOIN plan_overrides po ON po.tutor_id = p.id
    AND po.is_active = true
    AND (po.expires_at IS NULL OR po.expires_at > NOW())
  WHERE p.id = p_tutor_id;
END;
$$;

-- 6. Create function to record plan changes with full context
CREATE OR REPLACE FUNCTION record_plan_change(
  p_tutor_id UUID,
  p_previous_plan TEXT,
  p_new_plan TEXT,
  p_change_type TEXT,
  p_stripe_event_id TEXT DEFAULT NULL,
  p_proration_behavior TEXT DEFAULT NULL,
  p_checkout_session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_change_id UUID;
BEGIN
  INSERT INTO plan_change_history (
    tutor_id,
    previous_plan,
    new_plan,
    change_type,
    stripe_event_id,
    proration_behavior,
    checkout_session_id,
    created_at
  ) VALUES (
    p_tutor_id,
    p_previous_plan,
    p_new_plan,
    p_change_type,
    p_stripe_event_id,
    p_proration_behavior,
    p_checkout_session_id,
    NOW()
  )
  RETURNING id INTO v_change_id;

  RETURN v_change_id;
END;
$$;

-- 7. Create function to update customer verification timestamp
CREATE OR REPLACE FUNCTION update_stripe_customer_verification(
  p_user_id UUID,
  p_customer_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET
    stripe_customer_id = p_customer_id,
    stripe_customer_id_verified_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- 8. Create function to check if customer verification is still valid (within 24 hours)
CREATE OR REPLACE FUNCTION is_stripe_customer_valid(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_verified_at TIMESTAMPTZ;
BEGIN
  SELECT stripe_customer_id_verified_at INTO v_verified_at
  FROM profiles
  WHERE id = p_user_id;

  -- Valid if verified within last 24 hours
  RETURN v_verified_at IS NOT NULL
    AND v_verified_at > NOW() - INTERVAL '24 hours';
END;
$$;

COMMENT ON COLUMN profiles.stripe_customer_id_verified_at IS 'Timestamp when stripe_customer_id was last verified with Stripe API. Used for caching to reduce API calls.';
COMMENT ON COLUMN plan_change_history.proration_behavior IS 'Stripe proration behavior used: create_prorations, none, or always_invoice';
COMMENT ON COLUMN plan_change_history.checkout_session_id IS 'Stripe checkout session ID if plan change originated from checkout';
