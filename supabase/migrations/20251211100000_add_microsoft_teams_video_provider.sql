-- Add Microsoft Teams as a first-class video provider option
-- This migration adds microsoft_teams to the video_provider constraint and creates the link column

-- Drop existing constraint and add updated one with microsoft_teams
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_video_provider_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_video_provider_check
  CHECK (video_provider IN ('zoom_personal', 'google_meet', 'calendly', 'microsoft_teams', 'custom', 'none'));

-- Add microsoft_teams_link column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS microsoft_teams_link TEXT;

-- Add comment for clarity
COMMENT ON COLUMN profiles.microsoft_teams_link IS 'Tutor''s Microsoft Teams meeting link';
