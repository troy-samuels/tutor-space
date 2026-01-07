-- Add soft delete columns to tutor_site child tables
-- This enables non-destructive deletion and maintains audit trail integrity

-- tutor_site_services
ALTER TABLE tutor_site_services
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_tutor_site_services_active
  ON tutor_site_services(tutor_site_id)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN tutor_site_services.deleted_at IS 'Soft delete timestamp. NULL = active.';

-- tutor_site_reviews
ALTER TABLE tutor_site_reviews
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_tutor_site_reviews_active
  ON tutor_site_reviews(tutor_site_id)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN tutor_site_reviews.deleted_at IS 'Soft delete timestamp. NULL = active.';

-- tutor_site_products
ALTER TABLE tutor_site_products
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_tutor_site_products_active
  ON tutor_site_products(tutor_site_id)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN tutor_site_products.deleted_at IS 'Soft delete timestamp. NULL = active.';
