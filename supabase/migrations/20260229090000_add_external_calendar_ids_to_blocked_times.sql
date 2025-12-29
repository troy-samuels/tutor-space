-- Add external calendar event IDs to blocked_times for Google/Outlook sync
-- This allows blocked times to be synced to external calendars

ALTER TABLE blocked_times
ADD COLUMN IF NOT EXISTS google_event_id TEXT,
ADD COLUMN IF NOT EXISTS outlook_event_id TEXT;

-- Index for efficient lookup when deleting events
CREATE INDEX IF NOT EXISTS idx_blocked_times_google_event_id
ON blocked_times(google_event_id)
WHERE google_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_blocked_times_outlook_event_id
ON blocked_times(outlook_event_id)
WHERE outlook_event_id IS NOT NULL;

COMMENT ON COLUMN blocked_times.google_event_id IS 'Google Calendar event ID for synced blocked time';
COMMENT ON COLUMN blocked_times.outlook_event_id IS 'Outlook Calendar event ID for synced blocked time';
