-- ============================================================================
-- ADMIN DASHBOARD TABLES
-- Creates tables for platform admin functionality separate from tutors/students
-- ============================================================================

-- ============================================================================
-- ADMIN USERS TABLE
-- Completely separate from profiles (tutors) and students
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'support' CHECK (role IN ('super_admin', 'admin', 'support')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (email);

-- ============================================================================
-- ADMIN AUDIT LOG
-- Track all admin actions for compliance and debugging
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'login', 'logout', 'impersonate', 'view_tutor', 'send_email', 'export_data', etc.
  target_type TEXT, -- 'tutor', 'student', 'booking', 'refund', etc.
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin ON admin_audit_log (admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON admin_audit_log (target_type, target_id);

-- ============================================================================
-- PAGE VIEWS ANALYTICS
-- Track all page views platform-wide for analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  user_id UUID, -- NULL for anonymous visitors
  user_type TEXT, -- 'tutor', 'student', 'admin', NULL for anonymous
  session_id TEXT NOT NULL, -- Client-generated session identifier
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views (page_path, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_user ON page_views (user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views (session_id);

-- ============================================================================
-- IMPERSONATION SESSIONS
-- Track when admins impersonate tutors for support
-- ============================================================================
CREATE TABLE IF NOT EXISTS impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  reason TEXT NOT NULL, -- Required reason for audit trail
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_admin ON impersonation_sessions (admin_user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_tutor ON impersonation_sessions (tutor_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_active ON impersonation_sessions (is_active) WHERE is_active = TRUE;

-- ============================================================================
-- ADMIN EMAILS
-- Track emails sent by admins to tutors
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  recipient_ids UUID[] NOT NULL, -- Array of tutor profile IDs
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  template_id TEXT, -- Optional template reference
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_emails_admin ON admin_emails (admin_user_id, sent_at DESC);

-- ============================================================================
-- RLS POLICIES FOR ADMIN TABLES
-- All admin tables are accessed via service role only
-- ============================================================================
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;

-- Service role has full access to admin tables
CREATE POLICY "Service role manages admin_users"
  ON admin_users FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages admin_audit_log"
  ON admin_audit_log FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages page_views"
  ON page_views FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages impersonation_sessions"
  ON impersonation_sessions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages admin_emails"
  ON admin_emails FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- UPDATED_AT TRIGGER FOR ADMIN_USERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_users_set_updated_at ON admin_users;
CREATE TRIGGER trg_admin_users_set_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();
