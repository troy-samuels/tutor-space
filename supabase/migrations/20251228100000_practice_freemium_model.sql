-- Migration: AI Practice Freemium Model
-- Converts from $8/month subscription to free tier with $5 block add-ons
-- Free tier: 45 min audio (2700 sec) + 600 text turns per month
-- Blocks: $5 each for +45 min audio + 300 text turns

-- Add free tier tracking columns to practice_usage_periods
ALTER TABLE practice_usage_periods
  ADD COLUMN IF NOT EXISTS is_free_tier BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS free_audio_seconds INTEGER DEFAULT 2700,
  ADD COLUMN IF NOT EXISTS free_text_turns INTEGER DEFAULT 600;

-- Add free tier tracking to students table
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS ai_practice_free_tier_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_practice_free_tier_started_at TIMESTAMPTZ;

-- Function: Get or create FREE usage period (no Stripe subscription required)
-- This replaces the subscription-based period creation
CREATE OR REPLACE FUNCTION get_or_create_free_usage_period(
  p_student_id UUID,
  p_tutor_id UUID
) RETURNS practice_usage_periods AS $$
DECLARE
  v_period practice_usage_periods;
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
  -- Monthly periods aligned to 1st of month
  v_period_start := date_trunc('month', now());
  v_period_end := v_period_start + interval '1 month';

  -- Try to find existing period for this month
  SELECT * INTO v_period FROM practice_usage_periods
  WHERE student_id = p_student_id
    AND period_start = v_period_start
  LIMIT 1;

  -- If no period exists, create one with free tier allowances
  IF v_period IS NULL THEN
    INSERT INTO practice_usage_periods (
      id,
      student_id,
      tutor_id,
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
      v_period_start,
      v_period_end,
      0,
      0,
      0,
      0,  -- Free tier has no base price
      true,
      2700,  -- 45 min audio
      600,   -- 600 text turns
      now(),
      now()
    ) RETURNING * INTO v_period;
  END IF;

  RETURN v_period;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate total allowance (free + purchased blocks)
CREATE OR REPLACE FUNCTION get_practice_allowance(
  p_usage_period_id UUID
) RETURNS TABLE (
  audio_seconds_allowance INTEGER,
  text_turns_allowance INTEGER,
  audio_seconds_used INTEGER,
  text_turns_used INTEGER,
  audio_seconds_remaining INTEGER,
  text_turns_remaining INTEGER,
  blocks_consumed INTEGER,
  is_free_tier BOOLEAN
) AS $$
DECLARE
  v_period practice_usage_periods;
  v_block_audio_seconds INTEGER := 2700;  -- 45 min per block
  v_block_text_turns INTEGER := 300;      -- 300 text per block
BEGIN
  SELECT * INTO v_period FROM practice_usage_periods WHERE id = p_usage_period_id;

  IF v_period IS NULL THEN
    RETURN;
  END IF;

  audio_seconds_allowance := v_period.free_audio_seconds + (v_period.blocks_consumed * v_block_audio_seconds);
  text_turns_allowance := v_period.free_text_turns + (v_period.blocks_consumed * v_block_text_turns);
  audio_seconds_used := v_period.audio_seconds_used;
  text_turns_used := v_period.text_turns_used;
  audio_seconds_remaining := GREATEST(0, audio_seconds_allowance - audio_seconds_used);
  text_turns_remaining := GREATEST(0, text_turns_allowance - text_turns_used);
  blocks_consumed := v_period.blocks_consumed;
  is_free_tier := v_period.is_free_tier;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if student has remaining allowance
CREATE OR REPLACE FUNCTION check_practice_allowance(
  p_usage_period_id UUID,
  p_resource_type TEXT  -- 'audio' or 'text'
) RETURNS JSONB AS $$
DECLARE
  v_allowance RECORD;
  v_has_allowance BOOLEAN;
  v_used INTEGER;
  v_limit INTEGER;
BEGIN
  SELECT * INTO v_allowance FROM get_practice_allowance(p_usage_period_id);

  IF v_allowance IS NULL THEN
    RETURN jsonb_build_object(
      'has_allowance', false,
      'error', 'Usage period not found'
    );
  END IF;

  IF p_resource_type = 'audio' THEN
    v_has_allowance := v_allowance.audio_seconds_remaining > 0;
    v_used := v_allowance.audio_seconds_used;
    v_limit := v_allowance.audio_seconds_allowance;
  ELSE
    v_has_allowance := v_allowance.text_turns_remaining > 0;
    v_used := v_allowance.text_turns_used;
    v_limit := v_allowance.text_turns_allowance;
  END IF;

  RETURN jsonb_build_object(
    'has_allowance', v_has_allowance,
    'used', v_used,
    'limit', v_limit,
    'remaining', GREATEST(0, v_limit - v_used),
    'blocks_consumed', v_allowance.blocks_consumed,
    'is_free_tier', v_allowance.is_free_tier
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update increment_text_turn to work with freemium model
-- Returns whether a block purchase is needed (doesn't auto-purchase)
CREATE OR REPLACE FUNCTION increment_text_turn_freemium(
  p_usage_period_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_period practice_usage_periods;
  v_allowance RECORD;
  v_needs_block BOOLEAN := false;
BEGIN
  -- Get current period
  SELECT * INTO v_period FROM practice_usage_periods WHERE id = p_usage_period_id;

  IF v_period IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Period not found');
  END IF;

  -- Calculate current allowance
  SELECT * INTO v_allowance FROM get_practice_allowance(p_usage_period_id);

  -- Check if we need a block (at or over limit)
  IF v_period.text_turns_used >= v_allowance.text_turns_allowance THEN
    v_needs_block := true;
  END IF;

  -- Increment usage
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

-- Update increment_audio_seconds to work with freemium model
CREATE OR REPLACE FUNCTION increment_audio_seconds_freemium(
  p_usage_period_id UUID,
  p_seconds INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_period practice_usage_periods;
  v_allowance RECORD;
  v_needs_block BOOLEAN := false;
BEGIN
  -- Get current period
  SELECT * INTO v_period FROM practice_usage_periods WHERE id = p_usage_period_id;

  IF v_period IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Period not found');
  END IF;

  -- Calculate current allowance
  SELECT * INTO v_allowance FROM get_practice_allowance(p_usage_period_id);

  -- Check if we need a block (would exceed limit)
  IF (v_period.audio_seconds_used + p_seconds) > v_allowance.audio_seconds_allowance THEN
    v_needs_block := true;
  END IF;

  -- Increment usage
  UPDATE practice_usage_periods
  SET
    audio_seconds_used = audio_seconds_used + p_seconds,
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

-- Function: Record block purchase (called after Stripe confirms)
CREATE OR REPLACE FUNCTION record_block_purchase(
  p_usage_period_id UUID,
  p_trigger_type TEXT,  -- 'audio_overflow' or 'text_overflow'
  p_stripe_usage_record_id TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_period practice_usage_periods;
  v_block_audio_seconds INTEGER := 2700;
  v_block_text_turns INTEGER := 300;
BEGIN
  -- Increment blocks_consumed
  UPDATE practice_usage_periods
  SET
    blocks_consumed = blocks_consumed + 1,
    current_tier_price_cents = (blocks_consumed + 1) * 500,  -- $5 per block
    is_free_tier = false,
    updated_at = now()
  WHERE id = p_usage_period_id
  RETURNING * INTO v_period;

  IF v_period IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Period not found');
  END IF;

  -- Record in ledger
  INSERT INTO practice_block_ledger (
    id,
    usage_period_id,
    blocks_consumed,
    trigger_type,
    usage_at_trigger,
    stripe_usage_record_id,
    created_at
  ) VALUES (
    gen_random_uuid(),
    p_usage_period_id,
    1,
    p_trigger_type,
    jsonb_build_object(
      'audio_seconds_used', v_period.audio_seconds_used,
      'text_turns_used', v_period.text_turns_used
    ),
    p_stripe_usage_record_id,
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'blocks_consumed', v_period.blocks_consumed,
    'new_audio_allowance', v_period.free_audio_seconds + (v_period.blocks_consumed * v_block_audio_seconds),
    'new_text_allowance', v_period.free_text_turns + (v_period.blocks_consumed * v_block_text_turns)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_practice_usage_student_period
  ON practice_usage_periods(student_id, period_start);

CREATE INDEX IF NOT EXISTS idx_students_free_tier
  ON students(ai_practice_free_tier_enabled)
  WHERE ai_practice_free_tier_enabled = true;

-- Comment on changes
COMMENT ON COLUMN practice_usage_periods.is_free_tier IS 'Whether student is on free tier (no blocks purchased this period)';
COMMENT ON COLUMN practice_usage_periods.free_audio_seconds IS 'Free tier audio allowance (2700 = 45 min)';
COMMENT ON COLUMN practice_usage_periods.free_text_turns IS 'Free tier text allowance (600 turns)';
COMMENT ON COLUMN students.ai_practice_free_tier_enabled IS 'Whether student has activated free AI Practice (tutor must have Studio)';
COMMENT ON COLUMN students.ai_practice_free_tier_started_at IS 'When student first activated free AI Practice';
