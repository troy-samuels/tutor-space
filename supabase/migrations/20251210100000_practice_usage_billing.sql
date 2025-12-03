-- AI Practice Usage-Based Billing
-- Implements tiered usage with base allowance + metered blocks

-- Table: practice_usage_periods
-- Tracks usage per billing period per student
CREATE TABLE practice_usage_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id),
  subscription_id TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Usage tracking
  audio_seconds_used INTEGER NOT NULL DEFAULT 0,
  text_turns_used INTEGER NOT NULL DEFAULT 0,
  blocks_consumed INTEGER NOT NULL DEFAULT 0,

  -- Billing
  current_tier_price_cents INTEGER NOT NULL DEFAULT 800,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(student_id, subscription_id, period_start)
);

-- Indexes for efficient lookups
CREATE INDEX idx_practice_usage_student_period
  ON practice_usage_periods(student_id, period_start, period_end);
CREATE INDEX idx_practice_usage_subscription
  ON practice_usage_periods(subscription_id);

-- Table: practice_block_ledger
-- Audit trail for block purchases
CREATE TABLE practice_block_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usage_period_id UUID NOT NULL REFERENCES practice_usage_periods(id) ON DELETE CASCADE,
  blocks_consumed INTEGER NOT NULL DEFAULT 1,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('audio_overflow', 'text_overflow')),
  usage_at_trigger JSONB, -- {audio_seconds: X, text_turns: Y}
  stripe_usage_record_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_block_ledger_period
  ON practice_block_ledger(usage_period_id);

-- Add column to students table for metered subscription item ID
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS ai_practice_block_subscription_item_id TEXT;

-- RLS Policies

-- Enable RLS
ALTER TABLE practice_usage_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_block_ledger ENABLE ROW LEVEL SECURITY;

-- Policy: Students can view their own usage periods
CREATE POLICY "Students can view own usage periods"
  ON practice_usage_periods
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Policy: Tutors can view usage periods for their students
CREATE POLICY "Tutors can view student usage periods"
  ON practice_usage_periods
  FOR SELECT
  USING (tutor_id = auth.uid());

-- Policy: Service role can manage all usage periods (for API routes)
CREATE POLICY "Service role manages usage periods"
  ON practice_usage_periods
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy: Students can view their own block ledger
CREATE POLICY "Students can view own block ledger"
  ON practice_block_ledger
  FOR SELECT
  USING (
    usage_period_id IN (
      SELECT id FROM practice_usage_periods
      WHERE student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    )
  );

-- Policy: Service role can manage block ledger
CREATE POLICY "Service role manages block ledger"
  ON practice_block_ledger
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_practice_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER practice_usage_periods_updated_at
  BEFORE UPDATE ON practice_usage_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_practice_usage_updated_at();

-- Function to get or create current usage period
CREATE OR REPLACE FUNCTION get_or_create_usage_period(
  p_student_id UUID,
  p_tutor_id UUID,
  p_subscription_id TEXT,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS practice_usage_periods AS $$
DECLARE
  v_period practice_usage_periods;
BEGIN
  -- Try to find existing period
  SELECT * INTO v_period
  FROM practice_usage_periods
  WHERE student_id = p_student_id
    AND subscription_id = p_subscription_id
    AND period_start = p_period_start;

  -- If not found, create new period
  IF v_period IS NULL THEN
    INSERT INTO practice_usage_periods (
      student_id, tutor_id, subscription_id, period_start, period_end
    ) VALUES (
      p_student_id, p_tutor_id, p_subscription_id, p_period_start, p_period_end
    )
    RETURNING * INTO v_period;
  END IF;

  RETURN v_period;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment text turns and auto-purchase block if needed
-- Returns: { success: boolean, block_purchased: boolean, new_text_turns: integer, new_blocks: integer }
CREATE OR REPLACE FUNCTION increment_text_turn(
  p_usage_period_id UUID,
  p_base_text_turns INTEGER DEFAULT 300,
  p_block_text_turns INTEGER DEFAULT 200
)
RETURNS JSONB AS $$
DECLARE
  v_period practice_usage_periods;
  v_allowance INTEGER;
  v_block_purchased BOOLEAN := FALSE;
BEGIN
  -- Lock the row for update
  SELECT * INTO v_period
  FROM practice_usage_periods
  WHERE id = p_usage_period_id
  FOR UPDATE;

  IF v_period IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Period not found');
  END IF;

  -- Calculate current allowance
  v_allowance := p_base_text_turns + (v_period.blocks_consumed * p_block_text_turns);

  -- Check if we need a new block
  IF v_period.text_turns_used >= v_allowance THEN
    -- Auto-purchase a block
    UPDATE practice_usage_periods
    SET blocks_consumed = blocks_consumed + 1,
        current_tier_price_cents = 800 + ((blocks_consumed + 1) * 500),
        text_turns_used = text_turns_used + 1
    WHERE id = p_usage_period_id
    RETURNING * INTO v_period;

    v_block_purchased := TRUE;
  ELSE
    -- Just increment the turn
    UPDATE practice_usage_periods
    SET text_turns_used = text_turns_used + 1
    WHERE id = p_usage_period_id
    RETURNING * INTO v_period;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'block_purchased', v_block_purchased,
    'new_text_turns', v_period.text_turns_used,
    'new_blocks', v_period.blocks_consumed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment audio seconds and auto-purchase block if needed
CREATE OR REPLACE FUNCTION increment_audio_seconds(
  p_usage_period_id UUID,
  p_seconds INTEGER,
  p_base_audio_seconds INTEGER DEFAULT 6000,  -- 100 minutes
  p_block_audio_seconds INTEGER DEFAULT 3600  -- 60 minutes
)
RETURNS JSONB AS $$
DECLARE
  v_period practice_usage_periods;
  v_allowance INTEGER;
  v_blocks_needed INTEGER;
  v_block_purchased BOOLEAN := FALSE;
BEGIN
  -- Lock the row for update
  SELECT * INTO v_period
  FROM practice_usage_periods
  WHERE id = p_usage_period_id
  FOR UPDATE;

  IF v_period IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Period not found');
  END IF;

  -- Calculate current allowance
  v_allowance := p_base_audio_seconds + (v_period.blocks_consumed * p_block_audio_seconds);

  -- Check if we need new blocks
  IF (v_period.audio_seconds_used + p_seconds) > v_allowance THEN
    -- Calculate how many blocks needed
    v_blocks_needed := CEIL((v_period.audio_seconds_used + p_seconds - v_allowance)::NUMERIC / p_block_audio_seconds);

    -- Auto-purchase blocks
    UPDATE practice_usage_periods
    SET blocks_consumed = blocks_consumed + v_blocks_needed,
        current_tier_price_cents = 800 + ((blocks_consumed + v_blocks_needed) * 500),
        audio_seconds_used = audio_seconds_used + p_seconds
    WHERE id = p_usage_period_id
    RETURNING * INTO v_period;

    v_block_purchased := TRUE;
  ELSE
    -- Just increment the seconds
    UPDATE practice_usage_periods
    SET audio_seconds_used = audio_seconds_used + p_seconds
    WHERE id = p_usage_period_id
    RETURNING * INTO v_period;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'block_purchased', v_block_purchased,
    'blocks_added', CASE WHEN v_block_purchased THEN v_blocks_needed ELSE 0 END,
    'new_audio_seconds', v_period.audio_seconds_used,
    'new_blocks', v_period.blocks_consumed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
