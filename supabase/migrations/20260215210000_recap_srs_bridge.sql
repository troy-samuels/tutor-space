-- Migration: Recap → SRS Bridge
-- Allows recap-sourced SRS items with fingerprint-based student IDs (fp:xxx)
-- and adds source tracking columns.

-- 1. Drop FK constraints FIRST (must happen before type change).
--    Constraint names may vary, so we find them dynamically.

-- Drop student_id FK
DO $$
DECLARE
  _con TEXT;
BEGIN
  SELECT conname INTO _con
  FROM pg_constraint
  WHERE conrelid = 'spaced_repetition_items'::regclass
    AND contype = 'f'
    AND array_length(conkey, 1) = 1
    AND conkey[1] = (
      SELECT attnum FROM pg_attribute
      WHERE attrelid = 'spaced_repetition_items'::regclass
        AND attname = 'student_id'
    );
  IF _con IS NOT NULL THEN
    EXECUTE format('ALTER TABLE spaced_repetition_items DROP CONSTRAINT %I', _con);
  END IF;
END
$$;

-- Drop tutor_id FK
DO $$
DECLARE
  _con TEXT;
BEGIN
  SELECT conname INTO _con
  FROM pg_constraint
  WHERE conrelid = 'spaced_repetition_items'::regclass
    AND contype = 'f'
    AND array_length(conkey, 1) = 1
    AND conkey[1] = (
      SELECT attnum FROM pg_attribute
      WHERE attrelid = 'spaced_repetition_items'::regclass
        AND attname = 'tutor_id'
    );
  IF _con IS NOT NULL THEN
    EXECUTE format('ALTER TABLE spaced_repetition_items DROP CONSTRAINT %I', _con);
  END IF;
END
$$;

-- 2. Now safe to change column types to TEXT (supports both UUIDs and fp:xxx).
ALTER TABLE spaced_repetition_items
  ALTER COLUMN student_id TYPE TEXT;

ALTER TABLE spaced_repetition_items
  ALTER COLUMN tutor_id TYPE TEXT;

-- 2. Add source_type to distinguish where an SRS item came from
ALTER TABLE spaced_repetition_items
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'drill'
  CHECK (source_type IN ('drill', 'recap', 'manual'));

-- 3. Add recap_id reference for traceability
ALTER TABLE spaced_repetition_items
  ADD COLUMN IF NOT EXISTS source_recap_id UUID REFERENCES recaps(id) ON DELETE SET NULL;

-- 4. Partial index for fast fingerprint-based lookups
CREATE INDEX IF NOT EXISTS idx_sri_fingerprint_student
  ON spaced_repetition_items (student_id)
  WHERE student_id LIKE 'fp:%';

-- 5. Index on source_recap_id for joins
CREATE INDEX IF NOT EXISTS idx_sri_source_recap
  ON spaced_repetition_items (source_recap_id)
  WHERE source_recap_id IS NOT NULL;

-- 6. Update the unique constraint to include source deduplication
--    (student_id, item_key) already exists — keep it, it prevents duplicate items

-- 7. View: student_weak_spots (for tutor dashboard)
CREATE OR REPLACE VIEW student_weak_spots AS
SELECT
  sri.student_id,
  sri.tutor_id,
  sri.item_type,
  sri.item_key,
  sri.item_content ->> 'question' AS question,
  sri.item_content ->> 'answer' AS answer,
  sri.item_content ->> 'targetVocab' AS target_vocab,
  sri.source_type,
  sri.source_recap_id,
  sri.ease_factor,
  sri.interval_days,
  sri.repetition_count,
  sri.total_reviews,
  sri.correct_count,
  sri.incorrect_count,
  CASE
    WHEN sri.total_reviews > 0
    THEN ROUND(sri.correct_count::numeric / sri.total_reviews, 2)
    ELSE 0
  END AS correct_rate,
  sri.last_review_at,
  sri.next_review_at,
  CASE
    WHEN sri.repetition_count = 0 THEN 'new'
    WHEN sri.interval_days < 7 THEN 'learning'
    WHEN sri.interval_days >= 30 THEN 'mastered'
    ELSE 'reviewing'
  END AS mastery_status
FROM spaced_repetition_items sri
WHERE sri.total_reviews > 0
ORDER BY correct_rate ASC, sri.total_reviews DESC;

-- 8. RLS: allow service-role inserts for recap-sourced items (already enabled)
--    The existing policies use auth.uid() which won't match fp: students,
--    but we insert via service-role client which bypasses RLS.
