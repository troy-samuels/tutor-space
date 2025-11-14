BEGIN;

CREATE TABLE IF NOT EXISTS digital_products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd' NOT NULL,
  fulfillment_type TEXT DEFAULT 'file' CHECK (fulfillment_type IN ('file', 'link')),
  storage_path TEXT,
  external_url TEXT,
  download_limit INTEGER DEFAULT 3,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tutor_id, slug)
);

CREATE TABLE IF NOT EXISTS digital_product_purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES digital_products(id) ON DELETE CASCADE NOT NULL,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,
  stripe_session_id TEXT,
  download_token UUID DEFAULT uuid_generate_v4(),
  download_count INTEGER DEFAULT 0,
  download_limit INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS digital_products_tutor_idx ON digital_products(tutor_id);
CREATE INDEX IF NOT EXISTS digital_product_purchases_product_idx ON digital_product_purchases(product_id);
CREATE INDEX IF NOT EXISTS digital_product_purchases_token_idx ON digital_product_purchases(download_token);

ALTER TABLE digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_product_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors manage digital products" ON digital_products;
CREATE POLICY "Tutors manage digital products"
  ON digital_products
  FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

DROP POLICY IF EXISTS "Tutors view digital product purchases" ON digital_product_purchases;
CREATE POLICY "Tutors view digital product purchases"
  ON digital_product_purchases
  FOR SELECT
  USING (tutor_id = auth.uid());

DROP POLICY IF EXISTS "Tutors insert digital product purchases" ON digital_product_purchases;
CREATE POLICY "Tutors insert digital product purchases"
  ON digital_product_purchases
  FOR INSERT
  WITH CHECK (tutor_id = auth.uid());

COMMIT;
