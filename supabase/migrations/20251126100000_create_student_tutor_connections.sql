-- Student-Tutor Connections table for the follow/approval model
-- Students can connect with multiple tutors, each requiring approval

CREATE TABLE IF NOT EXISTS student_tutor_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  initial_message TEXT,  -- The one message student can send to request connection
  tutor_notes TEXT,      -- Optional notes from tutor when approving/rejecting
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_user_id, tutor_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS student_tutor_connections_student_idx
  ON student_tutor_connections (student_user_id, status);
CREATE INDEX IF NOT EXISTS student_tutor_connections_tutor_idx
  ON student_tutor_connections (tutor_id, status, requested_at DESC);
CREATE INDEX IF NOT EXISTS student_tutor_connections_pending_idx
  ON student_tutor_connections (tutor_id, status) WHERE status = 'pending';

-- RLS policies
ALTER TABLE student_tutor_connections ENABLE ROW LEVEL SECURITY;

-- Students can view their own connections
CREATE POLICY "Students view own connections"
  ON student_tutor_connections FOR SELECT
  USING (student_user_id = auth.uid());

-- Students can create connection requests
CREATE POLICY "Students create connection requests"
  ON student_tutor_connections FOR INSERT
  WITH CHECK (student_user_id = auth.uid());

-- Tutors can view connection requests to them
CREATE POLICY "Tutors view their connection requests"
  ON student_tutor_connections FOR SELECT
  USING (tutor_id = auth.uid());

-- Tutors can update (approve/reject) connection requests
CREATE POLICY "Tutors update connection requests"
  ON student_tutor_connections FOR UPDATE
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Add student role to profiles if not exists (for distinguishing tutors from students)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'tutor';
  END IF;
END $$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_student_tutor_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS student_tutor_connections_updated_at ON student_tutor_connections;
CREATE TRIGGER student_tutor_connections_updated_at
  BEFORE UPDATE ON student_tutor_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_student_tutor_connections_updated_at();
