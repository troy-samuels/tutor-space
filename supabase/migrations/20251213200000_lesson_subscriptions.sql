-- Monthly Lesson Subscription Feature
-- Students subscribe for X lessons/month with soft rollover (1 month max)

-- ============================================
-- TABLE: lesson_subscription_templates
-- Tutor's subscription offerings per service
-- ============================================
CREATE TABLE IF NOT EXISTS lesson_subscription_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,

  -- Tier configuration
  lessons_per_month INTEGER NOT NULL CHECK (lessons_per_month > 0),
  template_tier TEXT NOT NULL CHECK (template_tier IN ('2_lessons', '4_lessons', '8_lessons', 'custom')),

  -- Pricing
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Stripe integration
  stripe_product_id TEXT,
  stripe_price_id TEXT,

  -- Rollover policy (NULL = same as lessons_per_month)
  max_rollover_lessons INTEGER,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One template per tier per service
  UNIQUE(service_id, template_tier)
);

-- Indexes for lesson_subscription_templates
CREATE INDEX IF NOT EXISTS idx_lesson_sub_templates_tutor ON lesson_subscription_templates(tutor_id);
CREATE INDEX IF NOT EXISTS idx_lesson_sub_templates_service ON lesson_subscription_templates(service_id);
CREATE INDEX IF NOT EXISTS idx_lesson_sub_templates_active ON lesson_subscription_templates(is_active) WHERE is_active = TRUE;

-- ============================================
-- TABLE: lesson_subscriptions
-- Active student subscriptions
-- ============================================
CREATE TABLE IF NOT EXISTS lesson_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES lesson_subscription_templates(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Stripe subscription
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'canceled', 'past_due', 'trialing')),

  -- Current billing period
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One subscription per student-tutor pair
  UNIQUE(student_id, tutor_id)
);

-- Indexes for lesson_subscriptions
CREATE INDEX IF NOT EXISTS idx_lesson_subs_student ON lesson_subscriptions(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_subs_tutor ON lesson_subscriptions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_lesson_subs_stripe ON lesson_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_lesson_subs_status ON lesson_subscriptions(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_lesson_subs_template ON lesson_subscriptions(template_id);

-- ============================================
-- TABLE: lesson_allowance_periods
-- Tracks lesson credits per billing cycle with rollover
-- ============================================
CREATE TABLE IF NOT EXISTS lesson_allowance_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES lesson_subscriptions(id) ON DELETE CASCADE,

  -- Period boundaries
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Allowance tracking
  lessons_allocated INTEGER NOT NULL,
  lessons_rolled_over INTEGER NOT NULL DEFAULT 0,
  lessons_used INTEGER NOT NULL DEFAULT 0,

  -- Status
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  finalized_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One period per subscription per start date
  UNIQUE(subscription_id, period_start),

  -- Ensure period_end > period_start
  CHECK (period_end > period_start)
);

-- Indexes for lesson_allowance_periods
CREATE INDEX IF NOT EXISTS idx_allowance_periods_sub ON lesson_allowance_periods(subscription_id);
CREATE INDEX IF NOT EXISTS idx_allowance_periods_current ON lesson_allowance_periods(is_current) WHERE is_current = TRUE;
CREATE INDEX IF NOT EXISTS idx_allowance_periods_dates ON lesson_allowance_periods(period_start, period_end);

-- ============================================
-- TABLE: lesson_subscription_redemptions
-- Links bookings to subscription allowance usage
-- ============================================
CREATE TABLE IF NOT EXISTS lesson_subscription_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES lesson_allowance_periods(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

  -- Tracking
  lessons_redeemed INTEGER NOT NULL DEFAULT 1 CHECK (lessons_redeemed > 0),

  -- Refund support
  refunded_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One redemption per booking
  UNIQUE(booking_id)
);

-- Indexes for lesson_subscription_redemptions
CREATE INDEX IF NOT EXISTS idx_sub_redemptions_period ON lesson_subscription_redemptions(period_id);
CREATE INDEX IF NOT EXISTS idx_sub_redemptions_booking ON lesson_subscription_redemptions(booking_id);

-- ============================================
-- FUNCTION: get_subscription_balance
-- Calculate available lessons for a subscription
-- ============================================
CREATE OR REPLACE FUNCTION get_subscription_balance(p_subscription_id UUID)
RETURNS TABLE(
  total_available INTEGER,
  lessons_allocated INTEGER,
  lessons_rolled_over INTEGER,
  lessons_used INTEGER,
  period_ends_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    GREATEST(0, (lap.lessons_allocated + lap.lessons_rolled_over - lap.lessons_used))::INTEGER as total_available,
    lap.lessons_allocated,
    lap.lessons_rolled_over,
    lap.lessons_used,
    lap.period_end as period_ends_at
  FROM lesson_allowance_periods lap
  WHERE lap.subscription_id = p_subscription_id
    AND lap.is_current = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: process_subscription_rollover
-- Handle billing cycle reset with rollover calculation
-- Called by webhook on invoice.paid
-- ============================================
CREATE OR REPLACE FUNCTION process_subscription_rollover(
  p_subscription_id UUID,
  p_new_period_start TIMESTAMPTZ,
  p_new_period_end TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
  v_old_period lesson_allowance_periods%ROWTYPE;
  v_template lesson_subscription_templates%ROWTYPE;
  v_subscription lesson_subscriptions%ROWTYPE;
  v_unused_lessons INTEGER;
  v_rollover_lessons INTEGER;
  v_max_rollover INTEGER;
  v_new_period_id UUID;
BEGIN
  -- Get subscription and template
  SELECT * INTO v_subscription FROM lesson_subscriptions WHERE id = p_subscription_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
  END IF;

  SELECT * INTO v_template FROM lesson_subscription_templates WHERE id = v_subscription.template_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found for subscription: %', p_subscription_id;
  END IF;

  -- Get current period (about to end)
  SELECT * INTO v_old_period
  FROM lesson_allowance_periods
  WHERE subscription_id = p_subscription_id AND is_current = TRUE;

  -- Calculate unused lessons from old period
  IF v_old_period.id IS NOT NULL THEN
    v_unused_lessons := GREATEST(0,
      v_old_period.lessons_allocated + v_old_period.lessons_rolled_over - v_old_period.lessons_used
    );
  ELSE
    v_unused_lessons := 0;
  END IF;

  -- Apply rollover cap (soft cap = 1 month's allocation)
  v_max_rollover := COALESCE(v_template.max_rollover_lessons, v_template.lessons_per_month);
  v_rollover_lessons := LEAST(v_unused_lessons, v_max_rollover);

  -- Finalize old period
  IF v_old_period.id IS NOT NULL THEN
    UPDATE lesson_allowance_periods
    SET is_current = FALSE, finalized_at = NOW(), updated_at = NOW()
    WHERE id = v_old_period.id;
  END IF;

  -- Create new period
  INSERT INTO lesson_allowance_periods (
    subscription_id,
    period_start,
    period_end,
    lessons_allocated,
    lessons_rolled_over,
    lessons_used,
    is_current
  ) VALUES (
    p_subscription_id,
    p_new_period_start,
    p_new_period_end,
    v_template.lessons_per_month,
    v_rollover_lessons,
    0,
    TRUE
  ) RETURNING id INTO v_new_period_id;

  -- Update subscription period dates
  UPDATE lesson_subscriptions
  SET current_period_start = p_new_period_start,
      current_period_end = p_new_period_end,
      updated_at = NOW()
  WHERE id = p_subscription_id;

  RETURN v_new_period_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: redeem_subscription_lesson
-- Deduct a lesson credit when booking with subscription
-- ============================================
CREATE OR REPLACE FUNCTION redeem_subscription_lesson(
  p_subscription_id UUID,
  p_booking_id UUID,
  p_lessons_count INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_period lesson_allowance_periods%ROWTYPE;
  v_available INTEGER;
BEGIN
  -- Get current period
  SELECT * INTO v_period
  FROM lesson_allowance_periods
  WHERE subscription_id = p_subscription_id AND is_current = TRUE
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No current period found for subscription: %', p_subscription_id;
  END IF;

  -- Check available lessons
  v_available := v_period.lessons_allocated + v_period.lessons_rolled_over - v_period.lessons_used;
  IF v_available < p_lessons_count THEN
    RAISE EXCEPTION 'Insufficient lesson credits. Available: %, Requested: %', v_available, p_lessons_count;
  END IF;

  -- Create redemption record
  INSERT INTO lesson_subscription_redemptions (period_id, booking_id, lessons_redeemed)
  VALUES (v_period.id, p_booking_id, p_lessons_count);

  -- Update lessons_used
  UPDATE lesson_allowance_periods
  SET lessons_used = lessons_used + p_lessons_count, updated_at = NOW()
  WHERE id = v_period.id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: refund_subscription_lesson
-- Restore a lesson credit when booking is cancelled
-- ============================================
CREATE OR REPLACE FUNCTION refund_subscription_lesson(p_booking_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_redemption lesson_subscription_redemptions%ROWTYPE;
  v_period lesson_allowance_periods%ROWTYPE;
BEGIN
  -- Get redemption record
  SELECT * INTO v_redemption
  FROM lesson_subscription_redemptions
  WHERE booking_id = p_booking_id AND refunded_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    -- No redemption to refund (booking wasn't from subscription)
    RETURN FALSE;
  END IF;

  -- Get the period
  SELECT * INTO v_period
  FROM lesson_allowance_periods
  WHERE id = v_redemption.period_id;

  -- Only refund if period is still current
  IF v_period.is_current THEN
    -- Restore credit
    UPDATE lesson_allowance_periods
    SET lessons_used = GREATEST(0, lessons_used - v_redemption.lessons_redeemed),
        updated_at = NOW()
    WHERE id = v_period.id;
  END IF;

  -- Mark redemption as refunded (regardless of period status for audit)
  UPDATE lesson_subscription_redemptions
  SET refunded_at = NOW()
  WHERE id = v_redemption.id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE lesson_subscription_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_allowance_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_subscription_redemptions ENABLE ROW LEVEL SECURITY;

-- lesson_subscription_templates policies
CREATE POLICY "Tutors manage own templates"
  ON lesson_subscription_templates FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Public view active templates"
  ON lesson_subscription_templates FOR SELECT
  USING (is_active = TRUE);

-- lesson_subscriptions policies
CREATE POLICY "Tutors view student subscriptions"
  ON lesson_subscriptions FOR SELECT
  USING (tutor_id = auth.uid());

CREATE POLICY "Students view own subscriptions"
  ON lesson_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = lesson_subscriptions.student_id
        AND s.user_id = auth.uid()
    )
  );

-- Service role can manage subscriptions (for webhooks)
CREATE POLICY "Service role manages subscriptions"
  ON lesson_subscriptions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- lesson_allowance_periods policies
CREATE POLICY "Tutors view student periods"
  ON lesson_allowance_periods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lesson_subscriptions ls
      WHERE ls.id = lesson_allowance_periods.subscription_id
        AND ls.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Students view own periods"
  ON lesson_allowance_periods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lesson_subscriptions ls
      JOIN students s ON s.id = ls.student_id
      WHERE ls.id = lesson_allowance_periods.subscription_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role manages periods"
  ON lesson_allowance_periods FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- lesson_subscription_redemptions policies
CREATE POLICY "Tutors view redemptions"
  ON lesson_subscription_redemptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lesson_allowance_periods lap
      JOIN lesson_subscriptions ls ON ls.id = lap.subscription_id
      WHERE lap.id = lesson_subscription_redemptions.period_id
        AND ls.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Students view own redemptions"
  ON lesson_subscription_redemptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lesson_allowance_periods lap
      JOIN lesson_subscriptions ls ON ls.id = lap.subscription_id
      JOIN students s ON s.id = ls.student_id
      WHERE lap.id = lesson_subscription_redemptions.period_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role manages redemptions"
  ON lesson_subscription_redemptions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_lesson_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lesson_sub_templates_updated_at
  BEFORE UPDATE ON lesson_subscription_templates
  FOR EACH ROW EXECUTE FUNCTION update_lesson_subscription_updated_at();

CREATE TRIGGER trigger_lesson_subscriptions_updated_at
  BEFORE UPDATE ON lesson_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_lesson_subscription_updated_at();

CREATE TRIGGER trigger_allowance_periods_updated_at
  BEFORE UPDATE ON lesson_allowance_periods
  FOR EACH ROW EXECUTE FUNCTION update_lesson_subscription_updated_at();

-- ============================================
-- Add subscriptions_enabled column to services table
-- ============================================
ALTER TABLE services ADD COLUMN IF NOT EXISTS subscriptions_enabled BOOLEAN NOT NULL DEFAULT FALSE;
