-- Migration: Add rate limit storage and function for checkout session creation
-- Purpose: Prevent abuse by capping checkout session inits per identifier (user/IP)

CREATE TABLE IF NOT EXISTS rate_limit_events (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index to efficiently query recent events by key
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_key_created_at
  ON rate_limit_events (key, created_at DESC);

-- Enforce service-role only access
ALTER TABLE rate_limit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages rate limit events"
  ON rate_limit_events
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Atomic rate limit consumption: returns allowed flag, remaining quota, and reset time
CREATE OR REPLACE FUNCTION consume_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
) RETURNS TABLE (
  allowed BOOLEAN,
  remaining INTEGER,
  reset_at TIMESTAMPTZ
) AS $$
DECLARE
  window_start TIMESTAMPTZ := NOW() - make_interval(secs => p_window_seconds);
  current_count INTEGER;
  last_event TIMESTAMPTZ;
BEGIN
  IF p_limit <= 0 OR p_window_seconds <= 0 THEN
    RETURN QUERY SELECT FALSE, 0, NOW();
    RETURN;
  END IF;

  SELECT count(*), max(created_at)
  INTO current_count, last_event
  FROM rate_limit_events
  WHERE key = p_key
    AND created_at >= window_start;

  IF current_count >= p_limit THEN
    RETURN QUERY SELECT FALSE, GREATEST(p_limit - current_count, 0), last_event + make_interval(secs => p_window_seconds);
    RETURN;
  END IF;

  INSERT INTO rate_limit_events(key) VALUES (p_key);

  RETURN QUERY SELECT TRUE, p_limit - current_count - 1, NOW() + make_interval(secs => p_window_seconds);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

COMMENT ON TABLE rate_limit_events IS 'Per-identifier rate limit log for checkout session creation.';
COMMENT ON FUNCTION consume_rate_limit IS 'Consume a rate limit token for the given key within a rolling window.';
