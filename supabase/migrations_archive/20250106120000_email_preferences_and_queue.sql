BEGIN;

-- Students email preferences
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS email_opt_out BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_unsubscribe_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS last_reengage_email_at TIMESTAMPTZ;

COMMENT ON COLUMN students.email_opt_out IS 'When true, tutor broadcasts and automations skip this student.';
COMMENT ON COLUMN students.email_unsubscribe_token IS 'Unique token embedded in unsubscribe links.';
COMMENT ON COLUMN students.last_reengage_email_at IS 'Timestamp of the most recent automated re-engagement email.';

CREATE INDEX IF NOT EXISTS students_email_opt_out_idx ON students(email_opt_out);

-- Tutor automation preferences
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS auto_welcome_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS auto_reengage_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_reengage_days INTEGER DEFAULT 30;

COMMENT ON COLUMN profiles.auto_welcome_enabled IS 'Automatically send welcome email when new student is added.';
COMMENT ON COLUMN profiles.auto_reengage_enabled IS 'Automatically re-engage inactive students after a cooldown.';
COMMENT ON COLUMN profiles.auto_reengage_days IS 'Days of inactivity before a re-engagement email is queued.';

-- Email campaign scheduling + queue
ALTER TABLE email_campaigns
  ADD COLUMN IF NOT EXISTS kind TEXT DEFAULT 'broadcast',
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN sent_at DROP DEFAULT;

CREATE TABLE IF NOT EXISTS email_campaign_recipients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  student_email TEXT NOT NULL,
  student_name TEXT,
  personalization_subject TEXT,
  personalization_body TEXT,
  status TEXT DEFAULT 'pending',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX email_campaign_recipients_status_idx
  ON email_campaign_recipients (status, scheduled_for);

COMMIT;
