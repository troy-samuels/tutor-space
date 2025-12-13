-- =============================================================================
-- AUDIO MESSAGING AND HOMEWORK INSTRUCTIONS
-- Created: 2025-12-13
--
-- Enables audio recording capabilities:
-- 1) Adds audio_instruction_url column to homework_assignments
-- 2) Creates message-attachments storage bucket for voice messages
-- 3) Sets up RLS policies for audio uploads
-- =============================================================================

-- Add audio instruction URL column to homework_assignments
ALTER TABLE homework_assignments
ADD COLUMN IF NOT EXISTS audio_instruction_url TEXT;

COMMENT ON COLUMN homework_assignments.audio_instruction_url IS 'URL to audio instruction recording from tutor (max 2 minutes)';

-- =============================================================================
-- STORAGE: MESSAGE ATTACHMENTS BUCKET FOR VOICE MESSAGES
-- =============================================================================

-- Create bucket for message attachments (voice messages)
-- 20MB limit is sufficient for 2-minute audio recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  true,
  20971520,
  ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg']
)
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
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read message attachments'
  ) THEN
    DROP POLICY "Public read message attachments" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Tutors upload message attachments'
  ) THEN
    DROP POLICY "Tutors upload message attachments" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Students upload message attachments'
  ) THEN
    DROP POLICY "Students upload message attachments" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users delete own message attachments'
  ) THEN
    DROP POLICY "Users delete own message attachments" ON storage.objects;
  END IF;
END $$;

-- Public read access for voice message playback
CREATE POLICY "Public read message attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-attachments');

-- Tutors can upload to their own folder
CREATE POLICY "Tutors upload message attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments'
  AND (name LIKE auth.uid()::text || '/%')
);

-- Students can upload to threads they belong to (uses student's user_id as folder)
CREATE POLICY "Students upload message attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments'
  AND (name LIKE auth.uid()::text || '/%')
);

-- Users can delete their own uploaded files
CREATE POLICY "Users delete own message attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND (name LIKE auth.uid()::text || '/%')
);

-- =============================================================================
-- COMPLETE
-- =============================================================================
