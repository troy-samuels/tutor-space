-- Add new fields to tutor_sites table for enhanced mini-site builder

-- Photo gallery fields
ALTER TABLE tutor_sites ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
ALTER TABLE tutor_sites ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}';

-- Social links display control
ALTER TABLE tutor_sites ADD COLUMN IF NOT EXISTS show_social_links BOOLEAN DEFAULT true;

-- Additional pages content (FAQ, Resources as accordion/tabs)
ALTER TABLE tutor_sites ADD COLUMN IF NOT EXISTS additional_pages JSONB DEFAULT '{"faq": [], "resources": []}'::jsonb;

-- Create tutor_site_products junction table for showcasing digital products
CREATE TABLE IF NOT EXISTS tutor_site_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_site_id UUID NOT NULL REFERENCES tutor_sites(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT tutor_site_products_unique UNIQUE(tutor_site_id, product_id)
);

-- Create index for tutor_site_products
CREATE INDEX IF NOT EXISTS tutor_site_products_tutor_site_id_idx ON tutor_site_products(tutor_site_id);
CREATE INDEX IF NOT EXISTS tutor_site_products_product_id_idx ON tutor_site_products(product_id);

-- Enable RLS on tutor_site_products
ALTER TABLE tutor_site_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tutor_site_products
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

-- Add comment for documentation
COMMENT ON COLUMN tutor_sites.hero_image_url IS 'Main hero/banner image for the About section';
COMMENT ON COLUMN tutor_sites.gallery_images IS 'Array of image URLs for photo gallery in About section (max 5)';
COMMENT ON COLUMN tutor_sites.show_social_links IS 'Whether to display social media icons in header/footer';
COMMENT ON COLUMN tutor_sites.additional_pages IS 'JSONB object containing FAQ items and resource links for accordion display';
COMMENT ON TABLE tutor_site_products IS 'Junction table linking tutor sites to digital products they want to showcase';
