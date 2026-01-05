-- Migration: Create immutable audit_logs table
-- Purpose: Track tutor/admin actions on business entities (bookings, students, billing)
-- Security: Immutable RLS - rows can be inserted but never updated or deleted

-- ============================================================================
-- 1. CREATE AUDIT_LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL,                  -- tutor or admin who performed the action
  target_id UUID,                          -- the affected entity (student, booking, etc.)
  entity_type TEXT NOT NULL CHECK (entity_type IN ('booking', 'student', 'billing')),
  action_type TEXT NOT NULL CHECK (action_type IN ('update_status', 'manual_payment', 'delete', 'create', 'update')),
  metadata JSONB DEFAULT '{}',             -- action-specific details
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for business entity changes. Rows cannot be updated or deleted.';
COMMENT ON COLUMN audit_logs.actor_id IS 'UUID of the tutor or admin who performed the action';
COMMENT ON COLUMN audit_logs.target_id IS 'UUID of the affected entity (booking, student, etc.)';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity being audited: booking, student, or billing';
COMMENT ON COLUMN audit_logs.action_type IS 'Type of action performed: create, update, update_status, manual_payment, delete';
COMMENT ON COLUMN audit_logs.metadata IS 'Action-specific details (e.g., previous/new values, amount, method)';

-- ============================================================================
-- 2. INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================================

CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_id);
CREATE INDEX idx_audit_logs_target ON audit_logs (target_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs (entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- Composite index for entity queries (most common pattern)
CREATE INDEX idx_audit_logs_entity_target ON audit_logs (entity_type, target_id);

-- ============================================================================
-- 3. ENABLE RLS WITH IMMUTABLE POLICIES
-- ============================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- IMMUTABLE RULE: Insert-only, no updates or deletes
-- By omitting UPDATE and DELETE policies, rows become permanently immutable

-- Tutors can insert audit logs for their own actions
CREATE POLICY "Tutors insert own audit_logs"
  ON audit_logs FOR INSERT
  WITH CHECK (actor_id = auth.uid());

-- Tutors can read their own audit logs
CREATE POLICY "Tutors read own audit_logs"
  ON audit_logs FOR SELECT
  USING (actor_id = auth.uid());

-- Service role can insert (for server-side operations)
CREATE POLICY "Service role inserts audit_logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Service role can read all audit logs
CREATE POLICY "Service role reads audit_logs"
  ON audit_logs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

-- NO UPDATE or DELETE policies = rows are immutable
