-- =====================================================
-- ENHANCED COLLABORATIVE EDITING TABLES
-- Migration 021: Support for real-time collaborative editing
-- Compatible with realtimeService.js
-- =====================================================

-- =====================================================
-- 1. DOCUMENT_BLOCKS TABLE - Store document content blocks
-- =====================================================
CREATE TABLE IF NOT EXISTS document_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_block_id UUID REFERENCES document_blocks(id) ON DELETE CASCADE,

    -- Block content
    content TEXT NOT NULL DEFAULT '',
    block_type VARCHAR(100) NOT NULL DEFAULT 'text', -- text, heading, code, image, list, table, etc.

    -- Block positioning and ordering
    position INTEGER NOT NULL DEFAULT 0,
    depth INTEGER DEFAULT 0, -- For nested blocks

    -- Block metadata
    metadata JSONB DEFAULT '{}'::jsonb, -- Styling, attributes, formatting options

    -- Version control
    version INTEGER NOT NULL DEFAULT 1,
    checksum VARCHAR(64), -- For conflict detection

    -- Ownership and tracking
    created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_edited_by_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Locking for exclusive editing
    is_locked BOOLEAN DEFAULT FALSE,
    locked_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    locked_at TIMESTAMP,
    lock_expires_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Soft delete support
    deleted_at TIMESTAMP DEFAULT NULL
);

-- =====================================================
-- 2. BLOCK_COMMENTS TABLE - Comments on document blocks
-- =====================================================
CREATE TABLE IF NOT EXISTS block_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_id UUID NOT NULL REFERENCES document_blocks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES block_comments(id) ON DELETE CASCADE,

    -- Comment content
    content TEXT NOT NULL,

    -- Position in block (for inline comments)
    position JSONB DEFAULT '{}'::jsonb, -- {"start": 10, "end": 25, "type": "selection"}

    -- Comment metadata
    comment_type VARCHAR(50) DEFAULT 'comment', -- comment, suggestion, question, approval, rejection
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 3. TEMPORARY_EDIT_PERMISSIONS TABLE - Track temporary edit permissions
-- =====================================================
CREATE TABLE IF NOT EXISTS temporary_edit_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL, -- Can reference document_blocks.id or other document entities
    block_id UUID REFERENCES document_blocks(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Permission details
    permission_level VARCHAR(50) DEFAULT 'edit', -- view, suggest, edit, admin
    granted_by_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Request context
    request_message TEXT, -- Original request message
    approval_message TEXT, -- Response from approver

    -- Permission lifecycle
    granted_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    revoked_by_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Tracking
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP,
    usage_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Ensure unique active permissions per user/document/block
    CONSTRAINT unique_active_permission UNIQUE (user_id, document_id, block_id)
);

-- =====================================================
-- 4. DOCUMENT_OPERATIONS TABLE - Store collaborative editing operations
-- =====================================================
CREATE TABLE IF NOT EXISTS document_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL, -- Can reference document_blocks.id or other document entities
    block_id UUID REFERENCES document_blocks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Operation details
    operations JSONB NOT NULL, -- Array of operations: [{type: 'insert', position: 10, content: 'text'}]
    operation_type VARCHAR(50) NOT NULL DEFAULT 'text', -- text, format, structural, metadata

    -- Version control for conflict resolution
    version INTEGER NOT NULL,
    base_version INTEGER, -- Version this operation was based on

    -- Operation metadata
    client_id VARCHAR(100), -- Client identifier for deduplication
    sequence_number INTEGER, -- For ordering operations from same client

    -- Conflict resolution
    is_transformed BOOLEAN DEFAULT FALSE,
    transformed_from_id UUID REFERENCES document_operations(id) ON DELETE SET NULL,
    conflict_resolved BOOLEAN DEFAULT FALSE,

    -- Tracking
    applied_at TIMESTAMP,
    reverted_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 5. DOCUMENT_SNAPSHOTS TABLE - Store document state snapshots
-- =====================================================
CREATE TABLE IF NOT EXISTS document_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL,
    block_id UUID REFERENCES document_blocks(id) ON DELETE CASCADE,

    -- Snapshot content
    content TEXT NOT NULL,
    version INTEGER NOT NULL,

    -- Metadata
    snapshot_type VARCHAR(50) DEFAULT 'auto', -- auto, manual, milestone
    description TEXT,
    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Compression
    is_compressed BOOLEAN DEFAULT FALSE,
    compressed_content BYTEA,

    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 6. EDIT_PERMISSION_REQUESTS TABLE - Track edit permission requests
-- =====================================================
CREATE TABLE IF NOT EXISTS edit_permission_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL,
    block_id UUID REFERENCES document_blocks(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Request details
    request_message TEXT NOT NULL,
    requested_permission_level VARCHAR(50) DEFAULT 'edit',
    requested_duration_minutes INTEGER DEFAULT 60, -- How long they want access

    -- Request status
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, denied, expired, cancelled

    -- Response
    approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    response_message TEXT,
    responded_at TIMESTAMP,

    -- Resulting permission
    granted_permission_id UUID REFERENCES temporary_edit_permissions(id) ON DELETE SET NULL,

    -- Timestamps
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Document blocks indexes
CREATE INDEX IF NOT EXISTS idx_document_blocks_project_id ON document_blocks(project_id);
CREATE INDEX IF NOT EXISTS idx_document_blocks_parent_block_id ON document_blocks(parent_block_id);
CREATE INDEX IF NOT EXISTS idx_document_blocks_created_by_id ON document_blocks(created_by_id);
CREATE INDEX IF NOT EXISTS idx_document_blocks_last_edited_by_id ON document_blocks(last_edited_by_id);
CREATE INDEX IF NOT EXISTS idx_document_blocks_position ON document_blocks(project_id, position);
CREATE INDEX IF NOT EXISTS idx_document_blocks_is_locked ON document_blocks(is_locked);
CREATE INDEX IF NOT EXISTS idx_document_blocks_locked_by_id ON document_blocks(locked_by_id);
CREATE INDEX IF NOT EXISTS idx_document_blocks_block_type ON document_blocks(block_type);
CREATE INDEX IF NOT EXISTS idx_document_blocks_updated_at ON document_blocks(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_blocks_deleted_at ON document_blocks(deleted_at);

-- Block comments indexes
CREATE INDEX IF NOT EXISTS idx_block_comments_block_id ON block_comments(block_id);
CREATE INDEX IF NOT EXISTS idx_block_comments_user_id ON block_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_block_comments_parent_comment_id ON block_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_block_comments_is_resolved ON block_comments(is_resolved);
CREATE INDEX IF NOT EXISTS idx_block_comments_comment_type ON block_comments(comment_type);
CREATE INDEX IF NOT EXISTS idx_block_comments_created_at ON block_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_block_comments_position ON block_comments USING GIN (position);

-- Temporary edit permissions indexes
CREATE INDEX IF NOT EXISTS idx_temp_edit_perms_user_id ON temporary_edit_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_temp_edit_perms_document_id ON temporary_edit_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_temp_edit_perms_block_id ON temporary_edit_permissions(block_id);
CREATE INDEX IF NOT EXISTS idx_temp_edit_perms_project_id ON temporary_edit_permissions(project_id);
CREATE INDEX IF NOT EXISTS idx_temp_edit_perms_expires_at ON temporary_edit_permissions(expires_at);
CREATE INDEX IF NOT EXISTS idx_temp_edit_perms_is_active ON temporary_edit_permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_temp_edit_perms_granted_by_id ON temporary_edit_permissions(granted_by_id);
CREATE INDEX IF NOT EXISTS idx_temp_edit_perms_active_lookup ON temporary_edit_permissions(user_id, document_id, is_active, expires_at);

-- Document operations indexes
CREATE INDEX IF NOT EXISTS idx_document_ops_document_id ON document_operations(document_id);
CREATE INDEX IF NOT EXISTS idx_document_ops_block_id ON document_operations(block_id);
CREATE INDEX IF NOT EXISTS idx_document_ops_user_id ON document_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_document_ops_version ON document_operations(document_id, version);
CREATE INDEX IF NOT EXISTS idx_document_ops_created_at ON document_operations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_ops_operation_type ON document_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_document_ops_client_id ON document_operations(client_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_document_ops_conflict ON document_operations(document_id, conflict_resolved);

-- Document snapshots indexes
CREATE INDEX IF NOT EXISTS idx_document_snapshots_document_id ON document_snapshots(document_id);
CREATE INDEX IF NOT EXISTS idx_document_snapshots_block_id ON document_snapshots(block_id);
CREATE INDEX IF NOT EXISTS idx_document_snapshots_version ON document_snapshots(document_id, version);
CREATE INDEX IF NOT EXISTS idx_document_snapshots_created_at ON document_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_snapshots_snapshot_type ON document_snapshots(snapshot_type);

-- Edit permission requests indexes
CREATE INDEX IF NOT EXISTS idx_edit_perm_requests_requester_id ON edit_permission_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_edit_perm_requests_document_id ON edit_permission_requests(document_id);
CREATE INDEX IF NOT EXISTS idx_edit_perm_requests_block_id ON edit_permission_requests(block_id);
CREATE INDEX IF NOT EXISTS idx_edit_perm_requests_project_id ON edit_permission_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_edit_perm_requests_status ON edit_permission_requests(status);
CREATE INDEX IF NOT EXISTS idx_edit_perm_requests_approver_id ON edit_permission_requests(approver_id);
CREATE INDEX IF NOT EXISTS idx_edit_perm_requests_expires_at ON edit_permission_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_edit_perm_requests_created_at ON edit_permission_requests(created_at DESC);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =====================================================

-- Apply update triggers (using existing update_updated_at_column function from migration 014)
DO $$
BEGIN
    -- Create trigger for document_blocks
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_document_blocks_updated_at') THEN
        CREATE TRIGGER update_document_blocks_updated_at BEFORE UPDATE ON document_blocks
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Create trigger for block_comments
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_block_comments_updated_at') THEN
        CREATE TRIGGER update_block_comments_updated_at BEFORE UPDATE ON block_comments
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Create trigger for temporary_edit_permissions
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_temp_edit_perms_updated_at') THEN
        CREATE TRIGGER update_temp_edit_perms_updated_at BEFORE UPDATE ON temporary_edit_permissions
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Create trigger for edit_permission_requests
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_edit_perm_requests_updated_at') THEN
        CREATE TRIGGER update_edit_perm_requests_updated_at BEFORE UPDATE ON edit_permission_requests
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =====================================================
-- HELPER FUNCTIONS FOR COLLABORATIVE EDITING
-- =====================================================

-- Function to check if a user has edit permission for a document
CREATE OR REPLACE FUNCTION check_document_edit_permission(
    p_user_id UUID,
    p_document_id UUID,
    p_project_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN;
BEGIN
    SELECT EXISTS(
        -- Check if user is project owner
        SELECT 1 FROM projects WHERE id = p_project_id AND user_id = p_user_id
        UNION
        -- Check if user has permanent editor/admin role
        SELECT 1 FROM collaborations
        WHERE project_id = p_project_id
          AND collaborator_id = p_user_id
          AND role IN ('admin', 'editor')
          AND status = 'active'
        UNION
        -- Check if user has active temporary permission
        SELECT 1 FROM temporary_edit_permissions
        WHERE user_id = p_user_id
          AND document_id = p_document_id
          AND is_active = TRUE
          AND expires_at > NOW()
          AND revoked_at IS NULL
    ) INTO has_permission;

    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired permissions
CREATE OR REPLACE FUNCTION cleanup_expired_permissions() RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE temporary_edit_permissions
    SET is_active = FALSE,
        updated_at = NOW()
    WHERE is_active = TRUE
      AND expires_at <= NOW();

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- Function to get document operation history
CREATE OR REPLACE FUNCTION get_document_operations(
    p_document_id UUID,
    p_from_version INTEGER DEFAULT 0,
    p_limit INTEGER DEFAULT 100
) RETURNS TABLE (
    operation_id UUID,
    user_id UUID,
    operations JSONB,
    version INTEGER,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        id,
        do.user_id,
        do.operations,
        do.version,
        do.created_at
    FROM document_operations do
    WHERE do.document_id = p_document_id
      AND do.version > p_from_version
    ORDER BY do.version ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for active edit sessions with user details
CREATE OR REPLACE VIEW active_document_editors AS
SELECT
    tep.document_id,
    tep.block_id,
    tep.project_id,
    tep.user_id,
    u.name as user_name,
    u.email as user_email,
    tep.permission_level,
    tep.granted_at,
    tep.expires_at,
    tep.last_used_at,
    EXTRACT(EPOCH FROM (tep.expires_at - NOW()))/60 as minutes_remaining
FROM temporary_edit_permissions tep
JOIN users u ON u.id = tep.user_id
WHERE tep.is_active = TRUE
  AND tep.expires_at > NOW()
  AND tep.revoked_at IS NULL;

-- View for pending edit permission requests
CREATE OR REPLACE VIEW pending_edit_requests AS
SELECT
    epr.id as request_id,
    epr.requester_id,
    u.name as requester_name,
    u.email as requester_email,
    epr.document_id,
    epr.block_id,
    epr.project_id,
    epr.request_message,
    epr.requested_permission_level,
    epr.requested_duration_minutes,
    epr.created_at as requested_at,
    epr.expires_at
FROM edit_permission_requests epr
JOIN users u ON u.id = epr.requester_id
WHERE epr.status = 'pending'
  AND epr.expires_at > NOW();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration 021: Enhanced Collaborative Editing - COMPLETED successfully';
    RAISE NOTICE 'Tables created: document_blocks, block_comments, temporary_edit_permissions, document_operations, document_snapshots, edit_permission_requests';
    RAISE NOTICE 'Indexes created: 45+ performance indexes for optimal query performance';
    RAISE NOTICE 'Functions created: check_document_edit_permission, cleanup_expired_permissions, get_document_operations';
    RAISE NOTICE 'Views created: active_document_editors, pending_edit_requests';
    RAISE NOTICE 'This migration supports the realtimeService.js collaborative editing features';
END $$;
