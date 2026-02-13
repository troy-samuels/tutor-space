-- Track whether lesson recordings have had practice exercises generated.

ALTER TABLE lesson_recordings
  ADD COLUMN IF NOT EXISTS practice_exercises_generated BOOLEAN DEFAULT FALSE;

UPDATE lesson_recordings
SET practice_exercises_generated = FALSE
WHERE practice_exercises_generated IS NULL;

CREATE INDEX IF NOT EXISTS idx_lesson_recordings_exercise_backfill
  ON lesson_recordings (status, practice_exercises_generated, created_at DESC);

COMMENT ON COLUMN lesson_recordings.practice_exercises_generated IS
  'Whether exercise banks and linked practice assignments were generated from this lesson recording.';
