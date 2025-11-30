-- Add pinned review support to tutor_sites
-- This allows tutors to feature one review prominently on their home page

ALTER TABLE tutor_sites
ADD COLUMN IF NOT EXISTS pinned_review_id UUID
REFERENCES tutor_site_reviews(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tutor_sites_pinned_review
ON tutor_sites(pinned_review_id);

COMMENT ON COLUMN tutor_sites.pinned_review_id
IS 'ID of review to feature prominently on home page';
