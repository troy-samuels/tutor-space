-- Calendar sync hardening: align schema with application code and add durable sync tables

-- Align calendar_connections with code expectations
ALTER TABLE calendar_connections
  ADD COLUMN IF NOT EXISTS provider_account_id TEXT,
  ADD COLUMN IF NOT EXISTS account_name TEXT,
  ADD COLUMN IF NOT EXISTS scope TEXT,
  ADD COLUMN IF NOT EXISTS access_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'healthy', 'syncing', 'error')),
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Backfill access_token_expires_at from legacy token_expires_at if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'calendar_connections' AND column_name = 'token_expires_at'
  ) THEN
    UPDATE calendar_connections
    SET access_token_expires_at = COALESCE(access_token_expires_at, token_expires_at)
    WHERE access_token_expires_at IS NULL;
  END IF;
END $$;

-- Indexes for status lookups and recent syncs
CREATE INDEX IF NOT EXISTS idx_calendar_connections_status ON calendar_connections (sync_status);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_last_synced ON calendar_connections (last_synced_at);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_tutor_provider ON calendar_connections (tutor_id, provider);

-- RLS for calendar_connections
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS calendar_connections_tutor_select ON calendar_connections;
DROP POLICY IF EXISTS calendar_connections_tutor_insert ON calendar_connections;
DROP POLICY IF EXISTS calendar_connections_tutor_update ON calendar_connections;
DROP POLICY IF EXISTS calendar_connections_tutor_delete ON calendar_connections;
DROP POLICY IF EXISTS calendar_connections_service_role_all ON calendar_connections;

CREATE POLICY calendar_connections_tutor_select ON calendar_connections
  FOR SELECT USING (tutor_id = auth.uid());

CREATE POLICY calendar_connections_tutor_insert ON calendar_connections
  FOR INSERT WITH CHECK (tutor_id = auth.uid());

CREATE POLICY calendar_connections_tutor_update ON calendar_connections
  FOR UPDATE USING (tutor_id = auth.uid()) WITH CHECK (tutor_id = auth.uid());

CREATE POLICY calendar_connections_tutor_delete ON calendar_connections
  FOR DELETE USING (tutor_id = auth.uid());

CREATE POLICY calendar_connections_service_role_all ON calendar_connections
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role') WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- External calendar events cache
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_account_id TEXT,
  provider_event_id TEXT NOT NULL,
  calendar_id TEXT,
  recurrence_master_id TEXT,
  recurrence_instance_start TIMESTAMPTZ,
  etag TEXT,
  version TEXT,
  summary TEXT,
  location TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'confirmed',
  fingerprint_hash TEXT,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_at > start_at)
);

-- Unique per provider event + instance
CREATE UNIQUE INDEX IF NOT EXISTS ux_calendar_events_provider_instance
  ON calendar_events (tutor_id, provider, provider_event_id, COALESCE(recurrence_instance_start, start_at));

CREATE INDEX IF NOT EXISTS idx_calendar_events_time ON calendar_events (start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events (status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_tutor_time ON calendar_events (tutor_id, start_at, end_at);

-- RLS for calendar_events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS calendar_events_tutor_select ON calendar_events;
DROP POLICY IF EXISTS calendar_events_tutor_insert ON calendar_events;
DROP POLICY IF EXISTS calendar_events_tutor_update ON calendar_events;
DROP POLICY IF EXISTS calendar_events_tutor_delete ON calendar_events;
DROP POLICY IF EXISTS calendar_events_service_role_all ON calendar_events;

CREATE POLICY calendar_events_tutor_select ON calendar_events
  FOR SELECT USING (tutor_id = auth.uid());

CREATE POLICY calendar_events_tutor_insert ON calendar_events
  FOR INSERT WITH CHECK (tutor_id = auth.uid());

CREATE POLICY calendar_events_tutor_update ON calendar_events
  FOR UPDATE USING (tutor_id = auth.uid()) WITH CHECK (tutor_id = auth.uid());

CREATE POLICY calendar_events_tutor_delete ON calendar_events
  FOR DELETE USING (tutor_id = auth.uid());

CREATE POLICY calendar_events_service_role_all ON calendar_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role') WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Sync run log
CREATE TABLE IF NOT EXISTS calendar_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('webhook_incremental', 'poll_incremental', 'full_rescan', 'retry')),
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  items_fetched INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_deleted INTEGER DEFAULT 0,
  sync_token TEXT,
  next_page_token TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_calendar_sync_runs_tutor_time ON calendar_sync_runs (tutor_id, started_at DESC);

ALTER TABLE calendar_sync_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS calendar_sync_runs_tutor_select ON calendar_sync_runs;
DROP POLICY IF EXISTS calendar_sync_runs_service_role_all ON calendar_sync_runs;

CREATE POLICY calendar_sync_runs_tutor_select ON calendar_sync_runs
  FOR SELECT USING (tutor_id = auth.uid());

CREATE POLICY calendar_sync_runs_service_role_all ON calendar_sync_runs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role') WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Lightweight job queue for calendar sync
CREATE TABLE IF NOT EXISTS calendar_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('webhook_incremental', 'poll_incremental', 'full_rescan', 'retry')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'complete', 'dead')),
  not_before TIMESTAMPTZ DEFAULT NOW(),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  last_error TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_sync_jobs_status ON calendar_sync_jobs (status, not_before);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_jobs_tutor_status ON calendar_sync_jobs (tutor_id, status, not_before);

ALTER TABLE calendar_sync_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS calendar_sync_jobs_tutor_select ON calendar_sync_jobs;
DROP POLICY IF EXISTS calendar_sync_jobs_tutor_update ON calendar_sync_jobs;
DROP POLICY IF EXISTS calendar_sync_jobs_tutor_delete ON calendar_sync_jobs;
DROP POLICY IF EXISTS calendar_sync_jobs_service_role_all ON calendar_sync_jobs;

CREATE POLICY calendar_sync_jobs_tutor_select ON calendar_sync_jobs
  FOR SELECT USING (tutor_id = auth.uid());

CREATE POLICY calendar_sync_jobs_tutor_update ON calendar_sync_jobs
  FOR UPDATE USING (tutor_id = auth.uid()) WITH CHECK (tutor_id = auth.uid());

CREATE POLICY calendar_sync_jobs_tutor_delete ON calendar_sync_jobs
  FOR DELETE USING (tutor_id = auth.uid());

CREATE POLICY calendar_sync_jobs_service_role_all ON calendar_sync_jobs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role') WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
