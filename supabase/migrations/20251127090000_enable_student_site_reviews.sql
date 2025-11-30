-- Allow authenticated students to submit reviews that surface on tutor mini-sites

-- Extend tutor_site_reviews with student + rating metadata so we can attribute submissions
ALTER TABLE tutor_site_reviews
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rating SMALLINT CHECK (rating BETWEEN 1 AND 5);

CREATE INDEX IF NOT EXISTS tutor_site_reviews_student_id_idx
  ON tutor_site_reviews(student_id);

CREATE INDEX IF NOT EXISTS tutor_site_reviews_review_id_idx
  ON tutor_site_reviews(review_id);

-- Let students add a review to a tutor site only when they belong to that tutor
DROP POLICY IF EXISTS tutor_site_reviews_student_insert ON tutor_site_reviews;
CREATE POLICY tutor_site_reviews_student_insert
  ON tutor_site_reviews FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM tutor_sites
      WHERE tutor_sites.id = tutor_site_reviews.tutor_site_id
        AND tutor_sites.tutor_id IN (
          SELECT tutor_id FROM students WHERE user_id = auth.uid()
        )
    )
    AND (
      student_id IS NULL
      OR student_id IN (
        SELECT id
        FROM students
        WHERE user_id = auth.uid()
          AND tutor_id IN (
            SELECT tutor_id FROM tutor_sites WHERE tutor_sites.id = tutor_site_reviews.tutor_site_id
          )
      )
    )
    AND EXISTS (
      SELECT 1
      FROM bookings
      WHERE bookings.tutor_id = (
        SELECT tutor_id FROM tutor_sites WHERE tutor_sites.id = tutor_site_reviews.tutor_site_id
      )
      AND bookings.student_id = tutor_site_reviews.student_id
      AND bookings.status = 'completed'
    )
  );

-- Allow students to create and view their own reviews (tutors still keep full control)
DROP POLICY IF EXISTS "Students create reviews" ON reviews;
CREATE POLICY "Students create reviews"
  ON reviews FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM students
      WHERE user_id = auth.uid()
        AND tutor_id = reviews.tutor_id
    )
    AND EXISTS (
      SELECT 1
      FROM bookings
      WHERE bookings.tutor_id = reviews.tutor_id
        AND bookings.student_id = reviews.student_id
        AND bookings.status = 'completed'
    )
  );

DROP POLICY IF EXISTS "Students can view their reviews" ON reviews;
CREATE POLICY "Students can view their reviews"
  ON reviews FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students
      WHERE user_id = auth.uid()
    )
  );

-- Allow students to view their own booking rows so completion checks can pass
DROP POLICY IF EXISTS "Students can view their bookings" ON bookings;
CREATE POLICY "Students can view their bookings"
  ON bookings FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Lesson delivery confirmation with simple auto-complete when the calendar time stays unchanged
-- 1) Track the originally planned start time so we can detect reschedules
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS planned_scheduled_at TIMESTAMPTZ;

UPDATE bookings
SET planned_scheduled_at = scheduled_at
WHERE planned_scheduled_at IS NULL;

CREATE OR REPLACE FUNCTION set_booking_planned_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.planned_scheduled_at IS NULL THEN
    NEW.planned_scheduled_at := NEW.scheduled_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_booking_planned_time ON bookings;
CREATE TRIGGER set_booking_planned_time
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_planned_time();

-- 2) Store per-lesson confirmations that can auto-complete when the time/date never moved
CREATE TABLE IF NOT EXISTS lesson_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  package_purchase_id UUID REFERENCES session_package_purchases(id) ON DELETE SET NULL,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_ack BOOLEAN NOT NULL DEFAULT FALSE,
  student_ack BOOLEAN NOT NULL DEFAULT FALSE,
  auto_completed_at TIMESTAMPTZ,
  disputed BOOLEAN NOT NULL DEFAULT FALSE,
  dispute_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lesson_deliveries_tutor_idx
  ON lesson_deliveries(tutor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lesson_deliveries_student_idx
  ON lesson_deliveries(student_id, created_at DESC);

-- Simple auto-complete: if the booking time hasn't changed, mark both sides after the scheduled end
CREATE OR REPLACE FUNCTION lesson_deliveries_apply_auto_complete()
RETURNS TRIGGER AS $$
DECLARE
  b RECORD;
BEGIN
  SELECT scheduled_at, planned_scheduled_at, duration_minutes
  INTO b
  FROM bookings
  WHERE id = NEW.booking_id;

  IF b.planned_scheduled_at IS NOT NULL
     AND b.scheduled_at = b.planned_scheduled_at
     AND (b.scheduled_at + (b.duration_minutes || ' minutes')::interval) <= NOW()
     AND NOT NEW.disputed
  THEN
     NEW.tutor_ack := TRUE;
     NEW.student_ack := TRUE;
     IF NEW.auto_completed_at IS NULL THEN
       NEW.auto_completed_at := NOW();
     END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lesson_deliveries_auto_complete ON lesson_deliveries;
CREATE TRIGGER lesson_deliveries_auto_complete
  BEFORE INSERT OR UPDATE ON lesson_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION lesson_deliveries_apply_auto_complete();

-- RLS: tutors and their students can view/update their own confirmation rows
ALTER TABLE lesson_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors view lesson deliveries" ON lesson_deliveries;
CREATE POLICY "Tutors view lesson deliveries"
  ON lesson_deliveries FOR SELECT
  USING (tutor_id = auth.uid());

DROP POLICY IF EXISTS "Tutors manage lesson deliveries" ON lesson_deliveries;
CREATE POLICY "Tutors manage lesson deliveries"
  ON lesson_deliveries FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

DROP POLICY IF EXISTS "Students view lesson deliveries" ON lesson_deliveries;
CREATE POLICY "Students view lesson deliveries"
  ON lesson_deliveries FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students acknowledge lesson deliveries" ON lesson_deliveries;
CREATE POLICY "Students acknowledge lesson deliveries"
  ON lesson_deliveries FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );
