-- Migration: Update RLS Policies with WITH CHECK Clauses
-- Date: 2025-11-06
-- Purpose: Add matching WITH CHECK predicates to all write-enabled RLS policies
--          to ensure tutors can only insert/update rows tied to their own IDs
--          and service-role rules stay properly scoped.
--
-- Security Improvement: This prevents privilege escalation where a user could
-- potentially insert/update data with another user's tutor_id.

-- ============================================================================
-- CORE TABLES: Profiles, Services, Students, Bookings, Lesson Notes
-- ============================================================================

-- Profiles: Users can update only their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Services: Tutors manage their own services
DROP POLICY IF EXISTS "Tutors can manage own services" ON services;
CREATE POLICY "Tutors can manage own services"
  ON services FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Students: Tutors manage their students
DROP POLICY IF EXISTS "Tutors can manage their students" ON students;
CREATE POLICY "Tutors can manage their students"
  ON students FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Bookings: Tutors manage their bookings
DROP POLICY IF EXISTS "Tutors can manage their bookings" ON bookings;
CREATE POLICY "Tutors can manage their bookings"
  ON bookings FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

DROP POLICY IF EXISTS "Students can create bookings" ON bookings;
CREATE POLICY "Students can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Lesson Notes: Tutor-only access
DROP POLICY IF EXISTS "Tutors can manage their lesson notes" ON lesson_notes;
CREATE POLICY "Tutors can manage their lesson notes"
  ON lesson_notes FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Availability: Tutors manage their availability
DROP POLICY IF EXISTS "Tutors can manage their availability" ON availability;
CREATE POLICY "Tutors can manage their availability"
  ON availability FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Calendar Connections: Tutors manage their OAuth tokens
DROP POLICY IF EXISTS "Tutors manage their calendar connections" ON calendar_connections;
CREATE POLICY "Tutors manage their calendar connections"
  ON calendar_connections FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Links: Tutors manage their links
DROP POLICY IF EXISTS "Tutors can manage their links" ON links;
CREATE POLICY "Tutors can manage their links"
  ON links FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- ============================================================================
-- SUBSCRIPTIONS & MONETIZATION
-- ============================================================================

-- Subscriptions: Service role can manage subscriptions
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON subscriptions;
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- SESSION PACKAGES
-- ============================================================================

-- Package Templates
DROP POLICY IF EXISTS "Tutors manage their package templates" ON session_package_templates;
CREATE POLICY "Tutors manage their package templates"
  ON session_package_templates FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Package Purchases
DROP POLICY IF EXISTS "Tutors manage package purchases" ON session_package_purchases;
CREATE POLICY "Tutors manage package purchases"
  ON session_package_purchases FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Package Redemptions
DROP POLICY IF EXISTS "Tutors manage package redemptions" ON session_package_redemptions;
CREATE POLICY "Tutors manage package redemptions"
  ON session_package_redemptions FOR ALL
  USING (
    purchase_id IN (
      SELECT id FROM session_package_purchases
      WHERE tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    purchase_id IN (
      SELECT id FROM session_package_purchases
      WHERE tutor_id = auth.uid()
    )
  );

-- ============================================================================
-- INVOICING & PAYMENT REMINDERS
-- ============================================================================

-- Invoices
DROP POLICY IF EXISTS "Tutors manage their invoices" ON invoices;
CREATE POLICY "Tutors manage their invoices"
  ON invoices FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Invoice Line Items
DROP POLICY IF EXISTS "Tutors manage invoice line items" ON invoice_line_items;
CREATE POLICY "Tutors manage invoice line items"
  ON invoice_line_items FOR ALL
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE tutor_id = auth.uid()
    )
  );

-- Payment Reminders
DROP POLICY IF EXISTS "Tutors manage payment reminders" ON payment_reminders;
CREATE POLICY "Tutors manage payment reminders"
  ON payment_reminders FOR ALL
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE tutor_id = auth.uid()
    )
  );

-- ============================================================================
-- REVIEWS & SOCIAL PROOF
-- ============================================================================

-- Review Requests
DROP POLICY IF EXISTS "Tutors manage review requests" ON review_requests;
CREATE POLICY "Tutors manage review requests"
  ON review_requests FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Reviews
DROP POLICY IF EXISTS "Tutors manage their reviews" ON reviews;
CREATE POLICY "Tutors manage their reviews"
  ON reviews FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- ============================================================================
-- RESOURCE LIBRARY & LESSON PLANS
-- ============================================================================

-- Resources
DROP POLICY IF EXISTS "Tutors manage their resources" ON resources;
CREATE POLICY "Tutors manage their resources"
  ON resources FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Resource Tags
DROP POLICY IF EXISTS "Tutors manage resource tags" ON resource_tags;
CREATE POLICY "Tutors manage resource tags"
  ON resource_tags FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Resource Tag Map
DROP POLICY IF EXISTS "Tutors manage resource tag relations" ON resource_tag_map;
CREATE POLICY "Tutors manage resource tag relations"
  ON resource_tag_map FOR ALL
  USING (
    resource_id IN (
      SELECT id FROM resources WHERE tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    resource_id IN (
      SELECT id FROM resources WHERE tutor_id = auth.uid()
    )
  );

-- Lesson Plans
DROP POLICY IF EXISTS "Tutors manage lesson plans" ON lesson_plans;
CREATE POLICY "Tutors manage lesson plans"
  ON lesson_plans FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Lesson Plan Resources
DROP POLICY IF EXISTS "Tutors manage lesson plan resources" ON lesson_plan_resources;
CREATE POLICY "Tutors manage lesson plan resources"
  ON lesson_plan_resources FOR ALL
  USING (
    lesson_plan_id IN (
      SELECT id FROM lesson_plans WHERE tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    lesson_plan_id IN (
      SELECT id FROM lesson_plans WHERE tutor_id = auth.uid()
    )
  );

-- Interactive Activities
DROP POLICY IF EXISTS "Tutors manage interactive activities" ON interactive_activities;
CREATE POLICY "Tutors manage interactive activities"
  ON interactive_activities FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- ============================================================================
-- LEADS & GROWTH FEATURES
-- ============================================================================

-- Lead Sources
DROP POLICY IF EXISTS "Tutors manage their lead sources" ON lead_sources;
CREATE POLICY "Tutors manage their lead sources"
  ON lead_sources FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Leads
DROP POLICY IF EXISTS "Tutors manage their leads" ON leads;
CREATE POLICY "Tutors manage their leads"
  ON leads FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Lead Events
DROP POLICY IF EXISTS "Tutors manage lead events" ON lead_events;
CREATE POLICY "Tutors manage lead events"
  ON lead_events FOR ALL
  USING (
    lead_id IN (
      SELECT id FROM leads WHERE tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    lead_id IN (
      SELECT id FROM leads WHERE tutor_id = auth.uid()
    )
  );

-- ============================================================================
-- ADS MANAGEMENT
-- ============================================================================

-- Ad Accounts
DROP POLICY IF EXISTS "Tutors manage ad accounts" ON ad_accounts;
CREATE POLICY "Tutors manage ad accounts"
  ON ad_accounts FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Ad Campaigns
DROP POLICY IF EXISTS "Tutors manage ad campaigns" ON ad_campaigns;
CREATE POLICY "Tutors manage ad campaigns"
  ON ad_campaigns FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Ad Creatives
DROP POLICY IF EXISTS "Tutors manage ad creatives" ON ad_creatives;
CREATE POLICY "Tutors manage ad creatives"
  ON ad_creatives FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- ============================================================================
-- AI TEACHING ASSISTANT
-- ============================================================================

-- AI Transcripts
DROP POLICY IF EXISTS "Tutors manage AI transcripts" ON ai_transcripts;
CREATE POLICY "Tutors manage AI transcripts"
  ON ai_transcripts FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Transcript Segments
DROP POLICY IF EXISTS "Tutors manage transcript segments" ON ai_transcript_segments;
CREATE POLICY "Tutors manage transcript segments"
  ON ai_transcript_segments FOR ALL
  USING (
    transcript_id IN (
      SELECT id FROM ai_transcripts WHERE tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    transcript_id IN (
      SELECT id FROM ai_transcripts WHERE tutor_id = auth.uid()
    )
  );

-- Detected Errors
DROP POLICY IF EXISTS "Tutors manage detected errors" ON ai_detected_errors;
CREATE POLICY "Tutors manage detected errors"
  ON ai_detected_errors FOR ALL
  USING (
    transcript_id IN (
      SELECT id FROM ai_transcripts WHERE tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    transcript_id IN (
      SELECT id FROM ai_transcripts WHERE tutor_id = auth.uid()
    )
  );

-- AI Content Clips
DROP POLICY IF EXISTS "Tutors manage AI content clips" ON ai_content_clips;
CREATE POLICY "Tutors manage AI content clips"
  ON ai_content_clips FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- ============================================================================
-- GROUP SESSIONS
-- ============================================================================

-- Group Sessions
DROP POLICY IF EXISTS "Tutors manage group sessions" ON group_sessions;
CREATE POLICY "Tutors manage group sessions"
  ON group_sessions FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Group Session Attendees
DROP POLICY IF EXISTS "Tutors manage group attendees" ON group_session_attendees;
CREATE POLICY "Tutors manage group attendees"
  ON group_session_attendees FOR ALL
  USING (
    group_session_id IN (
      SELECT id FROM group_sessions WHERE tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    group_session_id IN (
      SELECT id FROM group_sessions WHERE tutor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can register for group sessions" ON group_session_attendees;
CREATE POLICY "Students can register for group sessions"
  ON group_session_attendees FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- MARKETPLACE
-- ============================================================================

-- Marketplace Resources
DROP POLICY IF EXISTS "Tutors manage their marketplace resources" ON marketplace_resources;
CREATE POLICY "Tutors manage their marketplace resources"
  ON marketplace_resources FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Marketplace Orders
DROP POLICY IF EXISTS "Tutors manage orders for their resources" ON marketplace_orders;
CREATE POLICY "Tutors manage orders for their resources"
  ON marketplace_orders FOR ALL
  USING (
    marketplace_resource_id IN (
      SELECT id FROM marketplace_resources WHERE tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    marketplace_resource_id IN (
      SELECT id FROM marketplace_resources WHERE tutor_id = auth.uid()
    )
  );

-- ============================================================================
-- EXECUTIVE DASHBOARD
-- ============================================================================

-- Executive Snapshots
DROP POLICY IF EXISTS "Tutors manage their executive snapshots" ON executive_snapshots;
CREATE POLICY "Tutors manage their executive snapshots"
  ON executive_snapshots FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
-- This migration adds WITH CHECK clauses to all write-enabled RLS policies,
-- ensuring that users can only insert/update data they own. This prevents
-- privilege escalation attacks where a user might try to create records
-- with another user's tutor_id.
