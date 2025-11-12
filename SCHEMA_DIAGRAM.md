# SwayFiles Database Schema Diagram (Simplified)

## Core Data Relationships

```
┌─────────────┐
│   users     │  (Account Management)
│ - id        │
│ - email     │
│ - plan      │
└──────┬──────┘
       │
       ├──────────────────────────────┬──────────────────────┐
       │                              │                      │
       ▼                              ▼                      ▼
┌──────────────────┐    ┌─────────────────────┐   ┌──────────────┐
│  file_requests   │    │     projects        │   │  team_members│
│ - id             │    │ - id                │   │ - owner_id   │
│ - user_id (FK)   │    │ - user_id (FK)      │   │ - email      │
│ - short_code     │    │ - project_type      │   │ - role       │
│ - title          │    │ - status            │   │ - status     │
│ - custom_fields  │    │ - visibility        │   └──────────────┘
│ - expires_at     │    └──────────┬──────────┘
└──────┬───────────┘               │
       │                           │
       │            ┌──────────────┴──────────────────┐
       │            │                                 │
       ▼            ▼                                 ▼
┌──────────────┐  ┌─────────────────┐    ┌────────────────────┐
│   uploads    │  │ collaborations  │    │   project_files    │
│ - id         │  │ - id            │    │ - id               │
│ - request_id │  │ - project_id    │    │ - project_id (FK)  │
│ - file_name  │  │ - owner_id      │    │ - upload_id (FK)   │
│ - uploader_* │  │ - collaborator* │    │ - file_name        │
└──────────────┘  │ - role          │    │ - version          │
                  │ - permissions   │    │ - is_current_ver*  │
                  └────────┬────────┘    └────────────────────┘
                           │
         ┌─────────────────┴────────────────────┐
         │                                      │
         ▼                                      ▼
┌─────────────────┐                  ┌──────────────────┐
│  team_           │                  │    reviews       │
│  invitations    │                  │ - id             │
│ - inviter_id    │                  │ - project_id     │
│ - project_id    │                  │ - reviewer_id    │
│ - email         │                  │ - assigned_by_id │
│ - status        │                  │ - status         │
└─────────────────┘                  │ - priority       │
                                     │ - feedback       │
                                     └────────┬────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │review_comments   │
                                     │ - review_id (FK) │
                                     │ - user_id        │
                                     │ - parent_id      │
                                     │ - content        │
                                     │ - is_resolved    │
                                     └──────────────────┘
```

## Editing & Approval Workflows

```
┌──────────────────┐
│  project_files   │
│ - id             │
│ - project_id     │
│ - version        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  file_sections   │
│ - id             │
│ - project_file_* │
│ - section_name   │
│ - section_type   │
│ - is_locked      │
└────────┬─────────┘
         │
         ├──────────────────┬──────────────┐
         │                  │              │
         ▼                  ▼              ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│  edit_requests   │ │edit_sessions │ │edit_permissions  │
│ - id             │ │ - id         │ │ - user_id        │
│ - requester_id   │ │ - editor_id  │ │ - permission_type│
│ - approver_id    │ │ - is_active  │ │ - scope          │
│ - status         │ │ - session_*  │ │ - conditions     │
│ - proposed_*     │ └────────┬─────┘ └──────────────────┘
│ - expires_at     │          │
└──────────────────┘          ▼
                      ┌──────────────────┐
                      │  edit_changes    │
                      │ - change_type    │
                      │ - change_data    │
                      │ - requires_appr* │
                      │ - approved_by*   │
                      └──────────────────┘
```

## Activity & Audit Trail

```
┌──────────────────┐
│  activity_log    │
│ - id             │
│ - user_id        │
│ - actor_id       │
│ - action         │  ← "file_uploaded", "review_completed", etc.
│ - resource_type  │  ← "project", "review", "collaboration"
│ - resource_id    │
│ - metadata       │
│ - created_at     │  ← Full history of all actions
└──────────────────┘
```

## Notification System

```
┌────────────────────────┐
│notification_subscription│
│ - user_id              │
│ - project_id (opt)     │
│ - collaboration_id(opt)│
│ - notification_type    │
│ - enabled              │
│ - delivery_method      │
└────────────────────────┘
```

## Supporting Tables

```
┌──────────────┐    ┌──────────────────┐    ┌────────────────┐
│ branding_    │    │  custom_domains  │    │ support_       │
│ settings     │    │ - domain         │    │ tickets        │
│ - logo_url   │    │ - verification_* │    │ - subject      │
│ - color      │    │ - is_active      │    │ - priority     │
└──────────────┘    └──────────────────┘    └────────────────┘

         ┌──────────────────┐
         │  integrations    │
         │ - provider       │  ← dropbox, google_drive
         │ - access_token   │
         │ - auto_sync      │
         │ - sync_folder    │
         └──────────────────┘
```

---

## Key Design Patterns

### 1. Request-Based Workflows
Files → Requests → Uploads → Reviews → Approvals

### 2. Role-Based Access Control (RBAC)
User roles in collaborations: viewer, editor, reviewer, owner
Granular permissions: can_view, can_edit, can_review, can_invite, can_manage

### 3. Project Organization
Projects group files and collaborators
Collaboration links users to projects with specific roles
Files versioned and tracked within projects

### 4. Approval Chains
Edit requests require explicit approval
Comments/reviews can be threaded
Status changes tracked with timestamps

### 5. Audit Trail
Every action logged in activity_log
User, action, resource, timestamp captured
Supports compliance and debugging

### 6. Temporal Design
- expires_at fields for time-limited items
- Automatic cleanup (hourly job)
- Timestamps on all major operations
- Triggers auto-update updated_at columns

---

## Database Statistics

Total Tables: 27
- Core Tables: 3 (users, file_requests, uploads)
- Collaboration Tables: 8 (projects, collaborations, reviews, review_comments, team_invitations, activity_log, notification_subscriptions, project_files)
- Editing Tables: 5 (file_sections, edit_requests, edit_sessions, edit_changes, edit_permissions)
- Premium/Support: 8 (team_members, support_tickets, branding_settings, custom_domains, integrations, + others)

Total Indexes: 29+
Primary Index Types:
- User/Resource lookups (user_id, request_id, project_id)
- Status filtering (status, visibility, role)
- Time-based queries (created_at DESC, expires_at, due_date)
- Full-text searches (email, domain, code)

Triggers: 8+
- Auto-update timestamps (updated_at columns)
- One per major table with update_updated_at_column() function

---

## Connection Information

**Production Connection Pool**:
- Library: `pg` (Node.js PostgreSQL client)
- Connection String: DATABASE_URL (Render format)
- Pool Settings: Default pg.Pool configuration
- SSL: Enabled in production
- Render Service: Managed PostgreSQL addon

**Development Connection**:
- Host: localhost:5432
- Database: sway
- Default User: postgres
- Connection Fallback: Individual env vars if DATABASE_URL not set
