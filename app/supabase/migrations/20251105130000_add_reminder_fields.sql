-- Add reminder tracking fields to bookings table
-- These fields track whether 24h and 1h reminder emails have been sent

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_1h_sent BOOLEAN DEFAULT false;

-- Create indexes to optimize cron job queries
-- These indexes help find bookings that need reminders quickly
CREATE INDEX IF NOT EXISTS bookings_reminder_24h_idx
  ON bookings(scheduled_at, reminder_24h_sent)
  WHERE status = 'confirmed' AND reminder_24h_sent = false;

CREATE INDEX IF NOT EXISTS bookings_reminder_1h_idx
  ON bookings(scheduled_at, reminder_1h_sent)
  WHERE status = 'confirmed' AND reminder_1h_sent = false;

-- Add comment to explain the fields
COMMENT ON COLUMN bookings.reminder_24h_sent IS 'Tracks if 24-hour reminder email has been sent';
COMMENT ON COLUMN bookings.reminder_1h_sent IS 'Tracks if 1-hour reminder email has been sent';
