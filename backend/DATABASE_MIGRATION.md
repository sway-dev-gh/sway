# Database Migration Instructions

## Password Protection Feature Migration

This migration adds support for password-protected file requests (Pro feature).

### Required Changes

Three new columns need to be added to the `file_requests` table:
- `password_hash` - Stores bcrypt hashed passwords
- `require_email` - Boolean flag to require uploader email
- `require_name` - Boolean flag to require uploader name

### How to Run on Render

1. **Access Render Dashboard**
   - Go to https://dashboard.render.com
   - Navigate to your PostgreSQL database instance

2. **Open Shell**
   - Click on the database service
   - Click "Connect" → "External Connection"
   - Or use the "Shell" tab in Render dashboard

3. **Run Migration SQL**

```sql
-- Add password protection columns
ALTER TABLE file_requests ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE file_requests ADD COLUMN IF NOT EXISTS require_email BOOLEAN DEFAULT false;
ALTER TABLE file_requests ADD COLUMN IF NOT EXISTS require_name BOOLEAN DEFAULT false;
```

4. **Verify Migration**

```sql
-- Check that columns were added
\d file_requests

-- Or use this query
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'file_requests'
AND column_name IN ('password_hash', 'require_email', 'require_name');
```

### Expected Output

You should see:
```
     column_name   |  data_type       | is_nullable | column_default
-------------------+------------------+-------------+----------------
 password_hash     | character varying| YES         | NULL
 require_email     | boolean          | YES         | false
 require_name      | boolean          | YES         | false
```

### Rollback (if needed)

If you need to rollback this migration:

```sql
ALTER TABLE file_requests DROP COLUMN IF EXISTS password_hash;
ALTER TABLE file_requests DROP COLUMN IF EXISTS require_email;
ALTER TABLE file_requests DROP COLUMN IF EXISTS require_name;
```

### Notes

- Migration uses `IF NOT EXISTS` so it's safe to run multiple times
- Existing requests will have NULL password_hash (no password protection)
- Default values for boolean columns are `false`
- No data loss will occur - this only adds new columns
- Backend code already includes bcrypt for password hashing
- Frontend already has password input UI for Pro users

### After Migration

Once migration is complete:
1. Backend will automatically support password-protected requests
2. Pro users can add passwords when creating requests
3. Upload pages will prompt for password when required
4. No code changes needed - feature is already implemented
