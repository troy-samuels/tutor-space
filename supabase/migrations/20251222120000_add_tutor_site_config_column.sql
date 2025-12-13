-- Add config JSONB column for configuration-driven tutor sites
ALTER TABLE tutor_sites
ADD COLUMN IF NOT EXISTS config JSONB;

-- Ensure existing rows have a default config object
UPDATE tutor_sites
SET config = '{}'::jsonb
WHERE config IS NULL;

-- Set default for future rows
ALTER TABLE tutor_sites
ALTER COLUMN config SET DEFAULT '{}'::jsonb;

-- Prevent null configs going forward
ALTER TABLE tutor_sites
ALTER COLUMN config SET NOT NULL;

COMMENT ON COLUMN tutor_sites.config IS 'Full site configuration payload (theme, blocks, layout).';
