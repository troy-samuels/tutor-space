-- =============================================================================
-- SECURITY HARDENING MIGRATION
-- Created: 2024-11-29
-- Purpose: Fix critical security issues for MVP launch
--
-- This migration:
-- 1. Adds RLS to payments_audit and refund_requests tables
-- 2. Adds RLS to page_views and link_events (analytics)
-- 3. Creates core tables if they don't exist (for new environments)
-- 4. Adds data retention infrastructure for analytics
-- =============================================================================

-- =============================================================================
-- PART 1: CORE SCHEMA (for new environments)
-- These use IF NOT EXISTS to be idempotent
-- =============================================================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  tagline TEXT,
  bio TEXT,
  role TEXT DEFAULT 'tutor',
  plan TEXT DEFAULT 'professional',
  timezone TEXT DEFAULT 'UTC',
  languages TEXT[] DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  payment_methods JSONB DEFAULT '{}',
  video_settings JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  stripe_account_id TEXT,
  stripe_charges_enabled BOOLEAN DEFAULT FALSE,
  stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
  stripe_onboarding_status TEXT DEFAULT 'pending',
  stripe_default_currency TEXT,
  stripe_country TEXT,
  stripe_last_capability_check_at TIMESTAMPTZ,
  booking_currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  timezone TEXT,
  native_language TEXT,
  learning_goals TEXT,
  proficiency_level TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  source TEXT DEFAULT 'manual',
  calendar_access_status TEXT DEFAULT 'pending',
  email_opt_out BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tutor_id, email)
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price_amount INTEGER NOT NULL DEFAULT 0,
  price_currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT TRUE,
  requires_approval BOOLEAN DEFAULT FALSE,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  offer_type TEXT DEFAULT 'single_session',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Availability table
CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  timezone TEXT,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'unpaid',
  payment_amount INTEGER,
  currency TEXT,
  stripe_payment_intent_id TEXT,
  student_notes TEXT,
  tutor_notes TEXT,
  meeting_url TEXT,
  meeting_provider TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session package templates
CREATE TABLE IF NOT EXISTS session_package_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  session_count INTEGER NOT NULL,
  total_minutes INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  validity_days INTEGER,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session package purchases
CREATE TABLE IF NOT EXISTS session_package_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES session_package_templates(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  remaining_minutes INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation threads
CREATE TABLE IF NOT EXISTS conversation_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  last_message_preview TEXT,
  tutor_unread BOOLEAN DEFAULT FALSE,
  student_unread BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tutor_id, student_id)
);

-- Conversation messages
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES conversation_threads(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digital products
CREATE TABLE IF NOT EXISTS digital_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  fulfillment_type TEXT DEFAULT 'file',
  file_url TEXT,
  external_url TEXT,
  download_limit INTEGER DEFAULT 5,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digital product purchases
CREATE TABLE IF NOT EXISTS digital_product_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  buyer_name TEXT,
  download_token TEXT UNIQUE NOT NULL,
  download_count INTEGER DEFAULT 0,
  download_limit INTEGER DEFAULT 5,
  status TEXT DEFAULT 'pending',
  stripe_session_id TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Links (link-in-bio)
CREATE TABLE IF NOT EXISTS links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  button_style TEXT DEFAULT 'default',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link events (click tracking)
CREATE TABLE IF NOT EXISTS link_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  referer TEXT,
  ip_hash TEXT -- Anonymized IP
);

-- Calendar connections
CREATE TABLE IF NOT EXISTS calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  account_email TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tutor_id, provider)
);

-- Page views (analytics)
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  user_id UUID,
  user_type TEXT,
  session_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT, -- ANONYMIZED - not raw IP
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: If page_views already exists with ip_address column, rename it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'page_views' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE page_views RENAME COLUMN ip_address TO ip_hash;
  END IF;
END $$;

-- Payments audit table (tracks all payment transactions)
CREATE TABLE IF NOT EXISTS payments_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  digital_product_purchase_id UUID REFERENCES digital_product_purchases(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  application_fee_cents INTEGER,
  net_amount_cents INTEGER,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  destination_account_id TEXT,
  payment_type TEXT DEFAULT 'booking',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refund requests table (tracks refund workflow)
CREATE TABLE IF NOT EXISTS refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  payments_audit_id UUID REFERENCES payments_audit(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  reason TEXT,
  status TEXT DEFAULT 'requested',
  actor_requested TEXT NOT NULL, -- 'student', 'tutor', or 'admin'
  processed_by_user_id UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PART 2: RLS POLICIES FOR FINANCIAL TABLES
-- =============================================================================

-- Enable RLS on payments_audit
ALTER TABLE IF EXISTS payments_audit ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS payments_audit_tutor_read ON payments_audit;
DROP POLICY IF EXISTS payments_audit_admin_all ON payments_audit;

-- Tutors can only read their own payment records
CREATE POLICY payments_audit_tutor_read ON payments_audit
  FOR SELECT
  USING (tutor_id = auth.uid());

-- Note: Inserts to payments_audit happen via service role (webhook handlers)
-- No user-facing insert policy needed

-- Enable RLS on refund_requests
ALTER TABLE IF EXISTS refund_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS refund_requests_tutor_read ON refund_requests;
DROP POLICY IF EXISTS refund_requests_tutor_create ON refund_requests;
DROP POLICY IF EXISTS refund_requests_student_read ON refund_requests;

-- Tutors can read refund requests for their bookings
CREATE POLICY refund_requests_tutor_read ON refund_requests
  FOR SELECT
  USING (tutor_id = auth.uid());

-- Tutors can create refund requests for their own bookings
CREATE POLICY refund_requests_tutor_create ON refund_requests
  FOR INSERT
  WITH CHECK (tutor_id = auth.uid());

-- Students can read their own refund requests
CREATE POLICY refund_requests_student_read ON refund_requests
  FOR SELECT
  USING (student_id = auth.uid());

-- =============================================================================
-- PART 3: RLS POLICIES FOR ANALYTICS TABLES
-- =============================================================================

-- Enable RLS on page_views
ALTER TABLE IF EXISTS page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS page_views_no_user_access ON page_views;

-- No user-facing read access to page_views - only admin via service role
-- This protects user privacy - analytics are aggregated, not individual
CREATE POLICY page_views_no_user_access ON page_views
  FOR ALL
  USING (false); -- Deny all direct access, service role bypasses RLS

-- Enable RLS on link_events
ALTER TABLE IF EXISTS link_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS link_events_tutor_read ON link_events;

-- Tutors can only read click events for their own links
CREATE POLICY link_events_tutor_read ON link_events
  FOR SELECT
  USING (tutor_id = auth.uid());

-- =============================================================================
-- PART 4: INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account_id ON profiles(stripe_account_id);

CREATE INDEX IF NOT EXISTS idx_students_tutor_id ON students(tutor_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);

CREATE INDEX IF NOT EXISTS idx_services_tutor_id ON services(tutor_id);

CREATE INDEX IF NOT EXISTS idx_availability_tutor_id ON availability(tutor_id);

CREATE INDEX IF NOT EXISTS idx_bookings_tutor_id ON bookings(tutor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_student_id ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_payments_audit_tutor_id ON payments_audit(tutor_id);
CREATE INDEX IF NOT EXISTS idx_payments_audit_created_at ON payments_audit(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_refund_requests_tutor_id ON refund_requests(tutor_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);

CREATE INDEX IF NOT EXISTS idx_link_events_tutor_id ON link_events(tutor_id);
CREATE INDEX IF NOT EXISTS idx_link_events_clicked_at ON link_events(clicked_at DESC);

-- =============================================================================
-- PART 5: DATA RETENTION FUNCTION FOR ANALYTICS
-- =============================================================================

-- Function to clean up old analytics data (for GDPR compliance)
CREATE OR REPLACE FUNCTION cleanup_old_analytics(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  cutoff_date TIMESTAMPTZ;
BEGIN
  cutoff_date := NOW() - (retention_days || ' days')::INTERVAL;

  -- Delete old page views
  WITH deleted AS (
    DELETE FROM page_views
    WHERE created_at < cutoff_date
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  -- Delete old link events
  WITH deleted AS (
    DELETE FROM link_events
    WHERE clicked_at < cutoff_date
    RETURNING 1
  )
  SELECT deleted_count + COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMPLETE
-- =============================================================================
