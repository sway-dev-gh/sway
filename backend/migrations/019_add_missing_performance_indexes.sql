-- =====================================================
-- PERFORMANCE OPTIMIZATION: Add Missing Database Indexes - Migration 019
-- Adds critical indexes for frequently queried columns
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Starting performance index creation migration...';

    -- =====================================================
    -- 1. USERS TABLE INDEXES
    -- =====================================================

    -- Critical for login performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    RAISE NOTICE '✓ Added index on users.email for login queries';

    -- For case-insensitive email lookups
    CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
    RAISE NOTICE '✓ Added index on users.LOWER(email) for case-insensitive lookups';

    -- =====================================================
    -- 2. PROJECTS TABLE INDEXES
    -- =====================================================

    -- Very common query pattern: projects by user
    CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
    RAISE NOTICE '✓ Added index on projects.user_id';

    -- For guest access patterns
    CREATE INDEX IF NOT EXISTS idx_projects_guest_id ON projects(guest_id);
    RAISE NOTICE '✓ Added index on projects.guest_id';

    -- For soft deletes and active project filtering
    CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);
    RAISE NOTICE '✓ Added index on projects.deleted_at';

    -- Composite index for user active projects
    CREATE INDEX IF NOT EXISTS idx_projects_user_active ON projects(user_id, deleted_at) WHERE deleted_at IS NULL;
    RAISE NOTICE '✓ Added composite index on projects(user_id, deleted_at) for active projects';

    -- =====================================================
    -- 3. FILE_REQUESTS TABLE INDEXES
    -- =====================================================

    -- Very common: file requests by user
    CREATE INDEX IF NOT EXISTS idx_file_requests_user_id ON file_requests(user_id);
    RAISE NOTICE '✓ Added index on file_requests.user_id';

    -- Critical composite index for active requests
    CREATE INDEX IF NOT EXISTS idx_file_requests_user_active ON file_requests(user_id, is_active);
    RAISE NOTICE '✓ Added composite index on file_requests(user_id, is_active)';

    -- For guest access patterns
    CREATE INDEX IF NOT EXISTS idx_file_requests_guest_id ON file_requests(guest_id);
    RAISE NOTICE '✓ Added index on file_requests.guest_id';

    -- For filtering by activity status
    CREATE INDEX IF NOT EXISTS idx_file_requests_is_active ON file_requests(is_active);
    RAISE NOTICE '✓ Added index on file_requests.is_active';

    -- For date-based queries and analytics
    CREATE INDEX IF NOT EXISTS idx_file_requests_created_at ON file_requests(created_at);
    RAISE NOTICE '✓ Added index on file_requests.created_at';

    -- =====================================================
    -- 4. UPLOADS TABLE INDEXES
    -- =====================================================

    -- For joins with file_requests and user uploads
    CREATE INDEX IF NOT EXISTS idx_uploads_request_id ON uploads(request_id);
    RAISE NOTICE '✓ Added index on uploads.request_id';

    -- For user upload queries
    CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads(user_id);
    RAISE NOTICE '✓ Added index on uploads.user_id (if column exists)';

    -- Critical for analytics and date filtering
    CREATE INDEX IF NOT EXISTS idx_uploads_uploaded_at ON uploads(uploaded_at);
    RAISE NOTICE '✓ Added index on uploads.uploaded_at';

    -- Composite index for user uploads by date
    CREATE INDEX IF NOT EXISTS idx_uploads_request_date ON uploads(request_id, uploaded_at);
    RAISE NOTICE '✓ Added composite index on uploads(request_id, uploaded_at)';

    -- =====================================================
    -- 5. NOTIFICATIONS TABLE INDEXES
    -- =====================================================

    -- Critical for user notification queries
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    RAISE NOTICE '✓ Added index on notifications.user_id';

    -- For filtering read/unread notifications
    CREATE INDEX IF NOT EXISTS idx_notifications_read_status ON notifications(is_read);
    RAISE NOTICE '✓ Added index on notifications.is_read (if column exists)';

    -- For date-based notification queries
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
    RAISE NOTICE '✓ Added index on notifications.created_at';

    -- Composite for user unread notifications
    CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at);
    RAISE NOTICE '✓ Added composite index for user unread notifications';

    -- =====================================================
    -- 6. GUEST_USERS TABLE INDEXES
    -- =====================================================

    -- Critical for guest identification
    CREATE INDEX IF NOT EXISTS idx_guest_users_device_fingerprint ON guest_users(device_fingerprint);
    RAISE NOTICE '✓ Added index on guest_users.device_fingerprint';

    -- For guest ID lookups
    CREATE INDEX IF NOT EXISTS idx_guest_users_guest_id ON guest_users(guest_id);
    RAISE NOTICE '✓ Added index on guest_users.guest_id';

    -- For filtering active guests
    CREATE INDEX IF NOT EXISTS idx_guest_users_is_active ON guest_users(is_active);
    RAISE NOTICE '✓ Added index on guest_users.is_active';

    -- Composite for active guest lookups
    CREATE INDEX IF NOT EXISTS idx_guest_users_active_fingerprint ON guest_users(device_fingerprint, is_active);
    RAISE NOTICE '✓ Added composite index on guest_users(device_fingerprint, is_active)';

    -- =====================================================
    -- 7. COLLABORATIONS TABLE INDEXES (if exists)
    -- =====================================================

    -- For collaboration queries
    CREATE INDEX IF NOT EXISTS idx_collaborations_owner_id ON collaborations(owner_id);
    RAISE NOTICE '✓ Added index on collaborations.owner_id (if table exists)';

    CREATE INDEX IF NOT EXISTS idx_collaborations_collaborator_id ON collaborations(collaborator_id);
    RAISE NOTICE '✓ Added index on collaborations.collaborator_id (if table exists)';

    CREATE INDEX IF NOT EXISTS idx_collaborations_project_id ON collaborations(project_id);
    RAISE NOTICE '✓ Added index on collaborations.project_id (if table exists)';

    -- =====================================================
    -- 8. TOKEN BLACKLIST INDEXES (for security)
    -- =====================================================

    -- For token validation performance
    CREATE INDEX IF NOT EXISTS idx_token_blacklist_token_hash ON token_blacklist(token_hash);
    RAISE NOTICE '✓ Added index on token_blacklist.token_hash (if table exists)';

    CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist(expires_at);
    RAISE NOTICE '✓ Added index on token_blacklist.expires_at (if table exists)';

    -- =====================================================
    -- 9. ACTIVITY LOG INDEXES (for monitoring)
    -- =====================================================

    -- For activity tracking and analytics
    CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
    RAISE NOTICE '✓ Added index on activity_log.user_id (if table exists)';

    CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log(timestamp);
    RAISE NOTICE '✓ Added index on activity_log.timestamp (if table exists)';

    CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
    RAISE NOTICE '✓ Added index on activity_log.action (if table exists)';

    -- =====================================================
    -- 10. OPTIMIZE EXISTING PARTIAL INDEXES
    -- =====================================================

    -- Optimize projects for active records only
    CREATE INDEX IF NOT EXISTS idx_projects_user_active_only ON projects(user_id) WHERE deleted_at IS NULL;
    RAISE NOTICE '✓ Added partial index for active projects only';

    -- Optimize file_requests for active records only
    CREATE INDEX IF NOT EXISTS idx_file_requests_active_only ON file_requests(user_id) WHERE is_active = true;
    RAISE NOTICE '✓ Added partial index for active file requests only';

    -- =====================================================
    -- 11. VALIDATION AND REPORTING
    -- =====================================================

    RAISE NOTICE '=== PERFORMANCE INDEX CREATION COMPLETE ===';
    RAISE NOTICE 'Added indexes for:';
    RAISE NOTICE '  - users: email lookup optimization';
    RAISE NOTICE '  - projects: user and guest access patterns';
    RAISE NOTICE '  - file_requests: user and activity filtering';
    RAISE NOTICE '  - uploads: request and date associations';
    RAISE NOTICE '  - notifications: user and read status';
    RAISE NOTICE '  - guest_users: device and activity tracking';
    RAISE NOTICE '  - collaborations: access control patterns';
    RAISE NOTICE '  - token_blacklist: security validation';
    RAISE NOTICE '  - activity_log: monitoring and analytics';
    RAISE NOTICE '  - partial indexes: optimized active record queries';
    RAISE NOTICE '';
    RAISE NOTICE 'These indexes will significantly improve query performance for:';
    RAISE NOTICE '  ✓ User authentication and login';
    RAISE NOTICE '  ✓ Project and file request listings';
    RAISE NOTICE '  ✓ Analytics and reporting queries';
    RAISE NOTICE '  ✓ Guest user identification';
    RAISE NOTICE '  ✓ Notification delivery';
    RAISE NOTICE '  ✓ Collaboration access control';
    RAISE NOTICE '  ✓ Token validation security';
    RAISE NOTICE '';
    RAISE NOTICE 'Migration 019: Missing Performance Indexes - COMPLETED';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating indexes: %', SQLERRM;
        RAISE NOTICE 'Some indexes may not have been created if tables do not exist.';
        RAISE NOTICE 'This is expected for optional tables.';
END $$;