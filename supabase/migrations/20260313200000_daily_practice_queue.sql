-- Daily Practice Queue
-- Stores auto-generated daily drills for students.
-- One row per student per day.

CREATE TABLE IF NOT EXISTS daily_practice_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  language text NOT NULL DEFAULT 'Spanish',
  level text NOT NULL DEFAULT 'Intermediate',
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  score integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- One drill per student per day
  CONSTRAINT daily_practice_queue_student_date_unique UNIQUE (student_id, date)
);

-- Index for fast lookups: "get today's drill for this student"
CREATE INDEX IF NOT EXISTS idx_daily_practice_queue_student_date
  ON daily_practice_queue (student_id, date DESC);

-- Index for admin/tutor queries: "which students completed today?"
CREATE INDEX IF NOT EXISTS idx_daily_practice_queue_date_completed
  ON daily_practice_queue (date, completed);

-- RLS
ALTER TABLE daily_practice_queue ENABLE ROW LEVEL SECURITY;

-- Students can read their own drills
CREATE POLICY "Students can read own drills"
  ON daily_practice_queue
  FOR SELECT
  USING (auth.uid() = student_id);

-- Students can insert their own drills (via API)
CREATE POLICY "Students can insert own drills"
  ON daily_practice_queue
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Students can update their own drills (mark complete)
CREATE POLICY "Students can update own drills"
  ON daily_practice_queue
  FOR UPDATE
  USING (auth.uid() = student_id);

-- Service role can do everything (for API routes)
CREATE POLICY "Service role full access"
  ON daily_practice_queue
  FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_daily_practice_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_practice_queue_updated_at
  BEFORE UPDATE ON daily_practice_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_practice_queue_updated_at();
