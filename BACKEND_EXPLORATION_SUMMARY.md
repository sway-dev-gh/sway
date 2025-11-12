# SwayFiles Backend Exploration Summary

## Overview
Complete analysis of the SwayFiles backend infrastructure for designing the review and approval system. This documentation captures the current state as of November 11, 2025.

## Key Findings

### 1. Database System: PostgreSQL
- **Type**: PostgreSQL (production-grade relational database)
- **Connection**: Via `pg` npm package with connection pooling
- **Hosting**: Render.com managed PostgreSQL service
- **Schema**: 27 tables with 29+ indexes, fully normalized
- **Connection String**: Uses DATABASE_URL in production, individual env vars in development

### 2. Current Tables: 27 Total

#### Core Tables (3)
- `users` - User accounts and subscription management
- `file_requests` - File requests with short codes for public sharing
- `uploads` - Uploaded files and metadata

#### Collaboration Tables (8)
- `projects` - Project grouping and management
- `collaborations` - User access and roles (viewer, editor, reviewer, owner)
- `reviews` - Review workflows with status tracking
- `review_comments` - Threaded comments within reviews
- `team_invitations` - Pending team invite tracking
- `activity_log` - Comprehensive audit trail
- `notification_subscriptions` - User notification preferences
- `project_files` - File versioning and project organization

#### Editing Tables (5) - NEW (Migration 015)
- `file_sections` - Granular section definitions within files
- `edit_requests` - Request-based editing with approvals
- `edit_sessions` - Active editing session tracking
- `edit_changes` - Audit trail of individual changes
- `edit_permissions` - Fine-grained permission control (per-user, per-section)

#### Premium/Support Tables (8)
- `team_members` - Team access for Business plan (max 5 members)
- `support_tickets` - Customer support tickets
- `branding_settings` - Custom branding (Pro feature)
- `custom_domains` - Custom domain support (Pro feature)
- `integrations` - Cloud storage integrations (Dropbox, Google Drive)
- Plus 3 more supporting tables

### 3. API Structure: Express.js Backend

#### Architecture
- **Framework**: Express.js (Node.js)
- **Port**: 5001 (production on Render.com)
- **Middleware**: CORS, JSON parsing, rate limiting, JWT auth
- **Routes**: 15+ route modules organized by feature

#### API Endpoints (Partial List)
- `/api/auth` - Authentication (signup, login, password reset)
- `/api/requests` - File request CRUD operations
- `/api/r/:code` - Public file upload by short code
- `/api/files` - File download and management
- `/api/projects` - Project management (CRUD)
- `/api/collaborations` - Collaboration workflows
- `/api/reviews` - Review assignments and feedback
- `/api/activity` - Activity log queries
- `/api/stats` - User statistics
- `/api/team` - Team member management
- `/api/stripe` - Stripe webhook handling

### 4. User Management System

#### Plan Hierarchy
1. **Free Plan**
   - 20 active requests limit
   - 1GB storage
   - Basic features

2. **Pro Plan**
   - Unlimited requests
   - Custom branding
   - Custom domains
   - Team members (5 max in Business)

3. **Business Plan**
   - All Pro features
   - Up to 5 team members
   - Advanced analytics
   - Priority support

#### Authentication
- JWT-based (30-day expiration)
- Password: 12+ chars with uppercase, lowercase, number, special char
- Bcrypt hashing (salt rounds: 10)
- Rate limiting: 3 signups/hour/IP, 10 login attempts/15 min/IP

### 5. File Upload & Management

#### Upload Process
1. User creates request (gets 8-char short code)
2. Share public link (e.g., swayfiles.com/requests/{shortCode})
3. Uploader submits files (no auth required)
4. Files stored locally in `/backend/src/uploads/`
5. User downloads authenticated files

#### Security
- 50MB file size limit per file
- Filename sanitization (prevents ../../../ attacks)
- Unique suffix: `{timestamp}-{random}-{sanitized_name}`
- Path traversal prevention on download
- Rate limiting: 10 uploads/15 min/IP, 10 downloads/min/IP

### 6. Review & Approval System Foundation

#### Existing Review Infrastructure
- `reviews` table with status workflow: pending → in_progress → approved/rejected/needs_changes
- `review_comments` table with threaded comments
- Priority levels: low, medium, high, urgent
- Reviewer assignment via reviewer_id
- Due dates and completion tracking

#### Existing Approval Workflow Pattern
- `edit_requests` table shows mature request-based approval pattern
  - Status: pending → approved → in_progress → completed
  - Approver_id for assignment
  - Conditions and approval_message fields
  - Proposed_changes and approval timestamps

#### Permission Model
- `edit_permissions` table provides fine-grained control
- Permission types: read, edit, approve, lock, unlock, comment
- Scope: section, file, or project-level
- Conditional permissions with time/change limits

### 7. Database Schema Design Patterns

#### Pattern 1: Role-Based Access Control
```
collaborations: { role, permissions (JSONB) }
Roles: viewer, editor, reviewer, owner
Permissions stored as JSON for flexibility
```

#### Pattern 2: Project Organization
```
Projects → Collaborations → Project_Files → Uploads
Groups files with team members and defines access
```

#### Pattern 3: Approval Chains
```
Edit_Requests: { requester_id, approver_id, status, approval_message }
Tracks request, approval, and conditions
Includes timestamp fields for workflow stages
```

#### Pattern 4: Audit Trail
```
Activity_Log: { user_id, actor_id, action, resource_type, resource_id, metadata }
Every action logged with user, timestamp, resource reference
```

#### Pattern 5: Temporal Design
```
Expires_at fields for time-limited items
Automatic cleanup job (runs hourly)
Triggers auto-update updated_at columns
```

### 8. Migrations & Version Control

#### Migration System
- Sequential numbering (001-015+)
- SQL-based migrations in `/backend/migrations/`
- Migration tracking via scripts in root and src/

#### Key Milestones
- **003**: Stripe integration
- **004**: Premium features (branding, domains, team members, integrations)
- **014**: Collaboration features (MAJOR - projects, reviews, activity log)
- **015**: Edit requests (granular editing with approvals)

#### Running Migrations
```bash
npm run migrate              # Development
node run-production-migrations.js  # Production
node emergency-migrate.js    # Recovery
```

### 9. Performance & Indexes

#### Index Coverage
- 29+ indexes across all major tables
- User/resource lookups: user_id, request_id, project_id
- Status filtering: status, visibility, role
- Time-based queries: created_at DESC, expires_at, due_date
- Foreign key relationships fully indexed

#### Triggers
- 8+ triggers for auto-updating updated_at columns
- Uses `update_updated_at_column()` function
- Applied to all major tables with temporal data

### 10. Security Features

#### Input Validation
- Text moderation for titles/descriptions
- Filename sanitization (alphanumeric, dots, hyphens, underscores only)
- SQL injection prevention (parameterized queries)
- Rate limiting on all public endpoints

#### Path Traversal Prevention
```javascript
Normalize paths with path.normalize()
Remove ../ sequences
Validate file exists in uploads directory
Ensure resolved path is within permitted directory
```

#### CORS Configuration
```
https://swayfiles.com
https://www.swayfiles.com
http://localhost:3001 (dev)
http://localhost:5173 (dev)
```

#### Stripe Security
- Webhook endpoint with signature verification
- Raw body parsing for verification
- Subscription lifecycle event handling

---

## Generated Documentation Files

Three comprehensive documentation files have been created in `/Users/wjc2007/Desktop/sway/`:

### 1. **BACKEND_INFRASTRUCTURE.md** (959 lines)
Complete breakdown of:
- Database system details
- All 27 tables with full schema definitions
- User management and authentication
- File upload and management system
- Security features and best practices
- API structure and endpoints
- Migrations timeline
- Performance indexes and triggers
- Backend file organization
- Environment variables

### 2. **SCHEMA_DIAGRAM.md** (222 lines)
Visual representation of:
- Core data relationships (ER diagram)
- Editing & approval workflows
- Activity & audit trail structure
- Notification system
- Supporting tables
- Key design patterns explained
- Database statistics
- Connection information

### 3. **API_QUICK_REFERENCE.md** (594 lines)
Practical API guide with:
- Authentication endpoints with examples
- File request CRUD with JSON examples
- Public file upload flow
- File management (list/download)
- Project management endpoints
- Collaboration workflows
- Review assignment and feedback
- Activity log queries
- Statistics & analytics endpoints
- Error handling and status codes
- Rate limiting information
- JWT token usage
- Plan limits reference

---

## Key Insights for Review & Approval System Design

### Ready-Made Infrastructure
1. **Database**: PostgreSQL with proven scalability
2. **User Model**: Multi-tier (Free/Pro/Business) with role-based access
3. **Project System**: Already groups files and collaborators
4. **Review Framework**: Tables and API endpoints exist
5. **Permissions**: Fine-grained system (edit_permissions table)
6. **Audit Trail**: Comprehensive activity_log table
7. **Workflow Patterns**: Edit_requests shows mature approval flow

### Existing Tables to Extend
- `reviews` - Add detailed approval workflow fields
- `review_comments` - Extend for approvals/rejections
- `edit_permissions` - Already supports approval permissions
- `activity_log` - Already tracks all actions

### What's Already Implemented
- Authentication & authorization
- User role management (viewer, editor, reviewer, owner)
- Project organization
- File versioning
- Timestamp tracking (with auto-update triggers)
- Activity logging
- Permission system
- API response patterns
- Error handling
- Rate limiting

### Design Considerations for New Review & Approval System
1. Leverage existing `reviews` and `review_comments` tables
2. Use existing `collaborations` for reviewer assignment
3. Extend `edit_permissions` for granular approvals
4. Follow established workflow pattern from `edit_requests`
5. Use activity_log for audit trail
6. Follow existing API response patterns
7. Maintain rate limiting approach
8. Use existing trigger system for timestamps

---

## Database Connection Details

### Production (Render.com)
```
Connection Pool: pg.Pool
Connection String: DATABASE_URL (format: postgresql://user:pass@host:port/db)
SSL: Enabled
Port: 5432 (default)
```

### Development (Local)
```
Host: localhost
Port: 5432
Database: sway
User: postgres (default)
Password: postgres (default)
SSL: Disabled
```

---

## File Organization

```
/backend/
├── src/
│   ├── db/pool.js                    # PostgreSQL pool
│   ├── middleware/auth.js            # JWT verification
│   ├── routes/                       # 15+ API route modules
│   ├── services/aiService.js         # (Disabled)
│   ├── utils/security.js             # Validation functions
│   ├── uploads/                      # File storage
│   └── server.js                     # Main app entry
├── migrations/                       # 15+ SQL migrations
├── package.json                      # Dependencies
└── setup-db.sql                      # Base schema
```

---

## Critical Dependencies

```
express              - Web framework
pg                  - PostgreSQL client
bcrypt              - Password hashing
jsonwebtoken        - JWT generation/verification
multer              - File upload handling
express-rate-limit - Rate limiting
cors                - CORS middleware
stripe              - Payment processing
dotenv              - Environment variables
```

---

## Next Steps for Review & Approval Design

1. **Review existing tables**: Examine `reviews`, `review_comments`, `edit_permissions`
2. **Plan schema extensions**: Decide what new fields/tables are needed
3. **Design workflow**: Define approval chain and status transitions
4. **Create migration**: SQL migration file (016) with new/extended tables
5. **Implement APIs**: Route handlers following existing patterns
6. **Add activity logging**: Log all approval actions via activity_log
7. **Implement permissions**: Use edit_permissions table for granular control
8. **Add tests**: Test workflows and edge cases

---

## Reference Links

- Database Pool: `/Users/wjc2007/Desktop/sway/backend/src/db/pool.js`
- Server Entry: `/Users/wjc2007/Desktop/sway/backend/src/server.js`
- Migrations: `/Users/wjc2007/Desktop/sway/backend/migrations/`
- Routes: `/Users/wjc2007/Desktop/sway/backend/src/routes/`
- Auth Middleware: `/Users/wjc2007/Desktop/sway/backend/src/middleware/auth.js`
- Security Utils: `/Users/wjc2007/Desktop/sway/backend/src/utils/security.js`

---

## Document Generation Date

November 12, 2025
Analysis based on current production code and latest migrations (015)
