-- Create blocked_times table for manual time blocking by tutors
CREATE TABLE IF NOT EXISTS blocked_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure end_time is after start_time
  CONSTRAINT blocked_times_valid_range CHECK (end_time > start_time)
);

-- Index for efficient queries by tutor and time range
CREATE INDEX IF NOT EXISTS blocked_times_tutor_time_idx
  ON blocked_times (tutor_id, start_time, end_time);

-- Enable RLS
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;

-- Policy: Tutors can view their own blocked times
CREATE POLICY "Tutors can view own blocked times"
  ON blocked_times FOR SELECT
  USING (auth.uid() = tutor_id);

-- Policy: Tutors can insert their own blocked times
CREATE POLICY "Tutors can insert own blocked times"
  ON blocked_times FOR INSERT
  WITH CHECK (auth.uid() = tutor_id);

-- Policy: Tutors can update their own blocked times
CREATE POLICY "Tutors can update own blocked times"
  ON blocked_times FOR UPDATE
  USING (auth.uid() = tutor_id)
  WITH CHECK (auth.uid() = tutor_id);

-- Policy: Tutors can delete their own blocked times
CREATE POLICY "Tutors can delete own blocked times"
  ON blocked_times FOR DELETE
  USING (auth.uid() = tutor_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blocked_times_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blocked_times_updated_at
  BEFORE UPDATE ON blocked_times
  FOR EACH ROW
  EXECUTE FUNCTION update_blocked_times_updated_at();

-- Comment on table
COMMENT ON TABLE blocked_times IS 'Manual time blocks set by tutors to mark unavailable periods';
