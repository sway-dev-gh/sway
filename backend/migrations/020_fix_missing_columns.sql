-- Fix missing database columns that are causing errors
-- Migration 020: Add missing columns to various tables

-- Add sender_id column to notifications table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='notifications' AND column_name='sender_id') THEN
        ALTER TABLE notifications ADD COLUMN sender_id UUID REFERENCES users(id);
        COMMENT ON COLUMN notifications.sender_id IS 'User who sent/triggered the notification';
    END IF;
END $$;

-- Add deleted_at column to projects table if it doesn't exist (for soft delete)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='projects' AND column_name='deleted_at') THEN
        ALTER TABLE projects ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL;
        COMMENT ON COLUMN projects.deleted_at IS 'Timestamp when project was soft deleted';
        CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);
    END IF;
END $$;

-- Add action column to activity_log table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='activity_log' AND column_name='action') THEN
        ALTER TABLE activity_log ADD COLUMN action VARCHAR(255) NOT NULL DEFAULT 'unknown';
        COMMENT ON COLUMN activity_log.action IS 'Type of action performed (create, update, delete, etc)';
        CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
    END IF;
END $$;

-- Create activity_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL DEFAULT 'unknown',
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for activity_log if they don't exist
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_resource ON activity_log(resource_type, resource_id);

-- Update existing activity_log records to have valid action if they're null/empty
UPDATE activity_log SET action = 'legacy_action' WHERE action IS NULL OR action = '';

COMMIT;