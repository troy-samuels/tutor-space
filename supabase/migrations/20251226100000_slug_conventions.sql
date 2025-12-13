-- Slug conventions normalization
-- - Standardize grammar_error_categories slugs to kebab-case
-- - Ensure digital_products has a kebab-case slug with per-tutor uniqueness
-- - Add kebab-case guardrails for slugs used in URLs

-- =============================================================================
-- 1) Grammar error category slugs: snake_case -> kebab-case
-- =============================================================================

-- Drop any FK constraints that reference grammar_error_categories(slug) so we can
-- safely update slug values, then re-add them with ON UPDATE CASCADE.
DO $$
DECLARE
  fk record;
BEGIN
  FOR fk IN
    SELECT c.conname, t.relname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_class r ON c.confrelid = r.oid
    WHERE n.nspname = 'public'
      AND r.relname = 'grammar_error_categories'
      AND c.contype = 'f'
      AND t.relname IN ('grammar_errors', 'student_grammar_patterns')
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', fk.relname, fk.conname);
  END LOOP;
END $$;

ALTER TABLE public.grammar_errors
  ADD CONSTRAINT grammar_errors_category_slug_fkey
  FOREIGN KEY (category_slug)
  REFERENCES public.grammar_error_categories(slug)
  ON UPDATE CASCADE;

ALTER TABLE public.student_grammar_patterns
  ADD CONSTRAINT student_grammar_patterns_category_slug_fkey
  FOREIGN KEY (category_slug)
  REFERENCES public.grammar_error_categories(slug)
  ON UPDATE CASCADE;

UPDATE public.grammar_error_categories
SET slug = REPLACE(slug, '_', '-')
WHERE slug LIKE '%\_%' ESCAPE '\';

DO $$
BEGIN
  ALTER TABLE public.grammar_error_categories
    ADD CONSTRAINT grammar_error_categories_slug_kebab_check
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 2) Digital products: ensure kebab-case slug exists and is unique per tutor
-- =============================================================================

ALTER TABLE public.digital_products
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill slugs for any existing rows missing them (best-effort, deterministic).
WITH base AS (
  SELECT
    id,
    tutor_id,
    CASE
      WHEN COALESCE(
        regexp_replace(
          regexp_replace(
            regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'),
            '(^-+|-+$)', '', 'g'
          ),
          '-{2,}', '-', 'g'
        ),
        ''
      ) = '' THEN 'product-' || substring(id::text from 1 for 8)
      ELSE left(
        regexp_replace(
          regexp_replace(
            regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'),
            '(^-+|-+$)', '', 'g'
          ),
          '-{2,}', '-', 'g'
        ),
        60
      )
    END AS base_slug
  FROM public.digital_products
),
dedup AS (
  SELECT
    id,
    tutor_id,
    CASE
      WHEN count(*) OVER (PARTITION BY tutor_id, base_slug) = 1 THEN base_slug
      ELSE base_slug || '-' || row_number() OVER (PARTITION BY tutor_id, base_slug ORDER BY id)
    END AS slug
  FROM base
)
UPDATE public.digital_products dp
SET slug = d.slug
FROM dedup d
WHERE dp.id = d.id
  AND dp.slug IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.digital_products WHERE slug IS NULL) THEN
    ALTER TABLE public.digital_products ALTER COLUMN slug SET NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'digital_products'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) LIKE '%(tutor_id, slug)%'
  ) THEN
    ALTER TABLE public.digital_products
      ADD CONSTRAINT digital_products_tutor_slug_unique UNIQUE (tutor_id, slug);
  END IF;
END $$;

DO $$
BEGIN
  ALTER TABLE public.digital_products
    ADD CONSTRAINT digital_products_slug_kebab_check
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 3) Marketing clips slug guardrail (used for public URLs)
-- =============================================================================

DO $$
BEGIN
  ALTER TABLE public.marketing_clips
    ADD CONSTRAINT marketing_clips_slug_kebab_check
    CHECK (slug IS NULL OR slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

