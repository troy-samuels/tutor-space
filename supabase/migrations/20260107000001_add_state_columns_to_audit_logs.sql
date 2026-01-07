-- Add state tracking columns to audit_logs for compliance
-- Captures before/after state for audit trail (especially create/update actions)

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS before_state JSONB DEFAULT NULL;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS after_state JSONB DEFAULT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN audit_logs.before_state IS 'State of the entity before the action (null for create actions)';
COMMENT ON COLUMN audit_logs.after_state IS 'State of the entity after the action (null for delete actions)';
