-- ============================================================================
-- SUPPORT TICKETS (simple contact to platform support)
-- Tutors and students can submit issues; service role handles responses
-- ============================================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_by_role TEXT NOT NULL DEFAULT 'tutor' CHECK (submitted_by_role IN ('tutor', 'student', 'unknown')),
  subject TEXT NOT NULL CHECK (length(trim(subject)) > 0),
  message TEXT NOT NULL CHECK (length(trim(message)) > 0),
  category TEXT DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  tutor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets (status, created_at DESC);

-- RLS: creator can read, service role manages, checks prevent cross-linking
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own support tickets" ON support_tickets;
CREATE POLICY "Users view own support tickets"
  ON support_tickets FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users create support tickets" ON support_tickets;
CREATE POLICY "Users create support tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      student_id IS NULL
      OR student_id IN (
        SELECT id FROM students WHERE user_id = auth.uid()
      )
    )
    AND (
      tutor_id IS NULL
      OR tutor_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM students
        WHERE user_id = auth.uid()
          AND tutor_id = support_tickets.tutor_id
      )
    )
  );

DROP POLICY IF EXISTS "Service role manages support tickets" ON support_tickets;
CREATE POLICY "Service role manages support tickets"
  ON support_tickets FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Ensure the common updated_at helper exists before creating triggers
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Keep updated_at fresh
DROP TRIGGER IF EXISTS trg_support_tickets_set_updated_at ON support_tickets;
CREATE TRIGGER trg_support_tickets_set_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();
