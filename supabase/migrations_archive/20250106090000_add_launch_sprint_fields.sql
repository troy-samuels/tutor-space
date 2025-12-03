BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'launch_topic_option') THEN
    CREATE TYPE launch_topic_option AS ENUM (
      'exam_prep',
      'kids_immersion',
      'business_fluency',
      'heritage_learners',
      'seasonal_promo'
    );
  END IF;
END $$;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS launch_topic launch_topic_option,
  ADD COLUMN IF NOT EXISTS launch_sprint_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS launch_sprint_completed_at timestamptz;

COMMENT ON COLUMN profiles.launch_topic IS 'Tutor-selected launch kit used to scaffold onboarding content';
COMMENT ON COLUMN profiles.launch_sprint_started_at IS 'Timestamp when the Tutor Launch Sprint began';
COMMENT ON COLUMN profiles.launch_sprint_completed_at IS 'Timestamp when the Tutor Launch Sprint checklist was fully complete';

COMMIT;
