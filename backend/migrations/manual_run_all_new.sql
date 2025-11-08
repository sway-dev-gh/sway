-- Manual migration script to run all new migrations (006, 007, 008)
-- Run this directly in psql or via Render Shell

-- ===== Migration 006: Team Members =====

DROP TABLE IF EXISTS team_members CASCADE;

CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  invited_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  removed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(owner_id, email)
);

CREATE INDEX idx_team_members_owner_id ON team_members(owner_id);
CREATE INDEX idx_team_members_email ON team_members(email);
CREATE INDEX idx_team_members_status ON team_members(status);

COMMENT ON TABLE team_members IS 'Team members for Business plan users (max 5 per account)';
COMMENT ON COLUMN team_members.owner_id IS 'User ID of the Business plan account owner';
COMMENT ON COLUMN team_members.email IS 'Email of the invited team member';
COMMENT ON COLUMN team_members.role IS 'Role of team member: member or admin';
COMMENT ON COLUMN team_members.status IS 'Status: pending (invited), active (accepted), removed';

-- ===== Migration 007: Custom Domains =====

DROP TABLE IF EXISTS custom_domains CASCADE;

CREATE TABLE custom_domains (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  domain VARCHAR(255) NOT NULL UNIQUE,
  verification_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  verification_token VARCHAR(255),
  dns_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_custom_domains_user_id ON custom_domains(user_id);
CREATE INDEX idx_custom_domains_domain ON custom_domains(domain);
CREATE INDEX idx_custom_domains_status ON custom_domains(verification_status);

COMMENT ON TABLE custom_domains IS 'Custom domains for Business plan users';
COMMENT ON COLUMN custom_domains.user_id IS 'User ID of the Business plan account owner';
COMMENT ON COLUMN custom_domains.domain IS 'Custom domain (e.g., files.yourcompany.com)';
COMMENT ON COLUMN custom_domains.verification_status IS 'DNS verification status';
COMMENT ON COLUMN custom_domains.verification_token IS 'Token for DNS TXT record verification';

-- ===== Migration 008: Integrations (Dropbox/Drive) =====

DROP TABLE IF EXISTS integrations CASCADE;

CREATE TABLE integrations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  integration_type VARCHAR(50) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  auto_sync BOOLEAN NOT NULL DEFAULT true,
  sync_folder VARCHAR(255) DEFAULT '/Sway Files',
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, integration_type)
);

CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE INDEX idx_integrations_type ON integrations(integration_type);
CREATE INDEX idx_integrations_active ON integrations(is_active);

COMMENT ON TABLE integrations IS 'Cloud storage integrations for Business plan users';
COMMENT ON COLUMN integrations.user_id IS 'User ID of the Business plan account owner';
COMMENT ON COLUMN integrations.integration_type IS 'Type of integration: dropbox or google_drive';
COMMENT ON COLUMN integrations.is_active IS 'Whether integration is currently active';
COMMENT ON COLUMN integrations.auto_sync IS 'Automatically sync files when uploaded';
COMMENT ON COLUMN integrations.sync_folder IS 'Folder path in cloud storage';
