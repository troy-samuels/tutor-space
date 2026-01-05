-- Idempotency tracking for create actions
-- Prevents duplicate mutations from double-clicking or network retries

CREATE TABLE IF NOT EXISTS processed_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL UNIQUE,
  response_body JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for cleanup operations (expire old entries)
CREATE INDEX IF NOT EXISTS idx_processed_requests_created_at
  ON processed_requests(created_at DESC);

-- RLS: Only service role can access (server actions use service role)
ALTER TABLE processed_requests ENABLE ROW LEVEL SECURITY;

-- No public policies - service role bypasses RLS

COMMENT ON TABLE processed_requests IS 'Stores responses for idempotent create operations';
COMMENT ON COLUMN processed_requests.idempotency_key IS 'Client-provided mutation ID (unique per request)';
COMMENT ON COLUMN processed_requests.response_body IS 'Cached JSON response to return on duplicate';
