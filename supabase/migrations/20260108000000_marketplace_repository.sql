-- Migration: Marketplace Repository Infrastructure
-- Adds soft delete support and atomic sale recording

-- ============================================================================
-- 1. Add soft delete column to digital_products
-- ============================================================================

ALTER TABLE digital_products
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create partial index for efficient filtering of active products
CREATE INDEX IF NOT EXISTS idx_digital_products_active
  ON digital_products(tutor_id)
  WHERE deleted_at IS NULL;

-- Create index for public product listings
CREATE INDEX IF NOT EXISTS idx_digital_products_published_active
  ON digital_products(published)
  WHERE deleted_at IS NULL AND published = true;

COMMENT ON COLUMN digital_products.deleted_at IS
  'Soft delete timestamp. NULL = active, non-NULL = deleted.
   Products are soft-deleted to preserve purchase history integrity.';

-- ============================================================================
-- 2. Create atomic sale recording function
-- ============================================================================

CREATE OR REPLACE FUNCTION record_marketplace_sale(
  p_purchase_id UUID,
  p_product_id UUID,
  p_tutor_id UUID,
  p_gross_amount_cents INTEGER,
  p_stripe_payment_intent_id TEXT
)
RETURNS TABLE(
  transaction_id UUID,
  commission_rate DECIMAL(5,4),
  platform_commission_cents INTEGER,
  net_amount_cents INTEGER
) AS $$
DECLARE
  v_lifetime_sales INTEGER;
  v_commission_rate DECIMAL(5,4);
  v_platform_commission INTEGER;
  v_net_amount INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Lock tutor row to prevent concurrent tier calculations
  -- This ensures commission tier is calculated correctly even under concurrent purchases
  PERFORM 1 FROM profiles WHERE id = p_tutor_id FOR UPDATE;

  -- Get lifetime sales for commission tier determination
  SELECT COALESCE(SUM(gross_amount_cents), 0)
  INTO v_lifetime_sales
  FROM marketplace_transactions
  WHERE tutor_id = p_tutor_id AND status = 'completed';

  -- Calculate commission: 15% until $500 (50000 cents), then 10%
  v_commission_rate := CASE WHEN v_lifetime_sales >= 50000 THEN 0.10 ELSE 0.15 END;
  v_platform_commission := ROUND(p_gross_amount_cents * v_commission_rate);
  v_net_amount := p_gross_amount_cents - v_platform_commission;

  -- Insert transaction record
  INSERT INTO marketplace_transactions (
    purchase_id,
    product_id,
    tutor_id,
    gross_amount_cents,
    platform_commission_cents,
    net_amount_cents,
    commission_rate,
    stripe_payment_intent_id,
    status
  ) VALUES (
    p_purchase_id,
    p_product_id,
    p_tutor_id,
    p_gross_amount_cents,
    v_platform_commission,
    v_net_amount,
    v_commission_rate,
    p_stripe_payment_intent_id,
    'completed'
  )
  RETURNING id INTO v_transaction_id;

  -- Update product sales stats atomically
  UPDATE digital_products
  SET
    total_sales = COALESCE(total_sales, 0) + 1,
    total_revenue_cents = COALESCE(total_revenue_cents, 0) + p_gross_amount_cents,
    updated_at = NOW()
  WHERE id = p_product_id;

  RETURN QUERY SELECT
    v_transaction_id,
    v_commission_rate,
    v_platform_commission,
    v_net_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_marketplace_sale IS
  'Atomically records a marketplace sale with commission calculation.

   This function performs three operations in a single atomic transaction:
   1. Calculates commission based on tutor lifetime sales tier
   2. Inserts marketplace_transaction record
   3. Updates product sales statistics

   Uses row-level locking on profiles to prevent race conditions
   in tier calculation when multiple purchases complete simultaneously.

   Commission tiers:
   - 15% commission: $0 - $499.99 lifetime sales
   - 10% commission: $500+ lifetime sales';

-- ============================================================================
-- 3. Create helper function to mark purchase as paid
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_purchase_paid(
  p_purchase_id UUID,
  p_stripe_session_id TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE digital_product_purchases
  SET
    status = 'paid',
    completed_at = NOW(),
    stripe_session_id = p_stripe_session_id
  WHERE id = p_purchase_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_purchase_paid IS
  'Marks a digital product purchase as paid with Stripe session ID.';

-- ============================================================================
-- 4. Create function for validating download tokens
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_download_token(
  p_token TEXT
)
RETURNS TABLE(
  valid BOOLEAN,
  reason TEXT,
  purchase_id UUID,
  product_id UUID,
  download_count INTEGER,
  download_limit INTEGER,
  storage_path TEXT,
  fulfillment_type TEXT,
  external_url TEXT,
  tutor_id UUID
) AS $$
DECLARE
  v_purchase RECORD;
  v_product RECORD;
BEGIN
  -- Lookup purchase by token
  SELECT * INTO v_purchase
  FROM digital_product_purchases
  WHERE download_token = p_token;

  IF v_purchase IS NULL THEN
    RETURN QUERY SELECT
      false::BOOLEAN,
      'not_found'::TEXT,
      NULL::UUID, NULL::UUID, NULL::INTEGER, NULL::INTEGER,
      NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check payment status
  IF v_purchase.status != 'paid' THEN
    RETURN QUERY SELECT
      false::BOOLEAN,
      'not_paid'::TEXT,
      v_purchase.id, v_purchase.product_id,
      v_purchase.download_count, v_purchase.download_limit,
      NULL::TEXT, NULL::TEXT, NULL::TEXT, v_purchase.tutor_id;
    RETURN;
  END IF;

  -- Check download limit
  IF v_purchase.download_count >= v_purchase.download_limit THEN
    RETURN QUERY SELECT
      false::BOOLEAN,
      'limit_reached'::TEXT,
      v_purchase.id, v_purchase.product_id,
      v_purchase.download_count, v_purchase.download_limit,
      NULL::TEXT, NULL::TEXT, NULL::TEXT, v_purchase.tutor_id;
    RETURN;
  END IF;

  -- Lookup product
  SELECT * INTO v_product
  FROM digital_products
  WHERE id = v_purchase.product_id;

  IF v_product IS NULL THEN
    RETURN QUERY SELECT
      false::BOOLEAN,
      'product_missing'::TEXT,
      v_purchase.id, v_purchase.product_id,
      v_purchase.download_count, v_purchase.download_limit,
      NULL::TEXT, NULL::TEXT, NULL::TEXT, v_purchase.tutor_id;
    RETURN;
  END IF;

  -- Valid token
  RETURN QUERY SELECT
    true::BOOLEAN,
    NULL::TEXT,
    v_purchase.id,
    v_purchase.product_id,
    v_purchase.download_count,
    v_purchase.download_limit,
    v_product.storage_path,
    v_product.fulfillment_type,
    v_product.external_url,
    v_product.tutor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_download_token IS
  'Validates a download token and returns structured result.

   Reasons for invalid token:
   - not_found: Token does not exist
   - not_paid: Purchase not yet paid
   - limit_reached: Download limit exceeded
   - product_missing: Product no longer exists';

-- ============================================================================
-- 5. Create function for atomic download count increment
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_download_count(
  p_purchase_id UUID,
  p_current_count INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_rows_affected INTEGER;
BEGIN
  -- Optimistic locking: only update if count matches expected value
  UPDATE digital_product_purchases
  SET download_count = p_current_count + 1
  WHERE id = p_purchase_id
    AND download_count = p_current_count;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  RETURN v_rows_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_download_count IS
  'Atomically increments download count with optimistic locking.
   Returns false if concurrent access detected (count changed).';
