-- Add booking linkage and auto-homework support for lesson drills
-- Drills generated from lesson analysis should be linked to:
-- 1. The student's next booking (for due date)
-- 2. An auto-created homework assignment

ALTER TABLE lesson_drills
  ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id),
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS homework_assignment_id UUID REFERENCES homework_assignments(id),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS drill_type TEXT DEFAULT 'pronunciation';

-- Add constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lesson_drills_status_check'
  ) THEN
    ALTER TABLE lesson_drills
      ADD CONSTRAINT lesson_drills_status_check
      CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lesson_drills_type_check'
  ) THEN
    ALTER TABLE lesson_drills
      ADD CONSTRAINT lesson_drills_type_check
      CHECK (drill_type IN ('pronunciation', 'grammar', 'vocabulary', 'fluency'));
  END IF;
END $$;

-- Index for finding pending drills by student
CREATE INDEX IF NOT EXISTS idx_lesson_drills_student_pending
  ON lesson_drills (student_id, status)
  WHERE status != 'completed';

-- Index for finding drills by homework assignment
CREATE INDEX IF NOT EXISTS idx_lesson_drills_homework
  ON lesson_drills (homework_assignment_id)
  WHERE homework_assignment_id IS NOT NULL;

COMMENT ON COLUMN lesson_drills.booking_id IS 'Next booking when drill was created (for due date reference)';
COMMENT ON COLUMN lesson_drills.due_date IS 'When the drill should be completed (typically next lesson)';
COMMENT ON COLUMN lesson_drills.homework_assignment_id IS 'Link to auto-created homework assignment';
COMMENT ON COLUMN lesson_drills.status IS 'Drill completion status: pending, assigned, in_progress, completed';
COMMENT ON COLUMN lesson_drills.drill_type IS 'Type of drill: pronunciation, grammar, vocabulary, fluency';
