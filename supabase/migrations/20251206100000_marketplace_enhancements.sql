-- Marketplace Enhancements Migration
-- Adds commission tracking and product categorization for digital products

-- ============================================
-- 1. Enhance digital_products table
-- ============================================

-- Add category for product organization
ALTER TABLE digital_products
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'worksheet';

-- Add language for language-specific products
ALTER TABLE digital_products
  ADD COLUMN IF NOT EXISTS language TEXT;

-- Add level for student proficiency targeting
ALTER TABLE digital_products
  ADD COLUMN IF NOT EXISTS level TEXT;

-- Add constraint for level values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'digital_products_level_check'
  ) THEN
    ALTER TABLE digital_products
      ADD CONSTRAINT digital_products_level_check
      CHECK (level IS NULL OR level IN ('beginner', 'intermediate', 'advanced', 'all'));
  END IF;
END $$;

-- Add sales tracking columns
ALTER TABLE digital_products
  ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_revenue_cents INTEGER DEFAULT 0;

-- ============================================
-- 2. Create marketplace_transactions table
-- ============================================

CREATE TABLE IF NOT EXISTS marketplace_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES digital_product_purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Financial tracking
  gross_amount_cents INTEGER NOT NULL,
  platform_commission_cents INTEGER NOT NULL,
  net_amount_cents INTEGER NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.15,

  -- Stripe tracking (for future payout implementation)
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,

  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for tutor lookup (commission tier calculation)
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_tutor
  ON marketplace_transactions(tutor_id);

-- Index for product lookup
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_product
  ON marketplace_transactions(product_id);

-- ============================================
-- 3. Function to increment product sales
-- ============================================

CREATE OR REPLACE FUNCTION increment_product_sales(
  p_product_id UUID,
  p_amount INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE digital_products
  SET
    total_sales = COALESCE(total_sales, 0) + 1,
    total_revenue_cents = COALESCE(total_revenue_cents, 0) + p_amount,
    updated_at = NOW()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Function to get tutor's commission rate
-- ============================================

CREATE OR REPLACE FUNCTION get_tutor_commission_rate(p_tutor_id UUID)
RETURNS DECIMAL(5,4) AS $$
DECLARE
  lifetime_sales INTEGER;
BEGIN
  -- Get total lifetime sales for this tutor
  SELECT COALESCE(SUM(gross_amount_cents), 0)
  INTO lifetime_sales
  FROM marketplace_transactions
  WHERE tutor_id = p_tutor_id
    AND status = 'completed';

  -- Tiered commission: 15% until $500 (50000 cents), then 10%
  IF lifetime_sales >= 50000 THEN
    RETURN 0.10;
  ELSE
    RETURN 0.15;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Row Level Security
-- ============================================

ALTER TABLE marketplace_transactions ENABLE ROW LEVEL SECURITY;

-- Tutors can view their own transactions
CREATE POLICY "Tutors can view own marketplace transactions"
  ON marketplace_transactions
  FOR SELECT
  USING (tutor_id = auth.uid());

-- Service role can manage all transactions (for webhook processing)
CREATE POLICY "Service role manages marketplace transactions"
  ON marketplace_transactions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 6. Trigger to update updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_marketplace_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS marketplace_transactions_updated_at ON marketplace_transactions;
CREATE TRIGGER marketplace_transactions_updated_at
  BEFORE UPDATE ON marketplace_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_transactions_updated_at();

-- ============================================
-- 7. Comments for documentation
-- ============================================

COMMENT ON TABLE marketplace_transactions IS
  'Tracks all digital product sales with platform commission breakdown. Commission is tiered: 15% until $500 lifetime sales, then 10%.';

COMMENT ON COLUMN marketplace_transactions.commission_rate IS
  'The commission rate applied at time of sale (0.15 = 15%, 0.10 = 10%)';

COMMENT ON COLUMN digital_products.category IS
  'Product category: worksheet, course, template, ebook, audio, other';

COMMENT ON COLUMN digital_products.level IS
  'Target student level: beginner, intermediate, advanced, all';
