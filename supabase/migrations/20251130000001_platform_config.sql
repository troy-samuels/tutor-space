-- ============================================================================
-- PLATFORM CONFIGURATION TABLE
-- Centralized platform settings for admin configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'payments', 'features', 'limits', 'notifications')),
  updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_config_category ON platform_config (category);

-- ============================================================================
-- SEED DEFAULT CONFIGURATION VALUES
-- ============================================================================

INSERT INTO platform_config (key, value, description, category) VALUES
  -- General settings
  ('maintenance_mode', 'false', 'Enable maintenance mode to block access', 'general'),
  ('signup_enabled', 'true', 'Allow new tutor registrations', 'general'),
  ('student_signup_enabled', 'true', 'Allow new student registrations', 'general'),
  ('platform_name', '"TutorLingua"', 'Platform display name', 'general'),

  -- Payment settings
  ('platform_fee_percentage', '0', 'Platform fee percentage on bookings (0-100)', 'payments'),
  ('stripe_connect_enabled', 'true', 'Enable Stripe Connect for tutors', 'payments'),
  ('default_currency', '"USD"', 'Default platform currency', 'payments'),
  ('supported_currencies', '["USD", "EUR", "GBP", "CAD", "AUD"]', 'Supported currencies for payments', 'payments'),
  ('minimum_payout_amount_cents', '1000', 'Minimum payout amount in cents', 'payments'),

  -- Feature flags
  ('ai_features_enabled', 'false', 'Enable AI assistant features', 'features'),
  ('digital_products_enabled', 'true', 'Enable digital product sales', 'features'),
  ('group_sessions_enabled', 'false', 'Enable group session bookings', 'features'),
  ('email_campaigns_enabled', 'true', 'Enable tutor email campaigns', 'features'),
  ('calendar_sync_enabled', 'true', 'Enable Google/Outlook calendar sync', 'features'),

  -- Plan limits
  ('max_students_professional', '20', 'Max students for Professional (free) plan', 'limits'),
  ('max_students_growth', '999999', 'Max students for Growth plan', 'limits'),
  ('max_services_professional', '3', 'Max services for Professional plan', 'limits'),
  ('max_services_growth', '999999', 'Max services for Growth plan', 'limits'),

  -- Notification settings
  ('lesson_reminder_hours', '24', 'Hours before lesson to send reminder', 'notifications'),
  ('admin_email', '"admin@tutorlingua.co"', 'Admin notification email', 'notifications')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- RLS POLICIES
-- All config access via service role only
-- ============================================================================

ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages platform_config"
  ON platform_config FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_platform_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_platform_config_set_updated_at ON platform_config;
CREATE TRIGGER trg_platform_config_set_updated_at
  BEFORE UPDATE ON platform_config
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_config_updated_at();
