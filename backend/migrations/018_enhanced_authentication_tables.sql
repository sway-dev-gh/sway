-- =====================================================
-- Enhanced Authentication System - Migration 018
-- Creates tables for key rotation and secure token management
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Starting Enhanced Authentication system setup...';

    -- =====================================================
    -- 1. ENCRYPTION KEYS TABLE (for key rotation service)
    -- =====================================================

    CREATE TABLE IF NOT EXISTS encryption_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key_type VARCHAR(50) NOT NULL,
        key_id VARCHAR(100) NOT NULL,
        key_value TEXT NOT NULL,  -- Encrypted key value
        algorithm VARCHAR(50) NOT NULL,
        key_length INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'rotating', 'deprecated', 'revoked')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        activated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE,
        rotated_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB DEFAULT '{}',
        UNIQUE(key_type, key_id)
    );

    -- =====================================================
    -- 2. TOKEN METADATA TABLE (for JWT tracking)
    -- =====================================================

    CREATE TABLE IF NOT EXISTS token_metadata (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        jti VARCHAR(255) NOT NULL UNIQUE, -- JWT ID
        user_id UUID,
        key_version VARCHAR(100) NOT NULL, -- References encryption_keys.key_id
        issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_guest BOOLEAN DEFAULT false,
        is_revoked BOOLEAN DEFAULT false,
        revoked_at TIMESTAMP WITH TIME ZONE,
        revocation_reason VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- =====================================================
    -- 3. REFRESH TOKENS TABLE (for token refresh)
    -- =====================================================

    CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token_id VARCHAR(255) NOT NULL UNIQUE,
        user_id UUID NOT NULL,
        device_fingerprint VARCHAR(255) NOT NULL,
        token_hash VARCHAR(255) NOT NULL, -- SHA256 hash of the actual token
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        last_used_at TIMESTAMP WITH TIME ZONE,
        is_revoked BOOLEAN DEFAULT false,
        revoked_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, device_fingerprint)
    );

    -- =====================================================
    -- 4. USER SESSIONS TABLE (for enhanced session management)
    -- =====================================================

    CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(255) NOT NULL UNIQUE,
        user_id UUID NOT NULL,
        device_fingerprint VARCHAR(255) NOT NULL,
        session_data TEXT NOT NULL, -- Encrypted session data
        ip_address INET,
        user_agent TEXT,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- =====================================================
    -- 5. SECURITY AUDIT LOG (enhanced logging)
    -- =====================================================

    CREATE TABLE IF NOT EXISTS security_audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type VARCHAR(50) NOT NULL,
        user_id UUID,
        session_id VARCHAR(255),
        ip_address INET,
        user_agent TEXT,
        resource_type VARCHAR(50),
        resource_id VARCHAR(255),
        action_details JSONB DEFAULT '{}',
        risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- =====================================================
    -- 6. KEY ROTATION EVENTS (for audit trail)
    -- =====================================================

    CREATE TABLE IF NOT EXISTS key_rotation_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type VARCHAR(50) NOT NULL, -- 'rotation', 'emergency_rotation', 'deprecation', 'revocation'
        key_type VARCHAR(50) NOT NULL,
        old_key_id VARCHAR(100),
        new_key_id VARCHAR(100),
        reason VARCHAR(255),
        triggered_by VARCHAR(50) DEFAULT 'automatic', -- 'automatic', 'manual', 'emergency'
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- =====================================================
    -- 7. CREATE PERFORMANCE INDEXES
    -- =====================================================

    -- Encryption keys indexes
    CREATE INDEX IF NOT EXISTS idx_encryption_keys_type_status ON encryption_keys(key_type, status);
    CREATE INDEX IF NOT EXISTS idx_encryption_keys_expires_at ON encryption_keys(expires_at) WHERE expires_at IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_encryption_keys_key_id ON encryption_keys(key_id);

    -- Token metadata indexes
    CREATE INDEX IF NOT EXISTS idx_token_metadata_jti ON token_metadata(jti);
    CREATE INDEX IF NOT EXISTS idx_token_metadata_user_id ON token_metadata(user_id);
    CREATE INDEX IF NOT EXISTS idx_token_metadata_expires_at ON token_metadata(expires_at);
    CREATE INDEX IF NOT EXISTS idx_token_metadata_key_version ON token_metadata(key_version);
    CREATE INDEX IF NOT EXISTS idx_token_metadata_is_revoked ON token_metadata(is_revoked);

    -- Refresh tokens indexes
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_device_fingerprint ON refresh_tokens(device_fingerprint);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked);

    -- User sessions indexes
    CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_device_fingerprint ON user_sessions(device_fingerprint);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

    -- Security audit log indexes
    CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON security_audit_log(event_type);
    CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at);
    CREATE INDEX IF NOT EXISTS idx_security_audit_log_risk_level ON security_audit_log(risk_level);

    -- Key rotation events indexes
    CREATE INDEX IF NOT EXISTS idx_key_rotation_events_key_type ON key_rotation_events(key_type);
    CREATE INDEX IF NOT EXISTS idx_key_rotation_events_event_type ON key_rotation_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_key_rotation_events_created_at ON key_rotation_events(created_at);

    -- =====================================================
    -- 8. ADD FOREIGN KEY CONSTRAINTS (if tables exist)
    -- =====================================================

    -- Add FK constraints to users table if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        -- Token metadata FK
        BEGIN
            ALTER TABLE token_metadata ADD CONSTRAINT token_metadata_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN
            -- Constraint already exists, ignore
        END;

        -- Refresh tokens FK
        BEGIN
            ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_tokens_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN
            -- Constraint already exists, ignore
        END;

        -- User sessions FK
        BEGIN
            ALTER TABLE user_sessions ADD CONSTRAINT user_sessions_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN
            -- Constraint already exists, ignore
        END;

        -- Security audit log FK
        BEGIN
            ALTER TABLE security_audit_log ADD CONSTRAINT security_audit_log_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN
            -- Constraint already exists, ignore
        END;
    END IF;

    -- =====================================================
    -- 9. CREATE UPDATE TRIGGERS
    -- =====================================================

    -- Ensure trigger function exists
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $func$ language 'plpgsql';

    -- Create last_activity update trigger for user_sessions
    CREATE OR REPLACE FUNCTION update_last_activity()
    RETURNS TRIGGER AS $func$
    BEGIN
        NEW.last_activity = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $func$ language 'plpgsql';

    -- Apply triggers
    BEGIN
        CREATE TRIGGER update_user_sessions_last_activity
            BEFORE UPDATE ON user_sessions
            FOR EACH ROW EXECUTE FUNCTION update_last_activity();
    EXCEPTION WHEN duplicate_object THEN
        -- Trigger already exists, ignore
    END;

    -- =====================================================
    -- 10. CREATE CLEANUP FUNCTIONS
    -- =====================================================

    -- Function to clean up expired tokens and sessions
    CREATE OR REPLACE FUNCTION cleanup_expired_auth_data()
    RETURNS TABLE(cleaned_tokens INT, cleaned_sessions INT, cleaned_refresh_tokens INT) AS $$
    DECLARE
        token_count INT := 0;
        session_count INT := 0;
        refresh_count INT := 0;
    BEGIN
        -- Clean expired token metadata
        DELETE FROM token_metadata WHERE expires_at < NOW();
        GET DIAGNOSTICS token_count = ROW_COUNT;

        -- Clean expired user sessions
        DELETE FROM user_sessions WHERE expires_at < NOW();
        GET DIAGNOSTICS session_count = ROW_COUNT;

        -- Mark expired refresh tokens as revoked
        UPDATE refresh_tokens
        SET is_revoked = true, revoked_at = NOW()
        WHERE expires_at < NOW() AND is_revoked = false;
        GET DIAGNOSTICS refresh_count = ROW_COUNT;

        RETURN QUERY SELECT token_count, session_count, refresh_count;
    END;
    $$ LANGUAGE plpgsql;

    -- Function to get authentication statistics
    CREATE OR REPLACE FUNCTION get_auth_statistics()
    RETURNS JSON AS $$
    DECLARE
        result JSON;
    BEGIN
        SELECT json_build_object(
            'tokens', (
                SELECT json_build_object(
                    'total', COUNT(*),
                    'active', COUNT(*) FILTER (WHERE is_revoked = false),
                    'expired', COUNT(*) FILTER (WHERE expires_at < NOW()),
                    'guest', COUNT(*) FILTER (WHERE is_guest = true),
                    'today', COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')
                )
                FROM token_metadata
            ),
            'refresh_tokens', (
                SELECT json_build_object(
                    'total', COUNT(*),
                    'active', COUNT(*) FILTER (WHERE is_revoked = false AND expires_at > NOW()),
                    'used_today', COUNT(*) FILTER (WHERE last_used_at > NOW() - INTERVAL '24 hours')
                )
                FROM refresh_tokens
            ),
            'sessions', (
                SELECT json_build_object(
                    'total', COUNT(*),
                    'active', COUNT(*) FILTER (WHERE is_active = true AND expires_at > NOW()),
                    'today', COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')
                )
                FROM user_sessions
            ),
            'keys', (
                SELECT json_build_object(
                    'total', COUNT(*),
                    'active', COUNT(*) FILTER (WHERE status = 'active'),
                    'rotating', COUNT(*) FILTER (WHERE status = 'rotating'),
                    'deprecated', COUNT(*) FILTER (WHERE status = 'deprecated')
                )
                FROM encryption_keys
            )
        ) INTO result;

        RETURN result;
    END;
    $$ LANGUAGE plpgsql;

    -- =====================================================
    -- 11. VALIDATION AND REPORTING
    -- =====================================================

    RAISE NOTICE '=== ENHANCED AUTHENTICATION SETUP COMPLETE ===';
    RAISE NOTICE 'Created tables: encryption_keys, token_metadata, refresh_tokens, user_sessions';
    RAISE NOTICE 'Created audit tables: security_audit_log, key_rotation_events';
    RAISE NOTICE 'Created performance indexes for all tables';
    RAISE NOTICE 'Created cleanup and statistics functions';
    RAISE NOTICE 'Added foreign key constraints where possible';

    -- Verify table creation
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'encryption_keys') THEN
        RAISE NOTICE '✓ encryption_keys table created successfully';
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'token_metadata') THEN
        RAISE NOTICE '✓ token_metadata table created successfully';
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'refresh_tokens') THEN
        RAISE NOTICE '✓ refresh_tokens table created successfully';
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_sessions') THEN
        RAISE NOTICE '✓ user_sessions table created successfully';
    END IF;

    RAISE NOTICE 'Migration 018: Enhanced Authentication System - COMPLETED';

END $$;