-- ============================================================================
-- CONTENT MODERATION SYSTEM
-- Tables and functions for handling content reports and moderation
-- ============================================================================

-- Content reports table
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_role TEXT CHECK (reporter_role IN ('tutor', 'student', 'admin', 'system')),

  -- What is being reported
  content_type TEXT NOT NULL CHECK (content_type IN ('message', 'review', 'profile', 'tutor_site', 'digital_product')),
  content_id UUID NOT NULL,
  content_preview TEXT, -- Cached preview of reported content

  -- Target user
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_user_role TEXT CHECK (reported_user_role IN ('tutor', 'student')),

  -- Report details
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'scam', 'impersonation', 'copyright', 'other')),
  description TEXT,

  -- Moderation status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Resolution
  resolution_action TEXT CHECK (resolution_action IN ('no_action', 'warning_issued', 'content_removed', 'user_suspended', 'user_banned')),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_content_type ON content_reports(content_type);
CREATE INDEX IF NOT EXISTS idx_content_reports_reported_user ON content_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON content_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_reports_priority ON content_reports(priority);

-- Moderation actions log
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES content_reports(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('view', 'assign', 'update_status', 'update_priority', 'resolve', 'dismiss', 'reopen')),
  previous_value TEXT,
  new_value TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_report ON moderation_actions(report_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_admin ON moderation_actions(admin_id);

-- Enable RLS
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

-- Admins (via service role) can manage reports
CREATE POLICY "Service role manages content_reports"
  ON content_reports FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages moderation_actions"
  ON moderation_actions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Users can create reports
CREATE POLICY "Users create reports"
  ON content_reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- Users can view their own submitted reports
CREATE POLICY "Users view own reports"
  ON content_reports FOR SELECT
  USING (reporter_id = auth.uid());

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_content_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_content_reports_updated_at ON content_reports;
CREATE TRIGGER trg_content_reports_updated_at
  BEFORE UPDATE ON content_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_content_reports_updated_at();

-- Function to auto-escalate priority based on user's report count
CREATE OR REPLACE FUNCTION check_report_escalation()
RETURNS TRIGGER AS $$
DECLARE
  report_count INTEGER;
BEGIN
  -- Count how many times this user has been reported in the last 30 days
  SELECT COUNT(*) INTO report_count
  FROM content_reports
  WHERE reported_user_id = NEW.reported_user_id
    AND created_at > NOW() - INTERVAL '30 days'
    AND status != 'dismissed';

  -- Escalate priority if user has multiple reports
  IF report_count >= 5 THEN
    NEW.priority := 'urgent';
  ELSIF report_count >= 3 THEN
    NEW.priority := 'high';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_report_escalation ON content_reports;
CREATE TRIGGER trg_report_escalation
  BEFORE INSERT ON content_reports
  FOR EACH ROW
  EXECUTE FUNCTION check_report_escalation();
