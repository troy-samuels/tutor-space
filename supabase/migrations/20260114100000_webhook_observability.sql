-- Migration: Add observability fields to processed_stripe_events
-- Purpose: Better monitoring and debugging of Stripe webhook processing
-- Date: 2026-01-14

-- Add correlation ID for request tracing
ALTER TABLE processed_stripe_events
  ADD COLUMN IF NOT EXISTS correlation_id UUID;

-- Add livemode tracking (matches Stripe event.livemode)
ALTER TABLE processed_stripe_events
  ADD COLUMN IF NOT EXISTS livemode BOOLEAN;

-- Add processing duration for performance monitoring
ALTER TABLE processed_stripe_events
  ADD COLUMN IF NOT EXISTS processing_duration_ms INTEGER;

-- Create index for health check queries
CREATE INDEX IF NOT EXISTS idx_processed_stripe_events_status_processed_at
  ON processed_stripe_events(status, processed_at DESC);

-- Create index for correlation ID lookups
CREATE INDEX IF NOT EXISTS idx_processed_stripe_events_correlation_id
  ON processed_stripe_events(correlation_id)
  WHERE correlation_id IS NOT NULL;

-- Create view for webhook health statistics
CREATE OR REPLACE VIEW webhook_health_stats AS
SELECT
  status,
  COUNT(*) as event_count,
  MAX(processed_at) as last_event_at,
  AVG(processing_duration_ms)::INTEGER as avg_processing_ms,
  MIN(processed_at) as oldest_event_at
FROM processed_stripe_events
WHERE processed_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Comment for documentation
COMMENT ON VIEW webhook_health_stats IS 'Aggregated webhook health metrics for the last 24 hours. Used by /api/stripe/webhook/health endpoint.';
COMMENT ON COLUMN processed_stripe_events.correlation_id IS 'UUID for request tracing across logs and responses';
COMMENT ON COLUMN processed_stripe_events.livemode IS 'Stripe event livemode flag - true for production, false for test';
COMMENT ON COLUMN processed_stripe_events.processing_duration_ms IS 'Time taken to process the event in milliseconds';
