-- =====================================================
-- COLLABORATIVE EDITING TABLES - Simplified Version
-- Migration 021: Support for real-time collaborative editing
-- =====================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. DOCUMENT_BLOCKS TABLE - Store document content blocks
-- =====================================================
CREATE TABLE IF NOT EXISTS document_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_block_id UUID REFERENCES document_blocks(id) ON DELETE CASCADE,

    -- Block content and metadata
    content TEXT NOT NULL DEFAULT '',
    block_type VARCHAR(100) NOT NULL DEFAULT 'text',
    position INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Version control
    version INTEGER NOT NULL DEFAULT 1,

    -- Ownership
    created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_edited_by_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. TEMPORARY_EDIT_PERMISSIONS - Request-to-edit workflow
-- =====================================================
CREATE TABLE IF NOT EXISTS temporary_edit_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES document_blocks(id) ON DELETE CASCADE,
    block_id UUID REFERENCES document_blocks(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Permission details
    granted_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),

    -- Constraints
    UNIQUE(user_id, document_id, block_id)
);

-- =====================================================
-- 3. DOCUMENT_OPERATIONS - Store editing operations for conflict resolution
-- =====================================================
CREATE TABLE IF NOT EXISTS document_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES document_blocks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Operation data
    operations JSONB NOT NULL,
    version INTEGER NOT NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. BLOCK_COMMENTS - Comments on document blocks
-- =====================================================
CREATE TABLE IF NOT EXISTS block_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_id UUID NOT NULL REFERENCES document_blocks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES block_comments(id) ON DELETE CASCADE,

    -- Comment content
    content TEXT NOT NULL,
    position JSONB DEFAULT '{}'::jsonb, -- For inline comments

    -- Status
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Document blocks indexes
CREATE INDEX IF NOT EXISTS idx_document_blocks_project_id ON document_blocks(project_id);
CREATE INDEX IF NOT EXISTS idx_document_blocks_parent_block_id ON document_blocks(parent_block_id);
CREATE INDEX IF NOT EXISTS idx_document_blocks_created_by_id ON document_blocks(created_by_id);
CREATE INDEX IF NOT EXISTS idx_document_blocks_position ON document_blocks(project_id, position);

-- Temporary permissions indexes
CREATE INDEX IF NOT EXISTS idx_temp_permissions_user_id ON temporary_edit_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_temp_permissions_project_id ON temporary_edit_permissions(project_id);
CREATE INDEX IF NOT EXISTS idx_temp_permissions_expires_at ON temporary_edit_permissions(expires_at);
CREATE INDEX IF NOT EXISTS idx_temp_permissions_document_id ON temporary_edit_permissions(document_id);

-- Document operations indexes
CREATE INDEX IF NOT EXISTS idx_document_operations_document_id ON document_operations(document_id);
CREATE INDEX IF NOT EXISTS idx_document_operations_user_id ON document_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_document_operations_version ON document_operations(document_id, version);
CREATE INDEX IF NOT EXISTS idx_document_operations_created_at ON document_operations(created_at);

-- Block comments indexes
CREATE INDEX IF NOT EXISTS idx_block_comments_block_id ON block_comments(block_id);
CREATE INDEX IF NOT EXISTS idx_block_comments_user_id ON block_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_block_comments_parent_comment_id ON block_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_block_comments_resolved ON block_comments(resolved);

-- Position JSONB index for inline comments
CREATE INDEX IF NOT EXISTS idx_block_comments_position ON block_comments USING GIN (position);

-- =====================================================
-- HELPER FUNCTION - Check edit permissions
-- =====================================================
CREATE OR REPLACE FUNCTION check_document_edit_permission(
    p_user_id UUID,
    p_document_id UUID,
    p_project_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    can_edit BOOLEAN := FALSE;
BEGIN
    -- Check if user is project owner
    SELECT EXISTS(
        SELECT 1 FROM projects p
        WHERE p.id = p_project_id AND p.user_id = p_user_id
    ) INTO can_edit;

    IF can_edit THEN
        RETURN TRUE;
    END IF;

    -- Check if user is admin/editor collaborator
    SELECT EXISTS(
        SELECT 1 FROM collaborations c
        WHERE c.project_id = p_project_id
        AND c.collaborator_id = p_user_id
        AND c.role IN ('admin', 'editor')
        AND c.status = 'active'
    ) INTO can_edit;

    IF can_edit THEN
        RETURN TRUE;
    END IF;

    -- Check temporary permissions
    SELECT EXISTS(
        SELECT 1 FROM temporary_edit_permissions tep
        WHERE tep.user_id = p_user_id
        AND tep.document_id = p_document_id
        AND tep.expires_at > NOW()
    ) INTO can_edit;

    RETURN can_edit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CLEANUP FUNCTION - Remove expired permissions
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_permissions() RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM temporary_edit_permissions
    WHERE expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FINAL SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Enhanced collaborative editing tables created successfully!';
    RAISE NOTICE 'Tables: document_blocks, temporary_edit_permissions, document_operations, block_comments';
    RAISE NOTICE 'Indexes and helper functions created.';
END $$;