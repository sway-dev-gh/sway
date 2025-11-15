-- Migration 006: Prompting Agent System
-- Adds comprehensive prompting agent functionality to SwayFiles

-- Prompting agents table - human agents who can review and optimize prompts
CREATE TABLE IF NOT EXISTS prompting_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_name VARCHAR(255) NOT NULL,
    expertise_areas TEXT[], -- e.g., ['code_review', 'documentation', 'testing']
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'busy')),
    max_concurrent_workspaces INTEGER DEFAULT 5,
    response_time_avg INTEGER DEFAULT 0, -- average response time in minutes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workspace prompting configuration
CREATE TABLE IF NOT EXISTS workspace_prompting_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    prompting_enabled BOOLEAN DEFAULT true,
    assigned_agent_id UUID REFERENCES prompting_agents(id) ON DELETE SET NULL,
    auto_approve_simple_prompts BOOLEAN DEFAULT false,
    require_agent_review BOOLEAN DEFAULT true,
    ai_model VARCHAR(100) DEFAULT 'gpt-4',
    max_prompt_length INTEGER DEFAULT 4000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workspace_id)
);

-- AI prompts and their lifecycle
CREATE TABLE IF NOT EXISTS ai_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES prompting_agents(id) ON DELETE SET NULL,

    -- Prompt content and metadata
    original_prompt TEXT NOT NULL,
    optimized_prompt TEXT,
    prompt_type VARCHAR(100) DEFAULT 'general', -- 'code_review', 'documentation', 'bug_fix', etc.
    context_metadata JSONB DEFAULT '{}',

    -- Lifecycle status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN
        ('pending', 'agent_review', 'optimized', 'approved', 'executed', 'rejected')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

    -- Timestamps
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    agent_reviewed_at TIMESTAMP,
    executed_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- AI execution results
    ai_response TEXT,
    execution_time_ms INTEGER,
    tokens_used INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prompting activity logs for dashboard and accountability
CREATE TABLE IF NOT EXISTS prompting_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    prompt_id UUID REFERENCES ai_prompts(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES prompting_agents(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Log details
    action VARCHAR(100) NOT NULL, -- 'prompt_submitted', 'agent_assigned', 'prompt_optimized', 'ai_executed', etc.
    description TEXT,
    metadata JSONB DEFAULT '{}',

    -- Non-sensitive context for agent dashboard
    workflow_context VARCHAR(255), -- e.g., 'code_review_request', 'documentation_update'
    activity_pattern VARCHAR(255), -- e.g., 'high_complexity_task', 'routine_update'

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workspace activity patterns for AI prompt generation (non-sensitive metadata)
CREATE TABLE IF NOT EXISTS workspace_activity_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Activity pattern metadata (no sensitive data)
    pattern_type VARCHAR(100) NOT NULL, -- 'file_changes', 'collaboration_peak', 'review_cycle', etc.
    frequency VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'irregular'
    complexity_level VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'

    -- Pattern data (sanitized, no code/content)
    activity_summary TEXT, -- human-readable summary
    suggested_prompts TEXT[], -- potential AI prompts based on pattern

    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure one pattern per type per workspace
    UNIQUE(workspace_id, pattern_type)
);

-- Agent permissions and access control
CREATE TABLE IF NOT EXISTS prompting_agent_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES prompting_agents(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Permission levels
    can_view_dashboard BOOLEAN DEFAULT true,
    can_edit_prompts BOOLEAN DEFAULT true,
    can_approve_prompts BOOLEAN DEFAULT true,
    can_view_logs BOOLEAN DEFAULT true,
    can_access_patterns BOOLEAN DEFAULT true,

    -- Restrictions
    can_access_code BOOLEAN DEFAULT false, -- Always false for security
    can_access_files BOOLEAN DEFAULT false, -- Always false for security
    can_view_sensitive_data BOOLEAN DEFAULT false, -- Always false for security

    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES users(id),

    UNIQUE(agent_id, workspace_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompting_agents_user_id ON prompting_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_prompting_agents_status ON prompting_agents(status);

CREATE INDEX IF NOT EXISTS idx_workspace_prompting_config_workspace_id ON workspace_prompting_config(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_prompting_config_agent_id ON workspace_prompting_config(assigned_agent_id);

CREATE INDEX IF NOT EXISTS idx_ai_prompts_workspace_id ON ai_prompts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_user_id ON ai_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_agent_id ON ai_prompts(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_status ON ai_prompts(status);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_submitted_at ON ai_prompts(submitted_at);

CREATE INDEX IF NOT EXISTS idx_prompting_logs_workspace_id ON prompting_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_prompting_logs_prompt_id ON prompting_logs(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompting_logs_created_at ON prompting_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_workspace_activity_patterns_workspace_id ON workspace_activity_patterns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_activity_patterns_type ON workspace_activity_patterns(pattern_type);

CREATE INDEX IF NOT EXISTS idx_prompting_agent_permissions_agent_id ON prompting_agent_permissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_prompting_agent_permissions_workspace_id ON prompting_agent_permissions(workspace_id);

-- Insert default prompting agent (yourself as the first agent)
INSERT INTO prompting_agents (user_id, agent_name, expertise_areas, status, max_concurrent_workspaces)
SELECT id, 'Claude Code Assistant',
       ARRAY['code_review', 'documentation', 'debugging', 'architecture', 'testing', 'optimization'],
       'active', 10
FROM users
WHERE name = 'will'
ON CONFLICT DO NOTHING;

-- Enable prompting for existing workspaces
INSERT INTO workspace_prompting_config (workspace_id, prompting_enabled, require_agent_review, ai_model)
SELECT id, true, true, 'gpt-4'
FROM projects
ON CONFLICT (workspace_id) DO NOTHING;

COMMENT ON TABLE prompting_agents IS 'Human agents who review and optimize AI prompts';
COMMENT ON TABLE workspace_prompting_config IS 'Configuration for prompting features per workspace';
COMMENT ON TABLE ai_prompts IS 'AI prompts and their optimization lifecycle';
COMMENT ON TABLE prompting_logs IS 'Activity logs for prompting dashboard and accountability';
COMMENT ON TABLE workspace_activity_patterns IS 'Non-sensitive activity patterns for prompt generation';
COMMENT ON TABLE prompting_agent_permissions IS 'Access control for prompting agents';