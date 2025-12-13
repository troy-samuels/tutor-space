-- Tutor Invite Links System
-- Allows tutors to create reusable invite links that auto-approve students

-- =============================================================================
-- TABLES
-- =============================================================================

-- Main invite links table
CREATE TABLE IF NOT EXISTS tutor_invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  service_ids UUID[] DEFAULT '{}',  -- Empty = all services available
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usage tracking - which students used which link
CREATE TABLE IF NOT EXISTS tutor_invite_link_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_link_id UUID NOT NULL REFERENCES tutor_invite_links(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(invite_link_id, student_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Tutor listing their invite links
CREATE INDEX IF NOT EXISTS tutor_invite_links_tutor_idx
  ON tutor_invite_links (tutor_id, is_active, expires_at DESC);

-- Token lookup for validation (partial index for active only)
CREATE INDEX IF NOT EXISTS tutor_invite_links_token_idx
  ON tutor_invite_links (token)
  WHERE is_active = true;

-- Usage lookups
CREATE INDEX IF NOT EXISTS tutor_invite_link_usages_link_idx
  ON tutor_invite_link_usages (invite_link_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE tutor_invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_invite_link_usages ENABLE ROW LEVEL SECURITY;

-- Tutors can manage their own invite links
CREATE POLICY "Tutors manage own invite links"
  ON tutor_invite_links FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Public can read valid invite links by token (for validation during signup)
CREATE POLICY "Public read valid invite links by token"
  ON tutor_invite_links FOR SELECT
  USING (is_active = true AND expires_at > NOW());

-- Tutors can view usages of their invite links
CREATE POLICY "Tutors view invite link usages"
  ON tutor_invite_link_usages FOR SELECT
  USING (
    invite_link_id IN (
      SELECT id FROM tutor_invite_links WHERE tutor_id = auth.uid()
    )
  );

-- Service role can insert usages (via server action)
CREATE POLICY "Service role insert usages"
  ON tutor_invite_link_usages FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tutor_invite_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tutor_invite_links_updated_at ON tutor_invite_links;
CREATE TRIGGER tutor_invite_links_updated_at
  BEFORE UPDATE ON tutor_invite_links
  FOR EACH ROW
  EXECUTE FUNCTION update_tutor_invite_links_updated_at();

-- =============================================================================
-- HELPER FUNCTION
-- =============================================================================

-- Validate invite token and return link data
CREATE OR REPLACE FUNCTION validate_invite_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  tutor_id UUID,
  name TEXT,
  service_ids UUID[],
  is_valid BOOLEAN,
  tutor_username TEXT,
  tutor_full_name TEXT,
  tutor_avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    til.id,
    til.tutor_id,
    til.name,
    til.service_ids,
    (til.is_active AND til.expires_at > NOW()) AS is_valid,
    p.username AS tutor_username,
    p.full_name AS tutor_full_name,
    p.avatar_url AS tutor_avatar_url
  FROM tutor_invite_links til
  JOIN profiles p ON p.id = til.tutor_id
  WHERE til.token = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment usage count atomically
CREATE OR REPLACE FUNCTION increment_invite_link_usage(p_link_id UUID, p_student_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_inserted BOOLEAN := false;
BEGIN
  -- Try to insert usage record (will fail if duplicate)
  INSERT INTO tutor_invite_link_usages (invite_link_id, student_id)
  VALUES (p_link_id, p_student_id)
  ON CONFLICT (invite_link_id, student_id) DO NOTHING;

  -- Check if we actually inserted
  IF FOUND THEN
    -- Increment the usage count
    UPDATE tutor_invite_links
    SET usage_count = usage_count + 1
    WHERE id = p_link_id;
    v_inserted := true;
  END IF;

  RETURN v_inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
