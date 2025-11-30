-- =============================================================================
-- ALIGN SERVICES PRICING + AVAILABILITY FLAGS
-- Created: 2025-12-01
--
-- This migration fixes mismatches between code and schema:
-- 1) Services now have price_amount/price_currency (cents) while keeping price/currency for compatibility
-- 2) Normalizes offer_type to the values used in the app (one_off, lesson_block, subscription, trial)
-- 3) Adds is_available flag to availability since the booking flow filters on it
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SERVICES PRICING COLUMNS
-- -----------------------------------------------------------------------------
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_amount INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_currency TEXT;
-- Keep legacy columns for compatibility with older code paths
ALTER TABLE services ADD COLUMN IF NOT EXISTS price INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS currency TEXT;

ALTER TABLE services ALTER COLUMN price_amount SET DEFAULT 0;
ALTER TABLE services ALTER COLUMN price SET DEFAULT 0;
ALTER TABLE services ALTER COLUMN price_currency SET DEFAULT 'USD';
ALTER TABLE services ALTER COLUMN currency SET DEFAULT 'USD';

-- Backfill and normalize currency casing
UPDATE services
SET
  price_amount = COALESCE(NULLIF(price_amount, 0), NULLIF(price, 0), 0),
  price = COALESCE(NULLIF(price, 0), NULLIF(price_amount, 0), 0),
  price_currency = UPPER(COALESCE(NULLIF(price_currency, ''), currency, 'USD')),
  currency = UPPER(COALESCE(NULLIF(currency, ''), price_currency, 'USD'))
WHERE price_amount IS NULL
   OR price IS NULL
   OR (price_amount = 0 AND COALESCE(price, 0) > 0)
   OR (price = 0 AND COALESCE(price_amount, 0) > 0)
   OR price_currency IS NULL
   OR currency IS NULL
   OR price_currency != UPPER(price_currency)
   OR currency != UPPER(currency);

-- Keep signup default services in sync with both pricing columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  first_name TEXT;
  full_name_val TEXT;
BEGIN
  full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  first_name := SPLIT_PART(full_name_val, ' ', 1);

  IF first_name = '' THEN
    first_name := 'Tutor';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, username, role, plan)
  VALUES (
    NEW.id,
    NEW.email,
    full_name_val,
    NEW.raw_user_meta_data->>'username',
    COALESCE(NEW.raw_user_meta_data->>'role', 'tutor'),
    COALESCE(NEW.raw_user_meta_data->>'plan', 'founder_lifetime')
  );

  INSERT INTO public.services (
    tutor_id,
    name,
    description,
    duration_minutes,
    price,
    currency,
    price_amount,
    price_currency,
    is_active,
    requires_approval,
    offer_type,
    max_students_per_session
  )
  VALUES
    (
      NEW.id,
      'Language Trial Lesson with ' || first_name,
      NULL,
      25,
      1500,
      'USD',
      1500,
      'USD',
      true,
      false,
      'trial',
      1
    ),
    (
      NEW.id,
      'Language Lesson with ' || first_name,
      NULL,
      25,
      1000,
      'USD',
      1000,
      'USD',
      true,
      false,
      'one_off',
      1
    ),
    (
      NEW.id,
      'Language Lesson with ' || first_name,
      NULL,
      55,
      2000,
      'USD',
      2000,
      'USD',
      true,
      false,
      'one_off',
      1
    );

  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- SERVICES OFFER TYPE NORMALIZATION
-- -----------------------------------------------------------------------------
UPDATE services
SET offer_type = 'one_off'
WHERE offer_type IS NULL OR offer_type = 'single_session';

ALTER TABLE services ALTER COLUMN offer_type SET DEFAULT 'one_off';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'services_offer_type_check'
      AND conrelid = 'services'::regclass
  ) THEN
    ALTER TABLE services DROP CONSTRAINT services_offer_type_check;
  END IF;

  ALTER TABLE services
    ADD CONSTRAINT services_offer_type_check
    CHECK (offer_type IN ('subscription', 'lesson_block', 'one_off', 'trial'));
END $$;

-- -----------------------------------------------------------------------------
-- AVAILABILITY FLAG
-- -----------------------------------------------------------------------------
ALTER TABLE availability ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
UPDATE availability SET is_available = TRUE WHERE is_available IS NULL;
ALTER TABLE availability ALTER COLUMN is_available SET NOT NULL;

-- =============================================================================
-- COMPLETE
-- =============================================================================
