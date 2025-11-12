-- SwayFiles Review & Approval Workflow System Extension
-- This migration extends the existing infrastructure for comprehensive review workflows
-- Working with existing file_sections and projects tables

-- Enhanced workspace management (extends existing projects table)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS workspace_type VARCHAR(50) DEFAULT 'review' CHECK (workspace_type IN ('review', 'approval', 'creative', 'code', 'general'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS workflow_template VARCHAR(50) DEFAULT 'standard' CHECK (workflow_template IN ('standard', 'fast', 'thorough', 'custom'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS default_reviewers UUID[] DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS auto_assign_reviewers BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS external_access_enabled BOOLEAN DEFAULT true;

-- Extend existing file_sections table with review workflow fields
ALTER TABLE file_sections ADD COLUMN IF NOT EXISTS section_status VARCHAR(50) DEFAULT 'draft' CHECK (section_status IN ('draft', 'under_review', 'changes_requested', 'approved'));
ALTER TABLE file_sections ADD COLUMN IF NOT EXISTS assigned_reviewers UUID[] DEFAULT '{}';
ALTER TABLE file_sections ADD COLUMN IF NOT EXISTS is_required_for_approval BOOLEAN DEFAULT true;
ALTER TABLE file_sections ADD COLUMN IF NOT EXISTS content_start_position INTEGER;
ALTER TABLE file_sections ADD COLUMN IF NOT EXISTS content_end_position INTEGER;
ALTER TABLE file_sections ADD COLUMN IF NOT EXISTS line_start INTEGER;
ALTER TABLE file_sections ADD COLUMN IF NOT EXISTS line_end INTEGER;

-- File workflow states (extends existing file management)
CREATE TABLE IF NOT EXISTS file_workflow_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id VARCHAR(255) NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    current_state VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (current_state IN ('draft', 'under_review', 'changes_requested', 'approved', 'delivered')),
    previous_state VARCHAR(50),
    state_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    state_changed_by UUID REFERENCES users(id),
    reviewer_assignments UUID[] DEFAULT '{}',
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    estimated_completion_date TIMESTAMP WITH TIME ZONE,
    priority_level VARCHAR(20) DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Section reviews and approvals (works with existing file_sections)
CREATE TABLE IF NOT EXISTS section_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES file_sections(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id),
    review_status VARCHAR(50) NOT NULL CHECK (review_status IN ('pending', 'reviewing', 'changes_requested', 'approved', 'rejected')),
    review_notes TEXT,
    review_score INTEGER CHECK (review_score BETWEEN 1 AND 5),
    time_spent_minutes INTEGER DEFAULT 0,
    is_final_approval BOOLEAN DEFAULT false,
    approval_weight DECIMAL(3,2) DEFAULT 1.00,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(section_id, reviewer_id)
);

-- Enhanced section comments system (works with existing file_sections)
CREATE TABLE IF NOT EXISTS section_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES file_sections(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES section_comments(id) ON DELETE CASCADE,
    commenter_id UUID REFERENCES users(id),
    commenter_email VARCHAR(255), -- For external collaborators
    commenter_name VARCHAR(255),
    comment_text TEXT NOT NULL,
    comment_type VARCHAR(50) DEFAULT 'general' CHECK (comment_type IN ('general', 'suggestion', 'issue', 'approval', 'question')),
    line_number INTEGER,
    character_position INTEGER,
    highlighted_text TEXT,
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    priority_level VARCHAR(20) DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high')),
    is_external BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- File version history for change tracking
CREATE TABLE IF NOT EXISTS file_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id VARCHAR(255) NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    version_number VARCHAR(50) NOT NULL,
    version_type VARCHAR(50) DEFAULT 'revision' CHECK (version_type IN ('initial', 'revision', 'major', 'final')),
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    file_hash VARCHAR(64),
    change_summary TEXT,
    changed_by UUID REFERENCES users(id),
    change_reason TEXT,
    is_current_version BOOLEAN DEFAULT false,
    created_from_version_id UUID REFERENCES file_versions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- External collaborator access tokens
CREATE TABLE IF NOT EXISTS external_access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    file_id VARCHAR(255),
    section_id UUID REFERENCES file_sections(id) ON DELETE CASCADE,
    access_level VARCHAR(50) DEFAULT 'view_comment' CHECK (access_level IN ('view', 'view_comment', 'review_approve')),
    collaborator_email VARCHAR(255) NOT NULL,
    collaborator_name VARCHAR(255),
    invited_by UUID REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workflow automation rules
CREATE TABLE IF NOT EXISTS workflow_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    trigger_event VARCHAR(100) NOT NULL,
    trigger_conditions JSONB DEFAULT '{}'::jsonb,
    actions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    execution_order INTEGER DEFAULT 1,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Review analytics and metrics
CREATE TABLE IF NOT EXISTS review_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    file_id VARCHAR(255),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2),
    metric_date DATE DEFAULT CURRENT_DATE,
    additional_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_workflow_states_file_id ON file_workflow_states(file_id);
CREATE INDEX IF NOT EXISTS idx_file_workflow_states_project_id ON file_workflow_states(project_id);
CREATE INDEX IF NOT EXISTS idx_file_workflow_states_current_state ON file_workflow_states(current_state);
CREATE INDEX IF NOT EXISTS idx_file_workflow_states_state_changed_at ON file_workflow_states(state_changed_at);

CREATE INDEX IF NOT EXISTS idx_file_sections_section_status ON file_sections(section_status);
CREATE INDEX IF NOT EXISTS idx_file_sections_project_file_id ON file_sections(project_file_id);

CREATE INDEX IF NOT EXISTS idx_section_reviews_section_id ON section_reviews(section_id);
CREATE INDEX IF NOT EXISTS idx_section_reviews_reviewer_id ON section_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_section_reviews_status ON section_reviews(review_status);
CREATE INDEX IF NOT EXISTS idx_section_reviews_reviewed_at ON section_reviews(reviewed_at);

CREATE INDEX IF NOT EXISTS idx_section_comments_section_id ON section_comments(section_id);
CREATE INDEX IF NOT EXISTS idx_section_comments_parent_id ON section_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_section_comments_commenter_id ON section_comments(commenter_id);
CREATE INDEX IF NOT EXISTS idx_section_comments_created_at ON section_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_file_versions_file_id ON file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_current ON file_versions(file_id, is_current_version);
CREATE INDEX IF NOT EXISTS idx_file_versions_created_at ON file_versions(created_at);

CREATE INDEX IF NOT EXISTS idx_external_tokens_hash ON external_access_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_external_tokens_project_id ON external_access_tokens(project_id);
CREATE INDEX IF NOT EXISTS idx_external_tokens_expires_at ON external_access_tokens(expires_at);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Only create triggers for new tables (existing file_sections might already have triggers)
CREATE TRIGGER update_file_workflow_states_updated_at BEFORE UPDATE ON file_workflow_states FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_section_reviews_updated_at BEFORE UPDATE ON section_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_section_comments_updated_at BEFORE UPDATE ON section_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_rules_updated_at BEFORE UPDATE ON workflow_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default workflow templates
INSERT INTO workflow_rules (project_id, rule_name, trigger_event, trigger_conditions, actions, created_by)
VALUES
(NULL, 'Auto-assign reviewers on file upload', 'file_uploaded', '{"auto_assign": true}', '{"assign_default_reviewers": true, "set_state": "under_review"}', NULL),
(NULL, 'Complete review when all sections approved', 'section_approved', '{"all_sections_approved": true}', '{"set_file_state": "approved", "notify_stakeholders": true}', NULL),
(NULL, 'Request changes when any section rejected', 'section_rejected', '{}', '{"set_file_state": "changes_requested", "notify_file_owner": true}', NULL)
ON CONFLICT DO NOTHING;

-- Insert sample review analytics metrics
INSERT INTO review_analytics (project_id, metric_name, metric_value, additional_data)
VALUES
(NULL, 'average_review_time_hours', 0, '{"description": "Average time to complete reviews"}'),
(NULL, 'approval_rate_percentage', 0, '{"description": "Percentage of files approved on first review"}'),
(NULL, 'reviewer_engagement_score', 0, '{"description": "Average reviewer participation score"}')
ON CONFLICT DO NOTHING;