-- Migration: Add reservation pattern support to processed_requests
-- This fixes the TOCTOU race condition in idempotency checks by enabling
-- atomic "claim" operations with status tracking.

-- Add status column to track processing state
-- 'processing' = request claimed but not yet complete
-- 'completed' = request finished with cached response
ALTER TABLE processed_requests
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed';

-- Add timing columns for stale reservation detection
ALTER TABLE processed_requests
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE processed_requests
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add check constraint for valid statuses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'processed_requests_status_check'
  ) THEN
    ALTER TABLE processed_requests
    ADD CONSTRAINT processed_requests_status_check
    CHECK (status IN ('processing', 'completed'));
  END IF;
END $$;

-- Index for efficiently finding stale processing reservations
CREATE INDEX IF NOT EXISTS idx_processed_requests_status_updated
ON processed_requests (status, updated_at)
WHERE status = 'processing';

-- Backfill any existing rows to 'completed' status
-- (They were created before status tracking existed)
UPDATE processed_requests
SET status = 'completed', updated_at = COALESCE(created_at, NOW())
WHERE status IS NULL OR status = '';
