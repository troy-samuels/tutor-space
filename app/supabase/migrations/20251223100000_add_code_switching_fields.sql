-- Migration: Add code-switching fields to lesson_recordings
-- Description: Adds columns for multilingual code-switching analysis metrics
-- Date: 2025-12-23

-- Add code-switching analysis fields to lesson_recordings
ALTER TABLE lesson_recordings
ADD COLUMN IF NOT EXISTS code_switching_metrics JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS detected_languages TEXT[] DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN lesson_recordings.code_switching_metrics IS
  'Metrics from multilingual code-switching analysis including word counts by language, switch count, and dominant language';

COMMENT ON COLUMN lesson_recordings.detected_languages IS
  'Array of BCP-47 language codes detected in the recording (e.g., ["en", "es"])';

-- Create index for querying recordings by detected languages
CREATE INDEX IF NOT EXISTS idx_lesson_recordings_detected_languages
ON lesson_recordings USING GIN (detected_languages);

-- Create index for querying recordings with code-switching
CREATE INDEX IF NOT EXISTS idx_lesson_recordings_code_switching
ON lesson_recordings ((code_switching_metrics->>'isCodeSwitched'))
WHERE code_switching_metrics IS NOT NULL;
