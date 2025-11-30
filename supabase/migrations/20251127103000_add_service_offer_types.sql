-- Add offer_type to services so tutors can distinguish subscriptions, lesson blocks, one-offs, and trials
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS offer_type TEXT;

-- Default existing rows to one-off lessons
UPDATE services
SET offer_type = COALESCE(offer_type, 'one_off');

-- Set defaults and enforce allowed values
ALTER TABLE services
  ALTER COLUMN offer_type SET DEFAULT 'one_off',
  ALTER COLUMN offer_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'services_offer_type_check'
      AND conrelid = 'services'::regclass
  ) THEN
    ALTER TABLE services
      ADD CONSTRAINT services_offer_type_check
      CHECK (offer_type IN ('subscription', 'lesson_block', 'one_off', 'trial'));
  END IF;
END $$;
