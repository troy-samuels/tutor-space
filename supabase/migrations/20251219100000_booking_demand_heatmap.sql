-- Booking Demand Heatmap Function
-- Analyzes booking patterns to show popular times

CREATE OR REPLACE FUNCTION get_booking_demand_heatmap(
  p_tutor_id UUID,
  p_days_back INTEGER DEFAULT 90
)
RETURNS TABLE(
  day_of_week INTEGER,
  hour_of_day INTEGER,
  booking_count BIGINT,
  demand_level TEXT
) AS $$
DECLARE
  v_max_count BIGINT;
BEGIN
  -- First, get the max booking count for normalization
  SELECT MAX(cnt) INTO v_max_count
  FROM (
    SELECT COUNT(*) AS cnt
    FROM bookings
    WHERE tutor_id = p_tutor_id
      AND status IN ('confirmed', 'completed')
      AND scheduled_at >= NOW() - (p_days_back || ' days')::interval
    GROUP BY EXTRACT(DOW FROM scheduled_at), EXTRACT(HOUR FROM scheduled_at)
  ) counts;

  -- If no bookings, return empty with default structure
  IF v_max_count IS NULL OR v_max_count = 0 THEN
    v_max_count := 1;
  END IF;

  RETURN QUERY
  WITH booking_counts AS (
    SELECT
      EXTRACT(DOW FROM scheduled_at)::INTEGER AS dow,
      EXTRACT(HOUR FROM scheduled_at)::INTEGER AS hod,
      COUNT(*) AS cnt
    FROM bookings
    WHERE tutor_id = p_tutor_id
      AND status IN ('confirmed', 'completed')
      AND scheduled_at >= NOW() - (p_days_back || ' days')::interval
    GROUP BY EXTRACT(DOW FROM scheduled_at), EXTRACT(HOUR FROM scheduled_at)
  ),
  all_slots AS (
    SELECT d.dow, h.hod
    FROM generate_series(0, 6) AS d(dow)
    CROSS JOIN generate_series(6, 21) AS h(hod)
  )
  SELECT
    a.dow AS day_of_week,
    a.hod AS hour_of_day,
    COALESCE(b.cnt, 0) AS booking_count,
    CASE
      WHEN COALESCE(b.cnt, 0) = 0 THEN 'none'
      WHEN (b.cnt::float / v_max_count) >= 0.75 THEN 'very_high'
      WHEN (b.cnt::float / v_max_count) >= 0.50 THEN 'high'
      WHEN (b.cnt::float / v_max_count) >= 0.25 THEN 'medium'
      ELSE 'low'
    END AS demand_level
  FROM all_slots a
  LEFT JOIN booking_counts b ON a.dow = b.dow AND a.hod = b.hod
  ORDER BY a.dow, a.hod;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION get_booking_demand_heatmap IS 'Returns booking demand data for creating a heatmap visualization. Shows which days and times are most popular for bookings.';
