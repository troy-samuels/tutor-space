-- Freemium Hardening Migration
-- Creates base freemium tables, adds performance indexes and data integrity constraints for AI Practice freemium model

-- ==============================================================================
-- 0. CREATE BASE TABLES (idempotent)
-- ==============================================================================

-- Practice usage periods table - tracks monthly usage for freemium billing
CREATE TABLE IF NOT EXISTS practice_usage_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id TEXT NOT NULL DEFAULT 'freemium',
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  audio_seconds_used INTEGER NOT NULL DEFAULT 0,
  text_turns_used INTEGER NOT NULL DEFAULT 0,
  blocks_consumed INTEGER NOT NULL DEFAULT 0,
  is_free_tier BOOLEAN DEFAULT true,
  free_audio_seconds INTEGER DEFAULT 2700,
  free_text_turns INTEGER DEFAULT 600,
  current_tier_price_cents INTEGER DEFAULT 0,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, subscription_id, period_start)
);

-- Practice block ledger - audit trail for block purchases
CREATE TABLE IF NOT EXISTS practice_block_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usage_period_id UUID NOT NULL REFERENCES practice_usage_periods(id) ON DELETE CASCADE,
  blocks_consumed INTEGER NOT NULL DEFAULT 1,
  trigger_type TEXT NOT NULL,
  usage_at_trigger JSONB,
  stripe_usage_record_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on the new tables
ALTER TABLE practice_usage_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_block_ledger ENABLE ROW LEVEL SECURITY;

-- RLS policies for practice_usage_periods
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'practice_usage_periods' AND policyname = 'Students can view own usage'
  ) THEN
    CREATE POLICY "Students can view own usage" ON practice_usage_periods
      FOR SELECT USING (student_id IN (
        SELECT id FROM students WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'practice_usage_periods' AND policyname = 'Tutors can view student usage'
  ) THEN
    CREATE POLICY "Tutors can view student usage" ON practice_usage_periods
      FOR SELECT USING (tutor_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'practice_usage_periods' AND policyname = 'Service role full access usage'
  ) THEN
    CREATE POLICY "Service role full access usage" ON practice_usage_periods
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- RLS policies for practice_block_ledger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'practice_block_ledger' AND policyname = 'Service role full access ledger'
  ) THEN
    CREATE POLICY "Service role full access ledger" ON practice_block_ledger
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ==============================================================================
-- 1. PERFORMANCE INDEXES
-- ==============================================================================

-- Index for looking up usage periods by student and period start
CREATE INDEX IF NOT EXISTS idx_practice_usage_student_period
  ON practice_usage_periods(student_id, period_start);

-- Index for looking up usage periods by tutor and period start
CREATE INDEX IF NOT EXISTS idx_practice_usage_tutor_period
  ON practice_usage_periods(tutor_id, period_start);

-- Index for looking up block ledger entries by usage period
CREATE INDEX IF NOT EXISTS idx_practice_block_ledger_period
  ON practice_block_ledger(usage_period_id);

-- Index for Stripe reconciliation lookups
CREATE INDEX IF NOT EXISTS idx_practice_block_ledger_stripe
  ON practice_block_ledger(stripe_usage_record_id) WHERE stripe_usage_record_id IS NOT NULL;

-- ==============================================================================
-- 2. DATA INTEGRITY CONSTRAINTS
-- ==============================================================================

-- Prevent negative usage values (would indicate a bug)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_audio_seconds_non_negative'
  ) THEN
    ALTER TABLE practice_usage_periods
      ADD CONSTRAINT chk_audio_seconds_non_negative
        CHECK (audio_seconds_used >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_text_turns_non_negative'
  ) THEN
    ALTER TABLE practice_usage_periods
      ADD CONSTRAINT chk_text_turns_non_negative
        CHECK (text_turns_used >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_blocks_consumed_non_negative'
  ) THEN
    ALTER TABLE practice_usage_periods
      ADD CONSTRAINT chk_blocks_consumed_non_negative
        CHECK (blocks_consumed >= 0);
  END IF;
END $$;

-- ==============================================================================
-- 3. ENSURE REQUIRED COLUMNS EXIST (idempotent)
-- ==============================================================================

-- Add is_free_tier column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practice_usage_periods' AND column_name = 'is_free_tier'
  ) THEN
    ALTER TABLE practice_usage_periods ADD COLUMN is_free_tier BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add free_audio_seconds column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practice_usage_periods' AND column_name = 'free_audio_seconds'
  ) THEN
    ALTER TABLE practice_usage_periods ADD COLUMN free_audio_seconds INTEGER DEFAULT 2700;
  END IF;
END $$;

-- Add free_text_turns column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practice_usage_periods' AND column_name = 'free_text_turns'
  ) THEN
    ALTER TABLE practice_usage_periods ADD COLUMN free_text_turns INTEGER DEFAULT 600;
  END IF;
END $$;

-- Add stripe_subscription_id column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practice_usage_periods' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE practice_usage_periods ADD COLUMN stripe_subscription_id TEXT;
  END IF;
END $$;

-- ==============================================================================
-- 4. STUDENT TABLE FREEMIUM COLUMNS (idempotent)
-- ==============================================================================

-- Add ai_practice_free_tier_enabled column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'ai_practice_free_tier_enabled'
  ) THEN
    ALTER TABLE students ADD COLUMN ai_practice_free_tier_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add ai_practice_free_tier_started_at column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'ai_practice_free_tier_started_at'
  ) THEN
    ALTER TABLE students ADD COLUMN ai_practice_free_tier_started_at TIMESTAMPTZ;
  END IF;
END $$;

-- ==============================================================================
-- 5. DATABASE FUNCTIONS FOR FREEMIUM MODEL
-- ==============================================================================

-- Function: Get or create free usage period (idempotent, monthly periods)
CREATE OR REPLACE FUNCTION get_or_create_free_usage_period(
  p_student_id UUID,
  p_tutor_id UUID
) RETURNS practice_usage_periods AS $$
DECLARE
  v_period practice_usage_periods;
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
  -- Monthly periods aligned to 1st of month (UTC)
  v_period_start := date_trunc('month', now() AT TIME ZONE 'UTC');
  v_period_end := v_period_start + interval '1 month';

  -- Try to find existing period for this month
  SELECT * INTO v_period
  FROM practice_usage_periods
  WHERE student_id = p_student_id
    AND period_start = v_period_start
  LIMIT 1;

  -- Create if doesn't exist
  IF v_period IS NULL THEN
    INSERT INTO practice_usage_periods (
      student_id, tutor_id, period_start, period_end,
      audio_seconds_used, text_turns_used, blocks_consumed,
      is_free_tier, free_audio_seconds, free_text_turns,
      subscription_id
    ) VALUES (
      p_student_id, p_tutor_id, v_period_start, v_period_end,
      0, 0, 0, true, 2700, 600, 'freemium'
    )
    ON CONFLICT (student_id, subscription_id, period_start)
    DO UPDATE SET updated_at = now()
    RETURNING * INTO v_period;
  END IF;

  RETURN v_period;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Increment text turns with block requirement check
CREATE OR REPLACE FUNCTION increment_text_turn_freemium(
  p_usage_period_id UUID,
  p_allow_block_overage BOOLEAN DEFAULT false
) RETURNS JSONB AS $$
DECLARE
  v_period practice_usage_periods;
  v_allowance INTEGER;
  v_needs_block BOOLEAN;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT * INTO v_period
  FROM practice_usage_periods
  WHERE id = p_usage_period_id
  FOR UPDATE;

  IF v_period IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'PERIOD_NOT_FOUND');
  END IF;

  -- Calculate total allowance: free tier + (blocks × 300)
  v_allowance := COALESCE(v_period.free_text_turns, 600) + (v_period.blocks_consumed * 300);

  -- Check if at or over limit
  v_needs_block := v_period.text_turns_used >= v_allowance;

  -- If over limit and not allowed to charge blocks, return error
  IF v_needs_block AND NOT p_allow_block_overage THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'BLOCK_REQUIRED',
      'needs_block', true,
      'text_turns_used', v_period.text_turns_used,
      'text_turns_allowance', v_allowance,
      'blocks_consumed', v_period.blocks_consumed
    );
  END IF;

  -- Increment usage
  UPDATE practice_usage_periods
  SET text_turns_used = text_turns_used + 1,
      updated_at = now()
  WHERE id = p_usage_period_id;

  RETURN jsonb_build_object(
    'success', true,
    'needs_block', v_needs_block,
    'text_turns_used', v_period.text_turns_used + 1,
    'text_turns_allowance', v_allowance,
    'blocks_consumed', v_period.blocks_consumed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Increment audio seconds with block requirement check
CREATE OR REPLACE FUNCTION increment_audio_seconds_freemium(
  p_usage_period_id UUID,
  p_seconds INTEGER,
  p_allow_block_overage BOOLEAN DEFAULT false
) RETURNS JSONB AS $$
DECLARE
  v_period practice_usage_periods;
  v_allowance INTEGER;
  v_projected INTEGER;
  v_needs_block BOOLEAN;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT * INTO v_period
  FROM practice_usage_periods
  WHERE id = p_usage_period_id
  FOR UPDATE;

  IF v_period IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'PERIOD_NOT_FOUND');
  END IF;

  -- Calculate total allowance: free tier + (blocks × 2700)
  v_allowance := COALESCE(v_period.free_audio_seconds, 2700) + (v_period.blocks_consumed * 2700);

  -- Calculate projected usage after this increment
  v_projected := v_period.audio_seconds_used + p_seconds;

  -- Check if would exceed limit
  v_needs_block := v_projected > v_allowance;

  -- If would exceed and not allowed to charge blocks, return error
  IF v_needs_block AND NOT p_allow_block_overage THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'BLOCK_REQUIRED',
      'needs_block', true,
      'audio_seconds_used', v_period.audio_seconds_used,
      'audio_seconds_allowance', v_allowance,
      'blocks_consumed', v_period.blocks_consumed
    );
  END IF;

  -- Increment usage
  UPDATE practice_usage_periods
  SET audio_seconds_used = audio_seconds_used + p_seconds,
      updated_at = now()
  WHERE id = p_usage_period_id;

  RETURN jsonb_build_object(
    'success', true,
    'needs_block', v_needs_block,
    'audio_seconds_used', v_period.audio_seconds_used + p_seconds,
    'audio_seconds_allowance', v_allowance,
    'blocks_consumed', v_period.blocks_consumed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Record block purchase after Stripe confirms
CREATE OR REPLACE FUNCTION record_block_purchase(
  p_usage_period_id UUID,
  p_trigger_type TEXT,
  p_stripe_usage_record_id TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_period practice_usage_periods;
  v_new_audio_allowance INTEGER;
  v_new_text_allowance INTEGER;
BEGIN
  -- Lock and update in one operation
  UPDATE practice_usage_periods
  SET blocks_consumed = blocks_consumed + 1,
      is_free_tier = false,
      current_tier_price_cents = (blocks_consumed + 1) * 500,
      updated_at = now()
  WHERE id = p_usage_period_id
  RETURNING * INTO v_period;

  IF v_period IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'PERIOD_NOT_FOUND');
  END IF;

  -- Insert audit entry
  INSERT INTO practice_block_ledger (
    usage_period_id,
    blocks_consumed,
    trigger_type,
    usage_at_trigger,
    stripe_usage_record_id
  ) VALUES (
    p_usage_period_id,
    1,
    p_trigger_type,
    jsonb_build_object(
      'audio_seconds_used', v_period.audio_seconds_used,
      'text_turns_used', v_period.text_turns_used,
      'timestamp', now()
    ),
    p_stripe_usage_record_id
  );

  -- Calculate new allowances
  v_new_audio_allowance := COALESCE(v_period.free_audio_seconds, 2700) + (v_period.blocks_consumed * 2700);
  v_new_text_allowance := COALESCE(v_period.free_text_turns, 600) + (v_period.blocks_consumed * 300);

  RETURN jsonb_build_object(
    'success', true,
    'blocks_consumed', v_period.blocks_consumed,
    'new_audio_allowance', v_new_audio_allowance,
    'new_text_allowance', v_new_text_allowance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 6. GRANT PERMISSIONS
-- ==============================================================================

GRANT EXECUTE ON FUNCTION get_or_create_free_usage_period(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_free_usage_period(UUID, UUID) TO service_role;

GRANT EXECUTE ON FUNCTION increment_text_turn_freemium(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_text_turn_freemium(UUID, BOOLEAN) TO service_role;

GRANT EXECUTE ON FUNCTION increment_audio_seconds_freemium(UUID, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_audio_seconds_freemium(UUID, INTEGER, BOOLEAN) TO service_role;

GRANT EXECUTE ON FUNCTION record_block_purchase(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION record_block_purchase(UUID, TEXT, TEXT) TO service_role;
