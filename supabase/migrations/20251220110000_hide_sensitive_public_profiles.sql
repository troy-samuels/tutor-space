-- Migration: Remove email and payment link from public_profiles exposure
-- SECURITY: Prevents public disclosure of tutor email and Stripe payment link

-- Drop dependent objects before recreation
DROP VIEW IF EXISTS public_profiles;
DROP FUNCTION IF EXISTS get_public_profiles();

-- Recreate SECURITY DEFINER function without sensitive columns
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
  website_url TEXT,
  instagram_handle TEXT,
  tiktok_handle TEXT,
  facebook_handle TEXT,
  x_handle TEXT,
  average_rating NUMERIC,
  testimonial_count INTEGER,
  total_students INTEGER,
  total_lessons INTEGER
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
    p.website_url,
    p.instagram_handle,
    p.tiktok_handle,
    p.facebook_handle,
    p.x_handle,
    p.average_rating,
    p.testimonial_count,
    p.total_students,
    p.total_lessons
  FROM profiles p
  WHERE p.role = 'tutor';
$$;

-- Grant access to public consumption
GRANT EXECUTE ON FUNCTION get_public_profiles() TO anon, authenticated;

-- View wrapper
CREATE VIEW public_profiles AS SELECT * FROM get_public_profiles();
GRANT SELECT ON public_profiles TO anon, authenticated;

COMMENT ON FUNCTION get_public_profiles() IS
  'Returns public-safe tutor profile data without email or payment links.';

COMMENT ON VIEW public_profiles IS
  'Public tutor profiles with only non-sensitive columns; use instead of querying profiles directly.';
