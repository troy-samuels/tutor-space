-- Sprint 3: AI Cost Optimisation — exercise banks, hybrid sessions, usage tracking

-- ─── Exercise Banks ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS exercise_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language TEXT NOT NULL,
  level TEXT NOT NULL,
  topic TEXT NOT NULL,
  grammar_focus TEXT[] DEFAULT '{}',
  vocabulary_focus TEXT[] DEFAULT '{}',
  exercises JSONB NOT NULL DEFAULT '[]',
  exercise_count INTEGER NOT NULL DEFAULT 0,
  source_session_id UUID REFERENCES student_practice_sessions(id) ON DELETE SET NULL,
  source_lesson_id UUID DEFAULT NULL,
  served_count INTEGER NOT NULL DEFAULT 0,
  quality_score REAL DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE exercise_banks ENABLE ROW LEVEL SECURITY;

-- Anyone can read exercise banks (served during practice)
CREATE POLICY "Anyone can view exercise banks"
  ON exercise_banks FOR SELECT
  USING (true);

-- No INSERT/UPDATE RLS policies = only service role can write

CREATE INDEX IF NOT EXISTS idx_exercise_banks_lookup
  ON exercise_banks(language, level, topic);

CREATE INDEX IF NOT EXISTS idx_exercise_banks_served
  ON exercise_banks(served_count ASC, created_at DESC);

-- ─── Student Exercise History ────────────────────────────────────

CREATE TABLE IF NOT EXISTS student_exercise_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exercise_bank_id UUID NOT NULL REFERENCES exercise_banks(id) ON DELETE CASCADE,
  score REAL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, exercise_bank_id)
);

ALTER TABLE student_exercise_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own history"
  ON student_exercise_history FOR SELECT
  USING (auth.uid()::text IN (
    SELECT user_id::text FROM students WHERE id = student_id
  ));

CREATE POLICY "Authenticated users can insert history"
  ON student_exercise_history FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_student_exercise_history_student
  ON student_exercise_history(student_id, completed_at DESC);

-- ─── Session Plan (hybrid exercise + conversation blocks) ────────

ALTER TABLE student_practice_sessions
  ADD COLUMN IF NOT EXISTS session_plan JSONB DEFAULT NULL;

-- ─── Exercise tracking on messages ───────────────────────────────

ALTER TABLE student_practice_messages
  ADD COLUMN IF NOT EXISTS exercise_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS exercise_score REAL DEFAULT NULL;

-- ─── AI Usage Tracking (aggregated daily) ────────────────────────

CREATE TABLE IF NOT EXISTS ai_usage_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  task TEXT NOT NULL,
  total_calls INTEGER NOT NULL DEFAULT 0,
  cache_hits INTEGER NOT NULL DEFAULT 0,
  tokens_input BIGINT NOT NULL DEFAULT 0,
  tokens_output BIGINT NOT NULL DEFAULT 0,
  estimated_cost_usd REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(date, task)
);

ALTER TABLE ai_usage_daily ENABLE ROW LEVEL SECURITY;
-- No RLS policies = service role only (internal tracking)

CREATE INDEX IF NOT EXISTS idx_ai_usage_daily_date
  ON ai_usage_daily(date DESC);
