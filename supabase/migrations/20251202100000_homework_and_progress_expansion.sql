-- ============================================================================
-- HOMEWORK ASSIGNMENTS + PROGRESS UX SUPPORT
-- Adds structured homework planner with attachment links and stats updates
-- ============================================================================

-- Homework assignments (per student)
CREATE TABLE IF NOT EXISTS homework_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  instructions TEXT,
  status TEXT NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned', 'in_progress', 'submitted', 'completed', 'cancelled')),
  due_date TIMESTAMPTZ,

  -- Attachment links (PDFs, images, external URLs)
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(attachments) = 'array'),

  student_notes TEXT,
  tutor_notes TEXT,
  completed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homework_assignments_student ON homework_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_homework_assignments_tutor ON homework_assignments(tutor_id);
CREATE INDEX IF NOT EXISTS idx_homework_assignments_status ON homework_assignments(status);
CREATE INDEX IF NOT EXISTS idx_homework_assignments_due_date ON homework_assignments(due_date);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION set_homework_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_homework_assignments_updated_at ON homework_assignments;
CREATE TRIGGER trg_homework_assignments_updated_at
  BEFORE UPDATE ON homework_assignments
  FOR EACH ROW
  EXECUTE FUNCTION set_homework_assignments_updated_at();

-- Keep learning_stats.homework_completed in sync when assignments are completed
CREATE OR REPLACE FUNCTION update_learning_stats_on_homework()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'completed' THEN
      UPDATE learning_stats
      SET homework_completed = GREATEST(COALESCE(homework_completed, 0) - 1, 0),
          updated_at = NOW()
      WHERE student_id = OLD.student_id
        AND tutor_id = OLD.tutor_id;
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
    INSERT INTO learning_stats (student_id, tutor_id, homework_completed, updated_at)
    VALUES (NEW.student_id, NEW.tutor_id, 1, NOW())
    ON CONFLICT (student_id, tutor_id) DO UPDATE SET
      homework_completed = COALESCE(learning_stats.homework_completed, 0) + 1,
      updated_at = NOW();
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status IS DISTINCT FROM 'completed' THEN
    UPDATE learning_stats
    SET homework_completed = GREATEST(COALESCE(homework_completed, 0) - 1, 0),
        updated_at = NOW()
    WHERE student_id = OLD.student_id
      AND tutor_id = OLD.tutor_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_learning_stats_homework ON homework_assignments;
CREATE TRIGGER trg_update_learning_stats_homework
  AFTER INSERT OR UPDATE OR DELETE ON homework_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_learning_stats_on_homework();

-- Enable RLS
ALTER TABLE homework_assignments ENABLE ROW LEVEL SECURITY;

-- Tutors can fully manage their assignments
CREATE POLICY "Tutors manage homework_assignments"
  ON homework_assignments FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Students can view their assignments
CREATE POLICY "Students view homework_assignments"
  ON homework_assignments FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Service role full access
CREATE POLICY "Service role manages homework_assignments"
  ON homework_assignments FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE homework_assignments IS 'Homework planner items with status, due dates, and attachment links for students';
COMMENT ON COLUMN homework_assignments.attachments IS 'Array of attachment objects [{label, url, type}] for PDFs, images, or external resources';
