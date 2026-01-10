-- =============================================================================
-- ADD TUTOR RECORDING CONSENT FIELDS
-- Created: 2026-03-09
--
-- Adds tutor recording consent fields and persists consent on signup.
-- =============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tutor_recording_consent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tutor_recording_consent_at TIMESTAMPTZ;

-- Update signup trigger to capture consent metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  first_name TEXT;
  full_name_val TEXT;
  v_standard_service_id UUID;
BEGIN
  full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  first_name := SPLIT_PART(full_name_val, ' ', 1);

  IF first_name = '' THEN
    first_name := 'Tutor';
  END IF;

  -- Create profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    username,
    role,
    plan,
    terms_accepted_at,
    tutor_recording_consent,
    tutor_recording_consent_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    full_name_val,
    NEW.raw_user_meta_data->>'username',
    COALESCE(NEW.raw_user_meta_data->>'role', 'tutor'),
    COALESCE(NEW.raw_user_meta_data->>'plan', 'founder_lifetime'),
    NULLIF(NEW.raw_user_meta_data->>'terms_accepted_at', '')::timestamptz,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'tutor_recording_consent', '')::boolean, false),
    NULLIF(NEW.raw_user_meta_data->>'tutor_recording_consent_at', '')::timestamptz
  );

  -- Service 1: Trial Lesson - 30 min, $0 (blank for tutor to set)
  INSERT INTO public.services (
    tutor_id,
    name,
    description,
    duration_minutes,
    price,
    currency,
    price_amount,
    price_currency,
    is_active,
    requires_approval,
    offer_type,
    max_students_per_session
  ) VALUES (
    NEW.id,
    'Trial Lesson with ' || first_name,
    'A short introductory session to see if we are a good fit.',
    30,
    0,
    'USD',
    0,
    'USD',
    true,
    false,
    'trial',
    1
  );

  -- Service 2: Standard Lesson - 55 min, $0 (blank for tutor to set)
  INSERT INTO public.services (
    tutor_id,
    name,
    description,
    duration_minutes,
    price,
    currency,
    price_amount,
    price_currency,
    is_active,
    requires_approval,
    offer_type,
    max_students_per_session
  ) VALUES (
    NEW.id,
    'Standard Lesson with ' || first_name,
    'A full-length lesson focused on your learning goals.',
    55,
    0,
    'USD',
    0,
    'USD',
    true,
    false,
    'one_off',
    1
  )
  RETURNING id INTO v_standard_service_id;

  -- Session Package: 10 Lessons attached to the standard lesson
  INSERT INTO public.session_package_templates (
    tutor_id,
    service_id,
    name,
    description,
    session_count,
    total_minutes,
    price_cents,
    currency,
    is_active
  ) VALUES (
    NEW.id,
    v_standard_service_id,
    '10 Lesson Package',
    'Save when you commit to 10 lessons upfront.',
    10,
    550,
    0,
    'USD',
    true
  );

  RETURN NEW;
END;
$$;

-- =============================================================================
-- COMPLETE
-- =============================================================================
