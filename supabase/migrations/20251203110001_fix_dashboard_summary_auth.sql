-- Migration: Fix get_dashboard_summary RPC to validate auth.uid()
-- SECURITY FIX: Prevents unauthorized access to other tutors' dashboard data
-- The original function accepted p_tutor_id without validation, allowing any
-- authenticated user to access any tutor's profile, bookings, students, and revenue.

CREATE OR REPLACE FUNCTION get_dashboard_summary(p_tutor_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  v_profile jsonb;
  v_upcoming_bookings jsonb;
  v_total_bookings bigint;
  v_student_count bigint;
  v_revenue_this_month bigint;
  v_now timestamp with time zone := now();
  v_month_start timestamp with time zone;
BEGIN
  -- SECURITY: Validate that the caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- SECURITY: Validate that the caller can only access their own dashboard
  IF auth.uid() != p_tutor_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access another tutor''s dashboard';
  END IF;

  -- Calculate start of current month
  v_month_start := date_trunc('month', v_now);

  -- Get profile data
  SELECT jsonb_build_object(
    'username', p.username,
    'bio', p.bio,
    'tagline', p.tagline,
    'full_name', p.full_name,
    'plan', p.plan,
    'email', p.email,
    'created_at', p.created_at,
    'booking_currency', p.booking_currency
  ) INTO v_profile
  FROM profiles p
  WHERE p.id = p_tutor_id;

  -- Get upcoming bookings (next 3)
  SELECT COALESCE(jsonb_agg(booking_data ORDER BY scheduled_at ASC), '[]'::jsonb)
  INTO v_upcoming_bookings
  FROM (
    SELECT jsonb_build_object(
      'id', b.id,
      'scheduled_at', b.scheduled_at,
      'status', b.status,
      'payment_status', b.payment_status,
      'payment_amount', b.payment_amount,
      'currency', b.currency,
      'student', jsonb_build_object(
        'full_name', s.full_name,
        'proficiency_level', s.proficiency_level
      ),
      'service', jsonb_build_object(
        'name', srv.name
      )
    ) AS booking_data,
    b.scheduled_at
    FROM bookings b
    LEFT JOIN students s ON s.id = b.student_id
    LEFT JOIN services srv ON srv.id = b.service_id
    WHERE b.tutor_id = p_tutor_id
      AND b.scheduled_at >= v_now
    ORDER BY b.scheduled_at ASC
    LIMIT 3
  ) upcoming;

  -- Get total bookings count
  SELECT COUNT(*)
  INTO v_total_bookings
  FROM bookings
  WHERE tutor_id = p_tutor_id;

  -- Get student count
  SELECT COUNT(*)
  INTO v_student_count
  FROM students
  WHERE tutor_id = p_tutor_id;

  -- Get revenue this month from paid invoices
  SELECT COALESCE(SUM(total_due_cents), 0)
  INTO v_revenue_this_month
  FROM invoices
  WHERE tutor_id = p_tutor_id
    AND status = 'paid'
    AND due_date >= v_month_start
    AND due_date < v_month_start + interval '1 month';

  -- Build and return the result
  result := jsonb_build_object(
    'profile', COALESCE(v_profile, '{}'::jsonb),
    'upcoming_bookings', v_upcoming_bookings,
    'total_bookings', COALESCE(v_total_bookings, 0),
    'student_count', COALESCE(v_student_count, 0),
    'revenue_this_month_cents', COALESCE(v_revenue_this_month, 0),
    'is_first_visit', COALESCE(v_total_bookings, 0) = 0
  );

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users (unchanged)
GRANT EXECUTE ON FUNCTION get_dashboard_summary(uuid) TO authenticated;

-- Update comment to reflect security fix
COMMENT ON FUNCTION get_dashboard_summary(uuid) IS
'Returns consolidated dashboard summary data for a tutor including profile, upcoming bookings, counts, and revenue. SECURITY: Validates that auth.uid() matches p_tutor_id to prevent unauthorized access.';
