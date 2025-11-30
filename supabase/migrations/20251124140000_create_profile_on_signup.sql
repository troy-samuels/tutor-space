-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Ensure offer_type exists before referencing it in default services
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS offer_type TEXT DEFAULT 'one_off';

-- Ensure max_students_per_session exists for default service inserts
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS max_students_per_session INTEGER DEFAULT 1;

-- Create function to handle new user signup
-- This automatically creates a profile and default services when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  first_name TEXT;
  full_name_val TEXT;
BEGIN
  -- Get full name and extract first name
  full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  first_name := SPLIT_PART(full_name_val, ' ', 1);

  -- If no first name, use 'Tutor' as fallback
  IF first_name = '' THEN
    first_name := 'Tutor';
  END IF;

  -- Create the profile
  INSERT INTO public.profiles (id, email, full_name, username, role, plan)
  VALUES (
    NEW.id,
    NEW.email,
    full_name_val,
    NEW.raw_user_meta_data->>'username',
    COALESCE(NEW.raw_user_meta_data->>'role', 'tutor'),
    COALESCE(NEW.raw_user_meta_data->>'plan', 'founder_lifetime')
  );

  -- Create default services for the tutor
  -- Service 1: Trial Lesson - 25 min - $15
  INSERT INTO public.services (tutor_id, name, description, duration_minutes, price, currency, is_active, requires_approval, offer_type, max_students_per_session)
  VALUES (
    NEW.id,
    'Language Trial Lesson with ' || first_name,
    NULL,
    25,
    1500,
    'usd',
    true,
    false,
    'trial',
    1
  );

  -- Service 2: Standard Lesson - 25 min - $10
  INSERT INTO public.services (tutor_id, name, description, duration_minutes, price, currency, is_active, requires_approval, offer_type, max_students_per_session)
  VALUES (
    NEW.id,
    'Language Lesson with ' || first_name,
    NULL,
    25,
    1000,
    'usd',
    true,
    false,
    'one_off',
    1
  );

  -- Service 3: Extended Lesson - 55 min - $20
  INSERT INTO public.services (tutor_id, name, description, duration_minutes, price, currency, is_active, requires_approval, offer_type, max_students_per_session)
  VALUES (
    NEW.id,
    'Language Lesson with ' || first_name,
    NULL,
    55,
    2000,
    'usd',
    true,
    false,
    'one_off',
    1
  );

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to run after new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create profiles for any existing users who don't have one
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', '')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
