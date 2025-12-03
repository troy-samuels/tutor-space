-- Migration: Expand student status values to support Growth plan labels
-- Date: 2025-11-13
-- Purpose: Allow tutors to set students to "trial" or "alumni" without violating the CHECK constraint.

ALTER TABLE students
  DROP CONSTRAINT IF EXISTS students_status_check;

ALTER TABLE students
  ADD CONSTRAINT students_status_check
  CHECK (status IN ('active', 'trial', 'paused', 'alumni', 'inactive'));


