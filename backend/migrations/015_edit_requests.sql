-- =====================================================
-- EDIT REQUESTS - Granular collaboration feature
-- Migration 015: Request-based collaborative editing
-- =====================================================

-- =====================================================
-- FILE_SECTIONS TABLE - Define editable sections in files
-- =====================================================
CREATE TABLE IF NOT EXISTS file_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_file_id UUID NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
    section_name VARCHAR(255) NOT NULL, -- "Paragraph 3", "Header", "Slide 5-8", "Layer 1"
    section_type VARCHAR(100) NOT NULL, -- text, image, slide, layer, page, element, etc.
    section_data JSONB NOT NULL, -- Coordinates, ranges, identifiers, metadata
    description TEXT,
    is_locked BOOLEAN DEFAULT FALSE, -- Temporarily locked during editing
    locked_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    locked_at TIMESTAMP,
    created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Ensure unique sections per file
    UNIQUE(project_file_id, section_name)
);

-- =====================================================
-- EDIT_REQUESTS TABLE - Requests to edit specific sections
-- =====================================================
CREATE TABLE IF NOT EXISTS edit_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_section_id UUID REFERENCES file_sections(id) ON DELETE CASCADE,
    project_file_id UUID REFERENCES project_files(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approver_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Request details
    title VARCHAR(255) NOT NULL, -- "Edit header section", "Fix typo in paragraph 3"
    description TEXT NOT NULL, -- What they want to change and why
    edit_type VARCHAR(100) DEFAULT 'modify', -- modify, add, delete, replace, format

    -- Section targeting (if no file_section_id, use these fields)
    target_section_name VARCHAR(255), -- "Slide 3", "Page 2", "Introduction paragraph"
    target_section_data JSONB, -- Specific coordinates, line numbers, element IDs

    -- Request workflow
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, denied, in_progress, completed, expired
    priority VARCHAR(50) DEFAULT 'normal', -- low, normal, high, urgent

    -- Proposed changes (before approval)
    proposed_changes JSONB, -- What they plan to change
    change_reason TEXT, -- Why this change is needed

    -- Approval workflow
    approval_message TEXT, -- Approval/denial reason from owner
    conditions TEXT, -- "Only change the color, not the text", "Keep it under 100 words"

    -- Time management
    estimated_time_minutes INTEGER, -- How long edit will take
    due_date TIMESTAMP, -- When edit needs to be done
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'), -- Request expiration

    -- Status timestamps
    requested_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    denied_at TIMESTAMP,
    started_at TIMESTAMP, -- When editing actually began
    completed_at TIMESTAMP,

    -- Version control
    original_version INTEGER, -- File version when request was made
    edit_version INTEGER, -- Version number for this edit

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- EDIT_SESSIONS TABLE - Active collaborative editing sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS edit_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    edit_request_id UUID NOT NULL REFERENCES edit_requests(id) ON DELETE CASCADE,
    editor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Session details
    session_type VARCHAR(50) DEFAULT 'exclusive', -- exclusive, collaborative, review
    session_data JSONB DEFAULT '{}'::jsonb, -- Session-specific metadata

    -- Real-time tracking
    is_active BOOLEAN DEFAULT TRUE,
    last_activity_at TIMESTAMP DEFAULT NOW(),
    cursor_position JSONB, -- Current editing position/selection

    -- Session lifecycle
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- EDIT_CHANGES TABLE - Track individual changes during editing
-- =====================================================
CREATE TABLE IF NOT EXISTS edit_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    edit_session_id UUID NOT NULL REFERENCES edit_sessions(id) ON DELETE CASCADE,

    -- Change details
    change_type VARCHAR(100) NOT NULL, -- insert, delete, modify, format, move, etc.
    change_data JSONB NOT NULL, -- Before/after content, coordinates, styling changes
    change_description TEXT, -- Human-readable description of change

    -- Position/targeting
    target_section JSONB, -- Where in the file this change applies

    -- Change metadata
    change_size INTEGER, -- Characters, pixels, bytes affected
    is_minor BOOLEAN DEFAULT FALSE, -- Typo fix vs major content change

    -- Approval (for collaborative sessions)
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- EDIT_PERMISSIONS TABLE - Granular editing permissions
-- =====================================================
CREATE TABLE IF NOT EXISTS edit_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collaboration_id UUID REFERENCES collaborations(id) ON DELETE CASCADE,
    file_section_id UUID REFERENCES file_sections(id) ON DELETE CASCADE,
    project_file_id UUID REFERENCES project_files(id) ON DELETE CASCADE,

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    granted_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Permission details
    permission_type VARCHAR(100) NOT NULL, -- read, edit, approve, lock, unlock, comment
    scope VARCHAR(100) DEFAULT 'section', -- section, file, project

    -- Conditional permissions
    conditions JSONB DEFAULT '{}'::jsonb, -- Time limits, change limits, approval required

    -- Permission lifecycle
    is_active BOOLEAN DEFAULT TRUE,
    granted_at TIMESTAMP DEFAULT NOW(),
    revoked_at TIMESTAMP,
    expires_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),

    -- Ensure unique permissions per user/section
    UNIQUE(user_id, file_section_id, permission_type),
    UNIQUE(user_id, project_file_id, permission_type)
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- File sections indexes
CREATE INDEX IF NOT EXISTS idx_file_sections_project_file_id ON file_sections(project_file_id);
CREATE INDEX IF NOT EXISTS idx_file_sections_created_by_id ON file_sections(created_by_id);
CREATE INDEX IF NOT EXISTS idx_file_sections_locked_by_id ON file_sections(locked_by_id);
CREATE INDEX IF NOT EXISTS idx_file_sections_is_locked ON file_sections(is_locked);
CREATE INDEX IF NOT EXISTS idx_file_sections_section_type ON file_sections(section_type);

-- Edit requests indexes
CREATE INDEX IF NOT EXISTS idx_edit_requests_file_section_id ON edit_requests(file_section_id);
CREATE INDEX IF NOT EXISTS idx_edit_requests_project_file_id ON edit_requests(project_file_id);
CREATE INDEX IF NOT EXISTS idx_edit_requests_requester_id ON edit_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_edit_requests_approver_id ON edit_requests(approver_id);
CREATE INDEX IF NOT EXISTS idx_edit_requests_status ON edit_requests(status);
CREATE INDEX IF NOT EXISTS idx_edit_requests_priority ON edit_requests(priority);
CREATE INDEX IF NOT EXISTS idx_edit_requests_due_date ON edit_requests(due_date);
CREATE INDEX IF NOT EXISTS idx_edit_requests_expires_at ON edit_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_edit_requests_requested_at ON edit_requests(requested_at DESC);

-- Edit sessions indexes
CREATE INDEX IF NOT EXISTS idx_edit_sessions_edit_request_id ON edit_sessions(edit_request_id);
CREATE INDEX IF NOT EXISTS idx_edit_sessions_editor_id ON edit_sessions(editor_id);
CREATE INDEX IF NOT EXISTS idx_edit_sessions_is_active ON edit_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_edit_sessions_last_activity_at ON edit_sessions(last_activity_at DESC);

-- Edit changes indexes
CREATE INDEX IF NOT EXISTS idx_edit_changes_edit_session_id ON edit_changes(edit_session_id);
CREATE INDEX IF NOT EXISTS idx_edit_changes_change_type ON edit_changes(change_type);
CREATE INDEX IF NOT EXISTS idx_edit_changes_created_at ON edit_changes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_edit_changes_requires_approval ON edit_changes(requires_approval);

-- Edit permissions indexes
CREATE INDEX IF NOT EXISTS idx_edit_permissions_collaboration_id ON edit_permissions(collaboration_id);
CREATE INDEX IF NOT EXISTS idx_edit_permissions_file_section_id ON edit_permissions(file_section_id);
CREATE INDEX IF NOT EXISTS idx_edit_permissions_project_file_id ON edit_permissions(project_file_id);
CREATE INDEX IF NOT EXISTS idx_edit_permissions_user_id ON edit_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_edit_permissions_granted_by_id ON edit_permissions(granted_by_id);
CREATE INDEX IF NOT EXISTS idx_edit_permissions_permission_type ON edit_permissions(permission_type);
CREATE INDEX IF NOT EXISTS idx_edit_permissions_is_active ON edit_permissions(is_active);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =====================================================

-- Apply update triggers
CREATE TRIGGER update_file_sections_updated_at BEFORE UPDATE ON file_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_edit_requests_updated_at BEFORE UPDATE ON edit_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_edit_sessions_updated_at BEFORE UPDATE ON edit_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- EXAMPLE WORKFLOWS DOCUMENTATION
-- =====================================================

-- Example 1: Request to edit specific paragraph
-- INSERT INTO edit_requests (project_file_id, requester_id, title, description, target_section_name, target_section_data)
-- VALUES (file_uuid, user_uuid, 'Fix typo in introduction', 'There is a spelling error in the word "collaboration"', 'Introduction paragraph', '{"line_start": 5, "line_end": 7, "char_start": 120, "char_end": 135}');

-- Example 2: Request to edit design layer
-- INSERT INTO edit_requests (project_file_id, requester_id, title, description, target_section_name, target_section_data)
-- VALUES (file_uuid, user_uuid, 'Update logo colors', 'Change brand colors to match new guidelines', 'Logo layer', '{"layer_id": "logo_main", "coordinates": {"x": 100, "y": 200, "width": 300, "height": 150}}');

-- Example 3: Request to edit presentation slides
-- INSERT INTO edit_requests (project_file_id, requester_id, title, description, target_section_name, target_section_data)
-- VALUES (file_uuid, user_uuid, 'Update Q4 numbers', 'Sales figures need to reflect latest data', 'Slides 8-12', '{"slide_range": [8, 9, 10, 11, 12], "elements": ["chart_sales", "table_metrics"]}');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration 015: Edit Requests - COMPLETED successfully';
    RAISE NOTICE 'New feature: GRANULAR COLLABORATIVE EDITING';
    RAISE NOTICE 'Users can now request to edit specific sections of files';
    RAISE NOTICE 'Tables created: file_sections, edit_requests, edit_sessions, edit_changes, edit_permissions';
    RAISE NOTICE 'This enables request-based editing workflows with approval processes';
END $$;