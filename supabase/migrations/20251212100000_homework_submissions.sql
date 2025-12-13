-- ============================================================================
-- HOMEWORK SUBMISSIONS
-- Student submissions for homework with audio, text, and file support
-- ============================================================================

-- Homework submissions table
CREATE TABLE IF NOT EXISTS homework_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id UUID NOT NULL REFERENCES homework_assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,

  -- Submission content
  text_response TEXT,
  audio_url TEXT,
  file_attachments JSONB DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(file_attachments) = 'array'),

  -- Metadata
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Tutor review
  tutor_feedback TEXT,
  reviewed_at TIMESTAMPTZ,
  review_status TEXT DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'reviewed', 'needs_revision')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_homework_submissions_homework ON homework_submissions(homework_id);
CREATE INDEX IF NOT EXISTS idx_homework_submissions_student ON homework_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_homework_submissions_review_status ON homework_submissions(review_status);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION set_homework_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_homework_submissions_updated_at ON homework_submissions;
CREATE TRIGGER trg_homework_submissions_updated_at
  BEFORE UPDATE ON homework_submissions
  FOR EACH ROW
  EXECUTE FUNCTION set_homework_submissions_updated_at();

-- Enable RLS
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;

-- Students can create and view their own submissions
CREATE POLICY "Students manage own submissions"
  ON homework_submissions FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Tutors can view submissions for their students' homework
CREATE POLICY "Tutors view student submissions"
  ON homework_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM homework_assignments ha
      WHERE ha.id = homework_submissions.homework_id
      AND ha.tutor_id = auth.uid()
    )
  );

-- Tutors can update (review) submissions for their students
CREATE POLICY "Tutors review submissions"
  ON homework_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM homework_assignments ha
      WHERE ha.id = homework_submissions.homework_id
      AND ha.tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM homework_assignments ha
      WHERE ha.id = homework_submissions.homework_id
      AND ha.tutor_id = auth.uid()
    )
  );

-- Service role full access
CREATE POLICY "Service role manages homework_submissions"
  ON homework_submissions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Update homework_assignments status when submission is created
CREATE OR REPLACE FUNCTION update_homework_on_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE homework_assignments
    SET status = 'submitted',
        submitted_at = NEW.submitted_at,
        updated_at = NOW()
    WHERE id = NEW.homework_id
      AND status IN ('assigned', 'in_progress');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_homework_on_submission ON homework_submissions;
CREATE TRIGGER trg_update_homework_on_submission
  AFTER INSERT ON homework_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_homework_on_submission();

COMMENT ON TABLE homework_submissions IS 'Student submissions for homework assignments with audio, text, and file attachments';
COMMENT ON COLUMN homework_submissions.file_attachments IS 'Array of file objects [{name, url, type, size}] uploaded to Supabase Storage';
COMMENT ON COLUMN homework_submissions.review_status IS 'Status of tutor review: pending, reviewed, needs_revision';
