BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'conversation_sender_role'
  ) THEN
    CREATE TYPE conversation_sender_role AS ENUM ('tutor', 'student', 'system');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS conversation_threads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  last_message_preview TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  unread_for_tutor BOOLEAN DEFAULT FALSE,
  unread_for_student BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS conversation_threads_tutor_student_idx
  ON conversation_threads (tutor_id, student_id);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  thread_id UUID REFERENCES conversation_threads(id) ON DELETE CASCADE NOT NULL,
  sender_role conversation_sender_role NOT NULL,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  read_by_tutor BOOLEAN DEFAULT FALSE,
  read_by_student BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conversation_messages_thread_idx
  ON conversation_messages (thread_id, created_at);

ALTER TABLE conversation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors manage conversation threads" ON conversation_threads;
CREATE POLICY "Tutors manage conversation threads"
  ON conversation_threads
  USING (
    tutor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = conversation_threads.student_id
        AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (tutor_id = auth.uid());

DROP POLICY IF EXISTS "Students view conversation threads" ON conversation_threads;
CREATE POLICY "Students view conversation threads"
  ON conversation_threads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = conversation_threads.student_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Tutors manage conversation messages" ON conversation_messages;
CREATE POLICY "Tutors manage conversation messages"
  ON conversation_messages
  USING (
    tutor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = conversation_messages.student_id
        AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (tutor_id = auth.uid());

DROP POLICY IF EXISTS "Students insert conversation messages" ON conversation_messages;
CREATE POLICY "Students insert conversation messages"
  ON conversation_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = conversation_messages.student_id
        AND s.user_id = auth.uid()
    )
  );

COMMIT;
