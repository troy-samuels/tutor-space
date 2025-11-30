-- Unlock theme controls for all plans and introduce layout presets
ALTER TABLE tutor_sites
  ADD COLUMN IF NOT EXISTS theme_background_style TEXT DEFAULT 'solid',
  ADD COLUMN IF NOT EXISTS theme_gradient_from TEXT DEFAULT '#f8fafc',
  ADD COLUMN IF NOT EXISTS theme_gradient_to TEXT DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS hero_layout TEXT DEFAULT 'minimal',
  ADD COLUMN IF NOT EXISTS lessons_layout TEXT DEFAULT 'cards',
  ADD COLUMN IF NOT EXISTS reviews_layout TEXT DEFAULT 'cards',
  ADD COLUMN IF NOT EXISTS booking_headline TEXT,
  ADD COLUMN IF NOT EXISTS booking_subcopy TEXT,
  ADD COLUMN IF NOT EXISTS booking_cta_label TEXT,
  ADD COLUMN IF NOT EXISTS booking_cta_url TEXT,
  ADD COLUMN IF NOT EXISTS show_booking BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_digital BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_social_page BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_social_header_icons BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_social_footer_icons BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_faq BOOLEAN DEFAULT FALSE;

ALTER TABLE tutor_site_resources
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'social';
