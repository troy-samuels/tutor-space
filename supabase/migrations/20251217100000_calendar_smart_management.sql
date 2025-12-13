-- Smart Calendar Management Migration
-- Adds scheduling preferences, recurring blocked times, and time-off periods

-- 1. Add scheduling preferences to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS max_lessons_per_day INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS max_lessons_per_week INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS advance_booking_days_min INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS advance_booking_days_max INTEGER DEFAULT 60;

-- 2. Create recurring blocked times table
CREATE TABLE IF NOT EXISTS recurring_blocked_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  effective_from DATE,
  effective_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT recurring_blocked_times_time_check CHECK (end_time > start_time)
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_recurring_blocked_times_tutor
  ON recurring_blocked_times(tutor_id, is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_blocked_times_day
  ON recurring_blocked_times(tutor_id, day_of_week) WHERE is_active = TRUE;

-- 3. Create time-off periods table
CREATE TABLE IF NOT EXISTS time_off_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT TRUE,
  start_time TIME,
  end_time TIME,
  show_on_calendar BOOLEAN NOT NULL DEFAULT TRUE,
  block_bookings BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT time_off_periods_date_check CHECK (end_date >= start_date),
  CONSTRAINT time_off_periods_time_check CHECK (
    all_day = TRUE OR (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  )
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_time_off_periods_tutor
  ON time_off_periods(tutor_id);
CREATE INDEX IF NOT EXISTS idx_time_off_periods_dates
  ON time_off_periods(tutor_id, start_date, end_date) WHERE block_bookings = TRUE;

-- 4. Enable RLS
ALTER TABLE recurring_blocked_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_periods ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for recurring_blocked_times
CREATE POLICY "Tutors can view own recurring blocks"
  ON recurring_blocked_times FOR SELECT
  USING (tutor_id = auth.uid());

CREATE POLICY "Tutors can create own recurring blocks"
  ON recurring_blocked_times FOR INSERT
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Tutors can update own recurring blocks"
  ON recurring_blocked_times FOR UPDATE
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Tutors can delete own recurring blocks"
  ON recurring_blocked_times FOR DELETE
  USING (tutor_id = auth.uid());

-- 6. Create RLS policies for time_off_periods
CREATE POLICY "Tutors can view own time off"
  ON time_off_periods FOR SELECT
  USING (tutor_id = auth.uid());

CREATE POLICY "Tutors can create own time off"
  ON time_off_periods FOR INSERT
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Tutors can update own time off"
  ON time_off_periods FOR UPDATE
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Tutors can delete own time off"
  ON time_off_periods FOR DELETE
  USING (tutor_id = auth.uid());

-- 7. Create function to expand recurring blocks for a date range
CREATE OR REPLACE FUNCTION expand_recurring_blocks_for_range(
  p_tutor_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  id UUID,
  occurrence_date DATE,
  start_time TIME,
  end_time TIME,
  label TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date AS d
  )
  SELECT
    rb.id,
    ds.d AS occurrence_date,
    rb.start_time,
    rb.end_time,
    rb.label
  FROM recurring_blocked_times rb
  CROSS JOIN date_series ds
  WHERE rb.tutor_id = p_tutor_id
    AND rb.is_active = TRUE
    AND EXTRACT(DOW FROM ds.d) = rb.day_of_week
    AND (rb.effective_from IS NULL OR ds.d >= rb.effective_from)
    AND (rb.effective_until IS NULL OR ds.d <= rb.effective_until)
  ORDER BY ds.d, rb.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to check booking limits
CREATE OR REPLACE FUNCTION check_booking_limits(
  p_tutor_id UUID,
  p_scheduled_at TIMESTAMPTZ
)
RETURNS TABLE(
  within_daily_limit BOOLEAN,
  within_weekly_limit BOOLEAN,
  current_daily_count INTEGER,
  current_weekly_count INTEGER,
  max_daily INTEGER,
  max_weekly INTEGER
) AS $$
DECLARE
  v_max_daily INTEGER;
  v_max_weekly INTEGER;
  v_daily_count INTEGER;
  v_weekly_count INTEGER;
  v_booking_date DATE;
  v_week_start DATE;
  v_week_end DATE;
BEGIN
  -- Get tutor's limits
  SELECT max_lessons_per_day, max_lessons_per_week
  INTO v_max_daily, v_max_weekly
  FROM profiles
  WHERE id = p_tutor_id;

  -- Calculate date boundaries
  v_booking_date := p_scheduled_at::date;
  v_week_start := date_trunc('week', p_scheduled_at)::date;
  v_week_end := v_week_start + interval '6 days';

  -- Count existing bookings for the day
  SELECT COUNT(*)
  INTO v_daily_count
  FROM bookings
  WHERE tutor_id = p_tutor_id
    AND scheduled_at::date = v_booking_date
    AND status IN ('pending', 'confirmed');

  -- Count existing bookings for the week
  SELECT COUNT(*)
  INTO v_weekly_count
  FROM bookings
  WHERE tutor_id = p_tutor_id
    AND scheduled_at::date BETWEEN v_week_start AND v_week_end
    AND status IN ('pending', 'confirmed');

  RETURN QUERY SELECT
    (v_max_daily IS NULL OR v_daily_count < v_max_daily) AS within_daily_limit,
    (v_max_weekly IS NULL OR v_weekly_count < v_max_weekly) AS within_weekly_limit,
    v_daily_count AS current_daily_count,
    v_weekly_count AS current_weekly_count,
    v_max_daily AS max_daily,
    v_max_weekly AS max_weekly;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to check advance booking window
CREATE OR REPLACE FUNCTION check_advance_booking_window(
  p_tutor_id UUID,
  p_scheduled_at TIMESTAMPTZ
)
RETURNS TABLE(
  is_within_window BOOLEAN,
  min_days INTEGER,
  max_days INTEGER,
  days_ahead INTEGER,
  error_message TEXT
) AS $$
DECLARE
  v_min_days INTEGER;
  v_max_days INTEGER;
  v_days_ahead INTEGER;
  v_now TIMESTAMPTZ;
BEGIN
  v_now := NOW();

  -- Get tutor's booking window settings
  SELECT
    COALESCE(advance_booking_days_min, 0),
    COALESCE(advance_booking_days_max, 365)
  INTO v_min_days, v_max_days
  FROM profiles
  WHERE id = p_tutor_id;

  -- Calculate days ahead
  v_days_ahead := EXTRACT(DAY FROM (p_scheduled_at::date - v_now::date));

  -- Check if within window
  IF v_days_ahead < v_min_days THEN
    RETURN QUERY SELECT
      FALSE,
      v_min_days,
      v_max_days,
      v_days_ahead,
      format('Bookings must be at least %s days in advance', v_min_days);
  ELSIF v_days_ahead > v_max_days THEN
    RETURN QUERY SELECT
      FALSE,
      v_min_days,
      v_max_days,
      v_days_ahead,
      format('Bookings cannot be more than %s days in advance', v_max_days);
  ELSE
    RETURN QUERY SELECT
      TRUE,
      v_min_days,
      v_max_days,
      v_days_ahead,
      NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create trigger for updated_at on recurring_blocked_times
CREATE OR REPLACE FUNCTION update_recurring_blocked_times_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recurring_blocked_times_updated_at
  BEFORE UPDATE ON recurring_blocked_times
  FOR EACH ROW
  EXECUTE FUNCTION update_recurring_blocked_times_updated_at();

-- 11. Create trigger for updated_at on time_off_periods
CREATE OR REPLACE FUNCTION update_time_off_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_time_off_periods_updated_at
  BEFORE UPDATE ON time_off_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_time_off_periods_updated_at();
