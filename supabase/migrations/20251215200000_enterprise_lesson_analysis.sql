-- Enterprise Lesson Analysis & Adaptive Homework System
-- Migration: 20251215200000_enterprise_lesson_analysis.sql
--
-- This migration adds support for:
-- 1. Student language profiles (dialect, L1 interference tracking)
-- 2. Lesson objectives (tutor-defined and AI-inferred)
-- 3. Spaced repetition items (SM-2 algorithm)
-- 4. L1 interference patterns reference table
-- 5. Enhanced lesson_recordings columns for analysis
-- 6. Enhanced lesson_drills columns for new drill types

-- =============================================================================
-- TABLE: student_language_profiles
-- Stores dialect preferences and L1 interference patterns per student-language pair
-- =============================================================================
CREATE TABLE IF NOT EXISTS student_language_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  target_language TEXT NOT NULL,  -- e.g., 'en', 'es', 'fr'
  native_language TEXT,           -- L1 for interference detection

  -- Dialect Profile
  dialect_variant TEXT,           -- e.g., 'en-GB', 'es-MX', 'pt-BR'
  formality_preference TEXT CHECK (formality_preference IN ('formal', 'neutral', 'informal')),
  vocabulary_style JSONB DEFAULT '{}',  -- {"prefers": ["colour", "favourite"], "avoids": ["color"]}

  -- L1 Interference Tracking
  l1_interference_patterns JSONB DEFAULT '[]',  -- [{"pattern": "article_omission", "frequency": 12, "improving": true}]
  common_errors_by_l1 JSONB DEFAULT '[]',       -- Cached common errors for this L1→L2 pair

  -- Speech Characteristics
  speaking_pace TEXT CHECK (speaking_pace IN ('slow', 'moderate', 'fast')),
  filler_words_used TEXT[] DEFAULT '{}',  -- ["um", "uh", "like"]

  -- Metadata
  lessons_analyzed INTEGER DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_id, target_language)
);

-- Indexes for student_language_profiles
CREATE INDEX IF NOT EXISTS idx_slp_student ON student_language_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_slp_language ON student_language_profiles(target_language);

-- RLS for student_language_profiles
ALTER TABLE student_language_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors can view profiles of their students"
  ON student_language_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_language_profiles.student_id
      AND s.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors can manage profiles of their students"
  ON student_language_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_language_profiles.student_id
      AND s.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to language profiles"
  ON student_language_profiles FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- TABLE: lesson_objectives
-- Stores tutor-defined or AI-inferred learning objectives per lesson
-- =============================================================================
CREATE TABLE IF NOT EXISTS lesson_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  recording_id UUID REFERENCES lesson_recordings(id) ON DELETE SET NULL,
  tutor_id UUID NOT NULL REFERENCES profiles(id),
  student_id UUID NOT NULL REFERENCES students(id),

  -- Objective Source
  source TEXT CHECK (source IN ('tutor_defined', 'ai_inferred', 'both')) DEFAULT 'ai_inferred',

  -- Pre-lesson Input (optional)
  tutor_objectives JSONB DEFAULT '[]',        -- [{"type": "grammar", "topic": "past_tense", "description": "..."}]
  tutor_focus_vocabulary TEXT[] DEFAULT '{}',
  tutor_focus_grammar TEXT[] DEFAULT '{}',

  -- AI-Inferred Objectives
  inferred_objectives JSONB DEFAULT '[]',     -- [{"type": "grammar", "topic": "past_tense", "confidence": 0.85, "evidence": "..."}]
  inferred_vocabulary TEXT[] DEFAULT '{}',
  inferred_grammar_points TEXT[] DEFAULT '{}',

  -- Coverage Metrics
  objectives_covered JSONB DEFAULT '{}',      -- {"past_tense": {"covered": true, "student_mastery": 0.7}}

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lesson_objectives
CREATE INDEX IF NOT EXISTS idx_lo_booking ON lesson_objectives(booking_id);
CREATE INDEX IF NOT EXISTS idx_lo_recording ON lesson_objectives(recording_id);
CREATE INDEX IF NOT EXISTS idx_lo_tutor ON lesson_objectives(tutor_id);
CREATE INDEX IF NOT EXISTS idx_lo_student ON lesson_objectives(student_id);

-- RLS for lesson_objectives
ALTER TABLE lesson_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors can manage their lesson objectives"
  ON lesson_objectives FOR ALL
  USING (tutor_id = auth.uid());

CREATE POLICY "Students can view their lesson objectives"
  ON lesson_objectives FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = lesson_objectives.student_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to lesson objectives"
  ON lesson_objectives FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- TABLE: spaced_repetition_items
-- SM-2 algorithm tracking for drill items
-- =============================================================================
CREATE TABLE IF NOT EXISTS spaced_repetition_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id),

  -- Item Reference
  drill_id UUID REFERENCES lesson_drills(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL,        -- 'vocabulary', 'grammar', 'pronunciation', 'phrase'
  item_content JSONB NOT NULL,    -- The specific item being reviewed
  item_key TEXT NOT NULL,         -- Unique key for deduplication (e.g., hash of content)

  -- SM-2 Algorithm Fields
  ease_factor DECIMAL(4,2) DEFAULT 2.5 CHECK (ease_factor >= 1.3),  -- 1.3 to 2.5+
  interval_days INTEGER DEFAULT 1,                                    -- Days until next review
  repetition_count INTEGER DEFAULT 0,

  -- Review History
  last_review_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ DEFAULT NOW(),  -- Initially due immediately
  last_quality INTEGER CHECK (last_quality >= 0 AND last_quality <= 5),  -- 0-5 quality rating

  -- Performance Stats
  total_reviews INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  average_response_time_ms INTEGER,

  -- Source Tracking
  source_lesson_id UUID REFERENCES lesson_recordings(id) ON DELETE SET NULL,
  source_timestamp_seconds INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_id, item_key)
);

-- Indexes for spaced_repetition_items
CREATE INDEX IF NOT EXISTS idx_sri_next_review ON spaced_repetition_items(student_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_sri_drill ON spaced_repetition_items(drill_id);
CREATE INDEX IF NOT EXISTS idx_sri_tutor ON spaced_repetition_items(tutor_id);
CREATE INDEX IF NOT EXISTS idx_sri_type ON spaced_repetition_items(item_type);

-- RLS for spaced_repetition_items
ALTER TABLE spaced_repetition_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors can view SR items for their students"
  ON spaced_repetition_items FOR SELECT
  USING (tutor_id = auth.uid());

CREATE POLICY "Students can view and update their SR items"
  ON spaced_repetition_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = spaced_repetition_items.student_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to SR items"
  ON spaced_repetition_items FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- TABLE: l1_interference_patterns
-- Reference table for common L1→L2 interference patterns
-- =============================================================================
CREATE TABLE IF NOT EXISTS l1_interference_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  native_language TEXT NOT NULL,   -- 'ja', 'zh', 'es', 'de', etc.
  target_language TEXT NOT NULL,   -- 'en', 'es', 'fr', etc.

  pattern_type TEXT NOT NULL,      -- 'article_omission', 'word_order', 'false_friend', etc.
  pattern_name TEXT NOT NULL,
  description TEXT,

  -- Detection
  detection_regex TEXT,            -- Regex pattern to detect
  detection_keywords TEXT[] DEFAULT '{}',  -- Keywords that trigger detection
  example_errors JSONB DEFAULT '[]',       -- [{"wrong": "I go store", "correct": "I go to the store"}]

  -- Correction
  explanation_template TEXT,       -- "In {target_language}, articles are required before..."
  drill_templates JSONB DEFAULT '[]',  -- Pre-built drill templates for this pattern

  -- Metadata
  frequency_rank INTEGER,          -- How common is this error (1 = most common)
  difficulty_to_correct TEXT CHECK (difficulty_to_correct IN ('easy', 'medium', 'hard')),

  UNIQUE(native_language, target_language, pattern_type)
);

-- Indexes for l1_interference_patterns
CREATE INDEX IF NOT EXISTS idx_l1p_languages ON l1_interference_patterns(native_language, target_language);
CREATE INDEX IF NOT EXISTS idx_l1p_pattern_type ON l1_interference_patterns(pattern_type);

-- RLS for l1_interference_patterns (public read, service role write)
ALTER TABLE l1_interference_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read L1 patterns"
  ON l1_interference_patterns FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage L1 patterns"
  ON l1_interference_patterns FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- ALTER TABLE: lesson_recordings
-- Add columns for enhanced analysis
-- =============================================================================
ALTER TABLE lesson_recordings ADD COLUMN IF NOT EXISTS speaker_segments JSONB;
ALTER TABLE lesson_recordings ADD COLUMN IF NOT EXISTS tutor_speaker_id INTEGER;
ALTER TABLE lesson_recordings ADD COLUMN IF NOT EXISTS student_speaker_id INTEGER;
ALTER TABLE lesson_recordings ADD COLUMN IF NOT EXISTS tutor_speech_analysis JSONB;
ALTER TABLE lesson_recordings ADD COLUMN IF NOT EXISTS student_speech_analysis JSONB;
ALTER TABLE lesson_recordings ADD COLUMN IF NOT EXISTS interaction_metrics JSONB;
ALTER TABLE lesson_recordings ADD COLUMN IF NOT EXISTS confusion_indicators JSONB;
ALTER TABLE lesson_recordings ADD COLUMN IF NOT EXISTS engagement_score DECIMAL(3,2);
ALTER TABLE lesson_recordings ADD COLUMN IF NOT EXISTS l1_interference_detected JSONB;

-- =============================================================================
-- ALTER TABLE: lesson_drills
-- Add columns for new drill types and SR integration
-- =============================================================================
ALTER TABLE lesson_drills ADD COLUMN IF NOT EXISTS objective_id UUID REFERENCES lesson_objectives(id) ON DELETE SET NULL;
ALTER TABLE lesson_drills ADD COLUMN IF NOT EXISTS targets_l1_interference BOOLEAN DEFAULT FALSE;
ALTER TABLE lesson_drills ADD COLUMN IF NOT EXISTS l1_pattern_type TEXT;
ALTER TABLE lesson_drills ADD COLUMN IF NOT EXISTS sr_item_id UUID REFERENCES spaced_repetition_items(id) ON DELETE SET NULL;
ALTER TABLE lesson_drills ADD COLUMN IF NOT EXISTS pronunciation_data JSONB;
ALTER TABLE lesson_drills ADD COLUMN IF NOT EXISTS conversation_scenario JSONB;
ALTER TABLE lesson_drills ADD COLUMN IF NOT EXISTS writing_prompt JSONB;

-- Index for drill objectives
CREATE INDEX IF NOT EXISTS idx_ld_objective ON lesson_drills(objective_id);
CREATE INDEX IF NOT EXISTS idx_ld_l1_pattern ON lesson_drills(l1_pattern_type) WHERE targets_l1_interference = TRUE;

-- =============================================================================
-- FUNCTION: calculate_sm2
-- PostgreSQL function to calculate SM-2 algorithm results
-- =============================================================================
CREATE OR REPLACE FUNCTION calculate_sm2(
  p_quality INTEGER,
  p_current_ease_factor DECIMAL,
  p_current_interval INTEGER,
  p_repetitions INTEGER
)
RETURNS TABLE (
  new_ease_factor DECIMAL,
  new_interval INTEGER,
  new_repetitions INTEGER,
  next_review_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_ease_factor DECIMAL;
  v_interval INTEGER;
  v_repetitions INTEGER;
BEGIN
  v_ease_factor := p_current_ease_factor;
  v_interval := p_current_interval;
  v_repetitions := p_repetitions;

  IF p_quality >= 3 THEN
    -- Correct response
    IF p_repetitions = 0 THEN
      v_interval := 1;
    ELSIF p_repetitions = 1 THEN
      v_interval := 6;
    ELSE
      v_interval := ROUND(p_current_interval * p_current_ease_factor);
    END IF;
    v_repetitions := p_repetitions + 1;
  ELSE
    -- Incorrect response - reset
    v_repetitions := 0;
    v_interval := 1;
  END IF;

  -- Update ease factor
  v_ease_factor := p_current_ease_factor + (0.1 - (5 - p_quality) * (0.08 + (5 - p_quality) * 0.02));
  v_ease_factor := GREATEST(1.3, v_ease_factor);  -- Minimum ease factor

  RETURN QUERY SELECT
    v_ease_factor,
    v_interval,
    v_repetitions,
    NOW() + (v_interval || ' days')::INTERVAL;
END;
$$;

-- =============================================================================
-- FUNCTION: record_sr_review
-- Records a spaced repetition review and updates the item
-- =============================================================================
CREATE OR REPLACE FUNCTION record_sr_review(
  p_item_id UUID,
  p_quality INTEGER,
  p_response_time_ms INTEGER DEFAULT NULL
)
RETURNS TABLE (
  next_review_date TIMESTAMPTZ,
  new_interval INTEGER,
  new_ease_factor DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item spaced_repetition_items%ROWTYPE;
  v_result RECORD;
BEGIN
  -- Get current item
  SELECT * INTO v_item FROM spaced_repetition_items WHERE id = p_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SR item not found: %', p_item_id;
  END IF;

  -- Calculate new SM-2 values
  SELECT * INTO v_result FROM calculate_sm2(
    p_quality,
    v_item.ease_factor,
    v_item.interval_days,
    v_item.repetition_count
  );

  -- Update the item
  UPDATE spaced_repetition_items SET
    ease_factor = v_result.new_ease_factor,
    interval_days = v_result.new_interval,
    repetition_count = v_result.new_repetitions,
    last_review_at = NOW(),
    next_review_at = v_result.next_review_at,
    last_quality = p_quality,
    total_reviews = total_reviews + 1,
    correct_count = CASE WHEN p_quality >= 3 THEN correct_count + 1 ELSE correct_count END,
    incorrect_count = CASE WHEN p_quality < 3 THEN incorrect_count + 1 ELSE incorrect_count END,
    average_response_time_ms = CASE
      WHEN p_response_time_ms IS NOT NULL AND total_reviews > 0 THEN
        ((average_response_time_ms * total_reviews) + p_response_time_ms) / (total_reviews + 1)
      WHEN p_response_time_ms IS NOT NULL THEN
        p_response_time_ms
      ELSE average_response_time_ms
    END
  WHERE id = p_item_id;

  RETURN QUERY SELECT
    v_result.next_review_at,
    v_result.new_interval,
    v_result.new_ease_factor;
END;
$$;

-- =============================================================================
-- FUNCTION: get_due_sr_items
-- Gets spaced repetition items due for review
-- =============================================================================
CREATE OR REPLACE FUNCTION get_due_sr_items(
  p_student_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  item_type TEXT,
  item_content JSONB,
  overdue_days INTEGER,
  priority INTEGER,
  drill_id UUID,
  ease_factor DECIMAL,
  repetition_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sri.id,
    sri.item_type,
    sri.item_content,
    EXTRACT(DAY FROM (NOW() - sri.next_review_at))::INTEGER AS overdue_days,
    -- Priority: higher for overdue items, lower ease factor = harder = higher priority
    (EXTRACT(DAY FROM (NOW() - sri.next_review_at))::INTEGER * 10 +
     (10 - (sri.ease_factor * 3)::INTEGER))::INTEGER AS priority,
    sri.drill_id,
    sri.ease_factor,
    sri.repetition_count
  FROM spaced_repetition_items sri
  WHERE sri.student_id = p_student_id
    AND sri.next_review_at <= NOW()
  ORDER BY priority DESC, sri.next_review_at ASC
  LIMIT p_limit;
END;
$$;

-- =============================================================================
-- FUNCTION: get_or_create_language_profile
-- Gets or creates a student language profile
-- =============================================================================
CREATE OR REPLACE FUNCTION get_or_create_language_profile(
  p_student_id UUID,
  p_target_language TEXT,
  p_native_language TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id UUID;
  v_student_native TEXT;
BEGIN
  -- Try to get existing profile
  SELECT id INTO v_profile_id
  FROM student_language_profiles
  WHERE student_id = p_student_id AND target_language = p_target_language;

  IF FOUND THEN
    RETURN v_profile_id;
  END IF;

  -- Get native language from student record if not provided
  IF p_native_language IS NULL THEN
    SELECT native_language INTO v_student_native
    FROM students WHERE id = p_student_id;
  ELSE
    v_student_native := p_native_language;
  END IF;

  -- Create new profile
  INSERT INTO student_language_profiles (
    student_id,
    target_language,
    native_language
  ) VALUES (
    p_student_id,
    p_target_language,
    v_student_native
  )
  RETURNING id INTO v_profile_id;

  RETURN v_profile_id;
END;
$$;

-- =============================================================================
-- COMMENTS for documentation
-- =============================================================================
COMMENT ON TABLE student_language_profiles IS 'Stores dialect preferences and L1 interference patterns per student-language pair';
COMMENT ON TABLE lesson_objectives IS 'Stores tutor-defined or AI-inferred learning objectives per lesson';
COMMENT ON TABLE spaced_repetition_items IS 'SM-2 algorithm tracking for drill items';
COMMENT ON TABLE l1_interference_patterns IS 'Reference table for common L1→L2 interference patterns';

COMMENT ON FUNCTION calculate_sm2 IS 'Calculates SM-2 spaced repetition algorithm results';
COMMENT ON FUNCTION record_sr_review IS 'Records a spaced repetition review and updates the item';
COMMENT ON FUNCTION get_due_sr_items IS 'Gets spaced repetition items due for review';
COMMENT ON FUNCTION get_or_create_language_profile IS 'Gets or creates a student language profile';
