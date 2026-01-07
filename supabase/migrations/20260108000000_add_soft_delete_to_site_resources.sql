-- Add soft delete column to tutor_site_resources
-- This enables non-destructive deletion of site resources (links, pages, etc.)

-- Add deleted_at column
ALTER TABLE tutor_site_resources ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create partial index for efficient queries on non-deleted resources
CREATE INDEX IF NOT EXISTS idx_tutor_site_resources_deleted
  ON tutor_site_resources(tutor_site_id)
  WHERE deleted_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN tutor_site_resources.deleted_at IS 'Soft delete timestamp. NULL = active, non-NULL = deleted at that time.';
