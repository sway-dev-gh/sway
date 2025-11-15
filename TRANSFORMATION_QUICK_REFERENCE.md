# Sway Transformation Quick Reference Guide

## Project Overview Summary

**Current State**: File-sharing and code review collaboration platform
**Target State**: Prompt Engineering Collaboration Tracker (PECT)
**Technology Stack**: Next.js (Frontend) + Express/Node.js (Backend) + PostgreSQL (Database)

---

## 1. PAGES ANALYSIS SUMMARY

### Frontend Pages (7 pages total)

| Page | Current Purpose | Transformation Action |
|------|-----------------|----------------------|
| `/dashboard` | Project overview & creation | Rename to "Collaboration Dashboard", replace file ops with prompt submission |
| `/workspace` | Collaborative file workspace | Convert to prompt collaboration with agent assignment |
| `/prompting` | Prompt engineering hub | **CORE** - Expand & enhance this |
| `/review` | Code review system | Adapt for prompt-specific feedback |
| `/teams` | Team management | Add prompt engineer/reviewer roles |
| `/settings` | User preferences | Add AI model & template settings |
| `/project/[id]` | Project detail view | Convert to prompt collaboration detail |

---

## 2. COMPONENT ANALYSIS SUMMARY

### Reusable Prompting Components (Ready to Use)
- **PromptCard.tsx** - Display prompt lifecycle (DIRECT REUSE)
- **ActivityLog.tsx** - Track all prompt operations (DIRECT REUSE)
- **AgentDashboard.tsx** - Manage agents (DIRECT REUSE)
- **PermissionManager.tsx** - Handle access control (DIRECT REUSE)

### Components Needing Adaptation
- **CollaborativeTextEditor.tsx** - Remove file-specific features
- **CollaborativeCursors.tsx** - Track prompt readers instead
- **FileVersionHistory.tsx** - Show optimization rounds

### Layout Components (Minimal Changes)
- **AppLayout.tsx** - Reuse with label updates
- **Sidebar.tsx** - Update navigation labels

---

## 3. DATA TYPES & INTERFACES

### Core Models Already Implemented
```
Prompt {
  id, original_prompt, optimized_prompt
  prompt_type (general, code_review, documentation, bug_fix, optimization, testing)
  status (pending, agent_review, optimized, approved, executed, rejected)
  priority (low, medium, high, urgent)
  submitted_at, agent_id, user_id
  ai_response, execution_time_ms, tokens_used
}

Agent {
  id, agent_name, expertise_areas[]
  status (active, inactive, busy)
  max_concurrent_workspaces, response_time_avg
}

WorkspaceConfig {
  workspace_id, prompting_enabled, assigned_agent_id
  auto_approve_simple_prompts, require_agent_review
  ai_model, max_prompt_length
}

ActivityLogEntry {
  workspace_id, prompt_id, agent_id, user_id
  action, description, workflow_context
  activity_pattern, metadata, created_at
}
```

### Models to Create/Transform
```
PromptCollaboration (replaces Project)
PromptVersion (tracks optimization iterations)
PromptFeedback (aggregates feedback)
PromptTemplate (reusable templates)
```

---

## 4. BACKEND API ENDPOINTS

### Current Endpoints Structure

**File-Based** (`/api/files/`, `/api/projects/`)
```
POST   /api/files/upload        - Upload file
GET    /api/files               - List files
DELETE /api/files/:id           - Delete file
```

**Prompting** (`/api/prompting/`)
```
GET    /api/prompting/agents           - List agents ✓
POST   /api/prompting/agents           - Create agent ✓
GET    /api/prompting/prompts          - List prompts ✓
POST   /api/prompting/prompts          - Submit prompt ✓
GET    /api/prompting/stats            - Dashboard stats ✓
GET    /api/prompting/workspace-config - Get config ✓
```

### New Endpoints Needed

```
POST   /api/collaborations              - Create collaboration
GET    /api/collaborations              - List collaborations
PUT    /api/collaborations/:id          - Update collaboration

POST   /api/prompts                     - Submit prompt (wrap existing)
GET    /api/prompts/:id/feedback        - Get feedback
POST   /api/prompts/:id/feedback        - Add feedback

POST   /api/prompts/:id/versions        - Get version history
POST   /api/prompts/:id/optimize        - Request optimization

GET    /api/templates                   - List templates
POST   /api/templates                   - Create template
```

---

## 5. DATABASE SCHEMA

### Tables Already Implemented
```
ai_prompts              ✓ Main prompt storage
prompting_agents        ✓ Agent management
workspace_prompting_config ✓ Workspace settings
prompting_logs          ✓ Activity tracking
prompting_agent_permissions ✓ Access control
```

### Tables to Create
```
prompt_collaborations       - Collaboration workspace
prompt_versions            - Optimization iterations
prompt_feedback           - Structured feedback
prompt_templates          - Reusable templates
collaboration_members     - Team membership
collaboration_permissions - Detailed RBAC
```

### Tables to Extend
```
ai_prompts:
  + collaboration_id (FK to prompt_collaborations)
  + version_number (tracking iterations)
  + feedback_id (link to main feedback)
  + review_rounds (count of optimization cycles)
```

---

## 6. TRANSFORMATION ROADMAP

### Phase 1: Foundation (Weeks 1-2)
- Create `prompt_collaborations` table
- Create `prompt_versions` table
- Extend `ai_prompts` with new fields
- Create collaboration backend service
- ✓ Already have prompting foundation

### Phase 2: Frontend Transformation (Weeks 2-3)
- Adapt Dashboard page
- Adapt Workspace page
- Update sidebar navigation
- Create collaboration detail components
- Enhance PromptCard display

### Phase 3: Feedback System (Weeks 3-4)
- Create `prompt_feedback` table
- Adapt Review page for prompts
- Implement feedback aggregation
- Build feedback UI components

### Phase 4: Advanced Features (Weeks 4-6)
- Template system
- Real-time prompt co-editing
- Batch operations
- Analytics dashboard
- AI model selection UI

---

## 7. KEY MIGRATION POINTS

### Frontend Changes Required
```
Dashboard
  - "Create Project" → "Create Collaboration"
  - "Upload Files" → "Submit Prompt"
  - File list → Collaboration list
  - Recent projects → Recent collaborations

Workspace
  - File tree → Prompt history
  - "Share" → "Collaborate"
  - Add agent assignment UI
  - Keep collaborative cursors

Prompting (EXPAND)
  - Add collaboration context
  - Show feedback aggregation
  - Display version history
  - Agent performance metrics

Review (ADAPT)
  - Map to prompts instead of files
  - Add optimization quality rating
  - Feedback threading
  - Status workflow for prompts
```

### Backend Changes Required
```
Services to Create:
  - promptCollaborations.js
  - promptVersioning.js
  - promptFeedback.js
  - promptTemplates.js

Services to Extend:
  - prompting.js (add collaboration logic)
  - prompting.js (add versioning)
  - prompting.js (add template support)

Routes to Create/Adapt:
  - /api/collaborations/* (new)
  - /api/prompts/* (new, wrapper)
  - /api/prompting/* (extend)
  - /api/templates/* (new)
```

---

## 8. REUSABILITY MATRIX

### Can Reuse As-Is (Direct Copy)
- ✓ PromptCard.tsx
- ✓ ActivityLog.tsx
- ✓ AgentDashboard.tsx
- ✓ PermissionManager.tsx
- ✓ prompting_agents table
- ✓ workspace_prompting_config table
- ✓ prompting_logs table
- ✓ ai_prompts table (mostly)
- ✓ /api/prompting/agents endpoints
- ✓ /api/prompting/stats endpoints

### Can Reuse with Modifications
- ~ CollaborativeTextEditor.tsx (remove file refs)
- ~ CollaborativeCursors.tsx (adapt for prompts)
- ~ FileVersionHistory.tsx (show optimization rounds)
- ~ Review page (prompt-specific comments)
- ~ AppLayout.tsx (navigation updates)
- ~ Sidebar.tsx (label changes)
- ~ /api/prompting/* (extend with collaboration)
- ~ /api/projects/* (adapt for collaborations)

### Need to Create New
- New PromptCollaboration component
- New PromptVersionHistory component
- New FeedbackAggregator component
- New PromptTemplateSelector component
- New prompt_collaborations table
- New prompt_versions table
- New prompt_feedback table
- New /api/collaborations/* endpoints
- New /api/templates/* endpoints
- New /api/prompts/* endpoints

---

## 9. IMPLEMENTATION EFFORT ESTIMATE

### Estimated Effort by Phase

| Phase | Duration | Effort Level | Key Tasks |
|-------|----------|--------------|-----------|
| 1: Foundation | 1-2 weeks | Medium | DB, services, basic API |
| 2: Frontend | 1-2 weeks | High | UI components, pages |
| 3: Feedback | 1-2 weeks | Medium | Comments, threading |
| 4: Advanced | 2-3 weeks | High | Templates, analytics |

**Total Estimated Time**: 5-9 weeks
**Team Size**: 1-2 developers

---

## 10. FILE LOCATIONS REFERENCE

### Frontend Files
```
/app/dashboard/page.tsx          → Transform
/app/workspace/page.tsx          → Transform
/app/prompting/page.tsx          → Enhance
/app/review/page.tsx             → Adapt
/app/teams/page.tsx              → Extend
/app/settings/page.tsx           → Extend
/app/project/[id]/page.tsx       → Transform

/components/prompting/*.tsx      → Mostly reuse
/components/AppLayout.tsx        → Minor changes
/components/Sidebar.tsx          → Update labels
```

### Backend Files
```
/backend/src/routes/prompting.js       → Extend
/backend/src/routes/projects.js        → Adapt
/backend/src/routes/files.js           → Create wrapper
/backend/src/routes/reviews.js         → Adapt

/backend/src/services/prompting.js     → Extend
/backend/migrations/006_prompting_agent_system.sql → Existing
```

### Database Files
```
/backend/migrations/006_prompting_agent_system.sql    → Existing
/backend/migrations/[NEW]_collaborations.sql          → Create
/backend/migrations/[NEW]_versions.sql                → Create
/backend/migrations/[NEW]_feedback.sql                → Create
/backend/src/db/schema.sql                             → Update
```

---

## 11. SUCCESS CRITERIA

### MVP (Minimum Viable Product)
- [x] Agents system (already implemented)
- [ ] Prompt submission workflow
- [ ] Collaboration concept replaces projects
- [ ] Feedback system for prompts
- [ ] Activity tracking
- [ ] UI displays collaborative context

### Production Ready
- [ ] Template library
- [ ] Batch operations
- [ ] Real-time collaboration
- [ ] AI model selection
- [ ] Performance metrics
- [ ] Advanced analytics

---

## 12. QUICK START FOR DEVELOPMENT

### Key Files to Review First
1. `/app/prompting/page.tsx` - Core UI (understand structure)
2. `/backend/src/routes/prompting.js` - Core API (understand patterns)
3. `/backend/migrations/006_prompting_agent_system.sql` - DB schema
4. `/components/prompting/` - Component patterns

### Development Order
1. Create new database tables
2. Create collaboration backend service
3. Create collaboration API endpoints
4. Update dashboard UI for collaborations
5. Create collaboration detail page
6. Implement feedback system
7. Enhance prompting dashboard

### Testing Strategy
- Unit tests for new services
- Integration tests for API endpoints
- E2E tests for user workflows
- Component tests for new UI components
