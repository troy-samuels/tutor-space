-- Add source column for attribution tracking (banner vs landing page)
ALTER TABLE lifetime_purchases
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'unknown';

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_lifetime_purchases_source
ON lifetime_purchases(source);

-- Backfill existing records
UPDATE lifetime_purchases
SET source = 'lifetime_landing_page'
WHERE source = 'unknown' OR source IS NULL;

COMMENT ON COLUMN lifetime_purchases.source IS
  'Acquisition source tracking: campaign_banner, lifetime_landing_page, etc.';
