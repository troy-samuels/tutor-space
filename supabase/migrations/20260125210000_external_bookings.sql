-- Migration: External Bookings for Unified Calendar
-- Allows tutors to track external marketplace bookings (Preply, iTalki, Verbling, etc.)

-- Create external_bookings table
CREATE TABLE IF NOT EXISTS external_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  source TEXT NOT NULL CHECK (source IN ('preply', 'italki', 'verbling', 'other')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  student_name TEXT,
  notes TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_external_bookings_tutor_id ON external_bookings(tutor_id);
CREATE INDEX IF NOT EXISTS idx_external_bookings_scheduled_at ON external_bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_external_bookings_source ON external_bookings(source);

-- Enable RLS
ALTER TABLE external_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Tutors can manage their own external bookings
CREATE POLICY "Tutors manage external bookings"
  ON external_bookings
  FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Add marketplace_source column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS marketplace_source TEXT
  CHECK (marketplace_source IS NULL OR marketplace_source IN ('preply', 'italki', 'verbling', 'other'));

-- Add comment for documentation
COMMENT ON TABLE external_bookings IS 'External marketplace bookings (Preply, iTalki, Verbling) for unified calendar view';
COMMENT ON COLUMN external_bookings.source IS 'Marketplace source: preply, italki, verbling, or other';
COMMENT ON COLUMN external_bookings.student_name IS 'Student name (used when student_id is not linked)';
COMMENT ON COLUMN students.marketplace_source IS 'Original marketplace where student was discovered';

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_external_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER external_bookings_updated_at
  BEFORE UPDATE ON external_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_external_bookings_updated_at();
