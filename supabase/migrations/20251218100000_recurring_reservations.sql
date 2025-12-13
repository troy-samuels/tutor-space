-- Recurring Lesson Reservations Migration
-- Allows students to reserve the same time slot weekly (Preply-style)

-- 1. Create recurring lesson reservations table
CREATE TABLE IF NOT EXISTS recurring_lesson_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE SET NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  timezone TEXT NOT NULL,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  auto_create_bookings BOOLEAN NOT NULL DEFAULT FALSE,
  auto_book_days_ahead INTEGER DEFAULT 7,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent duplicate reservations for same student at same time
  CONSTRAINT unique_student_reservation UNIQUE(tutor_id, student_id, day_of_week, start_time)
);

-- 2. Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_recurring_reservations_tutor
  ON recurring_lesson_reservations(tutor_id, is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_reservations_student
  ON recurring_lesson_reservations(student_id, is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_reservations_day
  ON recurring_lesson_reservations(tutor_id, day_of_week) WHERE is_active = TRUE;

-- 3. Create exceptions table for skipped/rescheduled occurrences
CREATE TABLE IF NOT EXISTS recurring_reservation_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES recurring_lesson_reservations(id) ON DELETE CASCADE,
  occurrence_date DATE NOT NULL,
  exception_type TEXT NOT NULL CHECK (exception_type IN ('cancelled', 'rescheduled', 'skipped')),
  rescheduled_to TIMESTAMPTZ,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent duplicate exceptions for same occurrence
  CONSTRAINT unique_reservation_exception UNIQUE(reservation_id, occurrence_date)
);

-- Create index for exceptions
CREATE INDEX IF NOT EXISTS idx_reservation_exceptions_reservation
  ON recurring_reservation_exceptions(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_exceptions_date
  ON recurring_reservation_exceptions(occurrence_date);

-- 4. Enable RLS
ALTER TABLE recurring_lesson_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_reservation_exceptions ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for recurring_lesson_reservations
CREATE POLICY "Tutors can view own reservations"
  ON recurring_lesson_reservations FOR SELECT
  USING (tutor_id = auth.uid());

CREATE POLICY "Tutors can create reservations"
  ON recurring_lesson_reservations FOR INSERT
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Tutors can update own reservations"
  ON recurring_lesson_reservations FOR UPDATE
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Tutors can delete own reservations"
  ON recurring_lesson_reservations FOR DELETE
  USING (tutor_id = auth.uid());

-- 6. Create RLS policies for exceptions (tutors only)
CREATE POLICY "Tutors can view own reservation exceptions"
  ON recurring_reservation_exceptions FOR SELECT
  USING (
    reservation_id IN (
      SELECT id FROM recurring_lesson_reservations WHERE tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors can create reservation exceptions"
  ON recurring_reservation_exceptions FOR INSERT
  WITH CHECK (
    reservation_id IN (
      SELECT id FROM recurring_lesson_reservations WHERE tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors can update own reservation exceptions"
  ON recurring_reservation_exceptions FOR UPDATE
  USING (
    reservation_id IN (
      SELECT id FROM recurring_lesson_reservations WHERE tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors can delete own reservation exceptions"
  ON recurring_reservation_exceptions FOR DELETE
  USING (
    reservation_id IN (
      SELECT id FROM recurring_lesson_reservations WHERE tutor_id = auth.uid()
    )
  );

-- 7. Create function to get reserved slots for a date range
CREATE OR REPLACE FUNCTION get_reserved_slots_for_range(
  p_tutor_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  reservation_id UUID,
  student_id UUID,
  student_name TEXT,
  service_id UUID,
  service_name TEXT,
  occurrence_date DATE,
  start_time TIME,
  duration_minutes INTEGER,
  timezone TEXT,
  is_exception BOOLEAN,
  exception_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date AS d
  ),
  expanded_reservations AS (
    SELECT
      r.id AS reservation_id,
      r.student_id,
      s.full_name AS student_name,
      r.service_id,
      sv.name AS service_name,
      ds.d AS occurrence_date,
      r.start_time,
      r.duration_minutes,
      r.timezone
    FROM recurring_lesson_reservations r
    CROSS JOIN date_series ds
    LEFT JOIN students s ON s.id = r.student_id
    LEFT JOIN services sv ON sv.id = r.service_id
    WHERE r.tutor_id = p_tutor_id
      AND r.is_active = TRUE
      AND EXTRACT(DOW FROM ds.d) = r.day_of_week
      AND ds.d >= r.effective_from
      AND (r.effective_until IS NULL OR ds.d <= r.effective_until)
  )
  SELECT
    er.reservation_id,
    er.student_id,
    er.student_name,
    er.service_id,
    er.service_name,
    er.occurrence_date,
    er.start_time,
    er.duration_minutes,
    er.timezone,
    (ex.id IS NOT NULL) AS is_exception,
    ex.exception_type
  FROM expanded_reservations er
  LEFT JOIN recurring_reservation_exceptions ex
    ON ex.reservation_id = er.reservation_id
    AND ex.occurrence_date = er.occurrence_date
  ORDER BY er.occurrence_date, er.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to check for reservation conflicts
CREATE OR REPLACE FUNCTION check_reservation_conflict(
  p_tutor_id UUID,
  p_day_of_week INTEGER,
  p_start_time TIME,
  p_duration_minutes INTEGER,
  p_exclude_reservation_id UUID DEFAULT NULL
)
RETURNS TABLE(
  has_conflict BOOLEAN,
  conflicting_reservation_id UUID,
  conflicting_student_name TEXT
) AS $$
DECLARE
  v_end_time TIME;
  v_conflict_id UUID;
  v_conflict_name TEXT;
BEGIN
  v_end_time := p_start_time + (p_duration_minutes || ' minutes')::interval;

  -- Check for overlapping reservations
  SELECT r.id, s.full_name
  INTO v_conflict_id, v_conflict_name
  FROM recurring_lesson_reservations r
  LEFT JOIN students s ON s.id = r.student_id
  WHERE r.tutor_id = p_tutor_id
    AND r.day_of_week = p_day_of_week
    AND r.is_active = TRUE
    AND (p_exclude_reservation_id IS NULL OR r.id != p_exclude_reservation_id)
    AND (
      -- Check time overlap
      (p_start_time < r.start_time + (r.duration_minutes || ' minutes')::interval)
      AND (v_end_time > r.start_time)
    )
  LIMIT 1;

  RETURN QUERY SELECT
    (v_conflict_id IS NOT NULL) AS has_conflict,
    v_conflict_id AS conflicting_reservation_id,
    v_conflict_name AS conflicting_student_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_recurring_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recurring_reservations_updated_at
  BEFORE UPDATE ON recurring_lesson_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_recurring_reservations_updated_at();

-- 10. Add comment for documentation
COMMENT ON TABLE recurring_lesson_reservations IS 'Weekly recurring lesson reservations (Preply-style). Students can reserve the same time slot each week.';
COMMENT ON TABLE recurring_reservation_exceptions IS 'Exceptions for individual occurrences of recurring reservations (cancelled, rescheduled, or skipped).';
COMMENT ON FUNCTION get_reserved_slots_for_range IS 'Expands recurring reservations into individual occurrences for a date range, including exception status.';
COMMENT ON FUNCTION check_reservation_conflict IS 'Checks if a proposed reservation time conflicts with existing reservations.';
