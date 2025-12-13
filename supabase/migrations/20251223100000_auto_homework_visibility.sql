-- Migration: Auto-Generated Homework Visibility & Tutor Review
-- Purpose: Add tracking for auto-generated content, tutor approval workflow, and configurable preferences

-- 1. Add columns to homework_assignments for source tracking and review status
ALTER TABLE homework_assignments
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'
    CHECK (source IN ('manual', 'auto_lesson_analysis', 'auto_ai_practice')),
  ADD COLUMN IF NOT EXISTS recording_id UUID REFERENCES lesson_recordings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tutor_reviewed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tutor_reviewed_at TIMESTAMPTZ;

-- 2. Add columns to lesson_drills for source tracking and visibility control
ALTER TABLE lesson_drills
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'
    CHECK (source IN ('manual', 'auto_fluency', 'auto_grammar', 'auto_vocabulary')),
  ADD COLUMN IF NOT EXISTS tutor_approved BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tutor_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS visible_to_student BOOLEAN DEFAULT TRUE;

-- 3. Add columns to lesson_recordings for tutor notification/review tracking
ALTER TABLE lesson_recordings
  ADD COLUMN IF NOT EXISTS tutor_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tutor_reviewed_at TIMESTAMPTZ;

-- 4. Add tutor preference to profiles for configurable approval workflow
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS auto_homework_approval TEXT DEFAULT 'require_approval'
    CHECK (auto_homework_approval IN ('require_approval', 'auto_send'));

-- 5. Create index for efficient querying of draft homework
CREATE INDEX IF NOT EXISTS idx_homework_assignments_source
  ON homework_assignments(source)
  WHERE source != 'manual';

CREATE INDEX IF NOT EXISTS idx_homework_assignments_tutor_reviewed
  ON homework_assignments(tutor_id, tutor_reviewed)
  WHERE tutor_reviewed = FALSE AND source != 'manual';

-- 6. Create index for drill visibility queries
CREATE INDEX IF NOT EXISTS idx_lesson_drills_visibility
  ON lesson_drills(student_id, visible_to_student)
  WHERE visible_to_student = FALSE;

CREATE INDEX IF NOT EXISTS idx_lesson_drills_source
  ON lesson_drills(source)
  WHERE source != 'manual';

-- 7. Update RLS policies for lesson_drills to respect visibility
-- Students can only see drills that are visible_to_student = true
DROP POLICY IF EXISTS "Students can view their own drills" ON lesson_drills;
CREATE POLICY "Students can view their visible drills"
  ON lesson_drills FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
    AND visible_to_student = TRUE
  );

-- Tutors can view all drills for their students
DROP POLICY IF EXISTS "Tutors can view drills for their students" ON lesson_drills;
CREATE POLICY "Tutors can view drills for their students"
  ON lesson_drills FOR SELECT
  USING (tutor_id = auth.uid());

-- Tutors can update drills for their students
CREATE POLICY IF NOT EXISTS "Tutors can update drills for their students"
  ON lesson_drills FOR UPDATE
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Tutors can delete drills for their students
CREATE POLICY IF NOT EXISTS "Tutors can delete drills for their students"
  ON lesson_drills FOR DELETE
  USING (tutor_id = auth.uid());

-- 8. Add comment documentation
COMMENT ON COLUMN homework_assignments.source IS 'Source of homework: manual (tutor created), auto_lesson_analysis (from recording), auto_ai_practice (from AI practice)';
COMMENT ON COLUMN homework_assignments.recording_id IS 'Reference to the lesson recording that generated this homework (if auto-generated)';
COMMENT ON COLUMN homework_assignments.tutor_reviewed IS 'Whether tutor has reviewed auto-generated homework';
COMMENT ON COLUMN homework_assignments.tutor_reviewed_at IS 'Timestamp when tutor reviewed the homework';

COMMENT ON COLUMN lesson_drills.source IS 'Source of drill: manual, auto_fluency, auto_grammar, auto_vocabulary';
COMMENT ON COLUMN lesson_drills.tutor_approved IS 'Whether tutor has approved this drill for student visibility';
COMMENT ON COLUMN lesson_drills.visible_to_student IS 'Whether student can see this drill (controlled by tutor approval workflow)';

COMMENT ON COLUMN profiles.auto_homework_approval IS 'Tutor preference: require_approval (review before sending) or auto_send (immediate delivery)';
