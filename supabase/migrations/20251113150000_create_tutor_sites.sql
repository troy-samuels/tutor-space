-- Create tutor_sites table for pages/website builder
CREATE TABLE tutor_sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- About section
  about_title TEXT,
  about_subtitle TEXT,
  about_body TEXT,
  hero_image_url TEXT,
  gallery_images TEXT[] DEFAULT '{}',

  -- Theme settings
  theme_background TEXT DEFAULT '#ffffff',
  theme_background_style TEXT DEFAULT 'solid',
  theme_gradient_from TEXT DEFAULT '#f8fafc',
  theme_gradient_to TEXT DEFAULT '#ffffff',
  theme_primary TEXT DEFAULT '#2563eb',
  theme_font TEXT DEFAULT 'system', -- 'system' | 'serif' | 'mono'
  theme_spacing TEXT DEFAULT 'comfortable', -- 'cozy' | 'comfortable' | 'compact'
  hero_layout TEXT DEFAULT 'minimal',
  lessons_layout TEXT DEFAULT 'cards',
  reviews_layout TEXT DEFAULT 'cards',

  -- Section visibility
  show_about BOOLEAN DEFAULT TRUE,
  show_lessons BOOLEAN DEFAULT TRUE,
  show_booking BOOLEAN DEFAULT TRUE,
  show_reviews BOOLEAN DEFAULT TRUE,
  show_social_links BOOLEAN DEFAULT TRUE,
  show_social_page BOOLEAN DEFAULT TRUE,
  show_resources BOOLEAN DEFAULT FALSE,
  show_contact BOOLEAN DEFAULT FALSE,
  show_digital BOOLEAN DEFAULT FALSE,
  show_faq BOOLEAN DEFAULT FALSE,

  -- Contact CTA
  contact_cta_label TEXT,
  contact_cta_url TEXT,

  -- Booking CTA copy
  booking_headline TEXT,
  booking_subcopy TEXT,
  booking_cta_label TEXT,
  booking_cta_url TEXT,

  -- Social icon controls
  show_social_header_icons BOOLEAN DEFAULT TRUE,
  show_social_footer_icons BOOLEAN DEFAULT TRUE,

  -- Additional structured content (FAQ + resources)
  additional_pages JSONB DEFAULT '{"faq": [], "resources": []}'::jsonb,

  -- Publishing state
  status TEXT DEFAULT 'draft', -- 'draft' | 'published'
  published_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT tutor_sites_tutor_id_unique UNIQUE(tutor_id)
);

-- Create tutor_site_services junction table
CREATE TABLE tutor_site_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_site_id UUID NOT NULL REFERENCES tutor_sites(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT tutor_site_services_unique UNIQUE(tutor_site_id, service_id)
);

-- Create tutor_site_reviews table
CREATE TABLE tutor_site_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_site_id UUID NOT NULL REFERENCES tutor_sites(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  quote TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tutor_site_resources table
CREATE TABLE tutor_site_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_site_id UUID NOT NULL REFERENCES tutor_sites(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT DEFAULT 'social',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tutor_site_products table
CREATE TABLE tutor_site_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_site_id UUID NOT NULL REFERENCES tutor_sites(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT tutor_site_products_unique UNIQUE(tutor_site_id, product_id)
);

-- Create indexes
CREATE INDEX tutor_sites_tutor_id_idx ON tutor_sites(tutor_id);
CREATE INDEX tutor_sites_status_idx ON tutor_sites(status);
CREATE INDEX tutor_site_services_tutor_site_id_idx ON tutor_site_services(tutor_site_id);
CREATE INDEX tutor_site_reviews_tutor_site_id_idx ON tutor_site_reviews(tutor_site_id);
CREATE INDEX tutor_site_resources_tutor_site_id_idx ON tutor_site_resources(tutor_site_id);
CREATE INDEX tutor_site_products_tutor_site_id_idx ON tutor_site_products(tutor_site_id);
CREATE INDEX tutor_site_products_product_id_idx ON tutor_site_products(product_id);

-- Enable RLS
ALTER TABLE tutor_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_site_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_site_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_site_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tutor_sites
CREATE POLICY tutor_sites_owner_all ON tutor_sites
  FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY tutor_sites_public_select ON tutor_sites
  FOR SELECT
  USING (status = 'published');

-- RLS Policies for tutor_site_services
CREATE POLICY tutor_site_services_owner_all ON tutor_site_services
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tutor_sites
      WHERE tutor_sites.id = tutor_site_services.tutor_site_id
      AND tutor_sites.tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tutor_sites
      WHERE tutor_sites.id = tutor_site_services.tutor_site_id
      AND tutor_sites.tutor_id = auth.uid()
    )
  );

CREATE POLICY tutor_site_services_public_select ON tutor_site_services
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tutor_sites
      WHERE tutor_sites.id = tutor_site_services.tutor_site_id
      AND tutor_sites.status = 'published'
    )
  );

-- RLS Policies for tutor_site_reviews
CREATE POLICY tutor_site_reviews_owner_all ON tutor_site_reviews
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tutor_sites
      WHERE tutor_sites.id = tutor_site_reviews.tutor_site_id
      AND tutor_sites.tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tutor_sites
      WHERE tutor_sites.id = tutor_site_reviews.tutor_site_id
      AND tutor_sites.tutor_id = auth.uid()
    )
  );

CREATE POLICY tutor_site_reviews_public_select ON tutor_site_reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tutor_sites
      WHERE tutor_sites.id = tutor_site_reviews.tutor_site_id
      AND tutor_sites.status = 'published'
    )
  );

-- RLS Policies for tutor_site_resources
CREATE POLICY tutor_site_resources_owner_all ON tutor_site_resources
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tutor_sites
      WHERE tutor_sites.id = tutor_site_resources.tutor_site_id
      AND tutor_sites.tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tutor_sites
      WHERE tutor_sites.id = tutor_site_resources.tutor_site_id
      AND tutor_sites.tutor_id = auth.uid()
    )
  );

CREATE POLICY tutor_site_resources_public_select ON tutor_site_resources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tutor_sites
      WHERE tutor_sites.id = tutor_site_resources.tutor_site_id
      AND tutor_sites.status = 'published'
    )
  );

-- RLS Policies for tutor_site_products
ALTER TABLE tutor_site_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY tutor_site_products_owner_all ON tutor_site_products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tutor_sites
      WHERE tutor_sites.id = tutor_site_products.tutor_site_id
      AND tutor_sites.tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tutor_sites
      WHERE tutor_sites.id = tutor_site_products.tutor_site_id
      AND tutor_sites.tutor_id = auth.uid()
    )
  );

CREATE POLICY tutor_site_products_public_select ON tutor_site_products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tutor_sites
      WHERE tutor_sites.id = tutor_site_products.tutor_site_id
      AND tutor_sites.status = 'published'
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tutor_sites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tutor_sites_updated_at
  BEFORE UPDATE ON tutor_sites
  FOR EACH ROW
  EXECUTE FUNCTION update_tutor_sites_updated_at();
