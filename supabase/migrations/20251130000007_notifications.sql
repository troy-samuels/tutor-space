-- ============================================================================
-- IN-APP NOTIFICATIONS
-- Tables and functions for real-time notifications
-- ============================================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL CHECK (user_role IN ('tutor', 'student')),

  -- Notification content
  type TEXT NOT NULL CHECK (type IN (
    'booking_new', 'booking_confirmed', 'booking_cancelled', 'booking_reminder',
    'payment_received', 'payment_failed',
    'message_new', 'message_reply',
    'student_new', 'student_access_request',
    'package_purchased', 'package_expiring',
    'review_received', 'review_approved',
    'system_announcement', 'account_update'
  )),
  title TEXT NOT NULL,
  body TEXT,
  icon TEXT, -- Icon name or URL

  -- Associated content
  link TEXT, -- URL to navigate to
  metadata JSONB DEFAULT '{}', -- Extra data (booking_id, student_id, etc.)

  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role can manage all notifications
CREATE POLICY "Service role manages notifications"
  ON notifications FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_user_role TEXT,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_link TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, user_role, type, title, body, link, icon, metadata)
  VALUES (p_user_id, p_user_role, p_type, p_title, p_body, p_link, p_icon, p_metadata)
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to send realtime notifications
-- Supabase will broadcast changes automatically via realtime

-- Notification preferences (optional future enhancement)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  in_app BOOLEAN DEFAULT TRUE,
  email BOOLEAN DEFAULT TRUE,
  push BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, notification_type)
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification_preferences"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role manages notification_preferences"
  ON notification_preferences FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
