-- ============================================
-- RECAP SYSTEM
-- Stores tutor lesson recaps and generated episodes
-- ============================================

-- Main recaps table
CREATE TABLE IF NOT EXISTS public.recaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id TEXT UNIQUE NOT NULL,
  
  -- Tutor identity (anonymous until they sign up)
  tutor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tutor_fingerprint TEXT NOT NULL,
  tutor_display_name TEXT,
  
  -- Student identity (captured from recap content)
  student_name TEXT,
  student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_email TEXT,
  
  -- Lesson content
  language TEXT NOT NULL,
  level TEXT,
  raw_input TEXT NOT NULL,
  
  -- AI-generated content (stored as JSONB)
  summary JSONB NOT NULL DEFAULT '{}',
  exercises JSONB NOT NULL DEFAULT '[]',
  
  -- Metadata
  scene_template TEXT DEFAULT 'default',
  generation_model TEXT DEFAULT 'gpt-4o-mini',
  generation_time_ms INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student practice attempts
CREATE TABLE IF NOT EXISTS public.recap_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recap_id UUID NOT NULL REFERENCES public.recaps(id) ON DELETE CASCADE,
  
  -- Student identity
  student_fingerprint TEXT,
  student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Results
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  time_spent_seconds INTEGER,
  answers JSONB NOT NULL DEFAULT '[]',
  
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Aggregated student profiles (the CRM)
CREATE TABLE IF NOT EXISTS public.recap_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links to tutor
  tutor_fingerprint TEXT NOT NULL,
  tutor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Student info
  student_name TEXT NOT NULL,
  student_email TEXT,
  student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Learning profile
  language TEXT,
  level TEXT,
  recap_count INTEGER NOT NULL DEFAULT 0,
  total_exercises_completed INTEGER NOT NULL DEFAULT 0,
  average_score NUMERIC(5,2),
  weak_topics TEXT[] DEFAULT '{}',
  strong_topics TEXT[] DEFAULT '{}',
  
  last_recap_at TIMESTAMPTZ,
  last_practice_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique per tutor-student pair
  UNIQUE(tutor_fingerprint, student_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recaps_short_id ON public.recaps(short_id);
CREATE INDEX IF NOT EXISTS idx_recaps_tutor_fp ON public.recaps(tutor_fingerprint);
CREATE INDEX IF NOT EXISTS idx_recaps_tutor_id ON public.recaps(tutor_id) WHERE tutor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recaps_student_name ON public.recaps(student_name);
CREATE INDEX IF NOT EXISTS idx_recaps_created ON public.recaps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recap_attempts_recap ON public.recap_attempts(recap_id);
CREATE INDEX IF NOT EXISTS idx_recap_students_tutor ON public.recap_students(tutor_fingerprint);

-- RLS policies
ALTER TABLE public.recaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recap_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recap_students ENABLE ROW LEVEL SECURITY;

-- Recaps: public read (these are shared via links)
DO $$ BEGIN
  CREATE POLICY "recaps_public_read" ON public.recaps FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "recaps_service_insert" ON public.recaps FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "recaps_service_update" ON public.recaps FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Attempts: public insert + read
DO $$ BEGIN
  CREATE POLICY "attempts_public_insert" ON public.recap_attempts FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "attempts_public_read" ON public.recap_attempts FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Students: full access (service role manages)
DO $$ BEGIN
  CREATE POLICY "students_service_all" ON public.recap_students FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Short ID generation function
CREATE OR REPLACE FUNCTION generate_short_id(len INTEGER DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijkmnpqrstuvwxyz23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..len LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate short_id on insert
CREATE OR REPLACE FUNCTION set_recap_short_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.short_id IS NULL OR NEW.short_id = '' THEN
    NEW.short_id := generate_short_id(8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recap_short_id_trigger ON public.recaps;
CREATE TRIGGER recap_short_id_trigger
  BEFORE INSERT ON public.recaps
  FOR EACH ROW
  EXECUTE FUNCTION set_recap_short_id();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_recap_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recaps_updated_at ON public.recaps;
CREATE TRIGGER recaps_updated_at
  BEFORE UPDATE ON public.recaps
  FOR EACH ROW
  EXECUTE FUNCTION update_recap_updated_at();

DROP TRIGGER IF EXISTS recap_students_updated_at ON public.recap_students;
CREATE TRIGGER recap_students_updated_at
  BEFORE UPDATE ON public.recap_students
  FOR EACH ROW
  EXECUTE FUNCTION update_recap_updated_at();
