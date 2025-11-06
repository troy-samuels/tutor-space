-- Add access control fields to students table
-- These fields manage which students can see and book from the calendar

ALTER TABLE students
ADD COLUMN IF NOT EXISTS calendar_access_status TEXT DEFAULT 'pending'
  CHECK (calendar_access_status IN ('pending', 'approved', 'denied', 'suspended')),
ADD COLUMN IF NOT EXISTS access_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS access_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS access_approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS students_access_status_idx
  ON students(tutor_id, calendar_access_status);

CREATE INDEX IF NOT EXISTS students_user_id_idx
  ON students(user_id) WHERE user_id IS NOT NULL;

-- Create table to track access requests
CREATE TABLE IF NOT EXISTS student_access_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'denied')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  tutor_notes TEXT,
  student_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for access requests
CREATE INDEX IF NOT EXISTS access_requests_tutor_idx
  ON student_access_requests(tutor_id, status, requested_at DESC);

CREATE INDEX IF NOT EXISTS access_requests_student_idx
  ON student_access_requests(student_id);

-- Add comments for documentation
COMMENT ON COLUMN students.calendar_access_status IS 'Controls whether student can view and book from calendar: pending (new), approved (can book), denied (rejected), suspended (temporarily blocked)';
COMMENT ON COLUMN students.access_requested_at IS 'Timestamp when student first requested calendar access';
COMMENT ON COLUMN students.access_approved_at IS 'Timestamp when tutor approved calendar access';
COMMENT ON COLUMN students.access_approved_by IS 'Tutor (profile) who approved the access';

COMMENT ON TABLE student_access_requests IS 'Tracks all calendar access requests from students to tutors';

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_access_requests_updated_at
  BEFORE UPDATE ON student_access_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for student_access_requests

ALTER TABLE student_access_requests ENABLE ROW LEVEL SECURITY;

-- Tutors can view their own access requests
CREATE POLICY "Tutors can view their access requests"
  ON student_access_requests FOR SELECT
  USING (auth.uid() = tutor_id);

-- Tutors can update (approve/deny) their access requests
CREATE POLICY "Tutors can update their access requests"
  ON student_access_requests FOR UPDATE
  USING (auth.uid() = tutor_id);

-- Students can view their own access requests
CREATE POLICY "Students can view their own access requests"
  ON student_access_requests FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- System can insert access requests (via service role)
CREATE POLICY "Service role can insert access requests"
  ON student_access_requests FOR INSERT
  WITH CHECK (true);
