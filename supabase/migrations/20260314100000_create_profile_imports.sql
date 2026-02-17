-- Profile Import Engine: stores scrape state + normalised data for platform imports
-- Supports: iTalki, Preply, Verbling, Cambly, Wyzant, Superprof

CREATE TABLE profile_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Source
  platform TEXT NOT NULL CHECK (platform IN ('italki', 'preply', 'verbling', 'cambly', 'wyzant', 'superprof')),
  platform_profile_id TEXT,
  source_url TEXT NOT NULL,

  -- Scrape state machine: pending → scraping → scraped → mapped → applied | failed
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'scraping', 'scraped', 'mapped', 'applied', 'failed')),
  error_message TEXT,
  scrape_attempts INT NOT NULL DEFAULT 0,
  last_scraped_at TIMESTAMPTZ,

  -- Raw scraped data (preserved for audit / re-parse)
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Normalised platform-agnostic data (output of scraper → normaliser)
  normalised_data JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- What the user confirmed/edited before applying to page builder
  confirmed_data JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One active import per platform per tutor (can re-import)
  CONSTRAINT profile_imports_tutor_platform_unique UNIQUE (tutor_id, platform)
);

-- Indexes
CREATE INDEX idx_profile_imports_tutor_id ON profile_imports(tutor_id);
CREATE INDEX idx_profile_imports_status ON profile_imports(status);
CREATE INDEX idx_profile_imports_platform ON profile_imports(platform);

-- RLS
ALTER TABLE profile_imports ENABLE ROW LEVEL SECURITY;

-- Tutors can only see/modify their own imports
CREATE POLICY profile_imports_owner_all ON profile_imports
  FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Service role bypass for API routes (scraper workers)
CREATE POLICY profile_imports_service_all ON profile_imports
  FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-update updated_at
CREATE TRIGGER profile_imports_updated_at
  BEFORE UPDATE ON profile_imports
  FOR EACH ROW
  EXECUTE FUNCTION update_tutor_sites_updated_at();
