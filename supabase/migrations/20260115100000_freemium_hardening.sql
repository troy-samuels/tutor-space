-- Freemium model hardening
-- - Ensure freemium periods always carry a subscription_id
-- - Make free-period creation idempotent
-- - Enforce block requirements inside RPCs to prevent free-tier overruns

-- Default subscription_id for freemium periods
ALTER TABLE practice_usage_periods
  ALTER COLUMN subscription_id SET DEFAULT 'freemium';

-- Backfill any missing subscription IDs (should not happen, but keep it safe)
UPDATE practice_usage_periods
SET subscription_id = 'freemium'
WHERE subscription_id IS NULL;

-- Idempotent free usage period creation scoped to freemium subscription_id
CREATE OR REPLACE FUNCTION get_or_create_free_usage_period(
  p_student_id UUID,
  p_tutor_id UUID
) RETURNS practice_usage_periods AS $$
DECLARE
  v_period practice_usage_periods;
  v_period_start TIMESTAMPTZ := date_trunc('month', timezone('UTC', now()));
  v_period_end TIMESTAMPTZ := v_period_start + interval '1 month';
  v_subscription_id TEXT := 'freemium';
BEGIN
  INSERT INTO practice_usage_periods (
    id,
    student_id,
    tutor_id,
    subscription_id,
    period_start,
    period_end,
    audio_seconds_used,
    text_turns_used,
    blocks_consumed,
    current_tier_price_cents,
    is_free_tier,
    free_audio_seconds,
    free_text_turns,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    p_student_id,
    p_tutor_id,
    v_subscription_id,
    v_period_start,
    v_period_end,
    0,
    0,
    0,
    0,
    true,
    2700,
    600,
    now(),
    now()
  )
  ON CONFLICT (student_id, subscription_id, period_start) DO UPDATE
  SET
    tutor_id = EXCLUDED.tutor_id,
    updated_at = now()
  RETURNING * INTO v_period;

  RETURN v_period;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enforce block requirements for text turns (free tier + blocks)
CREATE OR REPLACE FUNCTION increment_text_turn_freemium(
  p_usage_period_id UUID,
  p_allow_block_overage BOOLEAN DEFAULT false
) RETURNS JSONB AS $$
DECLARE
  v_period practice_usage_periods;
  v_allowance RECORD;
  v_needs_block BOOLEAN := false;
BEGIN
  SELECT * INTO v_period
  FROM practice_usage_periods
  WHERE id = p_usage_period_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Period not found');
  END IF;

  SELECT * INTO v_allowance FROM get_practice_allowance(p_usage_period_id);

  IF v_allowance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Allowance not found');
  END IF;

  -- Require a paid block once the free/block allowance is exhausted
  v_needs_block := v_period.text_turns_used >= v_allowance.text_turns_allowance;

  IF v_needs_block AND NOT p_allow_block_overage THEN
    RETURN jsonb_build_object(
      'success', false,
      'needs_block', true,
      'error', 'BLOCK_REQUIRED',
      'text_turns_used', v_period.text_turns_used,
      'text_turns_allowance', v_allowance.text_turns_allowance,
      'blocks_consumed', v_period.blocks_consumed
    );
  END IF;

  UPDATE practice_usage_periods
  SET
    text_turns_used = text_turns_used + 1,
    updated_at = now()
  WHERE id = p_usage_period_id
  RETURNING * INTO v_period;

  RETURN jsonb_build_object(
    'success', true,
    'needs_block', v_needs_block,
    'text_turns_used', v_period.text_turns_used,
    'text_turns_allowance', v_allowance.text_turns_allowance,
    'blocks_consumed', v_period.blocks_consumed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enforce block requirements for audio seconds (free tier + blocks)
CREATE OR REPLACE FUNCTION increment_audio_seconds_freemium(
  p_usage_period_id UUID,
  p_seconds INTEGER,
  p_allow_block_overage BOOLEAN DEFAULT false
) RETURNS JSONB AS $$
DECLARE
  v_period practice_usage_periods;
  v_allowance RECORD;
  v_needs_block BOOLEAN := false;
  v_projected INTEGER;
BEGIN
  SELECT * INTO v_period
  FROM practice_usage_periods
  WHERE id = p_usage_period_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Period not found');
  END IF;

  SELECT * INTO v_allowance FROM get_practice_allowance(p_usage_period_id);

  IF v_allowance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Allowance not found');
  END IF;

  v_projected := v_period.audio_seconds_used + COALESCE(p_seconds, 0);
  IF v_projected < 0 THEN
    v_projected := 0;
  END IF;

  -- Require a paid block if this recording would push beyond allowance
  v_needs_block := v_projected > v_allowance.audio_seconds_allowance;

  IF v_needs_block AND NOT p_allow_block_overage THEN
    RETURN jsonb_build_object(
      'success', false,
      'needs_block', true,
      'error', 'BLOCK_REQUIRED',
      'audio_seconds_used', v_period.audio_seconds_used,
      'audio_seconds_allowance', v_allowance.audio_seconds_allowance,
      'blocks_consumed', v_period.blocks_consumed
    );
  END IF;

  UPDATE practice_usage_periods
  SET
    audio_seconds_used = v_projected,
    updated_at = now()
  WHERE id = p_usage_period_id
  RETURNING * INTO v_period;

  RETURN jsonb_build_object(
    'success', true,
    'needs_block', v_needs_block,
    'audio_seconds_used', v_period.audio_seconds_used,
    'audio_seconds_allowance', v_allowance.audio_seconds_allowance,
    'blocks_consumed', v_period.blocks_consumed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
