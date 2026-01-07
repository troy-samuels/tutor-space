-- Add richer analysis fields and silent processing logs

-- Extend lesson_recordings with key points and fluency flags
ALTER TABLE lesson_recordings
  ADD COLUMN IF NOT EXISTS key_points JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS fluency_flags JSONB DEFAULT '[]';

-- Extend lesson_drills with metadata for auto-generated missions
ALTER TABLE lesson_drills
  ADD COLUMN IF NOT EXISTS source_timestamp_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS focus_area TEXT;

-- Processing logs (internal only, not surfaced in UI)
CREATE TABLE IF NOT EXISTS processing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- e.g., 'lesson_recording'
  entity_id UUID NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error')),
  message TEXT NOT NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processing_logs_entity ON processing_logs(entity_type, entity_id);
