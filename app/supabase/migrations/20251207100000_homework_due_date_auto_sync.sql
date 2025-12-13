-- Migration: Homework Due Date Auto-Sync with Lesson Reschedules
-- When a booking is rescheduled, automatically update linked homework due dates

-- Function to update homework due dates when booking is rescheduled
CREATE OR REPLACE FUNCTION sync_homework_due_dates_on_reschedule()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run if scheduled_at actually changed
  IF OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at THEN
    -- Only update homework that is EXPLICITLY linked to this booking via booking_id
    -- Homework with manually set due dates (booking_id IS NULL) will NOT be affected
    UPDATE homework_assignments
    SET
      due_date = NEW.scheduled_at,
      updated_at = NOW()
    WHERE
      booking_id = NEW.id  -- Must be linked to THIS specific booking
      AND status IN ('assigned', 'in_progress');  -- Only pending homework
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on bookings table
DROP TRIGGER IF EXISTS homework_due_date_sync_trigger ON bookings;
CREATE TRIGGER homework_due_date_sync_trigger
  AFTER UPDATE OF scheduled_at ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_homework_due_dates_on_reschedule();

-- Comment for documentation
COMMENT ON FUNCTION sync_homework_due_dates_on_reschedule() IS
  'Auto-updates homework due dates when a linked booking is rescheduled.
   Only affects homework explicitly linked via booking_id.
   Manually set due dates (booking_id IS NULL) are NOT affected.';
