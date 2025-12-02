-- ============================================================================
-- AI ASSISTANT
-- Tables for AI-powered features and chat history
-- ============================================================================

-- AI conversation threads
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL CHECK (user_role IN ('tutor', 'student')),

  -- Conversation metadata
  title TEXT,
  context_type TEXT CHECK (context_type IN ('general', 'lesson_prep', 'student_feedback', 'content_creation', 'scheduling')),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  message_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_active ON ai_conversations(is_active) WHERE is_active = TRUE;

-- AI messages
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,

  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- Optional metadata
  metadata JSONB DEFAULT '{}',
  tokens_used INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON ai_messages(created_at);

-- AI usage tracking
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Usage tracking
  month TEXT NOT NULL, -- Format: YYYY-MM
  total_tokens INTEGER DEFAULT 0,
  total_requests INTEGER DEFAULT 0,
  total_conversations INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_month ON ai_usage(user_id, month);

-- Enable RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Users can manage their own conversations
CREATE POLICY "Users manage own ai_conversations"
  ON ai_conversations FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can manage their own messages
CREATE POLICY "Users manage own ai_messages"
  ON ai_messages FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE user_id = auth.uid()
    )
  );

-- Users can view their own usage
CREATE POLICY "Users view own ai_usage"
  ON ai_usage FOR SELECT
  USING (user_id = auth.uid());

-- Service role policies
CREATE POLICY "Service role manages ai_conversations"
  ON ai_conversations FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages ai_messages"
  ON ai_messages FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages ai_usage"
  ON ai_usage FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Function to update message count
CREATE OR REPLACE FUNCTION update_ai_conversation_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_conversations
  SET message_count = message_count + 1,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_ai_message_count ON ai_messages;
CREATE TRIGGER trg_ai_message_count
  AFTER INSERT ON ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_conversation_count();
