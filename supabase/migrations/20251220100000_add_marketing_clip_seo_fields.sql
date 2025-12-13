-- ============================================================================
-- Add SEO-focused metadata to marketing_clips
-- Migration: 20251220100000_add_marketing_clip_seo_fields.sql
-- Description: Add title, slug, topic, visibility, views, and clip timing
-- ============================================================================

ALTER TABLE marketing_clips
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS topic TEXT,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS start_time DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS end_time DOUBLE PRECISION;

-- Ensure slugs are unique for public URLs
DO $$
BEGIN
  ALTER TABLE marketing_clips ADD CONSTRAINT marketing_clips_slug_unique UNIQUE (slug);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Guardrail to prevent negative view counts
DO $$
BEGIN
  ALTER TABLE marketing_clips ADD CONSTRAINT marketing_clips_views_nonnegative CHECK (views >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
