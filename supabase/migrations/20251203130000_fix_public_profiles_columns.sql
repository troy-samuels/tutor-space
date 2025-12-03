-- Migration: Fix public_profiles view to include all columns needed by public pages
-- Problem: The public_profiles view was created but:
--   1. Missing many columns needed by public pages
--   2. Application code still queries 'profiles' table directly
--
-- This migration:
--   1. Drops and recreates the SECURITY DEFINER function with all needed columns
--   2. Recreates the view
--
-- After this migration, update application code to query 'public_profiles' instead of 'profiles'

-- Drop existing view and function (order matters: view depends on function)
DROP VIEW IF EXISTS public_profiles;
DROP FUNCTION IF EXISTS get_public_profiles();

-- Create updated SECURITY DEFINER function with all public-safe columns
-- This function runs as the definer (superuser), bypassing RLS
-- Only exposes safe columns - no stripe_account_id, stripe_customer_id, payment_methods, etc.
CREATE OR REPLACE FUNCTION get_public_profiles()
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  tagline TEXT,
  timezone TEXT,
  languages_taught TEXT,
  booking_currency TEXT,
  created_at TIMESTAMPTZ,
  role TEXT,
  email TEXT,
  website_url TEXT,
  instagram_handle TEXT,
  tiktok_handle TEXT,
  facebook_handle TEXT,
  x_handle TEXT,
  average_rating NUMERIC,
  testimonial_count INTEGER,
  total_students INTEGER,
  total_lessons INTEGER,
  stripe_payment_link TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.tagline,
    p.timezone,
    p.languages_taught,
    p.booking_currency,
    p.created_at,
    p.role,
    p.email,
    p.website_url,
    p.instagram_handle,
    p.tiktok_handle,
    p.facebook_handle,
    p.x_handle,
    p.average_rating,
    p.testimonial_count,
    p.total_students,
    p.total_lessons,
    p.stripe_payment_link
  FROM profiles p
  WHERE p.role = 'tutor';
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION get_public_profiles() TO anon, authenticated;

-- Create view wrapping the function for query convenience
CREATE VIEW public_profiles AS SELECT * FROM get_public_profiles();

-- Grant SELECT on view to anon and authenticated
GRANT SELECT ON public_profiles TO anon, authenticated;

-- Add documentation comments
COMMENT ON FUNCTION get_public_profiles() IS
  'SECURITY DEFINER function that returns public-safe tutor profile data. Bypasses RLS to expose only safe columns for public pages (booking, profile, bio, products).';

COMMENT ON VIEW public_profiles IS
  'View wrapping get_public_profiles() for query convenience. Only returns tutors with safe columns exposed. Use this instead of querying profiles directly on public pages.';
