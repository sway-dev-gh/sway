# Schema Comparison: Correct vs Broken

## Side-by-Side Comparison

### MIGRATION 014 (CORRECT - Lines 117-129)
File: `/Users/wjc2007/Desktop/sway/backend/migrations/014_collaboration_features.sql`

```sql
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Columns**: 11
- actor_id: ✓ PRESENT
- action: ✓ PRESENT (VARCHAR(100), NOT NULL)
- target_user_id: ✓ PRESENT
- metadata: ✓ PRESENT (JSONB)
- user_agent: ✓ PRESENT (TEXT)

---

### MIGRATION 020 (BROKEN - Lines 36-47)
File: `/Users/wjc2007/Desktop/sway/backend/migrations/020_fix_missing_columns.sql`

```sql
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL DEFAULT 'unknown',
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns**: 9
- actor_id: ✗ MISSING (CRITICAL ERROR)
- action: ✓ PRESENT (VARCHAR(255), NOT NULL)
- target_user_id: ✗ MISSING (CRITICAL ERROR)
- metadata: ✗ WRONG (named "details" instead)
- user_agent: ✓ PRESENT (TEXT)

---

## Column-by-Column Comparison

| Column | Migration 014 | Migration 020 | Status |
|--------|---------------|---------------|--------|
| id | UUID PRIMARY KEY uuid_generate_v4() | UUID PRIMARY KEY gen_random_uuid() | ✓ OK |
| user_id | UUID NOT NULL FK cascade | UUID FK | ⚠ Missing NOT NULL |
| actor_id | UUID FK set null | **MISSING** | ✗ **CRITICAL** |
| action | VARCHAR(100) NOT NULL | VARCHAR(255) NOT NULL | ✓ OK (size diff acceptable) |
| resource_type | VARCHAR(100) | VARCHAR(100) | ✓ OK |
| resource_id | UUID | UUID | ✓ OK |
| target_user_id | UUID FK set null | **MISSING** | ✗ **CRITICAL** |
| metadata | JSONB | Renamed to "details" | ✗ **CRITICAL** |
| ip_address | INET | INET | ✓ OK |
| user_agent | TEXT | TEXT | ✓ OK |
| created_at | TIMESTAMP NOW() | TIMESTAMP CURRENT_TIMESTAMP | ✓ OK |

---

## Impact Analysis

### Missing Columns in Migration 020

#### 1. Missing `actor_id`
**Impact Level**: CRITICAL

Location: `activity.js` line 117
```javascript
LEFT JOIN users actor ON a.actor_id = actor.id
```

Error: "column 'actor_id' does not exist"
Breaks: All activity feed queries that need to show who performed the action

#### 2. Missing `target_user_id`
**Impact Level**: CRITICAL

Location: `activity.js` line 118
```javascript
LEFT JOIN users target ON a.target_user_id = target.id
```

Error: "column 'target_user_id' does not exist"
Breaks: All activity queries for actions targeting specific users

#### 3. Wrong Column Name: `details` vs `metadata`
**Impact Level**: CRITICAL

All INSERT queries: `activity.js` line 321
```javascript
INSERT INTO activity_log
(user_id, actor_id, action, resource_type, resource_id, target_user_id, metadata, ip_address, user_agent)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
```

All SELECT queries: `activity.js` line 91
```javascript
a.metadata,
```

Error: "column 'metadata' does not exist" or "column 'actor_id' does not exist"

---

## How the Error Occurs

### Scenario 1: Migration 020 Runs When Table Doesn't Exist

**Sequence of Events**:
1. Both migrations 014 and 020 try to create activity_log
2. If 020 runs BEFORE 014:
   - Table created with 020's incomplete schema
   - 014 runs but CREATE TABLE IF NOT EXISTS is skipped (table already exists)
   - Final schema is BROKEN (missing columns)
3. Application queries fail because actor_id and target_user_id don't exist

### Scenario 2: Table Dropped and Recreated

**Sequence of Events**:
1. Initial setup uses 014 (correct schema)
2. Table works fine for a while
3. Database issue causes table to be dropped
4. Migration retry or redeploy runs migrations
5. If 020 executes when 014 hasn't re-run:
   - 014's CREATE TABLE IF NOT EXISTS is skipped (migration already run)
   - 020 creates incomplete schema
   - Application fails

### Scenario 3: Database Restored from Backup

**Sequence of Events**:
1. Database restored from backup that used 020's schema
2. Table has incomplete schema from the backup
3. New code running against old schema causes errors

---

## Queries Affected by Missing Columns

### All SELECT Queries (Line 85-125)
```sql
SELECT DISTINCT
  a.id,
  a.action,
  a.resource_type,
  a.resource_id,
  a.metadata,          -- ERROR: column "details" used instead
  a.created_at,
  actor.name as actor_name,  -- ERROR: LEFT JOIN on a.actor_id fails
  actor.email as actor_email,
  actor.id as actor_id,
  target.name as target_name,  -- ERROR: LEFT JOIN on a.target_user_id fails
  target.email as target_email,
  ...
FROM activity_log a
LEFT JOIN users actor ON a.actor_id = actor.id  -- ERROR: a.actor_id does not exist
LEFT JOIN users target ON a.target_user_id = target.id  -- ERROR: a.target_user_id does not exist
```

### All INSERT Queries (Line 319-336)
```sql
INSERT INTO activity_log
(user_id, actor_id, action, resource_type, resource_id, target_user_id, metadata, ip_address, user_agent)
--            ↑                                               ↑                  ↑
--        MISSING!                                       MISSING!         COLUMN NAME WRONG!
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
```

### Recent Activity Query (Line 369-401)
```sql
SELECT
  a.action,
  a.resource_type,
  COUNT(*) as count,
  MAX(a.created_at) as latest_at,
  array_agg(DISTINCT actor.name) FILTER (WHERE actor.name IS NOT NULL) as actors
FROM activity_log a
LEFT JOIN users actor ON a.actor_id = actor.id  -- ERROR: a.actor_id does not exist
```

---

## Why Migration 020 Is Broken

**File**: `/Users/wjc2007/Desktop/sway/backend/migrations/020_fix_missing_columns.sql`

**Intent**: Fix missing columns that are causing errors

**What It Does**:
1. Lines 25-34: Tries to ADD action column IF NOT EXISTS
2. Lines 37-47: Creates entire table IF NOT EXISTS with incomplete schema

**The Problem**:
- Lines 37-47 should be removed or completely rewritten
- The CREATE TABLE IF NOT EXISTS contradicts the ADD COLUMN logic
- The table schema is incomplete and missing critical columns
- The migration appears to have been copy-pasted from incomplete documentation

**What It Should Do**:
- Keep the ALTER TABLE section that adds missing columns
- Remove or completely rewrite the CREATE TABLE section
- Use the correct schema from migration 014

---

## Evidence from Code

### Migration 014 Proof (Lines 210-217)
```sql
-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_actor_id ON activity_log(actor_id);  -- Expects actor_id
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_resource_type ON activity_log(resource_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_resource_id ON activity_log(resource_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_target_user_id ON activity_log(target_user_id);  -- Expects target_user_id
```

Migration 014 explicitly creates indexes on:
- actor_id (line 212)
- target_user_id (line 217)

This PROVES these columns must exist in the table!

### Migration 020 Ignores These Columns

Migration 020's CREATE TABLE IF NOT EXISTS has NO indexes because it doesn't know about these columns!

---

## Summary

| Aspect | Migration 014 | Migration 020 |
|--------|---------------|---------------|
| **File** | 014_collaboration_features.sql | 020_fix_missing_columns.sql |
| **Approach** | Full schema definition | Partial schema |
| **actor_id** | ✓ Included | ✗ Missing |
| **target_user_id** | ✓ Included | ✗ Missing |
| **metadata** | ✓ Correct name | ✗ Named "details" |
| **Indexes** | ✓ 7 comprehensive indexes | ✗ None defined |
| **Status** | ✓ CORRECT | ✗ BROKEN |
| **Should be used** | ✓ YES | ✗ NO |

