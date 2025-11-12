-- =====================================================
-- COLLABORATION FEATURES DATABASE SCHEMA
-- Migration 014: Complete collaboration platform
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROJECTS TABLE - Shared projects for collaboration
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(50) DEFAULT 'review', -- review, collaboration, shared_folder
    status VARCHAR(50) DEFAULT 'active', -- active, paused, completed, archived
    visibility VARCHAR(50) DEFAULT 'private', -- private, team, public
    settings JSONB DEFAULT '{}'::jsonb, -- Custom settings per project
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 2. COLLABORATIONS TABLE - Active collaboration sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS collaborations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    request_id UUID REFERENCES file_requests(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    collaborator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer', -- viewer, editor, reviewer, owner
    permissions JSONB DEFAULT '{
        "can_view": true,
        "can_edit": false,
        "can_review": false,
        "can_invite": false,
        "can_manage": false
    }'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- pending, active, paused, ended
    invited_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, collaborator_id),
    UNIQUE(request_id, collaborator_id)
);

-- =====================================================
-- 3. REVIEWS TABLE - Review workflows and feedback
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    request_id UUID REFERENCES file_requests(id) ON DELETE CASCADE,
    upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, approved, rejected, needs_changes
    priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high, urgent
    feedback TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_data JSONB DEFAULT '{}'::jsonb, -- Structured feedback data
    due_date TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 4. REVIEW_COMMENTS TABLE - Threaded comments for reviews
-- =====================================================
CREATE TABLE IF NOT EXISTS review_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES review_comments(id) ON DELETE CASCADE, -- For threaded comments
    content TEXT NOT NULL,
    comment_type VARCHAR(50) DEFAULT 'comment', -- comment, suggestion, approval, rejection
    metadata JSONB DEFAULT '{}'::jsonb, -- File annotations, timestamps, etc.
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 5. TEAM_INVITATIONS TABLE - Pending team invites
-- =====================================================
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer',
    permissions JSONB DEFAULT '{"can_view": true}'::jsonb,
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, declined, expired
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMP,
    declined_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 6. ACTIVITY_LOG TABLE - Comprehensive activity tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Who performed the action (can be different from user_id for notifications)
    action VARCHAR(100) NOT NULL, -- file_uploaded, review_completed, project_shared, etc.
    resource_type VARCHAR(100), -- project, review, collaboration, file_request, upload
    resource_id UUID,
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- For actions involving other users
    metadata JSONB DEFAULT '{}'::jsonb, -- Action-specific data
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 7. PROJECT_FILES TABLE - Files associated with projects
-- =====================================================
CREATE TABLE IF NOT EXISTS project_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
    request_id UUID REFERENCES file_requests(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    storage_path TEXT,
    version INTEGER DEFAULT 1,
    is_current_version BOOLEAN DEFAULT TRUE,
    uploaded_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    upload_source VARCHAR(50) DEFAULT 'direct', -- direct, request, integration
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 8. NOTIFICATION_SUBSCRIPTIONS TABLE - User notification preferences
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    collaboration_id UUID REFERENCES collaborations(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL, -- new_file, review_assigned, comment_added, etc.
    enabled BOOLEAN DEFAULT TRUE,
    delivery_method VARCHAR(50) DEFAULT 'in_app', -- in_app, email, both
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, project_id, notification_type),
    UNIQUE(user_id, collaboration_id, notification_type)
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_visibility ON projects(visibility);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_due_date ON projects(due_date);

-- Collaborations indexes
CREATE INDEX IF NOT EXISTS idx_collaborations_owner_id ON collaborations(owner_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_collaborator_id ON collaborations(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_project_id ON collaborations(project_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_request_id ON collaborations(request_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_status ON collaborations(status);
CREATE INDEX IF NOT EXISTS idx_collaborations_role ON collaborations(role);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_project_id ON reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_reviews_request_id ON reviews(request_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_assigned_by_id ON reviews(assigned_by_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_priority ON reviews(priority);
CREATE INDEX IF NOT EXISTS idx_reviews_due_date ON reviews(due_date);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Review comments indexes
CREATE INDEX IF NOT EXISTS idx_review_comments_review_id ON review_comments(review_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_user_id ON review_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_parent_id ON review_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_created_at ON review_comments(created_at DESC);

-- Team invitations indexes
CREATE INDEX IF NOT EXISTS idx_team_invitations_inviter_id ON team_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_project_id ON team_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_expires_at ON team_invitations(expires_at);

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_actor_id ON activity_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_resource_type ON activity_log(resource_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_resource_id ON activity_log(resource_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_target_user_id ON activity_log(target_user_id);

-- Project files indexes
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_upload_id ON project_files(upload_id);
CREATE INDEX IF NOT EXISTS idx_project_files_request_id ON project_files(request_id);
CREATE INDEX IF NOT EXISTS idx_project_files_uploaded_by_id ON project_files(uploaded_by_id);
CREATE INDEX IF NOT EXISTS idx_project_files_current_version ON project_files(is_current_version);
CREATE INDEX IF NOT EXISTS idx_project_files_created_at ON project_files(created_at DESC);

-- Notification subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_user_id ON notification_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_project_id ON notification_subscriptions(project_id);
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_collaboration_id ON notification_subscriptions(collaboration_id);
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_type ON notification_subscriptions(notification_type);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaborations_updated_at BEFORE UPDATE ON collaborations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_comments_updated_at BEFORE UPDATE ON review_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SECURITY & ACCESS CONTROL
-- =====================================================

-- Row Level Security (RLS) policies can be added here if needed
-- For now, we'll handle access control in the application layer

-- =====================================================
-- INITIAL DATA SEEDING (Optional)
-- =====================================================

-- Sample activity types for consistency
INSERT INTO activity_log (id, user_id, actor_id, action, resource_type, metadata, created_at)
VALUES
    (uuid_generate_v4(), (SELECT id FROM users LIMIT 1), (SELECT id FROM users LIMIT 1), 'collaboration_system_initialized', 'system', '{"message": "Collaboration features activated"}', NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 014: Collaboration Features - COMPLETED successfully';
    RAISE NOTICE 'Tables created: projects, collaborations, reviews, review_comments, team_invitations, activity_log, project_files, notification_subscriptions';
    RAISE NOTICE 'Indexes created: 29 performance indexes';
    RAISE NOTICE 'Triggers created: 4 automatic timestamp triggers';
END $$;