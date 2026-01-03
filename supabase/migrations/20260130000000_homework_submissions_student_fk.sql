-- Add FK for homework_submissions.student_id -> students.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'homework_submissions_student_id_fkey'
      AND conrelid = 'homework_submissions'::regclass
  ) THEN
    ALTER TABLE homework_submissions
      ADD CONSTRAINT homework_submissions_student_id_fkey
      FOREIGN KEY (student_id)
      REFERENCES students(id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM homework_submissions hs
    LEFT JOIN students s ON s.id = hs.student_id
    WHERE s.id IS NULL
  ) THEN
    ALTER TABLE homework_submissions
      VALIDATE CONSTRAINT homework_submissions_student_id_fkey;
  END IF;
END;
$$;
