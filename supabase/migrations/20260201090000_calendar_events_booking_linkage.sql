-- Add booking linkage to calendar events for reliable updates on reschedule/cancel

ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_events_booking_id ON calendar_events (booking_id);
