-- =============================================================================
-- SERVICES PRICING INTEGRITY
-- Created: 2026-03-12
--
-- Goals:
-- 1) Backfill missing or inconsistent pricing fields
-- 2) Normalize currency casing and fall back to profile booking currency
-- 3) Enforce non-negative, non-null pricing and aligned legacy columns
-- 4) Keep price/currency columns synced on insert/update
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Backfill and normalize services pricing + currency
-- -----------------------------------------------------------------------------
WITH normalized AS (
  SELECT
    s.id,
    GREATEST(
      CASE
        WHEN (s.price_amount IS NULL OR s.price_amount < 0)
          AND (s.price IS NULL OR s.price < 0) THEN 0
        WHEN s.price_amount IS NULL OR s.price_amount < 0 THEN s.price
        WHEN s.price IS NULL OR s.price < 0 THEN s.price_amount
        WHEN s.price_amount = s.price THEN s.price_amount
        WHEN s.price_amount = 0 AND s.price > 0 THEN s.price
        WHEN s.price = 0 AND s.price_amount > 0 THEN s.price_amount
        ELSE s.price_amount
      END,
      0
    ) AS resolved_price,
    UPPER(
      COALESCE(
        NULLIF(
          CASE
            WHEN LENGTH(BTRIM(s.price_currency)) = 3 THEN BTRIM(s.price_currency)
            ELSE ''
          END,
          ''
        ),
        NULLIF(
          CASE
            WHEN LENGTH(BTRIM(s.currency)) = 3 THEN BTRIM(s.currency)
            ELSE ''
          END,
          ''
        ),
        NULLIF(
          CASE
            WHEN LENGTH(BTRIM(p.booking_currency)) = 3 THEN BTRIM(p.booking_currency)
            ELSE ''
          END,
          ''
        ),
        'USD'
      )
    ) AS resolved_currency
  FROM public.services s
  LEFT JOIN public.profiles p ON p.id = s.tutor_id
)
UPDATE public.services s
SET
  price_amount = n.resolved_price,
  price = n.resolved_price,
  price_currency = n.resolved_currency,
  currency = n.resolved_currency
FROM normalized n
WHERE s.id = n.id
  AND (
    s.price_amount IS DISTINCT FROM n.resolved_price
    OR s.price IS DISTINCT FROM n.resolved_price
    OR s.price_currency IS DISTINCT FROM n.resolved_currency
    OR s.currency IS DISTINCT FROM n.resolved_currency
  );

-- -----------------------------------------------------------------------------
-- 2) Enforce non-null + non-negative pricing and aligned legacy columns
-- -----------------------------------------------------------------------------
ALTER TABLE public.services
  ALTER COLUMN price_amount SET NOT NULL,
  ALTER COLUMN price SET NOT NULL,
  ALTER COLUMN price_currency SET NOT NULL,
  ALTER COLUMN currency SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'services_price_amount_non_negative'
      AND conrelid = 'public.services'::regclass
  ) THEN
    ALTER TABLE public.services
      ADD CONSTRAINT services_price_amount_non_negative CHECK (price_amount >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'services_price_non_negative'
      AND conrelid = 'public.services'::regclass
  ) THEN
    ALTER TABLE public.services
      ADD CONSTRAINT services_price_non_negative CHECK (price >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'services_price_consistent'
      AND conrelid = 'public.services'::regclass
  ) THEN
    ALTER TABLE public.services
      ADD CONSTRAINT services_price_consistent CHECK (price_amount = price);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'services_currency_consistent'
      AND conrelid = 'public.services'::regclass
  ) THEN
    ALTER TABLE public.services
      ADD CONSTRAINT services_currency_consistent CHECK (price_currency = currency);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3) Keep pricing fields normalized on insert/update
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_service_pricing()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  resolved_price INTEGER;
  resolved_currency TEXT;
  profile_currency TEXT;
BEGIN
  SELECT booking_currency
    INTO profile_currency
    FROM public.profiles
    WHERE id = NEW.tutor_id;

  resolved_currency := UPPER(
    COALESCE(
      NULLIF(BTRIM(NEW.price_currency), ''),
      NULLIF(BTRIM(NEW.currency), ''),
      NULLIF(BTRIM(profile_currency), ''),
      'USD'
    )
  );

  resolved_price := CASE
    WHEN (NEW.price_amount IS NULL OR NEW.price_amount < 0)
      AND (NEW.price IS NULL OR NEW.price < 0) THEN 0
    WHEN NEW.price_amount IS NULL OR NEW.price_amount < 0 THEN NEW.price
    WHEN NEW.price IS NULL OR NEW.price < 0 THEN NEW.price_amount
    WHEN NEW.price_amount = NEW.price THEN NEW.price_amount
    WHEN NEW.price_amount = 0 AND NEW.price > 0 THEN NEW.price
    WHEN NEW.price = 0 AND NEW.price_amount > 0 THEN NEW.price_amount
    ELSE NEW.price_amount
  END;

  IF resolved_price IS NULL THEN
    resolved_price := 0;
  END IF;

  IF resolved_price < 0 THEN
    RAISE EXCEPTION 'Service price must be zero or greater';
  END IF;

  NEW.price_amount := resolved_price;
  NEW.price := resolved_price;
  NEW.price_currency := resolved_currency;
  NEW.currency := resolved_currency;
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_services_normalize_pricing ON public.services;
CREATE TRIGGER trg_services_normalize_pricing
BEFORE INSERT OR UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.normalize_service_pricing();

-- =============================================================================
-- COMPLETE
-- =============================================================================
