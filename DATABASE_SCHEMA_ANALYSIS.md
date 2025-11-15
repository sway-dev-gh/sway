# Database Schema Analysis: activity_log Table Issue

## Problem Summary
Error: "column 'action' of relation 'activity_log' does not exist"

The activity_log table exists but is missing the `action` column, which is being used extensively throughout the application in `/Users/wjc2007/Desktop/sway/backend/src/routes/activity.js`.

---

## Database Files Location

### Migration Files Directory
- **Path**: `/Users/wjc2007/Desktop/sway/backend/migrations/`
- **Schema File**: `/Users/wjc2007/Desktop/sway/backend/src/db/schema.sql`
- **Setup File**: `/Users/wjc2007/Desktop/sway/backend/setup-db.sql`

---

## Migration Timeline and Table Evolution

### Migration 014: Initial activity_log Creation (FIRST DEFINITION)
**File**: `/Users/wjc2007/Desktop/sway/backend/migrations/014_collaboration_features.sql`

Lines 117-129 define the initial activity_log table:

```sql
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,              -- ✓ Column exists here
    resource_type VARCHAR(100),
    resource_id UUID,
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Status**: ✓ `action` column defined as `VARCHAR(100) NOT NULL`
**Indexes created**: Lines 210-217 include indexes on action column

---

### Migration 020: Missing Column Fix (LAST DEFINITION - INCOMPLETE)
**File**: `/Users/wjc2007/Desktop/sway/backend/migrations/020_fix_missing_columns.sql`

Lines 25-34 attempt to ADD the action column IF it doesn't exist:

```sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='activity_log' AND column_name='action') THEN
        ALTER TABLE activity_log ADD COLUMN action VARCHAR(255) NOT NULL DEFAULT 'unknown';
        COMMENT ON COLUMN activity_log.action IS 'Type of action performed (create, update, delete, etc)';
        CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
    END IF;
END $$;
```

**PROBLEM**: This migration then recreates the entire table (lines 36-47) **WITHOUT** the proper full schema:

```sql
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL DEFAULT 'unknown',
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB DEFAULT '{}',                -- ✗ Different column name
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Issues**:
1. Missing `actor_id` column (required by activity.js line 117)
2. Missing `target_user_id` column (required by activity.js line 118)
3. Renamed `metadata` to `details` (breaks application queries)
4. Missing `user_agent` column from original definition

---

## Actual Table Structure Problem

If Migration 014 created the table first, then Migration 020 ran:

**Migration 014 created**:
- `actor_id`, `action`, `target_user_id`, `metadata`, `ip_address`, `user_agent`, etc.

**Migration 020 issues** (depending on which path executed):
- The ALTER TABLE ADD COLUMN for `action` would be redundant (column already exists from 014)
- The CREATE TABLE IF NOT EXISTS would NOT recreate it (table already exists)
- **But** if the table was somehow deleted or the migrations ran out of order, Migration 020's incomplete schema would be used

---

## Application Usage of activity_log

**File**: `/Users/wjc2007/Desktop/sway/backend/src/routes/activity.js`

### Required Columns (from actual queries):
1. **action** (Line 88, 371, 442, 533, 617) - VARCHAR used for filtering and grouping
2. **actor_id** (Line 117) - UUID foreign key, left joined to users table
3. **target_user_id** (Line 118) - UUID foreign key, left joined to users table  
4. **metadata** (Line 91) - JSONB for action-specific data
5. **ip_address** (Line 335) - INET for logging
6. **user_agent** (Line 335) - TEXT for logging
7. **created_at** (Line 92, 218) - TIMESTAMP for ordering

### Query Examples:
```javascript
// Line 87-98: SELECT columns used
SELECT DISTINCT
  a.id,
  a.action,
  a.resource_type,
  a.resource_id,
  a.metadata,
  a.created_at,
  actor.name as actor_name,
  ...
FROM activity_log a
LEFT JOIN users actor ON a.actor_id = actor.id
LEFT JOIN users target ON a.target_user_id = target.id
```

---

## Migration Execution Order

The migrations execute in numerical order:
1. 003, 004, 005, 006, 007, etc.
2. **014_collaboration_features.sql** - Creates activity_log with full schema
3. ...more migrations...
4. **017_fix_schema_type_mismatches.sql** - Fixes file_sections table
5. **018_enhanced_authentication_tables.sql** - Adds auth tables
6. **019_add_missing_performance_indexes.sql** - Adds indexes
7. **020_fix_missing_columns.sql** - INCOMPLETE SCHEMA

**Critical Issue**: Migration 020 has the wrong schema definition and could corrupt the table if it somehow executes when the table doesn't exist properly.

---

## The Root Cause

The error "column 'action' of relation 'activity_log' does not exist" occurs when:

1. **Scenario A**: Migration 020's incomplete CREATE TABLE IF NOT EXISTS executed before Migration 014
   - Table created WITH action, but missing actor_id and target_user_id
   - Application tries to LEFT JOIN on actor.id and target.id (lines 117-118)
   - Actor and target user queries would fail silently or with different errors

2. **Scenario B**: Migration order is correct (014 before 020), but:
   - The table might have been dropped accidentally
   - A previous deployment ran 020 and corrupted the schema
   - The database was restored from a backup with incomplete schema

3. **Scenario C**: Authentication failures causing:
   - Application assumes action column doesn't exist
   - Falls back to trying INSERT without action column
   - INSERT fails with missing NOT NULL column

---

## Migration Files to Review

All migration files in `/Users/wjc2007/Desktop/sway/backend/migrations/`:

| File | Purpose |
|------|---------|
| 014_collaboration_features.sql | ✓ CORRECT - Creates activity_log with full schema |
| 015_edit_requests.sql | File editing features |
| 016_review_workflow_extension.sql | Review workflow enhancements |
| 017_fix_schema_type_mismatches.sql | Fixes UUID/INTEGER mismatches |
| 018_enhanced_authentication_tables.sql | Auth system tables |
| 018_simple_auth_tables.sql | Alternative auth tables (DUPLICATE) |
| 019_add_missing_performance_indexes.sql | Performance optimization |
| 020_fix_missing_columns.sql | ✗ INCORRECT - Incomplete schema |

---

## The Fix

**Option 1: Use Migration 014's Schema (RECOMMENDED)**
- Ensure 014_collaboration_features.sql runs successfully
- Remove or update Migration 020's CREATE TABLE clause to include all columns

**Option 2: Fix Migration 020**
Replace the incomplete CREATE TABLE IF NOT EXISTS in Migration 020 with the complete schema from Migration 014:

```sql
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL DEFAULT 'unknown',
    resource_type VARCHAR(100),
    resource_id UUID,
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Summary

**Database Location**: PostgreSQL database (pool managed by `/Users/wjc2007/Desktop/sway/backend/src/db/pool.js`)

**Schema Files**:
1. **Correct Definition**: `/Users/wjc2007/Desktop/sway/backend/migrations/014_collaboration_features.sql` (lines 117-129)
2. **Problematic Definition**: `/Users/wjc2007/Desktop/sway/backend/migrations/020_fix_missing_columns.sql` (lines 36-47)

**Required Columns** (from 014):
- id (UUID)
- user_id (UUID, NOT NULL)
- actor_id (UUID)
- **action (VARCHAR(100), NOT NULL)** - MISSING in error
- resource_type (VARCHAR(100))
- resource_id (UUID)
- target_user_id (UUID)
- metadata (JSONB)
- ip_address (INET)
- user_agent (TEXT)
- created_at (TIMESTAMP)

**Next Steps**:
1. Verify which schema is currently in the database
2. Check if Migration 020 has been executed
3. Ensure Migration 014 includes all columns, especially actor_id and target_user_id
4. Re-run or repair migrations to ensure correct schema
