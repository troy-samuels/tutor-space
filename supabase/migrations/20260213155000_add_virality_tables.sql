-- Sprint 2: Virality Engine — new tables for referrals, challenges, anonymous sessions

-- ─── Tutor Referrals ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tutor_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rewarded')),
  reward_type TEXT DEFAULT NULL,
  reward_applied_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referrer_tutor_id, referred_tutor_id)
);

ALTER TABLE tutor_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors can view own referrals"
  ON tutor_referrals FOR SELECT
  USING (auth.uid() = referrer_tutor_id OR auth.uid() = referred_tutor_id);

CREATE POLICY "Authenticated tutors can create referral record"
  ON tutor_referrals FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = referred_tutor_id
    AND referrer_tutor_id != referred_tutor_id
  );

-- Only allow status column updates; restrict to participants
CREATE POLICY "Participants can update referral status"
  ON tutor_referrals FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (auth.uid() = referrer_tutor_id OR auth.uid() = referred_tutor_id)
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (auth.uid() = referrer_tutor_id OR auth.uid() = referred_tutor_id)
  );

CREATE INDEX IF NOT EXISTS idx_tutor_referrals_referrer
  ON tutor_referrals(referrer_tutor_id);

CREATE INDEX IF NOT EXISTS idx_tutor_referrals_referred
  ON tutor_referrals(referred_tutor_id);

-- ─── Practice Challenges ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS practice_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID REFERENCES students(id) ON DELETE SET NULL,
  challenger_name TEXT,
  language TEXT NOT NULL,
  level TEXT NOT NULL,
  challenger_score INTEGER NOT NULL,
  respondent_id UUID REFERENCES students(id) ON DELETE SET NULL,
  respondent_score INTEGER,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE practice_challenges ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can view open challenges (needed for challenge links)
CREATE POLICY "Anyone can view challenges"
  ON practice_challenges FOR SELECT
  USING (true);

-- Challenges created via service-role in API routes; RLS blocks direct anon inserts
CREATE POLICY "Authenticated users can create challenges"
  ON practice_challenges FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Respondents can complete challenges"
  ON practice_challenges FOR UPDATE
  USING (
    status = 'open'
    AND (respondent_id IS NULL OR auth.uid()::text = respondent_id::text)
  )
  WITH CHECK (
    status = 'completed'
  );

CREATE INDEX IF NOT EXISTS idx_practice_challenges_status
  ON practice_challenges(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_practice_challenges_challenger
  ON practice_challenges(challenger_id);

-- ─── Anonymous Practice Sessions ─────────────────────────────────

CREATE TABLE IF NOT EXISTS anonymous_practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL,
  level TEXT,
  score INTEGER,
  results JSONB DEFAULT '{}',
  attribution_tutor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  attribution_source TEXT,
  claimed_by_student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE anonymous_practice_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can create anonymous sessions (no auth required for 0-friction flow)
CREATE POLICY "Anyone can create anonymous sessions"
  ON anonymous_practice_sessions FOR INSERT
  WITH CHECK (true);

-- Public read for result pages
CREATE POLICY "Anyone can view anonymous sessions"
  ON anonymous_practice_sessions FOR SELECT
  USING (true);

-- Sessions can be claimed once (email capture); only authenticated users can claim
CREATE POLICY "Unclaimed sessions can be claimed by authenticated users"
  ON anonymous_practice_sessions FOR UPDATE
  USING (
    claimed_by_student_id IS NULL
    AND auth.uid() IS NOT NULL
  )
  WITH CHECK (
    claimed_by_student_id IS NOT NULL
  );

CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_token
  ON anonymous_practice_sessions(session_token);

CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_attribution
  ON anonymous_practice_sessions(attribution_tutor_id)
  WHERE attribution_tutor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_unclaimed
  ON anonymous_practice_sessions(created_at DESC)
  WHERE claimed_by_student_id IS NULL;

-- ─── Profile Extension ──────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referred_by_tutor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_referred_by
  ON profiles(referred_by_tutor_id)
  WHERE referred_by_tutor_id IS NOT NULL;
