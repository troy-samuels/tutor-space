-- Backfill tier for existing Studio subscribers
-- tier_type enum: 'standard' (free/pro) or 'studio'
-- NOTE: Already deployed as 'backfill_studio_tier_v2' on 2025-12-10

UPDATE profiles
SET tier = 'studio'
WHERE plan IN ('studio_monthly', 'studio_annual', 'studio_life')
  AND (tier IS NULL OR tier = 'standard');

-- Ensure non-studio users have standard tier (default)
UPDATE profiles
SET tier = 'standard'
WHERE plan NOT IN ('studio_monthly', 'studio_annual', 'studio_life')
  AND tier IS NULL;
