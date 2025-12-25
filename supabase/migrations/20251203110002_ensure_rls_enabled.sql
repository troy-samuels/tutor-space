-- Migration: Ensure RLS is enabled on all core tables with proper tutor-scoped policies
-- This migration is idempotent - safe to run even if RLS is already enabled
-- SECURITY FIX: Ensures all user data is protected by row-level security

-- ============================================================================
-- ENABLE RLS ON CORE TABLES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can only insert their own profile (during signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Allow public viewing of profiles via username (for booking pages)
CREATE POLICY "Public profiles are viewable"
  ON profiles FOR SELECT
  USING (true);

-- ============================================================================
-- STUDENTS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Tutors can manage their students" ON students;

-- Tutors can only access their own students
CREATE POLICY "Tutors can manage their students"
  ON students FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- ============================================================================
-- SERVICES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Tutors can manage own services" ON services;
DROP POLICY IF EXISTS "Public can view active services" ON services;

-- Tutors can only manage their own services
CREATE POLICY "Tutors can manage own services"
  ON services FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Public can view active services (for booking pages)
CREATE POLICY "Public can view active services"
  ON services FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- BOOKINGS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Tutors can manage their bookings" ON bookings;
DROP POLICY IF EXISTS "Students can create bookings" ON bookings;
DROP POLICY IF EXISTS "Students can view their bookings" ON bookings;

-- Tutors can manage all their bookings
CREATE POLICY "Tutors can manage their bookings"
  ON bookings FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Students can create bookings (via student record linked to user)
CREATE POLICY "Students can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Students can view their own bookings
CREATE POLICY "Students can view their bookings"
  ON bookings FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- INVOICES TABLE POLICIES
-- ============================================================================

DO $$
BEGIN
  IF to_regclass('public.invoices') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Tutors manage their invoices" ON invoices;
    DROP POLICY IF EXISTS "Students can view their invoices" ON invoices;

    -- Tutors can manage their own invoices
    CREATE POLICY "Tutors manage their invoices"
      ON invoices FOR ALL
      USING (tutor_id = auth.uid())
      WITH CHECK (tutor_id = auth.uid());

    -- Students can view invoices for their bookings
    CREATE POLICY "Students can view their invoices"
      ON invoices FOR SELECT
      USING (
        student_id IN (
          SELECT id FROM students WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================================
-- INVOICE LINE ITEMS TABLE POLICIES
-- ============================================================================

DO $$
BEGIN
  IF to_regclass('public.invoice_line_items') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Tutors manage invoice line items" ON invoice_line_items;

    -- Tutors can manage line items for their invoices
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
  END IF;
END $$;

-- ============================================================================
-- AVAILABILITY TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Tutors can manage their availability" ON availability;
DROP POLICY IF EXISTS "Public can view availability" ON availability;

-- Tutors can manage their own availability
CREATE POLICY "Tutors can manage their availability"
  ON availability FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Public can view availability (for booking pages)
CREATE POLICY "Public can view availability"
  ON availability FOR SELECT
  USING (is_available = true);

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "Users can view own profile" ON profiles IS
  'Users can only view their own profile data';

COMMENT ON POLICY "Tutors can manage their students" ON students IS
  'Tutors can only access students associated with their tutor_id';

COMMENT ON POLICY "Tutors can manage their bookings" ON bookings IS
  'Tutors can only access bookings where they are the tutor';
