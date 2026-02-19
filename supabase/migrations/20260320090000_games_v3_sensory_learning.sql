-- TutorLingua Games V3: sensory learning, skill mastery, meta progression, and challenge links.

CREATE TABLE IF NOT EXISTS game_learning_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('en', 'es', 'fr', 'de')),
  current_cefr TEXT CHECK (current_cefr IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  calibrated_difficulty INTEGER NOT NULL DEFAULT 35 CHECK (calibrated_difficulty BETWEEN 0 AND 100),
  last_difficulty_delta INTEGER NOT NULL DEFAULT 0 CHECK (last_difficulty_delta BETWEEN -100 AND 100),
  cognitive_load_state TEXT NOT NULL DEFAULT 'balanced' CHECK (cognitive_load_state IN ('focused', 'balanced', 'boosted')),
  last_aha_at TIMESTAMPTZ,
  runs_count INTEGER NOT NULL DEFAULT 0 CHECK (runs_count >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, language)
);

CREATE INDEX IF NOT EXISTS idx_game_learning_profiles_user ON game_learning_profiles(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS game_skill_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('en', 'es', 'fr', 'de')),
  track TEXT NOT NULL CHECK (track IN ('recognition', 'recall', 'false-friends', 'context', 'speed')),
  mastery_score INTEGER NOT NULL DEFAULT 50 CHECK (mastery_score BETWEEN 0 AND 100),
  last_delta INTEGER NOT NULL DEFAULT 0 CHECK (last_delta BETWEEN -20 AND 20),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, language, track)
);

CREATE INDEX IF NOT EXISTS idx_game_skill_mastery_user_lang ON game_skill_mastery(user_id, language);

CREATE TABLE IF NOT EXISTS game_meta_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens INTEGER NOT NULL DEFAULT 0 CHECK (tokens >= 0),
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_meta_node_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_slug TEXT NOT NULL,
  source_run_id UUID REFERENCES game_runs(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, node_slug)
);

CREATE INDEX IF NOT EXISTS idx_game_meta_unlocks_user ON game_meta_node_unlocks(user_id, unlocked_at DESC);

CREATE TABLE IF NOT EXISTS game_challenges (
  code TEXT PRIMARY KEY CHECK (code ~ '^[A-Z0-9]{4,32}$'),
  creator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_slug TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('daily', 'practice', 'challenge', 'ranked')),
  seed BIGINT NOT NULL,
  difficulty_band INTEGER NOT NULL CHECK (difficulty_band BETWEEN 0 AND 100),
  ui_version TEXT NOT NULL,
  curve_version TEXT NOT NULL,
  stumble_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_challenges_creator ON game_challenges(creator_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_challenges_expiry ON game_challenges(is_active, expires_at);

CREATE TABLE IF NOT EXISTS game_challenge_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_code TEXT NOT NULL REFERENCES game_challenges(code) ON DELETE CASCADE,
  run_id UUID REFERENCES game_runs(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  accuracy NUMERIC(5,2),
  time_ms INTEGER,
  outcome TEXT NOT NULL DEFAULT 'started' CHECK (outcome IN ('started', 'completed', 'abandoned')),
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_game_challenge_attempts_code ON game_challenge_attempts(challenge_code, accepted_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_challenge_attempts_user ON game_challenge_attempts(user_id, accepted_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_game_challenge_attempts_run ON game_challenge_attempts(run_id) WHERE run_id IS NOT NULL;

ALTER TABLE game_learning_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_skill_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_meta_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_meta_node_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_challenge_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own learning profiles" ON game_learning_profiles;
CREATE POLICY "Users manage own learning profiles"
  ON game_learning_profiles FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role manages learning profiles" ON game_learning_profiles;
CREATE POLICY "Service role manages learning profiles"
  ON game_learning_profiles FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Users manage own skill mastery" ON game_skill_mastery;
CREATE POLICY "Users manage own skill mastery"
  ON game_skill_mastery FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role manages skill mastery" ON game_skill_mastery;
CREATE POLICY "Service role manages skill mastery"
  ON game_skill_mastery FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Users manage own meta inventory" ON game_meta_inventory;
CREATE POLICY "Users manage own meta inventory"
  ON game_meta_inventory FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role manages meta inventory" ON game_meta_inventory;
CREATE POLICY "Service role manages meta inventory"
  ON game_meta_inventory FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Users manage own node unlocks" ON game_meta_node_unlocks;
CREATE POLICY "Users manage own node unlocks"
  ON game_meta_node_unlocks FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role manages node unlocks" ON game_meta_node_unlocks;
CREATE POLICY "Service role manages node unlocks"
  ON game_meta_node_unlocks FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Creators manage own challenges" ON game_challenges;
CREATE POLICY "Creators manage own challenges"
  ON game_challenges FOR ALL
  USING (creator_user_id = auth.uid())
  WITH CHECK (creator_user_id = auth.uid());

DROP POLICY IF EXISTS "Read active challenges by code" ON game_challenges;
CREATE POLICY "Read active challenges by code"
  ON game_challenges FOR SELECT
  USING (
    is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
  );

DROP POLICY IF EXISTS "Service role manages challenges" ON game_challenges;
CREATE POLICY "Service role manages challenges"
  ON game_challenges FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Users view own challenge attempts" ON game_challenge_attempts;
CREATE POLICY "Users view own challenge attempts"
  ON game_challenge_attempts FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM game_challenges c
      WHERE c.code = challenge_code
        AND c.creator_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users insert own challenge attempts" ON game_challenge_attempts;
CREATE POLICY "Users insert own challenge attempts"
  ON game_challenge_attempts FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own challenge attempts" ON game_challenge_attempts;
CREATE POLICY "Users update own challenge attempts"
  ON game_challenge_attempts FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role manages challenge attempts" ON game_challenge_attempts;
CREATE POLICY "Service role manages challenge attempts"
  ON game_challenge_attempts FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

DROP TRIGGER IF EXISTS set_game_learning_profiles_updated_at ON game_learning_profiles;
CREATE TRIGGER set_game_learning_profiles_updated_at
  BEFORE UPDATE ON game_learning_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_game_skill_mastery_updated_at ON game_skill_mastery;
CREATE TRIGGER set_game_skill_mastery_updated_at
  BEFORE UPDATE ON game_skill_mastery
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_game_meta_inventory_updated_at ON game_meta_inventory;
CREATE TRIGGER set_game_meta_inventory_updated_at
  BEFORE UPDATE ON game_meta_inventory
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

COMMENT ON TABLE game_learning_profiles IS 'Per-user per-language adaptive learning state for games v3.';
COMMENT ON TABLE game_skill_mastery IS 'Skill-track mastery deltas and rolling mastery score per language.';
COMMENT ON TABLE game_meta_inventory IS 'Player token/xp inventory for world map unlock progression.';
COMMENT ON TABLE game_meta_node_unlocks IS 'Unlocked game nodes in the v1 world map.';
COMMENT ON TABLE game_challenges IS 'Shareable deterministic challenge links with seed and tuning metadata.';
COMMENT ON TABLE game_challenge_attempts IS 'Attempts recorded against share challenge codes.';
