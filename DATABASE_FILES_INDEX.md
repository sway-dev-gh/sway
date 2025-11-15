# Database Schema Files Index

## Quick Navigation

This document provides a complete index of all database-related files in the Sway backend.

---

## Critical Files for activity_log Issue

### 1. Correct Schema Definition (USE THIS)
**File**: `/Users/wjc2007/Desktop/sway/backend/migrations/014_collaboration_features.sql`
- **Lines**: 117-129 (table definition)
- **Lines**: 210-217 (indexes)
- **Status**: ✓ CORRECT - Contains complete schema with all required columns
- **Columns**: 11 (includes actor_id, target_user_id, metadata)

### 2. Broken Schema Definition (DO NOT USE)
**File**: `/Users/wjc2007/Desktop/sway/backend/migrations/020_fix_missing_columns.sql`
- **Lines**: 36-47 (incomplete table definition)
- **Status**: ✗ BROKEN - Missing critical columns
- **Columns**: 9 (missing actor_id, target_user_id; wrong column name for metadata)
- **Action**: Needs to be fixed or removed

### 3. Application Code Using activity_log
**File**: `/Users/wjc2007/Desktop/sway/backend/src/routes/activity.js`
- **Size**: 715 lines
- **Key Operations**:
  - Line 72-297: GET /api/activity (main activity feed)
  - Line 302-359: POST /api/activity (log activity)
  - Line 364-427: GET /api/activity/recent (recent summary)
  - Line 433-520: GET /api/activity/notifications (notification feed)
  - Line 525-604: GET /api/activity/logs (activity logs)
  - Line 609-689: GET /api/activity/feed (activity feed for RightTerminal)

---

## All Migration Files

Directory: `/Users/wjc2007/Desktop/sway/backend/migrations/`

| # | File | Purpose | Status |
|---|------|---------|--------|
| 3 | 003_add_stripe_fields.sql | Stripe payment integration | ✓ OK |
| 4 | 004_premium_features.sql | Premium tier features | ✓ OK |
| 5 | 005_add_request_type_designs.sql | Request type designs | ✓ OK |
| 6 | 006_team_members.sql | Team management | ✓ OK |
| 6 | 006_prompting_agent_system.sql | AI prompting system | ✓ OK |
| 7 | 007_custom_domains.sql | Custom domain support | ✓ OK |
| 8 | 008_integrations.sql | External integrations | ✓ OK |
| 9 | 009_notifications.sql | Notification system | ✓ OK |
| 10 | 010_support.sql | Support features | ✓ OK |
| 11 | 011_branding.sql | Branding customization | ✓ OK |
| 12 | 012_simplify_branding.sql | Branding simplification | ✓ OK |
| 13 | 013_add_field_requirements.sql | Field requirements | ✓ OK |
| 14 | 014_collaboration_features.sql | **Collaboration & Activity Log** | ✓ **CORRECT** |
| 15 | 015_edit_requests.sql | Granular edit requests | ✓ OK |
| 16 | 016_review_workflow_extension.sql | Review workflow features | ✓ OK |
| 17 | 017_fix_schema_type_mismatches.sql | UUID/INTEGER type fixes | ✓ OK |
| 18 | 018_enhanced_authentication_tables.sql | Enhanced auth system | ✓ OK |
| 18 | 018_simple_auth_tables.sql | Simple auth tables (duplicate) | ⚠ DUPLICATE |
| 19 | 019_add_missing_performance_indexes.sql | Performance optimization | ✓ OK |
| 20 | 020_fix_missing_columns.sql | Missing column fixes | **✗ BROKEN** |

---

## Other Database Files

### Setup and Configuration

**File**: `/Users/wjc2007/Desktop/sway/backend/setup-db.sql`
- Initial database setup script
- Used for fresh database creation

**File**: `/Users/wjc2007/Desktop/sway/backend/src/db/schema.sql`
- Base schema definition (44 lines)
- Contains basic user, file_requests, uploads, and indexes
- Precedes all migrations

**File**: `/Users/wjc2007/Desktop/sway/backend/src/migrations/`
- Directory with alternative migration files
- Contains: `add_password_protection.sql`

---

## Other Files Referencing activity_log

### Routes and Services

**File**: `/Users/wjc2007/Desktop/sway/backend/src/routes/reviews.js`
- Uses activity_log for review activities

**File**: `/Users/wjc2007/Desktop/sway/backend/src/routes/team.js`
- Uses activity_log for team activities

**File**: `/Users/wjc2007/Desktop/sway/backend/src/routes/projects.js`
- Uses activity_log for project activities

**File**: `/Users/wjc2007/Desktop/sway/backend/src/routes/collaborations.js`
- Uses activity_log for collaboration activities

**File**: `/Users/wjc2007/Desktop/sway/backend/src/routes/workflow.js`
- Uses activity_log for workflow activities

**File**: `/Users/wjc2007/Desktop/sway/backend/src/routes/notifications.js`
- Uses activity_log for notification triggers

**File**: `/Users/wjc2007/Desktop/sway/backend/src/services/realtimeService.js`
- Real-time activity logging

**File**: `/Users/wjc2007/Desktop/sway/backend/src/services/keyRotation.js`
- Key rotation activity logging

---

## Migration Execution Scripts

**File**: `/Users/wjc2007/Desktop/sway/backend/deploy-migrations.js`
- Production migration deployment script

**File**: `/Users/wjc2007/Desktop/sway/backend/src/migrate.js`
- Development migration runner

**File**: `/Users/wjc2007/Desktop/sway/backend/src/migrate-production.js`
- Production migration runner

**File**: `/Users/wjc2007/Desktop/sway/backend/run-fix-columns-migration.js`
- Quick fix runner for column issues

**File**: `/Users/wjc2007/Desktop/sway/backend/emergency-migrate.js`
- Emergency migration for critical issues

---

## Database Configuration

**File**: `/Users/wjc2007/Desktop/sway/backend/src/db/pool.js`
- PostgreSQL connection pool configuration
- Used by all database operations

**File**: `/Users/wjc2007/Desktop/sway/backend/src/routes/migrate.js`
- API endpoint for triggering migrations

---

## Analysis Documents

Generated analysis documents are stored in the root sway directory:

**File**: `/Users/wjc2007/Desktop/sway/DATABASE_SCHEMA_ANALYSIS.md`
- Comprehensive analysis of the issue
- Migration timeline and table evolution
- Root cause analysis
- Scenarios causing the error

**File**: `/Users/wjc2007/Desktop/sway/SCHEMA_QUICK_REFERENCE.md`
- Quick reference guide
- Side-by-side schema comparison
- Verification queries
- Recommended actions

**File**: `/Users/wjc2007/Desktop/sway/SCHEMA_COMPARISON.md`
- Detailed column-by-column comparison
- Impact analysis
- Evidence from code
- Why Migration 020 is broken

---

## Key Findings Summary

### The Problem
Error: "column 'action' of relation 'activity_log' does not exist"

### Root Cause
Migration 020 has an incomplete schema definition that is missing critical columns.

### Critical Columns Missing in Migration 020
1. **actor_id** (UUID) - Used in LEFT JOIN at activity.js:117
2. **target_user_id** (UUID) - Used in LEFT JOIN at activity.js:118
3. **metadata** (JSONB) - Named "details" instead, wrong in INSERT/SELECT queries

### The Fix
1. Ensure Migration 014 schema is current in database
2. Fix or remove the broken CREATE TABLE section in Migration 020
3. Verify all columns exist before deploying

### Files to Focus On
- **Primary**: `/Users/wjc2007/Desktop/sway/backend/migrations/014_collaboration_features.sql` (CORRECT)
- **Problem**: `/Users/wjc2007/Desktop/sway/backend/migrations/020_fix_missing_columns.sql` (BROKEN)
- **Application**: `/Users/wjc2007/Desktop/sway/backend/src/routes/activity.js` (Uses all columns)

---

## Commands to Verify Current Schema

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT version();"

# List activity_log columns
psql $DATABASE_URL -c "
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'activity_log'
ORDER BY ordinal_position;"

# List activity_log indexes
psql $DATABASE_URL -c "
SELECT indexname
FROM pg_indexes
WHERE tablename = 'activity_log';"

# Show table creation SQL
psql $DATABASE_URL -c "
SELECT pg_get_ddl('activity_log'::regclass);"
```

---

## Next Steps

1. Read: `/Users/wjc2007/Desktop/sway/DATABASE_SCHEMA_ANALYSIS.md`
2. Read: `/Users/wjc2007/Desktop/sway/SCHEMA_COMPARISON.md`
3. Verify current schema using commands above
4. Fix Migration 020 or restore correct schema from Migration 014
5. Redeploy and test activity endpoints

