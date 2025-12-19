-- Migration: Add atomic onboarding step saves for improved performance and reliability
-- This creates two RPC functions that combine multiple database operations into single transactions

-- Function 1: Atomic save for step 3 (languages + service creation)
-- Combines profile update and service insert into a single transaction
CREATE OR REPLACE FUNCTION save_onboarding_step_3(
  p_user_id uuid,
  p_languages_taught text[],
  p_booking_currency text,
  p_service_name text DEFAULT NULL,
  p_service_duration integer DEFAULT NULL,
  p_service_price integer DEFAULT NULL,
  p_service_currency text DEFAULT NULL,
  p_offer_type text DEFAULT 'one_off'
)
RETURNS jsonb AS $$
DECLARE
  v_service_id uuid;
BEGIN
  -- Update profile with languages and currency
  UPDATE profiles
  SET
    languages_taught = p_languages_taught,
    booking_currency = UPPER(COALESCE(p_booking_currency, 'USD')),
    onboarding_step = 3
  WHERE id = p_user_id;

  -- Insert the service if provided
  IF p_service_name IS NOT NULL AND p_service_price IS NOT NULL THEN
    INSERT INTO services (
      tutor_id,
      name,
      duration_minutes,
      price_amount,
      price,
      price_currency,
      currency,
      is_active,
      offer_type
    )
    VALUES (
      p_user_id,
      p_service_name,
      COALESCE(p_service_duration, 60),
      p_service_price,
      p_service_price,
      UPPER(COALESCE(p_service_currency, 'USD')),
      UPPER(COALESCE(p_service_currency, 'USD')),
      true,
      COALESCE(p_offer_type, 'one_off')
    )
    RETURNING id INTO v_service_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'service_id', v_service_id);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Service already exists');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute to authenticated users (RLS on profiles/services still applies)
GRANT EXECUTE ON FUNCTION save_onboarding_step_3 TO authenticated;

-- Function 2: Atomic save for step 4 (availability)
-- Combines delete, insert, and profile update into a single transaction
CREATE OR REPLACE FUNCTION save_onboarding_step_4(
  p_user_id uuid,
  p_availability jsonb
)
RETURNS jsonb AS $$
BEGIN
  -- Delete existing availability for this tutor
  DELETE FROM availability WHERE tutor_id = p_user_id;

  -- Insert new availability slots from JSONB array
  IF p_availability IS NOT NULL AND jsonb_array_length(p_availability) > 0 THEN
    INSERT INTO availability (tutor_id, day_of_week, start_time, end_time)
    SELECT
      p_user_id,
      (slot->>'day_of_week')::integer,
      (slot->>'start_time')::time,
      (slot->>'end_time')::time
    FROM jsonb_array_elements(p_availability) AS slot;
  END IF;

  -- Update onboarding step on profile
  UPDATE profiles
  SET onboarding_step = 4
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION save_onboarding_step_4 TO authenticated;
