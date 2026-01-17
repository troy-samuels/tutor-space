-- Add stripe_product_id column to session_package_templates
-- This allows us to reuse the same Stripe product when updating prices,
-- instead of creating a new product every time.

ALTER TABLE session_package_templates
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

COMMENT ON COLUMN session_package_templates.stripe_product_id IS
  'Stripe product ID on tutor connected account. Used to reuse products when updating prices.';
