-- Atomic availability save (non-onboarding)
CREATE OR REPLACE FUNCTION save_availability(
  p_user_id uuid,
  p_availability jsonb
)
RETURNS jsonb AS $$
BEGIN
  -- Replace availability in a single transaction
  DELETE FROM availability WHERE tutor_id = p_user_id;

  IF p_availability IS NOT NULL AND jsonb_array_length(p_availability) > 0 THEN
    INSERT INTO availability (tutor_id, day_of_week, start_time, end_time, is_available)
    SELECT
      p_user_id,
      (slot->>'day_of_week')::integer,
      (slot->>'start_time')::text,
      (slot->>'end_time')::text,
      COALESCE((slot->>'is_available')::boolean, TRUE)
    FROM jsonb_array_elements(p_availability) AS slot;
  END IF;

  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION save_availability TO authenticated;
