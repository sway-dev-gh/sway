# Quick Reference: activity_log Table Schema

## File Locations

| File | Type | Location |
|------|------|----------|
| 014_collaboration_features.sql | Migration (CORRECT) | `/Users/wjc2007/Desktop/sway/backend/migrations/014_collaboration_features.sql` |
| 020_fix_missing_columns.sql | Migration (BROKEN) | `/Users/wjc2007/Desktop/sway/backend/migrations/020_fix_missing_columns.sql` |
| activity.js | Application Code | `/Users/wjc2007/Desktop/sway/backend/src/routes/activity.js` |

---

## Correct Schema (from Migration 014)

```sql
-- Lines 117-129 of 014_collaboration_features.sql
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

---

## Broken Schema (from Migration 020 - Lines 36-47)

```sql
-- WRONG - Missing critical columns
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL DEFAULT 'unknown',
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB DEFAULT '{}',                -- WRONG NAME (should be metadata)
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Missing: actor_id, target_user_id, user_agent
```

---

## Key Indexes (Migration 014, Lines 210-217)

```sql
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_actor_id ON activity_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_resource_type ON activity_log(resource_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_resource_id ON activity_log(resource_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_target_user_id ON activity_log(target_user_id);
```

---

## Error Location

Error occurs when `activity.js` tries to execute queries that reference the `action` column:

**File**: `/Users/wjc2007/Desktop/sway/backend/src/routes/activity.js`

**Key queries using action column**:
- Line 88: SELECT a.action
- Line 188: Filter by action (WHERE a.action = ...)
- Line 243: COUNT(*) FILTER (WHERE a.action LIKE '%review%')
- Line 321: INSERT INTO activity_log (... action ...)
- Line 371: SELECT a.action (in recent query)
- Line 442: SELECT a.action (in notifications query)
- Line 533: SELECT a.action (in logs query)
- Line 617: SELECT a.action (in feed query)

---

## Column Requirements

| Column | Type | Required | Used For |
|--------|------|----------|----------|
| id | UUID | Yes | Primary key |
| user_id | UUID | Yes | FK to users, activity ownership |
| actor_id | UUID | No | LEFT JOIN to user who performed action |
| **action** | VARCHAR | Yes | Activity type filtering/logging |
| resource_type | VARCHAR | No | Project, review, etc. filtering |
| resource_id | UUID | No | Which resource the action applies to |
| target_user_id | UUID | No | LEFT JOIN for user being acted upon |
| metadata | JSONB | No | Action-specific data |
| ip_address | INET | No | Logging for security |
| user_agent | TEXT | No | Logging for security |
| created_at | TIMESTAMP | Yes | Sorting/filtering by date |

---

## How to Verify Current Schema

```sql
-- Check if activity_log exists
SELECT to_regclass('activity_log');

-- List all columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'activity_log'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'activity_log';
```

---

## Root Cause Analysis

1. **Migration 014** created activity_log correctly with `action` and other columns
2. **Migration 020** attempted to fix missing columns but has an **incomplete CREATE TABLE IF NOT EXISTS**
3. The incomplete schema in 020 is missing:
   - actor_id (CRITICAL - used in LEFT JOIN at activity.js:117)
   - target_user_id (CRITICAL - used in LEFT JOIN at activity.js:118)  
   - Correct column names (metadata vs details)

4. If Migration 020 somehow executed when table didn't exist, the broken schema would be used
5. If table was dropped and recreated with 020's schema, columns would be missing

---

## Recommended Actions

1. **Verify current state**: Run the verification queries above
2. **If schema is correct**: Migration 014 ran successfully, Migration 020's CREATE TABLE was skipped (IF NOT EXISTS)
3. **If schema is broken**: 
   - Restore from backup with correct schema, OR
   - Manually alter table to add missing columns:
     ```sql
     ALTER TABLE activity_log ADD COLUMN actor_id UUID REFERENCES users(id) ON DELETE SET NULL;
     ALTER TABLE activity_log ADD COLUMN target_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
     ```

4. **Fix Migration 020**: Replace incomplete CREATE TABLE with correct full schema
