-- Atomic reservation for practice message slots to prevent race conditions.

CREATE OR REPLACE FUNCTION reserve_practice_message_slots(
  p_session_id UUID,
  p_increment INTEGER DEFAULT 2
) RETURNS JSONB AS $$
DECLARE
  v_message_count INTEGER;
  v_max_messages INTEGER;
  v_ended_at TIMESTAMPTZ;
BEGIN
  IF p_increment IS NULL OR p_increment <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_INCREMENT');
  END IF;

  SELECT COALESCE(s.message_count, 0),
         COALESCE(ps.max_messages, 20),
         s.ended_at
    INTO v_message_count, v_max_messages, v_ended_at
    FROM student_practice_sessions s
    LEFT JOIN practice_scenarios ps ON ps.id = s.scenario_id
   WHERE s.id = p_session_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'SESSION_NOT_FOUND');
  END IF;

  IF v_ended_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'SESSION_ENDED');
  END IF;

  IF (v_message_count + p_increment) > v_max_messages THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'MESSAGE_LIMIT_REACHED',
      'message_count', v_message_count,
      'max_messages', v_max_messages
    );
  END IF;

  UPDATE student_practice_sessions
     SET message_count = v_message_count + p_increment
   WHERE id = p_session_id
  RETURNING message_count INTO v_message_count;

  RETURN jsonb_build_object(
    'success', true,
    'message_count', v_message_count,
    'max_messages', v_max_messages
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
