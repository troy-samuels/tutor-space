-- Enable Row Level Security and add policies for tutor site tables

-- Enable RLS
ALTER TABLE IF EXISTS tutor_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tutor_site_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tutor_site_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tutor_site_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tutor_site_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running (safe-guard)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tutor_sites' AND policyname = 'tutor_sites_select_own') THEN
    DROP POLICY "tutor_sites_select_own" ON tutor_sites;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tutor_sites' AND policyname = 'tutor_sites_modify_own') THEN
    DROP POLICY "tutor_sites_modify_own" ON tutor_sites;
  END IF;
END $$;

-- Own rows on tutor_sites
CREATE POLICY "tutor_sites_select_own"
ON tutor_sites FOR SELECT
USING (tutor_id = auth.uid());

CREATE POLICY "tutor_sites_modify_own"
ON tutor_sites FOR ALL
USING (tutor_id = auth.uid())
WITH CHECK (tutor_id = auth.uid());

-- Child tables: allow when parent tutor_site belongs to user
-- Helper: common USING and CHECK subquery

CREATE POLICY "tutor_site_services_own"
ON tutor_site_services FOR ALL
USING (tutor_site_id IN (SELECT id FROM tutor_sites WHERE tutor_id = auth.uid()))
WITH CHECK (tutor_site_id IN (SELECT id FROM tutor_sites WHERE tutor_id = auth.uid()));

CREATE POLICY "tutor_site_reviews_own"
ON tutor_site_reviews FOR ALL
USING (tutor_site_id IN (SELECT id FROM tutor_sites WHERE tutor_id = auth.uid()))
WITH CHECK (tutor_site_id IN (SELECT id FROM tutor_sites WHERE tutor_id = auth.uid()));

CREATE POLICY "tutor_site_resources_own"
ON tutor_site_resources FOR ALL
USING (tutor_site_id IN (SELECT id FROM tutor_sites WHERE tutor_id = auth.uid()))
WITH CHECK (tutor_site_id IN (SELECT id FROM tutor_sites WHERE tutor_id = auth.uid()));

CREATE POLICY "tutor_site_products_own"
ON tutor_site_products FOR ALL
USING (tutor_site_id IN (SELECT id FROM tutor_sites WHERE tutor_id = auth.uid()))
WITH CHECK (tutor_site_id IN (SELECT id FROM tutor_sites WHERE tutor_id = auth.uid()));



