-- Create lifetime_purchases table to track pre-signup lifetime deal purchases
CREATE TABLE IF NOT EXISTS lifetime_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  stripe_session_id TEXT NOT NULL,
  stripe_customer_id TEXT,
  amount_paid INTEGER,
  currency TEXT,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_by UUID REFERENCES profiles(id),
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for email lookups during signup
CREATE INDEX IF NOT EXISTS idx_lifetime_purchases_email ON lifetime_purchases(email);
CREATE INDEX IF NOT EXISTS idx_lifetime_purchases_unclaimed ON lifetime_purchases(email) WHERE claimed = false;

-- Enable RLS
ALTER TABLE lifetime_purchases ENABLE ROW LEVEL SECURITY;

-- Service role can manage all purchases
CREATE POLICY "Service role manages lifetime purchases"
  ON lifetime_purchases FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE lifetime_purchases IS 'Tracks lifetime deal purchases made before account creation. Linked to profiles when users sign up with matching email.';
