-- Schema alignment: booking RPC, calendar token expiry, and package relationships
-- Fixes: ambiguous id in create_booking_atomic, missing calendar_connections.token_expires_at, and FK ambiguity for session packages

-- 1) Booking atomic helper with qualified RETURNING columns to avoid ambiguous id references
CREATE OR REPLACE FUNCTION booking_time_range(scheduled_at timestamptz, duration_minutes integer)
RETURNS tstzrange LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT tstzrange(scheduled_at, scheduled_at + (duration_minutes || ' minutes')::interval, '[)');
$$;

DROP FUNCTION IF EXISTS create_booking_atomic(
  uuid, uuid, uuid, timestamptz, integer, text, text, text, integer, text, text
);

CREATE OR REPLACE FUNCTION create_booking_atomic(
  p_tutor_id uuid,
  p_student_id uuid,
  p_service_id uuid,
  p_scheduled_at timestamptz,
  p_duration_minutes integer,
  p_timezone text,
  p_status text,
  p_payment_status text,
  p_payment_amount integer,
  p_currency text,
  p_student_notes text
)
RETURNS TABLE (id uuid, created_at timestamptz) AS $$
DECLARE
  v_start timestamptz := p_scheduled_at;
  v_end timestamptz := p_scheduled_at + (p_duration_minutes || ' minutes')::interval;
BEGIN
  -- Serialize booking creation per tutor to avoid race conditions
  IF NOT pg_try_advisory_xact_lock(hashtext(p_tutor_id::text)) THEN
    RAISE EXCEPTION USING errcode = '55P03', message = 'Could not acquire booking lock for tutor';
  END IF;

  -- Reject if overlapping active booking already exists
  PERFORM 1
  FROM public.bookings b
  WHERE b.tutor_id = p_tutor_id
    AND b.status IN ('pending', 'confirmed')
    AND booking_time_range(b.scheduled_at, b.duration_minutes) &&
        booking_time_range(p_scheduled_at, p_duration_minutes)
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION USING errcode = 'P0001', message = 'Time slot conflict for tutor';
  END IF;

  -- Reject if blocked time overlaps
  PERFORM 1
  FROM public.blocked_times bt
  WHERE bt.tutor_id = p_tutor_id
    AND bt.start_time < v_end
    AND bt.end_time > v_start
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION USING errcode = 'P0002', message = 'Time slot is blocked for tutor';
  END IF;

  RETURN QUERY
  INSERT INTO public.bookings (
    tutor_id,
    student_id,
    service_id,
    scheduled_at,
    duration_minutes,
    timezone,
    status,
    payment_status,
    payment_amount,
    currency,
    student_notes
  )
  VALUES (
    p_tutor_id,
    p_student_id,
    p_service_id,
    p_scheduled_at,
    p_duration_minutes,
    p_timezone,
    p_status,
    p_payment_status,
    p_payment_amount,
    p_currency,
    p_student_notes
  )
  RETURNING bookings.id AS id, bookings.created_at AS created_at;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

REVOKE ALL ON FUNCTION create_booking_atomic(uuid, uuid, uuid, timestamptz, integer, text, text, text, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_booking_atomic(uuid, uuid, uuid, timestamptz, integer, text, text, text, integer, text, text) TO service_role;

-- 2) Calendar token expiry column compatibility
ALTER TABLE public.calendar_connections
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

-- Backfill legacy column from the new name if it was missing
UPDATE public.calendar_connections
SET token_expires_at = COALESCE(token_expires_at, access_token_expires_at)
WHERE token_expires_at IS NULL AND access_token_expires_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_calendar_token_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.token_expires_at IS NULL AND NEW.access_token_expires_at IS NOT NULL THEN
    NEW.token_expires_at := NEW.access_token_expires_at;
  ELSIF NEW.access_token_expires_at IS NULL AND NEW.token_expires_at IS NOT NULL THEN
    NEW.access_token_expires_at := NEW.token_expires_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calendar_connections_sync_expiry ON public.calendar_connections;
CREATE TRIGGER trg_calendar_connections_sync_expiry
  BEFORE INSERT OR UPDATE ON public.calendar_connections
  FOR EACH ROW EXECUTE FUNCTION public.sync_calendar_token_expiry();

-- 3) Normalize session package purchase relationship to templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'session_package_purchases'
      AND column_name = 'package_id'
  ) THEN
    ALTER TABLE public.session_package_purchases
      ADD COLUMN package_id UUID REFERENCES public.session_package_templates(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
DECLARE
  fk record;
BEGIN
  FOR fk IN
    SELECT conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_class r ON c.confrelid = r.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'session_package_purchases'
      AND r.relname = 'session_package_templates'
      AND c.contype = 'f'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.session_package_purchases DROP CONSTRAINT IF EXISTS %I',
      fk.conname
    );
  END LOOP;
END $$;

ALTER TABLE public.session_package_purchases
  ADD CONSTRAINT session_package_purchases_package_id_fkey
    FOREIGN KEY (package_id) REFERENCES public.session_package_templates(id) ON DELETE CASCADE;

ALTER TABLE public.session_package_purchases
  ALTER COLUMN package_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_session_package_purchases_package
  ON public.session_package_purchases(package_id);
