-- Version snapshots for tutor sites

CREATE TABLE IF NOT EXISTS tutor_site_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_site_id UUID NOT NULL REFERENCES tutor_sites(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  UNIQUE (tutor_site_id, version)
);

-- Published version pointer on main table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tutor_sites' AND column_name = 'published_version'
  ) THEN
    ALTER TABLE tutor_sites ADD COLUMN published_version INTEGER;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tutor_site_versions_site ON tutor_site_versions(tutor_site_id);
CREATE INDEX IF NOT EXISTS idx_tutor_site_versions_site_ver ON tutor_site_versions(tutor_site_id, version);

-- RLS for versions: readable/insertable if user owns the parent
ALTER TABLE tutor_site_versions ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tutor_site_versions' AND policyname = 'tutor_site_versions_own') THEN
    DROP POLICY "tutor_site_versions_own" ON tutor_site_versions;
  END IF;
END $$;

CREATE POLICY "tutor_site_versions_own"
ON tutor_site_versions FOR ALL
USING (tutor_site_id IN (SELECT id FROM tutor_sites WHERE tutor_id = auth.uid()))
WITH CHECK (tutor_site_id IN (SELECT id FROM tutor_sites WHERE tutor_id = auth.uid()));



