-- Guard: make sure session_package_purchases has the package_id column
-- Older environments may have been created without this FK, which breaks
-- the RLS policies that reference package_id.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'session_package_purchases'
      AND column_name = 'package_id'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE session_package_purchases
      ADD COLUMN package_id UUID REFERENCES session_package_templates(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Helpful index for joins/filtering by package
CREATE INDEX IF NOT EXISTS idx_session_package_purchases_package
  ON session_package_purchases(package_id);
