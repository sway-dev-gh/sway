-- Migration: Create notifications table
-- Stores user notifications for file uploads, requests, and system events

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'file_uploaded', 'request_received', 'payment_received', 'system'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

COMMENT ON TABLE notifications IS 'User notifications for uploads, requests, and system events';
COMMENT ON COLUMN notifications.type IS 'Type of notification: file_uploaded, request_received, payment_received, system';
COMMENT ON COLUMN notifications.is_read IS 'Whether the notification has been read by the user';
