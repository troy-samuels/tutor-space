-- ============================================================================
-- Add egress_id column to lesson_recordings
-- Migration: 20251209110000_add_egress_id_to_recordings.sql
-- Description: Add LiveKit egress ID for tracking recordings from webhook
-- ============================================================================

-- Add egress_id column to track LiveKit recording sessions
ALTER TABLE lesson_recordings
  ADD COLUMN IF NOT EXISTS egress_id TEXT UNIQUE;

-- Index for quick lookup by egress_id (used by webhook)
CREATE INDEX IF NOT EXISTS idx_recordings_egress
  ON lesson_recordings(egress_id);
