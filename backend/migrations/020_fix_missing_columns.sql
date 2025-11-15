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

-- Create activity_log table if it doesn't exist (FIXED: Complete schema with all required columns)
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns if table already exists with incomplete schema
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='activity_log' AND column_name='actor_id') THEN
        ALTER TABLE activity_log ADD COLUMN actor_id UUID REFERENCES users(id) ON DELETE SET NULL;
        COMMENT ON COLUMN activity_log.actor_id IS 'User who performed the action (can be different from user_id)';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='activity_log' AND column_name='target_user_id') THEN
        ALTER TABLE activity_log ADD COLUMN target_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
        COMMENT ON COLUMN activity_log.target_user_id IS 'User who was the target of the action';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='activity_log' AND column_name='metadata') THEN
        ALTER TABLE activity_log ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        COMMENT ON COLUMN activity_log.metadata IS 'Additional metadata for the activity';
    END IF;
END $$;

-- Create indexes for activity_log if they don't exist (FIXED: Complete index set)
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_actor_id ON activity_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_target_user_id ON activity_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_resource ON activity_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_created ON activity_log(user_id, created_at);

-- Update existing activity_log records to have valid action if they're null/empty
UPDATE activity_log SET action = 'legacy_action' WHERE action IS NULL OR action = '';

COMMIT;