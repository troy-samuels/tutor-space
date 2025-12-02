-- ============================================================================
-- SYSTEM HEALTH MONITORING
-- Tables for tracking system metrics and status
-- ============================================================================

-- System metrics for time-series data
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL CHECK (metric_type IN ('api_response', 'error_rate', 'db_query', 'job_run', 'email_send', 'storage')),
  metric_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_metrics_type ON system_metrics (metric_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_metrics_recent ON system_metrics (recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics (metric_name, recorded_at DESC);

-- System status for current service health
CREATE TABLE IF NOT EXISTS system_status (
  id TEXT PRIMARY KEY, -- 'database', 'stripe', 'resend', 'storage', 'google_calendar', 'outlook_calendar'
  status TEXT NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'degraded', 'outage', 'unknown')),
  message TEXT,
  last_check_at TIMESTAMPTZ DEFAULT NOW(),
  last_error TEXT,
  consecutive_failures INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial status entries
INSERT INTO system_status (id, status, message) VALUES
  ('database', 'operational', 'Supabase PostgreSQL'),
  ('stripe', 'operational', 'Stripe payment processing'),
  ('resend', 'operational', 'Resend email service'),
  ('storage', 'operational', 'Supabase storage'),
  ('google_calendar', 'operational', 'Google Calendar API'),
  ('outlook_calendar', 'operational', 'Microsoft Outlook API')
ON CONFLICT (id) DO NOTHING;

-- Aggregated metrics for dashboards (hourly)
CREATE TABLE IF NOT EXISTS system_metrics_hourly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  hour_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  sum_value NUMERIC DEFAULT 0,
  avg_value NUMERIC DEFAULT 0,
  min_value NUMERIC,
  max_value NUMERIC,
  p50_value NUMERIC,
  p95_value NUMERIC,
  p99_value NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(metric_type, metric_name, hour_start)
);

CREATE INDEX IF NOT EXISTS idx_system_metrics_hourly_lookup ON system_metrics_hourly (metric_type, metric_name, hour_start DESC);

-- Error log for tracking issues
CREATE TABLE IF NOT EXISTS system_error_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL, -- 'api_error', 'db_error', 'integration_error', 'webhook_error'
  error_code TEXT,
  message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'error' CHECK (severity IN ('warning', 'error', 'critical')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_error_log_type ON system_error_log (error_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_error_log_unresolved ON system_error_log (created_at DESC) WHERE resolved_at IS NULL;

-- Enable RLS
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_error_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages system_metrics"
  ON system_metrics FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages system_status"
  ON system_status FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages system_metrics_hourly"
  ON system_metrics_hourly FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages system_error_log"
  ON system_error_log FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Function to clean up old metrics (keep 7 days of raw data)
CREATE OR REPLACE FUNCTION cleanup_old_system_metrics()
RETURNS void AS $$
BEGIN
  DELETE FROM system_metrics WHERE recorded_at < NOW() - INTERVAL '7 days';
  DELETE FROM system_error_log WHERE created_at < NOW() - INTERVAL '30 days' AND resolved_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated at trigger for system_status
CREATE OR REPLACE FUNCTION update_system_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_system_status_set_updated_at ON system_status;
CREATE TRIGGER trg_system_status_set_updated_at
  BEFORE UPDATE ON system_status
  FOR EACH ROW
  EXECUTE FUNCTION update_system_status_updated_at();
