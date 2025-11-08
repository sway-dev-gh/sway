-- Migration: Update notifications table schema
-- Migrates from old schema (read, metadata) to new schema (is_read, link, read_at)

-- Add new columns if they don't exist
DO $$
BEGIN
  -- Add is_read column (rename from read)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read') THEN
    ALTER TABLE notifications RENAME COLUMN read TO is_read;
  END IF;

  -- Add link column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'link') THEN
    ALTER TABLE notifications ADD COLUMN link VARCHAR(500);
  END IF;

  -- Add read_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read_at') THEN
    ALTER TABLE notifications ADD COLUMN read_at TIMESTAMP;
  END IF;

  -- Drop metadata column if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'metadata') THEN
    ALTER TABLE notifications DROP COLUMN metadata;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Add comments
COMMENT ON TABLE notifications IS 'User notifications for uploads, requests, and system events';
COMMENT ON COLUMN notifications.type IS 'Type of notification: file_uploaded, request_received, payment_received, system';
COMMENT ON COLUMN notifications.is_read IS 'Whether the notification has been read by the user';
