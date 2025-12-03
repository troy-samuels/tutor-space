-- Migration: Fix profiles public access security vulnerability
-- SECURITY FIX: Use SECURITY DEFINER function to bypass RLS while exposing only safe columns
-- Problem: Views don't bypass RLS, so owner-only policy blocks anon access completely

-- 1. Drop existing view and function
DROP VIEW IF EXISTS public_profiles;
DROP FUNCTION IF EXISTS get_public_profiles();

-- 2. Create SECURITY DEFINER function that projects safe columns
-- This function runs as the owner, bypassing RLS
CREATE OR REPLACE FUNCTION get_public_profiles()
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  tagline TEXT,
  timezone TEXT,
  languages TEXT[],
  booking_currency TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, username, full_name, avatar_url, bio, tagline,
         timezone, languages, booking_currency, created_at
  FROM profiles
  WHERE role = 'tutor';
$$;

-- 3. Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION get_public_profiles() TO anon, authenticated;

-- 4. Create view wrapping the function (for query convenience)
CREATE VIEW public_profiles AS SELECT * FROM get_public_profiles();
GRANT SELECT ON public_profiles TO anon, authenticated;

-- 5. Remove ALL overly-permissive SELECT policies
DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- 6. Create owner-only SELECT policy for direct table access
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

COMMENT ON FUNCTION get_public_profiles() IS
  'SECURITY DEFINER function that returns public-safe tutor profile data. Bypasses RLS to expose only safe columns.';

COMMENT ON VIEW public_profiles IS
  'View wrapping get_public_profiles() for query convenience. Only tutors, no sensitive columns.';
