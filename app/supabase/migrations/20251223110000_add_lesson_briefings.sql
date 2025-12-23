-- Migration: Add lesson briefings table for AI Copilot
-- This table stores pre-lesson briefings generated 24 hours before each lesson
-- Studio tier only - requires lesson recordings and analysis data

-- Create lesson_briefings table
CREATE TABLE IF NOT EXISTS lesson_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

  -- Core briefing content
  student_summary TEXT,                    -- Quick context about this student
  focus_areas JSONB DEFAULT '[]',          -- [{type, topic, reason, evidence}]
  error_patterns JSONB DEFAULT '[]',       -- [{type, count, examples, severity}]
  suggested_activities JSONB DEFAULT '[]', -- [{title, description, duration_min, category}]

  -- Data aggregated from existing tables
  sr_items_due INTEGER DEFAULT 0,
  sr_items_preview JSONB DEFAULT '[]',     -- [{word, type, last_reviewed}]
  goal_progress JSONB,                     -- {goal_text, progress_pct, target_date}
  engagement_trend TEXT,                   -- 'improving', 'stable', 'declining', 'new_student'
  engagement_signals JSONB DEFAULT '[]',   -- [{type, value, concern}]

  -- Recent lesson analysis summary
  lessons_analyzed INTEGER DEFAULT 0,
  last_lesson_summary TEXT,
  last_lesson_date TIMESTAMPTZ,

  -- Proficiency context
  proficiency_level TEXT,                  -- Current level from assessments
  native_language TEXT,                    -- For L1 interference context
  target_language TEXT,

  -- Metadata
  generated_at TIMESTAMPTZ DEFAULT now(),
  viewed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One briefing per booking
  UNIQUE(booking_id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_lesson_briefings_tutor_date
  ON lesson_briefings(tutor_id, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_lesson_briefings_booking
  ON lesson_briefings(booking_id);

CREATE INDEX IF NOT EXISTS idx_lesson_briefings_student
  ON lesson_briefings(student_id);

CREATE INDEX IF NOT EXISTS idx_lesson_briefings_pending
  ON lesson_briefings(tutor_id, dismissed_at)
  WHERE dismissed_at IS NULL;

-- Enable Row Level Security
ALTER TABLE lesson_briefings ENABLE ROW LEVEL SECURITY;

-- Tutors can view their own briefings
CREATE POLICY "Tutors can view their own briefings"
  ON lesson_briefings FOR SELECT
  USING (tutor_id = auth.uid());

-- Tutors can update their own briefings (mark as viewed/dismissed)
CREATE POLICY "Tutors can update their own briefings"
  ON lesson_briefings FOR UPDATE
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Service role can insert briefings (for cron job)
CREATE POLICY "Service role can insert briefings"
  ON lesson_briefings FOR INSERT
  WITH CHECK (true);

-- Service role can delete briefings
CREATE POLICY "Service role can delete briefings"
  ON lesson_briefings FOR DELETE
  USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_lesson_briefings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lesson_briefings_updated_at
  BEFORE UPDATE ON lesson_briefings
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_briefings_updated_at();

-- Add comment for documentation
COMMENT ON TABLE lesson_briefings IS 'AI-generated pre-lesson briefings for tutors (Studio tier). Generated 24 hours before each lesson.';
COMMENT ON COLUMN lesson_briefings.focus_areas IS 'Array of focus areas: [{type: "grammar"|"vocabulary"|"pronunciation", topic: string, reason: string, evidence: string}]';
COMMENT ON COLUMN lesson_briefings.error_patterns IS 'Array of error patterns from recent lessons: [{type: string, count: number, examples: string[], severity: "minor"|"moderate"|"major"}]';
COMMENT ON COLUMN lesson_briefings.suggested_activities IS 'AI-suggested activities: [{title: string, description: string, duration_min: number, category: "warmup"|"practice"|"conversation"|"review"}]';
COMMENT ON COLUMN lesson_briefings.engagement_trend IS 'Student engagement trend: improving, stable, declining, or new_student';
