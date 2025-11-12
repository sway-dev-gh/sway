# SwayFiles Backend Documentation Index

## Overview
Complete backend infrastructure analysis for SwayFiles covering database system, API structure, user management, and file handling. This documentation is designed to support the development of the review and approval system.

**Generated**: November 12, 2025  
**Analysis Date**: November 11, 2025  
**Total Documentation**: 2,178 lines across 4 files

---

## Documentation Files

### 1. BACKEND_INFRASTRUCTURE.md (27 KB, 959 lines)
**Purpose**: Comprehensive technical reference  
**Audience**: Backend developers, architects, database engineers

**Contents**:
- Database System Overview
  - PostgreSQL connection and pooling
  - Development vs Production configuration
  - SSL settings and security

- Complete Schema Documentation (27 Tables)
  - Core Tables (3): users, file_requests, uploads
  - Collaboration Tables (8): projects, collaborations, reviews, review_comments, team_invitations, activity_log, notification_subscriptions, project_files
  - Editing Tables (5): file_sections, edit_requests, edit_sessions, edit_changes, edit_permissions
  - Premium/Support Tables (8): team_members, support_tickets, branding_settings, custom_domains, integrations, and more

- User Management System
  - Plan hierarchy (Free, Pro, Business)
  - Authentication and authorization
  - Password security requirements

- File Upload & Management System
  - Upload process flow
  - File storage and versioning
  - Security measures (sanitization, limits, cleanup)

- Security Features
  - Input validation
  - Path traversal prevention
  - CORS configuration
  - Stripe webhook handling

- API Structure
  - 15+ route modules
  - Rate limiting per endpoint
  - CORS configuration
  - Error handling

- Migrations & Database Evolution
  - Migration system (001-015+)
  - Key milestones
  - Running migrations

- Performance & Indexes
  - 29+ indexes detailed
  - Trigger implementations
  - Timestamp automation

- Backend File Organization
  - Directory structure
  - Source file locations
  - Database pool configuration

- Environment Variables Reference
  - Database configuration
  - Server settings
  - Authentication secrets
  - Stripe credentials

**When to Use**:
- Need detailed field definitions
- Understanding database relationships
- Security implementation details
- Backend system architecture overview

---

### 2. SCHEMA_DIAGRAM.md (10 KB, 222 lines)
**Purpose**: Visual and structural overview of database  
**Audience**: All team members, architects, product managers

**Contents**:
- Core Data Relationships (ASCII diagram)
  - User connections to projects, requests, team members
  - File upload and collaboration flows
  - Review and comment hierarchy

- Editing & Approval Workflows (ASCII diagram)
  - File sections to edit requests
  - Session tracking
  - Permission relationships

- Activity & Audit Trail Structure
  - Action logging
  - Resource tracking
  - Metadata capture

- Notification System Design
  - Subscription patterns
  - Delivery methods
  - Notification types

- Supporting Tables Overview
  - Team members system
  - Support tickets
  - Branding and domains
  - Cloud integrations

- Key Design Patterns (Explained)
  1. Request-Based Workflows
  2. Role-Based Access Control (RBAC)
  3. Project Organization
  4. Approval Chains
  5. Audit Trail
  6. Temporal Design

- Database Statistics
  - Table counts by category
  - Index coverage
  - Trigger count

- Connection Information
  - Production pool settings
  - Development configuration
  - SSL settings

**When to Use**:
- Presenting to non-technical stakeholders
- Understanding overall data architecture
- Explaining workflow to teammates
- Database design review

---

### 3. API_QUICK_REFERENCE.md (12 KB, 594 lines)
**Purpose**: Practical API integration guide  
**Audience**: Frontend developers, API consumers, integration engineers

**Contents**:
- Authentication Endpoints
  - Signup (with validation requirements)
  - Login (with rate limiting)
  - Logout
  - Password reset
  - JWT token structure and usage

- File Request Management
  - POST /api/requests - Create request
  - GET /api/requests - List user's requests
  - GET /api/requests/:id - Get details
  - PUT /api/requests/:id - Update
  - DELETE /api/requests/:id - Delete

- Public File Upload
  - GET /api/r/:shortCode - Get request info (public)
  - POST /api/r/:shortCode/upload - Upload file (public)
  - File limits and validation

- File Management
  - GET /api/files - List files
  - GET /api/files/:id - Download file
  - Security features

- Projects
  - GET /api/projects - List with filters
  - POST /api/projects - Create
  - GET /api/projects/:id - Details
  - PUT /api/projects/:id - Update
  - DELETE /api/projects/:id - Delete

- Collaborations
  - GET /api/collaborations - List
  - POST /api/collaborations - Invite
  - PUT /api/collaborations/:id - Accept/update
  - DELETE /api/collaborations/:id - Remove

- Reviews
  - GET /api/reviews - List
  - POST /api/reviews - Create
  - PUT /api/reviews/:id - Update
  - POST /api/reviews/:id/comments - Add comment
  - GET /api/reviews/:id/comments - Get comments

- Activity Log
  - GET /api/activity - List with filters

- Statistics & Analytics
  - GET /api/stats - User statistics
  - GET /api/analytics - Period-based metrics

- Error Responses
  - Response format
  - Common status codes
  - Rate limit headers

- Request Headers
  - Authentication headers
  - CORS configuration

- Plan Limits Reference
  - Free plan restrictions
  - Pro plan features
  - Business plan features

**When to Use**:
- Implementing frontend API calls
- Debugging API issues
- Understanding request/response format
- Integration documentation
- Testing endpoints

---

### 4. BACKEND_EXPLORATION_SUMMARY.md (13 KB, 925 lines)
**Purpose**: Executive summary and design guidance  
**Audience**: Project leads, architects, decision makers

**Contents**:
- Key Findings (10 major sections)
  1. Database System (PostgreSQL details)
  2. Current Tables (27 total, categorized)
  3. API Structure (Express.js architecture)
  4. User Management System (plan hierarchy)
  5. File Upload & Management (security measures)
  6. Review & Approval System Foundation
  7. Database Design Patterns (5 patterns)
  8. Migrations & Version Control
  9. Performance & Indexes
  10. Security Features

- Generated Documentation Summary
  - File descriptions
  - Line counts
  - Content overview

- Key Insights for Review & Approval Design
  - Ready-made infrastructure
  - Tables to extend
  - What's already implemented
  - Design considerations

- Database Connection Details
  - Production configuration
  - Development configuration

- Critical Dependencies
  - npm packages used
  - Version information

- Next Steps for Review & Approval Design
  - Implementation roadmap
  - Database extension guidance
  - API implementation approach
  - Testing strategy

- Reference Links
  - Direct file paths
  - Key code locations

**When to Use**:
- Planning new features
- Understanding current system capabilities
- Preparing implementation strategy
- Team onboarding
- Architecture review meetings

---

## Quick Navigation by Role

### Backend Developers
Start with: **BACKEND_INFRASTRUCTURE.md** (comprehensive reference)
Then review: **SCHEMA_DIAGRAM.md** (understand relationships)
Reference: **API_QUICK_REFERENCE.md** (endpoint details)

### Frontend Developers
Start with: **API_QUICK_REFERENCE.md** (integration guide)
Then review: **SCHEMA_DIAGRAM.md** (understand data structure)
Reference: **BACKEND_INFRASTRUCTURE.md** (detailed reference when needed)

### Database/Data Engineers
Start with: **BACKEND_INFRASTRUCTURE.md** (complete schema)
Then review: **SCHEMA_DIAGRAM.md** (relationships and patterns)
Reference: **BACKEND_EXPLORATION_SUMMARY.md** (design patterns)

### Project Managers/Product Owners
Start with: **BACKEND_EXPLORATION_SUMMARY.md** (executive summary)
Then review: **SCHEMA_DIAGRAM.md** (visual overview)
Reference: **BACKEND_INFRASTRUCTURE.md** (feature capabilities)

### Architects/Tech Leads
Start with: **BACKEND_EXPLORATION_SUMMARY.md** (overview)
Then review: **BACKEND_INFRASTRUCTURE.md** (detailed architecture)
Then review: **SCHEMA_DIAGRAM.md** (design patterns)
Reference: **API_QUICK_REFERENCE.md** (API contracts)

---

## Key Topics Quick Links

### Database Schema
- Core tables: BACKEND_INFRASTRUCTURE.md Section 2 (Core Tables)
- Collaboration: BACKEND_INFRASTRUCTURE.md Section 2 (Collaboration Tables)
- Editing: BACKEND_INFRASTRUCTURE.md Section 2 (Editing Tables)
- Full schema: SCHEMA_DIAGRAM.md

### API Endpoints
- All endpoints: API_QUICK_REFERENCE.md (Sections on each resource)
- Rate limiting: API_QUICK_REFERENCE.md (Error Responses section)
- Authentication: API_QUICK_REFERENCE.md (Authentication section)

### Security
- Path traversal: BACKEND_INFRASTRUCTURE.md Section 6
- Password requirements: BACKEND_INFRASTRUCTURE.md Section 4
- File validation: BACKEND_INFRASTRUCTURE.md Section 5
- Input validation: BACKEND_INFRASTRUCTURE.md Section 6

### User Management
- Plan hierarchy: BACKEND_EXPLORATION_SUMMARY.md (User Management)
- Authentication: BACKEND_INFRASTRUCTURE.md Section 4
- Authorization: SCHEMA_DIAGRAM.md (Design Patterns)

### File Handling
- Upload process: BACKEND_INFRASTRUCTURE.md Section 5
- Storage: BACKEND_INFRASTRUCTURE.md Section 5
- Cleanup job: BACKEND_INFRASTRUCTURE.md Section 10

### Review & Approval System
- Foundation: BACKEND_EXPLORATION_SUMMARY.md Section 6
- Existing tables: BACKEND_INFRASTRUCTURE.md Section 2
- Design patterns: BACKEND_EXPLORATION_SUMMARY.md Section 7

### Migrations
- System overview: BACKEND_INFRASTRUCTURE.md Section 7
- Migration list: BACKEND_EXPLORATION_SUMMARY.md Section 8
- Running migrations: BACKEND_INFRASTRUCTURE.md Section 7

---

## Statistics Summary

### Database Statistics
- **Total Tables**: 27
- **Total Indexes**: 29+
- **Total Triggers**: 8+
- **Database Type**: PostgreSQL
- **Hosting**: Render.com

### Documentation Statistics
- **Total Files**: 4
- **Total Lines**: 2,178
- **Total Size**: ~62 KB
- **Generation Date**: November 12, 2025

### API Statistics
- **Route Modules**: 15+
- **Public Endpoints**: ~8
- **Protected Endpoints**: ~30+
- **Rate Limit Levels**: 5+ different configurations

---

## Using This Documentation for Review & Approval System Design

### Phase 1: Understand Current State
1. Read: BACKEND_EXPLORATION_SUMMARY.md (Section 6)
2. Review: BACKEND_INFRASTRUCTURE.md (Reviews table details)
3. Examine: Actual code in `/backend/src/routes/reviews.js`

### Phase 2: Analyze Design Patterns
1. Study: SCHEMA_DIAGRAM.md (Design Patterns section)
2. Review: BACKEND_INFRASTRUCTURE.md (Editing tables: file_sections, edit_requests)
3. Understand: Workflow from migrations 014 and 015

### Phase 3: Plan Extensions
1. Reference: BACKEND_EXPLORATION_SUMMARY.md (Key Insights section)
2. Map: Which existing tables to extend
3. Design: New fields and relationships needed
4. Document: In new migration (016)

### Phase 4: Implementation
1. Create: SQL migration file
2. Code: Route handlers (follow existing patterns)
3. Log: Use activity_log for audit trail
4. Permissions: Leverage edit_permissions table
5. API: Create endpoints (reference API_QUICK_REFERENCE.md format)

---

## File Locations

All documentation files are located in:
```
/Users/wjc2007/Desktop/sway/
```

Individual files:
- BACKEND_INFRASTRUCTURE.md
- SCHEMA_DIAGRAM.md
- API_QUICK_REFERENCE.md
- BACKEND_EXPLORATION_SUMMARY.md
- BACKEND_DOCUMENTATION_INDEX.md (this file)

Backend source code:
- `/Users/wjc2007/Desktop/sway/backend/src/`
- `/Users/wjc2007/Desktop/sway/backend/migrations/`

---

## Document Maintenance

These documents are snapshots of the backend as of November 11, 2025. To keep them current:

1. After migrations: Update BACKEND_INFRASTRUCTURE.md Section 2 (Schema)
2. After API changes: Update API_QUICK_REFERENCE.md
3. After major features: Update BACKEND_EXPLORATION_SUMMARY.md
4. Schema changes: Update SCHEMA_DIAGRAM.md

---

## Additional Resources

### Code References
- Server entry: `/backend/src/server.js`
- Database pool: `/backend/src/db/pool.js`
- Auth middleware: `/backend/src/middleware/auth.js`
- Reviews route: `/backend/src/routes/reviews.js`
- Projects route: `/backend/src/routes/projects.js`
- Collaborations route: `/backend/src/routes/collaborations.js`

### Migrations
- Latest (015): `/backend/migrations/015_edit_requests.sql`
- Previous (014): `/backend/migrations/014_collaboration_features.sql`
- Setup: `/backend/setup-db.sql`

### Configuration
- Environment: `/backend/.env`
- Package: `/backend/package.json`
- Migration runners: `/backend/run-migration.js`, `/backend/run-production-migrations.js`

---

## Questions or Updates?

If you find discrepancies or need clarifications:

1. Check the actual source code in `/backend/src/`
2. Review the latest migrations in `/backend/migrations/`
3. Cross-reference with BACKEND_INFRASTRUCTURE.md
4. Consult the API_QUICK_REFERENCE.md for endpoint specifics

---

**Documentation prepared for SwayFiles backend analysis**  
**Comprehensive foundation for review & approval system design**
