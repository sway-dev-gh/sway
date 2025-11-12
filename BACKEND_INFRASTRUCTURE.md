# SwayFiles Backend Infrastructure Analysis

## Executive Summary

SwayFiles uses a **PostgreSQL database** with a Node.js/Express backend running on Render.com. The backend is structured with clear separation between database models, API routes, and middleware. The system has evolved from a simple file request service to a full collaboration platform with reviews, projects, and team management.

---

## 1. Database System

### Database Technology
- **System**: PostgreSQL (production-grade RDBMS)
- **Client Library**: `pg` npm package (native Node.js PostgreSQL driver)
- **Connection**: Pooled connections via `pg.Pool`
- **Database Name**: `sway`
- **Location**: Render.com managed PostgreSQL service

### Database Connection Configuration
**File**: `/Users/wjc2007/Desktop/sway/backend/src/db/pool.js`

```javascript
// Uses DATABASE_URL in production (Render format)
// Falls back to individual env vars in development:
// - DB_USER (default: postgres)
// - DB_HOST (default: localhost)
// - DB_NAME (default: sway)
// - DB_PASSWORD (default: postgres)
// - DB_PORT (default: 5432)
```

**SSL Configuration**: 
- Enabled in production environments
- Disabled in development

---

## 2. Current Database Schema (27 Tables)

### Core Tables (Foundation)

#### **users**
```sql
id (UUID PRIMARY KEY)
email (UNIQUE)
password_hash
name
plan (free, pro, business) -- Stripe integration
stripe_customer_id
stripe_subscription_id
storage_limit_gb
custom_domain
branding_elements (JSONB)
created_at
```
**Purpose**: User accounts and subscription management

#### **file_requests**
```sql
id (UUID PRIMARY KEY)
user_id (FK → users)
short_code (UNIQUE, 8-char code for public sharing)
title
description
request_type (text, images, documents, designs, etc.)
time_limit_days (expiration)
custom_fields (JSONB) -- Dynamic form fields
field_requirements (JSONB) -- Field validation rules
expires_at (calculated from time_limit_days)
is_active (boolean)
password_hash (optional protection)
require_email, require_name (form requirements)
created_at
```
**Purpose**: File request creation and public sharing
**Usage Pattern**: Users create a request, get a short code (e.g., "abc12345"), share with others who upload files

#### **uploads**
```sql
id (UUID PRIMARY KEY)
request_id (FK → file_requests)
uploader_name
uploader_email
file_name
file_size (BIGINT)
storage_path (local filesystem path)
uploaded_at
```
**Purpose**: Track uploaded files and metadata
**Storage**: Local filesystem (`/src/uploads/`)

### Premium/Collaboration Features (Post-MVP)

#### **projects**
```sql
id (UUID PRIMARY KEY)
user_id (FK → users) -- Project owner
title
description
project_type (review, collaboration, shared_folder)
status (active, paused, completed, archived)
visibility (private, team, public)
settings (JSONB) -- Custom project configuration
due_date
completed_at
created_at
updated_at
```
**Purpose**: Group files and collaborators together

#### **collaborations**
```sql
id (UUID PRIMARY KEY)
project_id (FK → projects, nullable)
request_id (FK → file_requests, nullable)
owner_id (FK → users) -- Who invited
collaborator_id (FK → users) -- Who was invited
role (viewer, editor, reviewer, owner)
permissions (JSONB default:
  {
    "can_view": true,
    "can_edit": false,
    "can_review": false,
    "can_invite": false,
    "can_manage": false
  }
)
status (pending, active, paused, ended)
invited_at
accepted_at
last_activity_at
created_at
updated_at
UNIQUE(project_id, collaborator_id)
UNIQUE(request_id, collaborator_id)
```
**Purpose**: Manage user access and roles

#### **reviews**
```sql
id (UUID PRIMARY KEY)
project_id (FK → projects, nullable)
request_id (FK → file_requests, nullable)
upload_id (FK → uploads, nullable)
reviewer_id (FK → users)
assigned_by_id (FK → users)
title
status (pending, in_progress, approved, rejected, needs_changes)
priority (low, medium, high, urgent)
feedback (TEXT)
rating (1-5)
review_data (JSONB) -- Structured feedback
due_date
started_at
completed_at
created_at
updated_at
```
**Purpose**: Structured review workflow

#### **review_comments**
```sql
id (UUID PRIMARY KEY)
review_id (FK → reviews)
user_id (FK → users)
parent_id (FK → review_comments, nullable) -- Threading
content (TEXT)
comment_type (comment, suggestion, approval, rejection)
metadata (JSONB) -- Annotations, timestamps
is_resolved (boolean)
resolved_by_id (FK → users)
resolved_at
created_at
updated_at
```
**Purpose**: Threaded comments within reviews

#### **project_files**
```sql
id (UUID PRIMARY KEY)
project_id (FK → projects)
upload_id (FK → uploads, nullable)
request_id (FK → file_requests, nullable)
file_name
file_size (BIGINT)
file_type (mime type)
storage_path
version (INTEGER)
is_current_version (boolean)
uploaded_by_id (FK → users)
upload_source (direct, request, integration)
metadata (JSONB)
created_at
```
**Purpose**: File versioning and project organization

### Editing/Collaborative Features (Migration 015)

#### **file_sections**
```sql
id (UUID PRIMARY KEY)
project_file_id (FK → project_files)
section_name (e.g., "Paragraph 3", "Header", "Slide 5-8", "Layer 1")
section_type (text, image, slide, layer, page, element)
section_data (JSONB) -- Coordinates, ranges, identifiers
description
is_locked (boolean) -- Locked during editing
locked_by_id (FK → users)
locked_at
created_by_id (FK → users)
created_at
updated_at
UNIQUE(project_file_id, section_name)
```
**Purpose**: Define granular sections for editing

#### **edit_requests**
```sql
id (UUID PRIMARY KEY)
file_section_id (FK → file_sections, nullable)
project_file_id (FK → project_files, nullable)
requester_id (FK → users) -- Who wants to edit
approver_id (FK → users, nullable) -- Who approved
title
description
edit_type (modify, add, delete, replace, format)
target_section_name
target_section_data (JSONB)
status (pending, approved, denied, in_progress, completed, expired)
priority (low, normal, high, urgent)
proposed_changes (JSONB)
change_reason (TEXT)
approval_message
conditions (TEXT)
estimated_time_minutes
due_date
expires_at (7 days default)
requested_at
approved_at
denied_at
started_at
completed_at
original_version
edit_version
created_at
updated_at
```
**Purpose**: Request-based editing with approval workflows

#### **edit_sessions**
```sql
id (UUID PRIMARY KEY)
edit_request_id (FK → edit_requests)
editor_id (FK → users)
session_type (exclusive, collaborative, review)
session_data (JSONB)
is_active (boolean)
last_activity_at
cursor_position (JSONB)
started_at
ended_at
created_at
updated_at
```
**Purpose**: Track active editing sessions

#### **edit_changes**
```sql
id (UUID PRIMARY KEY)
edit_session_id (FK → edit_sessions)
change_type (insert, delete, modify, format, move, etc.)
change_data (JSONB) -- Before/after content
change_description
target_section (JSONB)
change_size (INTEGER)
is_minor (boolean)
requires_approval (boolean)
approved_by_id (FK → users)
approved_at
created_at
```
**Purpose**: Audit trail of changes

#### **edit_permissions**
```sql
id (UUID PRIMARY KEY)
collaboration_id (FK → collaborations, nullable)
file_section_id (FK → file_sections, nullable)
project_file_id (FK → project_files, nullable)
user_id (FK → users)
granted_by_id (FK → users)
permission_type (read, edit, approve, lock, unlock, comment)
scope (section, file, project)
conditions (JSONB) -- Time limits, change limits
is_active (boolean)
granted_at
revoked_at
expires_at
created_at
UNIQUE(user_id, file_section_id, permission_type)
UNIQUE(user_id, project_file_id, permission_type)
```
**Purpose**: Fine-grained permission control

### Supporting Tables

#### **team_invitations** (Migration 014)
```sql
id (UUID PRIMARY KEY)
inviter_id (FK → users)
project_id (FK → projects, nullable)
email
role
permissions (JSONB)
invitation_token (UNIQUE)
message
status (pending, accepted, declined, expired)
expires_at (7 days default)
accepted_at
declined_at
created_at
```
**Purpose**: Track pending team invitations

#### **activity_log** (Migration 014)
```sql
id (UUID PRIMARY KEY)
user_id (FK → users)
actor_id (FK → users, nullable) -- Who performed action
action (file_uploaded, review_completed, project_shared, etc.)
resource_type (project, review, collaboration, file_request, upload)
resource_id (UUID)
target_user_id (FK → users, nullable)
metadata (JSONB)
ip_address (INET)
user_agent (TEXT)
created_at
```
**Purpose**: Audit trail and activity tracking

#### **notification_subscriptions** (Migration 014)
```sql
id (UUID PRIMARY KEY)
user_id (FK → users)
project_id (FK → projects, nullable)
collaboration_id (FK → collaborations, nullable)
notification_type (new_file, review_assigned, comment_added, etc.)
enabled (boolean)
delivery_method (in_app, email, both)
created_at
UNIQUE(user_id, project_id, notification_type)
UNIQUE(user_id, collaboration_id, notification_type)
```
**Purpose**: User notification preferences

#### **team_members** (Migration 006)
```sql
id (SERIAL PRIMARY KEY)
owner_id (FK → users) -- Business plan owner
email
role (member, admin)
status (pending, active, removed)
invited_at
accepted_at
removed_at
created_at
updated_at
UNIQUE(owner_id, email)
```
**Purpose**: Team access for Business plan (max 5 per account)

#### **support_tickets** (Migration 004)
```sql
id (SERIAL PRIMARY KEY)
user_id (FK → users)
subject
message
priority (low, normal, high, urgent)
status (open, in_progress, resolved, closed)
created_at
updated_at
```
**Purpose**: Customer support

#### **branding_settings** (Migration 004)
```sql
id (SERIAL PRIMARY KEY)
user_id (FK → users, UNIQUE)
remove_branding (boolean)
logo_url
primary_color (hex)
created_at
updated_at
```
**Purpose**: Custom branding (Pro feature)

#### **custom_domains** (Migration 004)
```sql
id (SERIAL PRIMARY KEY)
user_id (FK → users, UNIQUE)
domain (UNIQUE)
verification_status (pending, verified, failed)
verification_token
is_active (boolean)
created_at
verified_at
updated_at
```
**Purpose**: Custom domain support (Pro feature)

#### **integrations** (Migration 004)
```sql
id (SERIAL PRIMARY KEY)
user_id (FK → users)
provider (dropbox, google_drive)
access_token
refresh_token
token_expires_at
auto_sync (boolean)
sync_folder (default: /Sway Files)
last_sync_at
is_active (boolean)
created_at
updated_at
UNIQUE(user_id, provider)
```
**Purpose**: Cloud storage integrations

---

## 3. Current API Structure

### Server Entry Point
**File**: `/Users/wjc2007/Desktop/sway/backend/src/server.js`

**Server Configuration**:
- Framework: Express.js
- Port: 5001 (customizable via PORT env var)
- Middleware: CORS, JSON parsing (except Stripe webhook)
- Rate limiting: Express-rate-limit for all endpoints
- Health check: `/health` (returns service status)

### API Routes Organization

```
/api/auth                  → Authentication (signup, login, password reset)
/api/requests              → File request management (CRUD)
/api/r/:code               → Public file upload (by short code)
/api/files                 → File download and management
/api/stats                 → User statistics and analytics
/api/stripe                → Stripe payment webhook
/api/admin                 → Admin operations
/api/analytics             → Advanced analytics
/api/team                  → Team management
/api/projects              → Project management
/api/reviews               → Review workflows
/api/reviewers             → Reviewer management
/api/collaborations        → Collaboration management
/api/activity              → Activity log and audit trail
/api/migrate               → Database migrations
```

### Core Route Details

#### **Authentication** (`/api/auth`)
- `POST /signup` - Create new account
  - Rate limit: 3 signups/hour/IP
  - Password: 12+ chars, uppercase, lowercase, number, special char
  - Returns JWT token
- `POST /login` - Login
  - Rate limit: 10 attempts/15 min/IP
- `POST /logout` - Logout
- `POST /password-reset` - Reset password

#### **File Requests** (`/api/requests`)
- `POST /` - Create new request
  - Rate limit: Per user plan (Free: 20 active max, Pro: unlimited)
  - Body: `{ title, description, type, timeLimit, fields, customFields, fieldRequirements, password, requireEmail, requireName }`
  - Returns: `{ id, shortCode, title, expiresAt, createdAt }`
- `GET /` - List user's requests
  - Includes upload counts, last upload timestamp
- `GET /:id` - Get specific request details
- `PUT /:id` - Update request settings
- `DELETE /:id` - Delete request

#### **Public Upload** (`/api/r/:code`)
- `GET /:code` - Get request details (public, no auth)
  - Rate limit: 30 requests/min/IP
  - Returns branding data, custom fields, form requirements
- `POST /:code/upload` - Upload file
  - Rate limit: 10 uploads/15 min/IP
  - Multer: 50MB file size limit
  - Filename sanitization (prevents ../../../ attacks)
  - Form data: `{ file, uploader_name, uploader_email, custom_field_data }`

#### **File Management** (`/api/files`)
- `GET /` - List all files for user (protected)
  - Requires JWT auth
- `GET /:id` - Download file (protected)
  - Rate limit: 10 downloads/min/IP
  - SECURITY: Path traversal prevention, file existence verification

#### **Projects** (`/api/projects`)
- `GET /` - List user's projects (owned + collaborating)
  - Filters: status, visibility
  - Returns project stats (collaborators, pending reviews, file count)
- `POST /` - Create project
  - Body: `{ title, description, project_type, visibility, due_date, settings }`
- `GET /:id` - Project details with collaborators and files
- `PUT /:id` - Update project
- `DELETE /:id` - Delete project

#### **Collaborations** (`/api/collaborations`)
- `GET /` - List collaborations (owned + member)
  - Filters: status, role
  - Returns related reviews and file counts
- `POST /` - Invite collaborator to project
  - Body: `{ project_id, email, role, permissions }`
  - Creates entry with status='pending'
- `PUT /:id` - Update collaboration (accept, change role)
- `DELETE /:id` - Remove collaboration

#### **Reviews** (`/api/reviews`)
- `GET /` - List user's reviews
  - Returns empty array (currently placeholder for dashboard)
  - Could query file_requests as reviews
- `POST /` - Create review assignment
  - Body: `{ project_id, reviewer_id, title, priority, due_date }`
- `PUT /:id` - Update review status and feedback
- `GET /:id/comments` - Get review comments (threaded)
- `POST /:id/comments` - Add comment to review

#### **Activity Log** (`/api/activity`)
- `GET /` - Get user's activity
  - Filters: action, resource_type, date range
- `GET /:id` - Activity details

#### **Stats & Analytics** (`/api/stats`, `/api/analytics`)
- User statistics (total files, uploads, requests)
- Request analytics (most popular, conversion rate)
- Usage trends and charts

---

## 4. User Management System

### User Hierarchy
1. **Free Plan Users**
   - 20 active requests limit
   - 1GB storage
   - Basic file upload/download
   - No team members

2. **Pro Plan Users**
   - Unlimited requests
   - Custom branding
   - Custom domains
   - Team members (up to 5 in Business plan)

3. **Business Plan Users**
   - All Pro features
   - Up to 5 team members
   - Advanced analytics
   - Priority support

### Authentication & Authorization
**File**: `/Users/wjc2007/Desktop/sway/backend/src/middleware/auth.js`

- JWT (JSON Web Token) based
- Secret: `process.env.JWT_SECRET`
- Expiration: 30 days
- Token passed via Authorization header: `Bearer <token>`
- Admin check via `req.isAdmin` flag (set in auth middleware)

### Password Security
- Bcrypt hashing (salt rounds: 10)
- Minimum 12 characters
- Requires: uppercase, lowercase, number, special character
- Optional per-request password protection (hashed with bcrypt)

---

## 5. File Upload & Management System

### Upload Process

1. **User Creates Request**
   - Generates 8-character short code (random alphanumeric)
   - Stored in `file_requests` table
   - Link: `swayfiles.com/requests/{shortCode}`

2. **Public File Upload**
   - No authentication required
   - Rate limited: 10 uploads/15 min/IP
   - File validation:
     - Max 50MB
     - Filename sanitization (alphanumeric, dots, hyphens, underscores only)
     - Unique suffix to prevent collision: `{timestamp}-{random}-{sanitized_name}`
   - Uploader info captured: name, email
   - Custom fields data stored in uploads

3. **File Storage**
   - Location: `/Users/wjc2007/Desktop/sway/backend/src/uploads/`
   - Created on first upload if doesn't exist
   - Multer disk storage backend
   - Path stored in database

4. **Download**
   - Requires user authentication
   - Verifies user owns the request
   - Path traversal prevention (normalized paths)
   - File existence check before serving

### Upload Table Structure
```sql
uploads {
  id: UUID,
  request_id: UUID (FK),
  uploader_name: TEXT,
  uploader_email: TEXT,
  file_name: TEXT,
  file_size: BIGINT,
  storage_path: TEXT,
  uploaded_at: TIMESTAMP
}
```

### Custom Fields
- Defined per request: `custom_fields` (JSONB in file_requests)
- Field requirements: `field_requirements` (JSONB)
- Data captured during upload
- Form validation on submission

---

## 6. Security Features

### Input Validation
- Text moderation for titles/descriptions (via `moderateText()`)
- Filename sanitization (path traversal prevention)
- SQL injection prevention (parameterized queries via pg library)
- Rate limiting on all public endpoints

### Path Traversal Prevention
```javascript
// Normalize and validate file paths
const sanitizedPath = path.normalize(uploadPath).replace(/^(\.\.(\/|\\|$))+/, '')
const filePath = path.resolve(uploadsDir, sanitizedPath)
if (!filePath.startsWith(uploadsDir)) {
  // Reject - attempted traversal
}
```

### Suspicious Activity Detection
- Function `detectSuspiciousActivity()` in `src/utils/security.js`
- Tracks login attempts, rapid requests, etc.

### CORS Configuration
```
Allowed origins:
- https://swayfiles.com
- https://www.swayfiles.com
- http://localhost:3001 (dev)
- http://localhost:5173 (dev)
```

### Stripe Integration
- Webhook endpoint: `POST /api/stripe/webhook`
- Raw body parsing (not JSON) for Stripe signature verification
- Handles subscription lifecycle events

---

## 7. Migrations & Database Setup

### Migration System
**Files**: `/Users/wjc2007/Desktop/sway/backend/migrations/`

- Sequential numbering (001, 002, ..., 015+)
- SQL-based migrations
- Migration tracking via `migrate.js` / `run-migration.js`

### Base Tables Created (setup-db.sql)
1. users
2. file_requests
3. uploads

### Migration Timeline
1. **003** - Stripe fields (stripe_customer_id, stripe_subscription_id)
2. **004** - Premium features (branding, domains, team_members, integrations, support_tickets)
3. **005** - Request type designs
4. **006** - Team members table
5. **007** - Custom domains table
6. **008** - Integrations table
7. **009** - Notifications table
8. **010** - Support tickets table
9. **011** - Branding table (initial complex version)
10. **012** - Simplified branding
11. **013** - Field requirements for requests
12. **014** - Collaboration features (MAJOR: projects, collaborations, reviews, team_invitations, activity_log, etc.)
13. **015** - Edit requests (file_sections, edit_requests, edit_sessions, edit_changes, edit_permissions)

### Running Migrations
```bash
# Development
npm run migrate

# Production (on Render)
node run-production-migrations.js

# Emergency migration (recovery)
node emergency-migrate.js
```

---

## 8. Indexes & Performance

### Key Indexes Created (29+ indexes)

**Users & Auth**
- `idx_requests_user` - file_requests.user_id
- `idx_requests_code` - file_requests.short_code
- `idx_uploads_request` - uploads.request_id
- `idx_users_stripe_subscription` - users.stripe_subscription_id

**Projects & Collaboration** (Migration 014)
- `idx_projects_user_id` - projects.user_id
- `idx_projects_status` - projects.status
- `idx_projects_visibility` - projects.visibility
- `idx_projects_created_at` - projects.created_at DESC
- `idx_collaborations_owner_id` - collaborations.owner_id
- `idx_collaborations_collaborator_id` - collaborations.collaborator_id
- `idx_collaborations_project_id` - collaborations.project_id
- `idx_collaborations_status` - collaborations.status
- `idx_reviews_project_id` - reviews.project_id
- `idx_reviews_reviewer_id` - reviews.reviewer_id
- `idx_reviews_status` - reviews.status
- `idx_review_comments_review_id` - review_comments.review_id

**Edit Requests** (Migration 015)
- `idx_file_sections_project_file_id` - file_sections.project_file_id
- `idx_file_sections_is_locked` - file_sections.is_locked
- `idx_edit_requests_status` - edit_requests.status
- `idx_edit_requests_priority` - edit_requests.priority
- `idx_edit_requests_expires_at` - edit_requests.expires_at
- `idx_edit_sessions_is_active` - edit_sessions.is_active
- `idx_edit_permissions_user_id` - edit_permissions.user_id

**Activity & Logs**
- `idx_activity_log_user_id` - activity_log.user_id
- `idx_activity_log_action` - activity_log.action
- `idx_activity_log_created_at` - activity_log.created_at DESC

### Triggers for Automatic Timestamps
- `update_projects_updated_at` - Auto-update updated_at on project changes
- `update_collaborations_updated_at` - Auto-update on collaboration changes
- `update_reviews_updated_at` - Auto-update on review changes
- `update_file_sections_updated_at` - Auto-update on section changes
- Similar triggers for all major tables

---

## 9. Backend File Organization

```
backend/
├── src/
│   ├── db/
│   │   └── pool.js                 # PostgreSQL connection pool
│   │
│   ├── middleware/
│   │   └── auth.js                 # JWT token verification
│   │
│   ├── routes/
│   │   ├── auth.js                 # Authentication endpoints
│   │   ├── requests.js             # File request CRUD
│   │   ├── uploads.js              # Public file upload endpoint
│   │   ├── files.js                # File download & management
│   │   ├── projects.js             # Project management
│   │   ├── collaborations.js       # Collaboration workflows
│   │   ├── reviews.js              # Review assignments & feedback
│   │   ├── reviewers.js            # Reviewer management
│   │   ├── team.js                 # Team member management
│   │   ├── activity.js             # Activity log queries
│   │   ├── stats.js                # User statistics
│   │   ├── analytics.js            # Advanced analytics
│   │   ├── stripe.js               # Stripe webhook handling
│   │   ├── admin.js                # Admin operations
│   │   ├── notifications.js        # Notification system
│   │   └── migrate.js              # Migration endpoints
│   │
│   ├── services/
│   │   ├── aiService.js            # OpenAI integration (disabled)
│   │   └── ...
│   │
│   ├── utils/
│   │   ├── security.js             # Text moderation, validation
│   │   └── ...
│   │
│   ├── uploads/                    # Local file storage directory
│   │
│   └── server.js                   # Main Express app + server startup
│
├── migrations/                     # SQL migration files (001-015+)
│
├── package.json                    # Dependencies: express, pg, bcrypt, jwt, stripe, etc.
├── .env                            # Environment variables (production)
├── setup-db.sql                    # Base database setup
├── migrate.js                      # Migration runner
├── run-migration.js                # Dev migration script
├── run-production-migrations.js    # Prod migration script
└── emergency-migrate.js            # Recovery migration script
```

---

## 10. Server Startup & Health Checks

### Main Server File
**File**: `/Users/wjc2007/Desktop/sway/backend/src/server.js`

**Initialization**:
```javascript
1. Load environment variables (unless production)
2. Initialize Express app
3. Configure CORS middleware
4. Set up JSON parsing (except for Stripe webhook)
5. Mount all route handlers
6. Start cleanup job for expired requests (runs hourly)
7. Listen on PORT (default 5001)
```

**Cleanup Job**:
- Deactivates expired file_requests every hour
- Queries: `UPDATE file_requests SET is_active = false WHERE expires_at < NOW()`

### Health Check Endpoints
- `GET /health` - Basic service status
- `GET /health-migrate` - Run migrations + return status
- Query param: `?migrate=true` to trigger automatic migrations

---

## 11. Existing API Error Handling

### Response Patterns

**Success Response**:
```json
{
  "success": true,
  "id": "uuid",
  "shortCode": "abc12345",
  "data": {}
}
```

**Error Response**:
```json
{
  "error": "Descriptive error message",
  "details": "Additional error details (dev only)",
  "limitReached": false,
  "currentPlan": "free"
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad request (validation errors)
- `403` - Access denied / Forbidden / Plan limits
- `404` - Resource not found
- `500` - Server error

### Rate Limiting Responses
```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": 900
}
```

---

## 12. Environment Variables Required

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/sway
# OR
DB_USER=postgres
DB_HOST=localhost
DB_NAME=sway
DB_PASSWORD=postgres
DB_PORT=5432

# Server
PORT=5001
NODE_ENV=production

# Authentication
JWT_SECRET=<long-random-secret-key>

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_BUSINESS=price_...

# Optional
OPENAI_API_KEY=sk_...  # Currently disabled
```

---

## 13. Key Insights for Review & Approval System Design

### Existing Review Infrastructure
- **reviews** table exists with:
  - Status workflow: pending → in_progress → approved/rejected/needs_changes
  - Priority levels: low, medium, high, urgent
  - Due dates and timestamps
  - Threaded comments via review_comments table

### Collaboration Framework
- **collaborations** table with role-based access (viewer, editor, reviewer, owner)
- **edit_permissions** table for granular permissions (read, edit, approve, lock, unlock, comment)
- **activity_log** table for audit trails

### Project Organization
- **projects** table groups related files and collaborators
- **project_files** table links uploads to projects with versioning

### Approval Workflow Patterns
- **edit_requests** table shows request-based workflow pattern
  - Status: pending → approved → in_progress → completed
  - Approver assignment via approver_id
  - Conditions and approval messages

---

## Summary for New Review & Approval System

The backend is well-structured to support a review and approval system:

1. **Database** is PostgreSQL with mature schema
2. **User management** distinguishes between owners, collaborators, and reviewers
3. **Project organization** groups files with team members
4. **Activity logging** is already tracked
5. **Permission model** is fine-grained (per-user, per-section, per-file)
6. **Workflow patterns** exist (edit_requests shows approval flow)
7. **Timestamps** are automatically managed via triggers

**Key tables to extend**:
- `reviews` - Add detailed approval workflow fields
- `review_comments` - Extend for approvals/rejections
- `edit_permissions` - Already supports approval permissions
- `activity_log` - Already tracks all actions

