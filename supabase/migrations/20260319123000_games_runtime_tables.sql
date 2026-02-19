-- Games runtime persistence for full-engine runs.

CREATE TABLE IF NOT EXISTS game_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_slug TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('daily', 'practice', 'challenge', 'ranked')),
  language TEXT NOT NULL CHECK (language IN ('en', 'es', 'fr', 'de')),
  device_class TEXT NOT NULL CHECK (device_class IN ('mobile', 'desktop', 'telegram')),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'abandoned')),
  score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 0,
  accuracy NUMERIC(5,2) NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  mistakes INTEGER NOT NULL DEFAULT 0,
  max_combo INTEGER NOT NULL DEFAULT 0,
  false_friend_hits INTEGER NOT NULL DEFAULT 0,
  first_correct_ms INTEGER,
  replayed BOOLEAN NOT NULL DEFAULT FALSE,
  tier_reached TEXT NOT NULL DEFAULT 'foundation' CHECK (tier_reached IN ('onboarding', 'foundation', 'pressure', 'mastery')),
  is_won BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_game_runs_user_game ON game_runs(user_id, game_slug, language);
CREATE INDEX IF NOT EXISTS idx_game_runs_completed ON game_runs(status, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_runs_mode_date ON game_runs(game_slug, mode, language, started_at DESC);

CREATE TABLE IF NOT EXISTS game_player_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_slug TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('en', 'es', 'fr', 'de')),
  runs_played INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  total_score BIGINT NOT NULL DEFAULT 0,
  total_time_ms BIGINT NOT NULL DEFAULT 0,
  total_mistakes BIGINT NOT NULL DEFAULT 0,
  avg_accuracy NUMERIC(5,2) NOT NULL DEFAULT 0,
  first_success_p50_ms INTEGER,
  last_played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, game_slug, language)
);

CREATE INDEX IF NOT EXISTS idx_game_player_profiles_user ON game_player_profiles(user_id, last_played_at DESC);

CREATE TABLE IF NOT EXISTS game_rank_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES game_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_slug TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('ranked')),
  language TEXT NOT NULL CHECK (language IN ('en', 'es', 'fr', 'de')),
  leaderboard_date DATE NOT NULL,
  score INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_rank_entries_run ON game_rank_entries(run_id);
CREATE INDEX IF NOT EXISTS idx_rank_entries_board ON game_rank_entries(game_slug, mode, language, leaderboard_date, score DESC, duration_ms ASC);

ALTER TABLE game_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rank_entries ENABLE ROW LEVEL SECURITY;

-- Owners can access their own runs.
DROP POLICY IF EXISTS "Users manage own game runs" ON game_runs;
CREATE POLICY "Users manage own game runs"
  ON game_runs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role can manage all game runs.
DROP POLICY IF EXISTS "Service role manages game runs" ON game_runs;
CREATE POLICY "Service role manages game runs"
  ON game_runs FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Users manage own game profiles" ON game_player_profiles;
CREATE POLICY "Users manage own game profiles"
  ON game_player_profiles FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role manages game profiles" ON game_player_profiles;
CREATE POLICY "Service role manages game profiles"
  ON game_player_profiles FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Leaderboard is public read" ON game_rank_entries;
CREATE POLICY "Leaderboard is public read"
  ON game_rank_entries FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Users insert own rank entries" ON game_rank_entries;
CREATE POLICY "Users insert own rank entries"
  ON game_rank_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role manages rank entries" ON game_rank_entries;
CREATE POLICY "Service role manages rank entries"
  ON game_rank_entries FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- Keep updated_at current on profile updates.
DROP TRIGGER IF EXISTS set_game_player_profiles_updated_at ON game_player_profiles;
CREATE TRIGGER set_game_player_profiles_updated_at
  BEFORE UPDATE ON game_player_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

COMMENT ON TABLE game_runs IS 'Gameplay run lifecycle records for full-engine games runtime.';
COMMENT ON TABLE game_player_profiles IS 'Per-game per-language aggregate player profile metrics.';
COMMENT ON TABLE game_rank_entries IS 'Ranked leaderboard snapshots for published game runs.';
