-- ============================================================================
-- Studio Tier Database Initialization
-- Migration: 20251209090000_init_studio_tier.sql
-- Description: Initialize database schema for Studio tier features
-- ============================================================================

-- ============================================================================
-- 1. PROFILE EXTENSIONS
-- ============================================================================

-- Create tier enum type
DO $$ BEGIN
  CREATE TYPE tier_type AS ENUM ('standard', 'studio');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add Studio columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier tier_type DEFAULT 'standard';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_credits_used INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_domain TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#000000';

-- ============================================================================
-- 2. LESSON RECORDINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS lesson_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

  -- Storage
  storage_path TEXT NOT NULL,
  duration_seconds INTEGER,

  -- Transcript
  transcript_json JSONB,

  -- Processing status
  status TEXT DEFAULT 'processing'
    CHECK (status IN ('uploading', 'processing', 'transcribing', 'analyzing', 'completed', 'failed')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. LESSON DRILLS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS lesson_drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID REFERENCES lesson_recordings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Drill content (JSON schema: { type, prompt, data })
  content JSONB NOT NULL,

  -- Completion tracking
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. MARKETING CLIPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketing_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID REFERENCES lesson_recordings(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Content
  storage_path TEXT NOT NULL,
  transcript_snippet TEXT,

  -- AI analysis
  viral_score FLOAT CHECK (viral_score >= 0.0 AND viral_score <= 1.0),

  -- Approval workflow
  tutor_approved BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. LEARNING ROADMAPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Content
  title TEXT,
  nodes JSONB DEFAULT '[]',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. INDEXES
-- ============================================================================

-- lesson_recordings indexes
CREATE INDEX IF NOT EXISTS idx_recordings_tutor ON lesson_recordings(tutor_id);
CREATE INDEX IF NOT EXISTS idx_recordings_status ON lesson_recordings(status);
CREATE INDEX IF NOT EXISTS idx_recordings_booking ON lesson_recordings(booking_id);

-- lesson_drills indexes
CREATE INDEX IF NOT EXISTS idx_drills_student ON lesson_drills(student_id);
CREATE INDEX IF NOT EXISTS idx_drills_incomplete ON lesson_drills(student_id) WHERE NOT is_completed;
CREATE INDEX IF NOT EXISTS idx_drills_recording ON lesson_drills(recording_id);

-- marketing_clips indexes
CREATE INDEX IF NOT EXISTS idx_clips_tutor ON marketing_clips(tutor_id);
CREATE INDEX IF NOT EXISTS idx_clips_approved ON marketing_clips(tutor_id) WHERE tutor_approved = true;

-- learning_roadmaps indexes
CREATE INDEX IF NOT EXISTS idx_roadmaps_student ON learning_roadmaps(student_id);

-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE lesson_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_roadmaps ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. RLS POLICIES - LESSON RECORDINGS
-- ============================================================================

-- Tutors can perform all operations on their own recordings
CREATE POLICY "Tutors can manage own recordings"
  ON lesson_recordings FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Students can view recordings where they are the student
CREATE POLICY "Students can view own recordings"
  ON lesson_recordings FOR SELECT
  USING (
    student_id IN (
      SELECT s.id FROM students s WHERE s.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 9. RLS POLICIES - LESSON DRILLS
-- ============================================================================

-- Tutors can perform all operations on drills they created
CREATE POLICY "Tutors can manage own drills"
  ON lesson_drills FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Students can view their own drills
CREATE POLICY "Students can view own drills"
  ON lesson_drills FOR SELECT
  USING (
    student_id IN (
      SELECT s.id FROM students s WHERE s.user_id = auth.uid()
    )
  );

-- Students can update (mark complete) their own drills
CREATE POLICY "Students can update own drills"
  ON lesson_drills FOR UPDATE
  USING (
    student_id IN (
      SELECT s.id FROM students s WHERE s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT s.id FROM students s WHERE s.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 10. RLS POLICIES - MARKETING CLIPS
-- ============================================================================

-- Tutors can perform all operations on their own clips
CREATE POLICY "Tutors can manage own clips"
  ON marketing_clips FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Anyone can view approved clips (public)
CREATE POLICY "Public can view approved clips"
  ON marketing_clips FOR SELECT
  USING (tutor_approved = true);

-- ============================================================================
-- 11. RLS POLICIES - LEARNING ROADMAPS
-- ============================================================================

-- Tutors can perform all operations on roadmaps they created
CREATE POLICY "Tutors can manage own roadmaps"
  ON learning_roadmaps FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Students can view their own roadmaps
CREATE POLICY "Students can view own roadmaps"
  ON learning_roadmaps FOR SELECT
  USING (
    student_id IN (
      SELECT s.id FROM students s WHERE s.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 12. RLS POLICY - PROFILES (ensure users can read own profile)
-- ============================================================================

-- Note: This policy may already exist, using CREATE POLICY IF NOT EXISTS pattern
DO $$ BEGIN
  CREATE POLICY "Users can read own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
