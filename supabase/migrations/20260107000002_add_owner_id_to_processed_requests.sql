-- Add owner_id column to processed_requests for idempotency lock ownership tracking
-- This enables debugging stale reservations by identifying which request owns the lock

ALTER TABLE processed_requests ADD COLUMN IF NOT EXISTS owner_id TEXT DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN processed_requests.owner_id IS 'TraceId of the request that claimed this reservation (for debugging stale locks)';

-- Add index for efficient queries by owner
CREATE INDEX IF NOT EXISTS idx_processed_requests_owner_id ON processed_requests (owner_id) WHERE owner_id IS NOT NULL;
