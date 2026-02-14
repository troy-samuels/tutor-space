ALTER TABLE students
  ADD COLUMN IF NOT EXISTS practice_tier TEXT DEFAULT NULL CHECK (practice_tier IN ('unlimited', 'solo')),
  ADD COLUMN IF NOT EXISTS practice_subscription_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS practice_sessions_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS practice_period_start TIMESTAMPTZ DEFAULT NULL;
