-- Add missing columns for lesson recording analysis
-- The cron job at /api/cron/lesson-analysis tries to update these columns
-- but they were not defined in the initial schema

ALTER TABLE lesson_recordings
  ADD COLUMN IF NOT EXISTS ai_summary_md TEXT,
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add index for efficient lookup of recordings needing analysis
CREATE INDEX IF NOT EXISTS idx_lesson_recordings_pending_analysis
  ON lesson_recordings (status, created_at DESC)
  WHERE ai_summary_md IS NULL;

COMMENT ON COLUMN lesson_recordings.ai_summary_md IS 'Markdown summary from OpenAI analysis';
COMMENT ON COLUMN lesson_recordings.ai_summary IS 'Plain text summary (legacy compatibility)';
COMMENT ON COLUMN lesson_recordings.notes IS 'Tutor notes/homework for the student';
