-- Simple Enhanced Authentication Tables Migration

-- 1. Encryption keys table
CREATE TABLE IF NOT EXISTS encryption_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_type VARCHAR(50) NOT NULL,
    key_id VARCHAR(100) NOT NULL,
    key_value TEXT NOT NULL,
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

-- 2. Token metadata table
CREATE TABLE IF NOT EXISTS token_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jti VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID,
    key_version VARCHAR(100) NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_guest BOOLEAN DEFAULT false,
    is_revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revocation_reason VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    device_fingerprint VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, device_fingerprint)
);

-- 4. User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    device_fingerprint VARCHAR(255) NOT NULL,
    session_data TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Security audit log
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

-- 6. Key rotation events
CREATE TABLE IF NOT EXISTS key_rotation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    key_type VARCHAR(50) NOT NULL,
    old_key_id VARCHAR(100),
    new_key_id VARCHAR(100),
    reason VARCHAR(255),
    triggered_by VARCHAR(50) DEFAULT 'automatic',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_encryption_keys_type_status ON encryption_keys(key_type, status);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_expires_at ON encryption_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_token_metadata_jti ON token_metadata(jti);
CREATE INDEX IF NOT EXISTS idx_token_metadata_user_id ON token_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_token_metadata_expires_at ON token_metadata(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);

-- Add success message
SELECT 'Enhanced authentication tables created successfully' AS status;