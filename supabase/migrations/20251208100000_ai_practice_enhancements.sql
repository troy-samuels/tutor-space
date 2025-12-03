-- AI Practice Companion Enhancements
-- Adds structured grammar tracking, pronunciation assessment, and tutor analytics

-- ============================================================================
-- GRAMMAR ERROR TRACKING
-- ============================================================================

-- Grammar error categories (reference table)
CREATE TABLE IF NOT EXISTS grammar_error_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  severity_weight SMALLINT DEFAULT 1 CHECK (severity_weight BETWEEN 1 AND 3),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed grammar categories
INSERT INTO grammar_error_categories (slug, label, description, severity_weight) VALUES
  ('verb_tense', 'Verb Tense', 'Incorrect tense usage (past, present, future)', 2),
  ('subject_verb_agreement', 'Subject-Verb Agreement', 'Mismatch between subject and verb number', 2),
  ('preposition', 'Prepositions', 'Wrong preposition choice or omission', 1),
  ('article', 'Articles', 'Missing or incorrect use of a/an/the', 1),
  ('word_order', 'Word Order', 'Incorrect sentence structure', 2),
  ('gender_agreement', 'Gender Agreement', 'Noun-adjective or noun-article gender mismatch', 2),
  ('conjugation', 'Conjugation', 'Incorrect verb conjugation', 2),
  ('pronoun', 'Pronouns', 'Wrong pronoun usage or agreement', 1),
  ('plural_singular', 'Plural/Singular', 'Number agreement errors', 1),
  ('spelling', 'Spelling', 'Misspelled words', 1),
  ('vocabulary', 'Vocabulary Choice', 'Wrong word for context or false friend', 1)
ON CONFLICT (slug) DO NOTHING;

-- Individual grammar errors from practice sessions
CREATE TABLE IF NOT EXISTS grammar_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES student_practice_messages(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES student_practice_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_slug TEXT NOT NULL REFERENCES grammar_error_categories(slug),
  original_text TEXT NOT NULL,
  corrected_text TEXT NOT NULL,
  explanation TEXT,
  language TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grammar_errors_student ON grammar_errors(student_id);
CREATE INDEX IF NOT EXISTS idx_grammar_errors_session ON grammar_errors(session_id);
CREATE INDEX IF NOT EXISTS idx_grammar_errors_category ON grammar_errors(category_slug);

-- Aggregated grammar patterns per student (for trend tracking)
CREATE TABLE IF NOT EXISTS student_grammar_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_slug TEXT NOT NULL REFERENCES grammar_error_categories(slug),
  language TEXT NOT NULL,
  error_count INTEGER DEFAULT 0,
  last_error_at TIMESTAMPTZ,
  first_error_at TIMESTAMPTZ,
  trend TEXT CHECK (trend IN ('improving', 'stable', 'declining')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, tutor_id, category_slug, language)
);

CREATE INDEX IF NOT EXISTS idx_grammar_patterns_student ON student_grammar_patterns(student_id);

-- ============================================================================
-- PRONUNCIATION TRACKING
-- ============================================================================

-- Phonetic spelling errors (text-based pronunciation inference)
CREATE TABLE IF NOT EXISTS phonetic_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES student_practice_messages(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES student_practice_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  misspelled_word TEXT NOT NULL,
  intended_word TEXT NOT NULL,
  phonetic_pattern TEXT,  -- e.g., "au->o confusion", "th->t substitution"
  language TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phonetic_errors_student ON phonetic_errors(student_id);

-- Audio pronunciation assessments (Azure Speech integration)
CREATE TABLE IF NOT EXISTS pronunciation_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES student_practice_sessions(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  audio_duration_seconds NUMERIC(6,2) NOT NULL,
  transcript TEXT,
  accuracy_score NUMERIC(5,2) CHECK (accuracy_score BETWEEN 0 AND 100),
  fluency_score NUMERIC(5,2) CHECK (fluency_score BETWEEN 0 AND 100),
  pronunciation_score NUMERIC(5,2) CHECK (pronunciation_score BETWEEN 0 AND 100),
  completeness_score NUMERIC(5,2) CHECK (completeness_score BETWEEN 0 AND 100),
  word_scores JSONB,        -- Per-word breakdown
  problem_phonemes JSONB,   -- Phonemes needing work
  cost_cents INTEGER NOT NULL DEFAULT 0,
  language TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pronunciation_student ON pronunciation_assessments(student_id);

-- Audio budget tracking per billing period
CREATE TABLE IF NOT EXISTS student_audio_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  audio_seconds_used INTEGER DEFAULT 0,
  audio_seconds_limit INTEGER NOT NULL DEFAULT 60,  -- 60 seconds/month default
  audio_cost_cents INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, period_start)
);

-- ============================================================================
-- TUTOR ANALYTICS (Summary Tables)
-- ============================================================================

-- Cached practice summaries for fast dashboard loading
CREATE TABLE IF NOT EXISTS student_practice_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Session stats
  total_sessions INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  total_messages_sent INTEGER DEFAULT 0,
  total_practice_minutes INTEGER DEFAULT 0,

  -- Grammar tracking
  total_grammar_errors INTEGER DEFAULT 0,
  top_grammar_issues JSONB,  -- [{category_slug, label, count, trend}]

  -- Pronunciation tracking
  total_audio_assessments INTEGER DEFAULT 0,
  avg_pronunciation_score NUMERIC(5,2),
  avg_fluency_score NUMERIC(5,2),
  total_phonetic_errors INTEGER DEFAULT 0,

  -- Vocabulary
  unique_vocabulary_used INTEGER DEFAULT 0,
  vocabulary_words JSONB,  -- Array of unique words practiced

  -- Engagement
  avg_session_rating NUMERIC(3,2),
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_practice_at TIMESTAMPTZ,

  -- For charts
  weekly_activity JSONB,   -- [{week, sessions, minutes, errors}]
  monthly_progress JSONB,  -- [{month, avg_rating, error_reduction_pct}]

  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, tutor_id)
);

CREATE INDEX IF NOT EXISTS idx_practice_summaries_tutor ON student_practice_summaries(tutor_id);

-- ============================================================================
-- ENHANCEMENTS TO EXISTING TABLES
-- ============================================================================

-- Add structured grammar/phonetic fields to practice messages
ALTER TABLE student_practice_messages
  ADD COLUMN IF NOT EXISTS grammar_errors JSONB,
  ADD COLUMN IF NOT EXISTS phonetic_errors JSONB,
  ADD COLUMN IF NOT EXISTS has_audio BOOLEAN DEFAULT FALSE;

-- Add grammar/phonetic counts to sessions
ALTER TABLE student_practice_sessions
  ADD COLUMN IF NOT EXISTS grammar_errors_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phonetic_errors_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_audio_input BOOLEAN DEFAULT FALSE;

-- Add audio settings to students
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS ai_audio_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_audio_seconds_limit INTEGER DEFAULT 60;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE grammar_error_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE grammar_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_grammar_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE phonetic_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pronunciation_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_audio_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_practice_summaries ENABLE ROW LEVEL SECURITY;

-- Grammar categories are public read
CREATE POLICY "Grammar categories are public read"
  ON grammar_error_categories FOR SELECT
  USING (true);

-- Grammar errors: tutors can view their students' errors
CREATE POLICY "Tutors can view student grammar errors"
  ON grammar_errors FOR SELECT
  USING (tutor_id = auth.uid());

CREATE POLICY "Service role can insert grammar errors"
  ON grammar_errors FOR INSERT
  WITH CHECK (true);

-- Grammar patterns: tutors can view their students' patterns
CREATE POLICY "Tutors can view student grammar patterns"
  ON student_grammar_patterns FOR SELECT
  USING (tutor_id = auth.uid());

CREATE POLICY "Service role can manage grammar patterns"
  ON student_grammar_patterns FOR ALL
  WITH CHECK (true);

-- Phonetic errors: tutors can view
CREATE POLICY "Tutors can view phonetic errors"
  ON phonetic_errors FOR SELECT
  USING (tutor_id = auth.uid());

CREATE POLICY "Service role can insert phonetic errors"
  ON phonetic_errors FOR INSERT
  WITH CHECK (true);

-- Pronunciation assessments: tutors can view
CREATE POLICY "Tutors can view pronunciation assessments"
  ON pronunciation_assessments FOR SELECT
  USING (tutor_id = auth.uid());

CREATE POLICY "Service role can insert pronunciation assessments"
  ON pronunciation_assessments FOR INSERT
  WITH CHECK (true);

-- Audio budgets: tutors can view and students can view their own
CREATE POLICY "Tutors can view student audio budgets"
  ON student_audio_budgets FOR SELECT
  USING (tutor_id = auth.uid());

CREATE POLICY "Service role can manage audio budgets"
  ON student_audio_budgets FOR ALL
  WITH CHECK (true);

-- Practice summaries: tutors can view their students
CREATE POLICY "Tutors can view practice summaries"
  ON student_practice_summaries FOR SELECT
  USING (tutor_id = auth.uid());

CREATE POLICY "Service role can manage practice summaries"
  ON student_practice_summaries FOR ALL
  WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to increment grammar pattern counts
CREATE OR REPLACE FUNCTION increment_grammar_pattern(
  p_student_id UUID,
  p_tutor_id UUID,
  p_category_slug TEXT,
  p_language TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO student_grammar_patterns (
    student_id, tutor_id, category_slug, language,
    error_count, first_error_at, last_error_at, updated_at
  )
  VALUES (
    p_student_id, p_tutor_id, p_category_slug, p_language,
    1, NOW(), NOW(), NOW()
  )
  ON CONFLICT (student_id, tutor_id, category_slug, language)
  DO UPDATE SET
    error_count = student_grammar_patterns.error_count + 1,
    last_error_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh practice summary for a student
CREATE OR REPLACE FUNCTION refresh_practice_summary(
  p_student_id UUID,
  p_tutor_id UUID
) RETURNS VOID AS $$
DECLARE
  v_total_sessions INTEGER;
  v_completed_sessions INTEGER;
  v_total_messages INTEGER;
  v_total_minutes INTEGER;
  v_total_grammar_errors INTEGER;
  v_total_phonetic_errors INTEGER;
  v_avg_rating NUMERIC;
  v_last_practice TIMESTAMPTZ;
  v_top_issues JSONB;
  v_weekly_activity JSONB;
BEGIN
  -- Get session stats
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE ended_at IS NOT NULL),
    COALESCE(SUM(message_count), 0),
    COALESCE(SUM(duration_seconds) / 60, 0),
    COALESCE(AVG((ai_feedback->>'overall_rating')::NUMERIC), 0),
    MAX(started_at)
  INTO
    v_total_sessions,
    v_completed_sessions,
    v_total_messages,
    v_total_minutes,
    v_avg_rating,
    v_last_practice
  FROM student_practice_sessions
  WHERE student_id = p_student_id AND tutor_id = p_tutor_id;

  -- Get grammar error count
  SELECT COUNT(*)
  INTO v_total_grammar_errors
  FROM grammar_errors
  WHERE student_id = p_student_id AND tutor_id = p_tutor_id;

  -- Get phonetic error count
  SELECT COUNT(*)
  INTO v_total_phonetic_errors
  FROM phonetic_errors
  WHERE student_id = p_student_id AND tutor_id = p_tutor_id;

  -- Get top grammar issues
  SELECT COALESCE(jsonb_agg(issue), '[]'::jsonb)
  INTO v_top_issues
  FROM (
    SELECT jsonb_build_object(
      'category_slug', sgp.category_slug,
      'label', gec.label,
      'count', sgp.error_count,
      'trend', sgp.trend
    ) as issue
    FROM student_grammar_patterns sgp
    JOIN grammar_error_categories gec ON gec.slug = sgp.category_slug
    WHERE sgp.student_id = p_student_id AND sgp.tutor_id = p_tutor_id
    ORDER BY sgp.error_count DESC
    LIMIT 5
  ) top_issues;

  -- Get weekly activity (last 8 weeks)
  SELECT COALESCE(jsonb_agg(week_data ORDER BY week_start), '[]'::jsonb)
  INTO v_weekly_activity
  FROM (
    SELECT
      date_trunc('week', started_at) as week_start,
      jsonb_build_object(
        'week', to_char(date_trunc('week', started_at), 'YYYY-MM-DD'),
        'sessions', COUNT(*),
        'minutes', COALESCE(SUM(duration_seconds) / 60, 0),
        'errors', COALESCE(SUM(grammar_errors_count), 0)
      ) as week_data
    FROM student_practice_sessions
    WHERE student_id = p_student_id
      AND tutor_id = p_tutor_id
      AND started_at >= NOW() - INTERVAL '8 weeks'
    GROUP BY date_trunc('week', started_at)
  ) weeks;

  -- Upsert summary
  INSERT INTO student_practice_summaries (
    student_id, tutor_id,
    total_sessions, completed_sessions, total_messages_sent, total_practice_minutes,
    total_grammar_errors, top_grammar_issues,
    total_phonetic_errors,
    avg_session_rating, last_practice_at,
    weekly_activity, updated_at
  )
  VALUES (
    p_student_id, p_tutor_id,
    v_total_sessions, v_completed_sessions, v_total_messages, v_total_minutes,
    v_total_grammar_errors, v_top_issues,
    v_total_phonetic_errors,
    v_avg_rating, v_last_practice,
    v_weekly_activity, NOW()
  )
  ON CONFLICT (student_id, tutor_id)
  DO UPDATE SET
    total_sessions = EXCLUDED.total_sessions,
    completed_sessions = EXCLUDED.completed_sessions,
    total_messages_sent = EXCLUDED.total_messages_sent,
    total_practice_minutes = EXCLUDED.total_practice_minutes,
    total_grammar_errors = EXCLUDED.total_grammar_errors,
    top_grammar_issues = EXCLUDED.top_grammar_issues,
    total_phonetic_errors = EXCLUDED.total_phonetic_errors,
    avg_session_rating = EXCLUDED.avg_session_rating,
    last_practice_at = EXCLUDED.last_practice_at,
    weekly_activity = EXCLUDED.weekly_activity,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
