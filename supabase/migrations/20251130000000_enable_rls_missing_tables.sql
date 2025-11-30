-- =============================================================================
-- FIX MISSING RLS ON 5 TABLES
-- Created: 2024-11-30
-- Purpose: Enable RLS and add policies for tables that were missed
--
-- Tables fixed:
-- 1. conversation_threads
-- 2. conversation_messages
-- 3. digital_products
-- 4. digital_product_purchases
-- 5. email_campaign_recipients
-- =============================================================================

-- =============================================================================
-- CONVERSATION THREADS
-- =============================================================================

ALTER TABLE conversation_threads ENABLE ROW LEVEL SECURITY;

-- Tutors can manage their own threads
CREATE POLICY conversation_threads_tutor_all ON conversation_threads
  FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Students can view threads they're part of (via student.user_id)
CREATE POLICY conversation_threads_student_read ON conversation_threads
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- CONVERSATION MESSAGES
-- =============================================================================

ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- Tutors can manage messages in their threads
CREATE POLICY conversation_messages_tutor_all ON conversation_messages
  FOR ALL
  USING (
    thread_id IN (
      SELECT id FROM conversation_threads WHERE tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    thread_id IN (
      SELECT id FROM conversation_threads WHERE tutor_id = auth.uid()
    )
  );

-- Students can read and send messages in their threads
CREATE POLICY conversation_messages_student_read ON conversation_messages
  FOR SELECT
  USING (
    thread_id IN (
      SELECT ct.id FROM conversation_threads ct
      JOIN students s ON ct.student_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY conversation_messages_student_insert ON conversation_messages
  FOR INSERT
  WITH CHECK (
    thread_id IN (
      SELECT ct.id FROM conversation_threads ct
      JOIN students s ON ct.student_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

-- =============================================================================
-- DIGITAL PRODUCTS
-- =============================================================================

ALTER TABLE digital_products ENABLE ROW LEVEL SECURITY;

-- Tutors can manage their own products
CREATE POLICY digital_products_tutor_all ON digital_products
  FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Public can view active products (for product catalog pages)
CREATE POLICY digital_products_public_read ON digital_products
  FOR SELECT
  USING (is_active = true);

-- =============================================================================
-- DIGITAL PRODUCT PURCHASES
-- =============================================================================

ALTER TABLE digital_product_purchases ENABLE ROW LEVEL SECURITY;

-- Tutors can view purchases of their products
CREATE POLICY digital_product_purchases_tutor_read ON digital_product_purchases
  FOR SELECT
  USING (tutor_id = auth.uid());

-- Service role handles inserts (via Stripe webhook)
-- No user-facing insert policy needed

-- =============================================================================
-- EMAIL CAMPAIGN RECIPIENTS
-- =============================================================================

-- Check if table exists before enabling RLS
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'email_campaign_recipients'
  ) THEN
    ALTER TABLE email_campaign_recipients ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if any
    DROP POLICY IF EXISTS email_campaign_recipients_tutor_all ON email_campaign_recipients;

    -- Tutors can manage recipients for their campaigns
    EXECUTE '
      CREATE POLICY email_campaign_recipients_tutor_all ON email_campaign_recipients
        FOR ALL
        USING (
          campaign_id IN (
            SELECT id FROM email_campaigns WHERE tutor_id = auth.uid()
          )
        )
        WITH CHECK (
          campaign_id IN (
            SELECT id FROM email_campaigns WHERE tutor_id = auth.uid()
          )
        )
    ';
  END IF;
END $$;

-- =============================================================================
-- INDEXES FOR PERFORMANCE (on new policies)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_conversation_threads_tutor_id ON conversation_threads(tutor_id);
CREATE INDEX IF NOT EXISTS idx_conversation_threads_student_id ON conversation_threads(student_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_thread_id ON conversation_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_digital_products_tutor_id ON digital_products(tutor_id);
CREATE INDEX IF NOT EXISTS idx_digital_products_is_active ON digital_products(is_active);
CREATE INDEX IF NOT EXISTS idx_digital_product_purchases_tutor_id ON digital_product_purchases(tutor_id);

-- =============================================================================
-- COMPLETE
-- =============================================================================
