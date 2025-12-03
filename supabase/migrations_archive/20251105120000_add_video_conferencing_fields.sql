-- Add video conferencing fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS video_provider TEXT CHECK (
  video_provider IN ('zoom_personal', 'google_meet', 'calendly', 'custom', 'none')
) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS zoom_personal_link TEXT,
ADD COLUMN IF NOT EXISTS google_meet_link TEXT,
ADD COLUMN IF NOT EXISTS calendly_link TEXT,
ADD COLUMN IF NOT EXISTS custom_video_url TEXT,
ADD COLUMN IF NOT EXISTS custom_video_name TEXT;

-- Add meeting URL fields to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS meeting_url TEXT,
ADD COLUMN IF NOT EXISTS meeting_provider TEXT;

-- Add comments for clarity
COMMENT ON COLUMN profiles.video_provider IS 'Video platform preference: zoom_personal, google_meet, calendly, custom, or none';
COMMENT ON COLUMN profiles.zoom_personal_link IS 'Tutor''s Zoom Personal Meeting Room URL';
COMMENT ON COLUMN profiles.google_meet_link IS 'Tutor''s Google Meet room URL';
COMMENT ON COLUMN profiles.calendly_link IS 'Tutor''s Calendly booking page URL';
COMMENT ON COLUMN profiles.custom_video_url IS 'Custom video platform URL (Teams, WhatsApp, etc.)';
COMMENT ON COLUMN profiles.custom_video_name IS 'Display name for custom video platform';
COMMENT ON COLUMN bookings.meeting_url IS 'Video meeting URL for this booking';
COMMENT ON COLUMN bookings.meeting_provider IS 'Provider used for this meeting';
