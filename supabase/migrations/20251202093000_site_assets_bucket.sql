-- =============================================================================
-- STORAGE: SITE ASSETS BUCKET FOR MINI-SITE BUILDER
-- Created: 2025-12-02
--
-- Ensures tutors can upload hero/gallery images and render them publicly:
-- 1) Creates a dedicated public bucket `site-assets`
-- 2) Restricts writes to the authenticated user's own folder (<user_id>/...)
-- 3) Allows public reads so published sites can load images without auth
-- =============================================================================

-- Create bucket if missing and enforce image-only uploads with a sane size cap (10 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('site-assets', 'site-assets', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO
  UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Clean up any duplicate policies from previous runs
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read site assets'
  ) THEN
    DROP POLICY "Public read site assets" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Site assets upload own folder'
  ) THEN
    DROP POLICY "Site assets upload own folder" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Site assets update own folder'
  ) THEN
    DROP POLICY "Site assets update own folder" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Site assets delete own folder'
  ) THEN
    DROP POLICY "Site assets delete own folder" ON storage.objects;
  END IF;
END $$;

-- Public read access so published sites render without auth
CREATE POLICY "Public read site assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

-- Authenticated users can upload to their own folder: <user_id>/...
CREATE POLICY "Site assets upload own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'site-assets'
  AND (name LIKE auth.uid()::text || '/%')
);

-- Authenticated users can update files inside their own folder
CREATE POLICY "Site assets update own folder"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'site-assets'
  AND (name LIKE auth.uid()::text || '/%')
)
WITH CHECK (
  bucket_id = 'site-assets'
  AND (name LIKE auth.uid()::text || '/%')
);

-- Authenticated users can delete files inside their own folder
CREATE POLICY "Site assets delete own folder"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'site-assets'
  AND (name LIKE auth.uid()::text || '/%')
);

-- =============================================================================
-- COMPLETE
-- =============================================================================
