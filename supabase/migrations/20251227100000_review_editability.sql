-- Migration: Enable Review Editability
-- Students can update their existing reviews (one review per tutor, but editable)

-- Add updated_at column to reviews table for tracking edits
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger function to auto-update timestamp on review edits
CREATE OR REPLACE FUNCTION update_review_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_review_timestamp_trigger ON reviews;
CREATE TRIGGER update_review_timestamp_trigger
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_review_timestamp();

-- RLS policy for students to update their own reviews
-- Students can only update reviews where they are the author (via student_id)
DROP POLICY IF EXISTS "Students update own reviews" ON reviews;
CREATE POLICY "Students update own reviews"
  ON reviews FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM students
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT id FROM students
      WHERE user_id = auth.uid()
    )
  );

-- RLS policy for students to update their own tutor_site_reviews
-- This syncs the public-facing review display when students edit their review
DROP POLICY IF EXISTS "Students update own site reviews" ON tutor_site_reviews;
CREATE POLICY "Students update own site reviews"
  ON tutor_site_reviews FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM students
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT id FROM students
      WHERE user_id = auth.uid()
    )
  );

-- Add index for faster review lookups by student
CREATE INDEX IF NOT EXISTS idx_reviews_student_tutor
  ON reviews(student_id, tutor_id);

-- Add index for tutor_site_reviews by student
CREATE INDEX IF NOT EXISTS idx_tutor_site_reviews_student
  ON tutor_site_reviews(student_id);
