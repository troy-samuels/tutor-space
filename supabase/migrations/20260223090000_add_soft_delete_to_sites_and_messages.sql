-- Add soft delete support to tutor sites and messaging tables

ALTER TABLE tutor_sites
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_tutor_sites_deleted_at
  ON tutor_sites(deleted_at) WHERE deleted_at IS NULL;

ALTER TABLE conversation_threads
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_conversation_threads_deleted_at
  ON conversation_threads(deleted_at) WHERE deleted_at IS NULL;

ALTER TABLE conversation_messages
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_conversation_messages_deleted_at
  ON conversation_messages(deleted_at) WHERE deleted_at IS NULL;
