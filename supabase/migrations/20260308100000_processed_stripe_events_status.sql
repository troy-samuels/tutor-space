-- Migration: Add status tracking to processed_stripe_events for webhook retries

ALTER TABLE processed_stripe_events
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'processed';

ALTER TABLE processed_stripe_events
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;

ALTER TABLE processed_stripe_events
  ADD COLUMN IF NOT EXISTS last_error TEXT;

ALTER TABLE processed_stripe_events
  ADD COLUMN IF NOT EXISTS last_error_at TIMESTAMPTZ;

ALTER TABLE processed_stripe_events
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE processed_stripe_events
  ADD CONSTRAINT processed_stripe_events_status_check
  CHECK (status IN ('processing', 'processed', 'failed'));

UPDATE processed_stripe_events
SET status = 'processed',
    updated_at = COALESCE(updated_at, processed_at, created_at, NOW())
WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_processed_stripe_events_status
  ON processed_stripe_events(status);
