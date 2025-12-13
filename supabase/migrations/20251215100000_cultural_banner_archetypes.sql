-- Cultural Banner: Language Niche Edition
-- Adds Teaching Archetypes to replace generic palettes

-- Add archetype columns to tutor_sites
ALTER TABLE tutor_sites
  ADD COLUMN IF NOT EXISTS theme_archetype_id TEXT DEFAULT 'immersion',
  ADD COLUMN IF NOT EXISTS theme_heading_font TEXT DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS theme_border_radius TEXT DEFAULT '3xl';

-- Migrate existing palette selections to archetypes
-- professional = business/dark themes, immersion = warm/friendly, academic = formal, polyglot = modern
UPDATE tutor_sites SET theme_archetype_id =
  CASE theme_palette_id
    WHEN 'classic-ink' THEN 'professional'
    WHEN 'ocean-trust' THEN 'professional'
    WHEN 'warm-clay' THEN 'immersion'
    WHEN 'midnight-gold' THEN 'professional'
    WHEN 'lavender-luxe' THEN 'polyglot'
    ELSE 'immersion'  -- Default for new or unset
  END
WHERE theme_archetype_id IS NULL OR theme_archetype_id = 'immersion';

-- Set appropriate border radius based on archetype
UPDATE tutor_sites SET theme_border_radius =
  CASE theme_archetype_id
    WHEN 'professional' THEN 'lg'
    WHEN 'immersion' THEN '3xl'
    WHEN 'academic' THEN 'xl'
    WHEN 'polyglot' THEN '2xl'
    ELSE '3xl'
  END
WHERE theme_border_radius IS NULL OR theme_border_radius = '3xl';

-- Set heading font for academic archetype (uses serif headings)
UPDATE tutor_sites SET theme_heading_font = 'serif'
WHERE theme_archetype_id = 'academic' AND (theme_heading_font IS NULL OR theme_heading_font = 'system');

-- Update hero_layout to 'banner' for all sites (Cultural Banner is the only layout now)
UPDATE tutor_sites SET hero_layout = 'banner'
WHERE hero_layout IS NULL OR hero_layout IN ('minimal', 'portrait');

-- Add comment for clarity
COMMENT ON COLUMN tutor_sites.theme_archetype_id IS 'Teaching archetype: professional, immersion, academic, polyglot';
COMMENT ON COLUMN tutor_sites.theme_heading_font IS 'Font for headings (e.g., serif for Academic archetype)';
COMMENT ON COLUMN tutor_sites.theme_border_radius IS 'Border radius: lg, xl, 2xl, 3xl';
