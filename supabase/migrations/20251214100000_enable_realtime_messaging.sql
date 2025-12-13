-- Enable Supabase Realtime for messaging tables
-- This allows real-time subscriptions to message and thread changes

ALTER PUBLICATION supabase_realtime ADD TABLE conversation_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_threads;
