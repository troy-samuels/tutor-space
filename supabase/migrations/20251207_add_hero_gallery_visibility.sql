-- Add visibility columns for hero and gallery sections
ALTER TABLE tutor_sites
ADD COLUMN IF NOT EXISTS show_hero BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_gallery BOOLEAN DEFAULT true;
