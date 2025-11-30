-- Stripe Connect support: profile fields + payments audit log
-- 1) Extend profiles with Stripe Connect metadata
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS stripe_default_currency TEXT,
  ADD COLUMN IF NOT EXISTS stripe_country TEXT,
  ADD COLUMN IF NOT EXISTS stripe_last_capability_check_at TIMESTAMPTZ;

-- 2) Payments audit trail for bookings/products
CREATE TABLE IF NOT EXISTS payments_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  -- Not all deployments include digital_product_purchases; keep nullable without FK
  digital_product_purchase_id UUID,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  application_fee_cents INTEGER,
  net_amount_cents INTEGER,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  destination_account_id TEXT,
  payment_type TEXT NOT NULL DEFAULT 'booking', -- 'booking' | 'digital_product' | future types
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payments_audit_tutor_id_idx ON payments_audit (tutor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payments_audit_booking_id_idx ON payments_audit (booking_id);
CREATE INDEX IF NOT EXISTS payments_audit_purchase_id_idx ON payments_audit (digital_product_purchase_id);
CREATE INDEX IF NOT EXISTS payments_audit_pi_idx ON payments_audit (stripe_payment_intent_id);


