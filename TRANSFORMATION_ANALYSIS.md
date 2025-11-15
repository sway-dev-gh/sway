# Sway Project Structure Analysis: Current State & Transformation Plan

## Executive Summary

Sway is a collaborative platform built with Next.js (frontend) and Express/Node.js (backend) that currently functions as a file-sharing and code review collaboration tool. The platform already has a foundation for prompt engineering collaboration (prompting module) that needs to be expanded and integrated.

---

## 1. CURRENT PAGES AND THEIR PURPOSES

### Frontend Pages (Next.js App Router)

#### 1.1 Dashboard (`/app/dashboard/page.tsx`)
**Purpose**: Main entry point for authenticated users
- **Current Functionality**:
  - Display recent projects (max 3)
  - Create new projects
  - Upload files
  - Project type selection (review, collaboration, shared_folder)
- **Data Structures**:
  - `Project` interface: id, title, description, project_type, created_at, status
- **Key Operations**:
  - GET `/api/projects` - Fetch user's projects
  - POST `/api/projects` - Create new project
  - POST `/api/files/upload` - Upload files to projects
- **Transformation Need**: Replace file operations with prompt submission workflows

#### 1.2 Workspace (`/app/workspace/page.tsx`)
**Purpose**: Collaborative project environment
- **Current Functionality**:
  - Select active project
  - Upload files to selected project
  - Share projects via link or email
  - Project settings management
  - Display collaborative cursors
- **Key Operations**:
  - GET `/api/projects` - List user projects
  - POST `/api/files/upload` - Upload to project
  - POST `/api/projects/invite` - Send invitations
  - PUT `/api/projects/{id}` - Update project settings
- **Transformation Need**: Convert to prompt collaboration workspace with agent assignment

#### 1.3 Prompting (`/app/prompting/page.tsx`)
**Purpose**: AI prompt engineering dashboard with human oversight
- **Current Functionality**:
  - Submit prompts with type and priority
  - View prompt lifecycle (pending → agent_review → optimized → approved → executed)
  - View agent status and availability
  - Manage agent permissions
  - Activity logging
- **Key Operations**:
  - GET `/api/prompting/agents` - List prompting agents
  - GET `/api/prompting/prompts` - List user's prompts
  - GET `/api/prompting/workspace-config` - Get workspace settings
  - POST `/api/prompting/prompts` - Submit new prompt
- **Status**: Partially implemented, needs expansion
- **Transformation Need**: This is the core module - enhance and extend

#### 1.4 Review (`/app/review/page.tsx`)
**Purpose**: Code review and file review management
- **Current Functionality**:
  - List reviews assigned/created
  - Add comments and suggestions
  - Update review status (pending, in_progress, approved, rejected, needs_changes)
  - Rate reviews
  - View version history
- **Key Operations**:
  - GET `/api/reviews` - List reviews
  - POST `/api/reviews/{id}/comments` - Add feedback
  - PUT `/api/reviews/{id}` - Update status
- **Transformation Need**: Adapt review system to work with prompts instead of files

#### 1.5 Teams (`/app/teams/page.tsx`)
**Purpose**: Team management and collaboration
- **Current Functionality**:
  - Manage team members
  - Send invitations
  - Set member roles and permissions
  - Configure team settings
- **Key Operations**:
  - POST `/api/teams/invite` - Send team invitations
- **Transformation Need**: Extend to support prompt engineering team roles

#### 1.6 Settings (`/app/settings/page.tsx`)
**Purpose**: User account and preferences
- **Current Functionality**:
  - Account settings (email, username)
  - Notification preferences
  - API key management
  - Automation rules
  - Theme and editor preferences
- **Transformation Need**: Add prompting-specific settings (AI model, prompt templates, etc.)

#### 1.7 Project Detail (`/app/project/[id]/page.tsx`)
**Purpose**: Individual project workspace
- **Current Functionality**: Project-specific file management
- **Transformation Need**: Project-specific prompt management

---

## 2. KEY COMPONENTS AND THEIR FUNCTIONALITY

### Prompting Components (`/components/prompting/`)

#### 2.1 PromptCard.tsx
- **Purpose**: Display individual prompt with lifecycle status
- **Props**:
  - id, originalPrompt, optimizedPrompt, promptType, status, priority, submittedAt
  - agentId, aiResponse, executionTimeMs, tokensUsed
  - onUpdate callback
- **Features**:
  - Color-coded status indicators
  - Priority and type icons
  - Expandable details
  - Optimization preview
- **Transformation**: Already prompt-focused, minimal changes needed

#### 2.2 ActivityLog.tsx
- **Purpose**: Real-time activity tracking for prompting operations
- **Props**:
  - workspaceId, promptId, agentId, limit, autoRefresh, showFilters
- **Features**:
  - Auto-refreshing activity stream
  - Filterable by action and pattern
  - Time range filtering (hour, day, week, month)
- **Data Structure**:
  ```typescript
  ActivityLogEntry {
    id, workspace_id, prompt_id, agent_id, user_id,
    action, description, workflow_context, activity_pattern,
    metadata, created_at
  }
  ```
- **Transformation**: Fully applicable, already designed for prompting

#### 2.3 AgentDashboard.tsx
- **Purpose**: Agent management interface
- **Features**:
  - Create new prompting agents
  - Update agent status
  - View agent expertise areas
- **Transformation**: Core component for agent management in transformed system

#### 2.4 PermissionManager.tsx
- **Purpose**: Control access and permissions for prompting operations
- **Features**:
  - Assign user permissions
  - Configure role-based access control
  - Manage permission inheritance
- **Transformation**: Already handles prompting permissions

### Core Layout Components

#### 2.5 AppLayout.tsx
- **Purpose**: Main application layout wrapper
- **Contains**: Sidebar, header, main content area
- **Transformation Need**: Minimal - adjust navigation labels

#### 2.6 Sidebar.tsx
- **Purpose**: Navigation menu
- **Current Items**: Dashboard, Workspace, Prompting, Review, Teams, Settings
- **Transformation Need**: Relabel "Workspace" to "Prompt Workspace", update descriptions

#### 2.7 CollaborativeTextEditor.tsx
- **Purpose**: Real-time collaborative text editing
- **Transformation Need**: Adapt for prompt collaboration instead of file editing

---

## 3. DATA TYPES AND INTERFACES

### Core Domain Models

#### 3.1 Prompt Model
```typescript
interface Prompt {
  id: string
  original_prompt: string
  optimized_prompt?: string
  prompt_type: 'general' | 'code_review' | 'documentation' | 'bug_fix' | 'optimization' | 'testing'
  status: 'pending' | 'agent_review' | 'optimized' | 'approved' | 'executed' | 'rejected'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  submitted_at: string
  agent_id?: string
  user_id: string
  ai_response?: string
  execution_time_ms?: number
  tokens_used?: number
  created_at?: string
  updated_at?: string
}
```
**Database Table**: `ai_prompts`
**Required Additions for PECT**:
- collaboration_id
- review_rounds (number of optimization cycles)
- feedback_history (array of feedback objects)

#### 3.2 Agent Model
```typescript
interface Agent {
  id: string
  agent_name: string
  expertise_areas: string[]
  status: 'active' | 'inactive' | 'busy'
  max_concurrent_workspaces: number
  response_time_avg: number
  user_id?: string
  created_at?: string
}
```
**Database Table**: `prompting_agents`
**Status**: Fully implemented

#### 3.3 Workspace Config Model
```typescript
interface WorkspaceConfig {
  id: string
  workspace_id: string
  prompting_enabled: boolean
  assigned_agent_id?: string
  auto_approve_simple_prompts: boolean
  require_agent_review: boolean
  ai_model: string
  max_prompt_length: number
}
```
**Database Table**: `workspace_prompting_config`
**Status**: Fully implemented

#### 3.4 Activity Log Entry Model
```typescript
interface ActivityLogEntry {
  id: string
  workspace_id: string
  prompt_id?: string
  agent_id?: string
  user_id?: string
  action: string
  description: string
  workflow_context?: string
  activity_pattern?: string
  metadata: Record<string, any>
  created_at: string
}
```
**Database Table**: `prompting_logs`
**Status**: Fully implemented

#### 3.5 File-Based Models (TO BE TRANSFORMED)
```typescript
// Current model
interface Project {
  id: string
  title: string
  description: string
  project_type: string
  created_at: string
  status: string
  collaborator_count?: number
  file_count?: number
}

interface Review {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'needs_changes'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  feedback?: string
  rating?: number
  comment_count: number
  reviewer_email: string
}
```
**Transformation**: Convert Projects → PromptCollaborations, Reviews → PromptReviews

---

## 4. BACKEND ROUTES AND ENDPOINTS

### Current API Endpoints

#### 4.1 Projects Routes (`/api/projects`)
```
GET    /api/projects                    - List user's projects
POST   /api/projects                    - Create new project
GET    /api/projects/:id                - Get project details
PUT    /api/projects/:id                - Update project
DELETE /api/projects/:id                - Delete project
POST   /api/projects/invite             - Send project invite
```
**File**: `/backend/src/routes/projects.js`
**Transformation**: Adapt to handle prompt collaborations

#### 4.2 Files Routes (`/api/files`)
```
GET    /api/files                       - List user's files
POST   /api/files/upload                - Upload file
GET    /api/files/:id                   - Download file
```
**File**: `/backend/src/routes/files.js`
**Transformation**: Convert to `/api/prompts/` with prompt submission

#### 4.3 Prompting Routes (`/api/prompting`)
```
GET    /api/prompting/agents            - List agents
POST   /api/prompting/agents            - Create agent
GET    /api/prompting/prompts           - List prompts
POST   /api/prompting/prompts           - Submit new prompt
PUT    /api/prompting/prompts/:id       - Update prompt
GET    /api/prompting/workspace-config  - Get config
POST   /api/prompting/workspace-config  - Update config
GET    /api/prompting/stats             - Dashboard stats
```
**File**: `/backend/src/routes/prompting.js`
**Status**: Core endpoints implemented
**Transformation**: Extend and enhance

#### 4.4 Reviews Routes (`/api/reviews`)
```
GET    /api/reviews                     - List reviews
POST   /api/reviews/:id/comments        - Add comment
PUT    /api/reviews/:id                 - Update review
GET    /api/reviews/by-status/:status   - Filter by status
```
**Transformation**: Adapt to prompt-specific reviews

#### 4.5 Teams Routes (`/api/teams`)
```
POST   /api/teams/invite                - Send invitation
GET    /api/teams                       - List team members
PUT    /api/teams/:userId/role          - Update member role
```
**Transformation**: Extend role definitions for prompting teams

### Database Schema (Key Tables)

#### 4.6 Primary Tables

**ai_prompts** (Core)
```sql
id UUID PRIMARY KEY
workspace_id UUID NOT NULL (REFERENCES projects)
user_id UUID NOT NULL (REFERENCES users)
agent_id UUID (REFERENCES prompting_agents)
original_prompt TEXT NOT NULL
optimized_prompt TEXT
prompt_type VARCHAR(100)
status VARCHAR(50) -- pending, agent_review, optimized, approved, executed, rejected
priority VARCHAR(20)
submitted_at TIMESTAMP
agent_reviewed_at TIMESTAMP
executed_at TIMESTAMP
completed_at TIMESTAMP
ai_response TEXT
execution_time_ms INTEGER
tokens_used INTEGER
created_at TIMESTAMP
updated_at TIMESTAMP
```

**prompting_agents** (Core)
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL (REFERENCES users)
agent_name VARCHAR(255)
expertise_areas TEXT[]
status VARCHAR(50)
max_concurrent_workspaces INTEGER
response_time_avg INTEGER
created_at TIMESTAMP
updated_at TIMESTAMP
```

**workspace_prompting_config** (Core)
```sql
id UUID PRIMARY KEY
workspace_id UUID NOT NULL UNIQUE (REFERENCES projects)
prompting_enabled BOOLEAN
assigned_agent_id UUID (REFERENCES prompting_agents)
auto_approve_simple_prompts BOOLEAN
require_agent_review BOOLEAN
ai_model VARCHAR(100)
max_prompt_length INTEGER
created_at TIMESTAMP
updated_at TIMESTAMP
```

**prompting_logs** (Core)
```sql
id UUID PRIMARY KEY
workspace_id UUID NOT NULL (REFERENCES projects)
prompt_id UUID (REFERENCES ai_prompts)
agent_id UUID (REFERENCES prompting_agents)
user_id UUID (REFERENCES users)
action VARCHAR(100)
description TEXT
metadata JSONB
workflow_context VARCHAR(255)
activity_pattern VARCHAR(255)
created_at TIMESTAMP
```

---

## 5. TRANSFORMATION MAPPING: File Sharing → Prompt Engineering

### 5.1 Page Transformation Matrix

| Current Page | New Purpose | Key Changes |
|--------------|-------------|------------|
| Dashboard | Prompt Engineering Dashboard | Replace "Recent Projects" with "Recent Collaborations", "Upload Files" with "Submit Prompt" |
| Workspace | Prompt Collaboration Workspace | Replace file tree with prompt history, change "Share" to "Collaborate", keep agent assignment |
| Prompting | Prompt Engineering Collaboration | **EXPAND** - already core component |
| Review | Prompt Review & Feedback | Adapt review system for prompt feedback instead of file comments |
| Teams | Collaboration Teams | Add "Prompt Engineer" and "Prompt Reviewer" roles |
| Settings | User & Prompt Settings | Add "AI Model Preferences", "Prompt Templates", "Auto-review Thresholds" |

### 5.2 Component Transformation Matrix

| Current Component | New Purpose | Reusability |
|-------------------|-------------|------------|
| PromptCard | Display prompt lifecycle | **Direct Reuse** |
| ActivityLog | Track prompt operations | **Direct Reuse** |
| AgentDashboard | Manage agents | **Direct Reuse** |
| PermissionManager | Control access | **Direct Reuse** |
| CollaborativeTextEditor | Edit prompts in real-time | **Adapt** - remove file-specific features |
| CollaborativeCursors | Show active collaborators | **Adapt** - track prompt readers |
| FileVersionHistory | Prompt iteration history | **Transform** - show optimization rounds |

### 5.3 Data Model Transformation

**Old: File-Centric Model**
```
Project
  ├── Files (uploaded)
  ├── Reviews (on files)
  └── Comments (on review)

Collaborations linked to Projects
```

**New: Prompt-Centric Model**
```
PromptCollaboration (replaces Project)
  ├── Prompts (submitted)
  ├── PromptReviews (feedback loops)
  ├── PromptVersions (optimization cycles)
  ├── PromptFeedback (agent reviews)
  └── CollaborationEvents (activity log)

Agents assigned to Collaborations
Permissions based on collaboration role
```

### 5.4 API Endpoint Transformation

**Old Endpoints (File-Based)**
```
POST   /api/files/upload
GET    /api/files/:id
DELETE /api/files/:id
POST   /api/reviews/:fileId/comment
```

**New Endpoints (Prompt-Based)**
```
POST   /api/prompts                           # Submit new prompt
GET    /api/prompts/:id                       # Get prompt details
PUT    /api/prompts/:id                       # Update prompt
POST   /api/prompts/:id/feedback              # Add feedback
POST   /api/prompts/:id/optimize              # Request optimization
GET    /api/prompts/:id/versions              # Get iteration history
GET    /api/collaborations                    # List collaborations
POST   /api/collaborations                    # Create collaboration
```

---

## 6. DETAILED IMPLEMENTATION ROADMAP

### Phase 1: Core Prompting Infrastructure (Already Partially Complete)
- [x] Prompting agents system
- [x] AI prompts table with lifecycle
- [x] Workspace prompting config
- [x] Activity logging
- [x] Permission management
- [ ] **Expand**: Support multiple optimization rounds
- [ ] **Expand**: Feedback aggregation system
- [ ] **Expand**: Prompt template library

### Phase 2: Frontend UI Transformation
- [ ] Rename "Dashboard" → "Collaboration Dashboard"
- [ ] Replace file upload with prompt submission forms
- [ ] Create prompt collaboration workspace interface
- [ ] Build prompt version history viewer
- [ ] Create feedback aggregation display
- [ ] Build prompt template selector

### Phase 3: Review System Integration
- [ ] Adapt Review page for prompt feedback
- [ ] Create prompt-specific comment types (suggestion, optimization, approval)
- [ ] Build feedback threading system
- [ ] Implement rating system for optimization quality

### Phase 4: Collaboration Enhancements
- [ ] Real-time prompt co-editing
- [ ] Agent assignment UI
- [ ] Async collaboration notifications
- [ ] Prompt sharing and permissions

### Phase 5: Advanced Features
- [ ] Prompt template library
- [ ] Batch prompt processing
- [ ] Performance analytics (optimization improvement %)
- [ ] AI model selection per collaboration
- [ ] Custom approval workflows

---

## 7. KEY MIGRATION POINTS

### Backend Services to Migrate/Create

#### 7.1 Services to Adapt
- **projects.js** → Create new **collaborations.js**
- **files.js** → Create new **prompts.js**
- **reviews.js** → Create **promptReviews.js**

#### 7.2 Services to Extend
- **prompting.js** - Add collaboration and feedback management
- **prompting.js** - Add version history tracking
- **prompting.js** - Add template management

#### 7.3 Services to Create
- **promptCollaborations.js** - Manage collaboration lifecycle
- **promptVersioning.js** - Manage prompt iterations
- **promptFeedback.js** - Aggregate and manage feedback
- **promptTemplates.js** - Template management

### Database Migrations Needed

#### 7.4 Tables to Create
```sql
prompt_collaborations         # Replace projects with collaboration concept
prompt_versions               # Track optimization iterations
prompt_feedback              # Structured feedback storage
prompt_templates             # Reusable prompt templates
collaboration_permissions   # Detailed access control
collaboration_members       # Team membership
```

#### 7.5 Tables to Modify
```sql
ai_prompts                   # Add collaboration_id, feedback_id, version_number
prompting_logs              # Already supports this purpose
```

---

## 8. DATA FLOW CHANGES

### Current Flow (File Sharing)
```
User → Upload File → Project → Share Link/Email → Reviewer → Comments → Status Update
```

### New Flow (Prompt Engineering)
```
User → Submit Prompt → Collaboration → Assign Agent → 
Agent Reviews → Suggests Optimization → 
System Optimizes → Feedback Thread → 
Approval Decision → Execute/Reject → 
Activity Log Entry
```

---

## Summary

The Sway platform already has a solid foundation for prompt engineering collaboration through its prompting module. The transformation focuses on:

1. **Reusing existing prompting infrastructure** - Agents, permissions, activity logs are already in place
2. **Adapting file-centric components** - Workspace, projects, reviews need UI/logic adjustments
3. **Creating new collaboration models** - Prompt collaborations, versioning, feedback systems
4. **Extending backend services** - Add prompt-specific business logic
5. **Maintaining auth and security** - Existing authentication and rate limiting apply

The transformation is achievable with an estimated 4-6 weeks of development effort, leveraging the existing codebase structure and patterns.
