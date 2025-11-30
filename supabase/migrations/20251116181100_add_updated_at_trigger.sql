-- Ensure updated_at is refreshed on every row update for tutor_sites

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tutor_sites_set_updated_at ON tutor_sites;
CREATE TRIGGER trg_tutor_sites_set_updated_at
BEFORE UPDATE ON tutor_sites
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();



