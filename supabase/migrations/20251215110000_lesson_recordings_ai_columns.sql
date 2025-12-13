-- ============================================================================
-- Add AI analysis columns for lesson recordings
-- Ensures transcript analysis can persist summaries and structured insights
-- ============================================================================

ALTER TABLE lesson_recordings
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_summary_md TEXT,
  ADD COLUMN IF NOT EXISTS summary_md TEXT,
  ADD COLUMN IF NOT EXISTS analysis_md TEXT;

-- Helpful index for querying recent analyzed recordings
CREATE INDEX IF NOT EXISTS idx_recordings_ai_status
  ON lesson_recordings(status, created_at);
