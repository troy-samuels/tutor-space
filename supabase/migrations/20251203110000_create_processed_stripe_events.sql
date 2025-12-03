-- Migration: Create processed_stripe_events table for Stripe webhook idempotency
-- This prevents double-processing of webhook events (double-charges, duplicate emails, etc.)

-- Create idempotency table for Stripe webhooks
CREATE TABLE IF NOT EXISTS processed_stripe_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cleanup operations (oldest events first)
CREATE INDEX IF NOT EXISTS idx_processed_stripe_events_created_at
  ON processed_stripe_events(created_at DESC);

-- Index for event type queries (useful for debugging)
CREATE INDEX IF NOT EXISTS idx_processed_stripe_events_event_type
  ON processed_stripe_events(event_type);

-- Enable RLS
ALTER TABLE processed_stripe_events ENABLE ROW LEVEL SECURITY;

-- Service role only (webhooks use service role client)
-- This ensures only the backend can read/write to this table
CREATE POLICY "Service role manages processed events"
  ON processed_stripe_events
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE processed_stripe_events IS 'Idempotency tracking for Stripe webhook events. Prevents double-processing of payments and subscriptions.';
