-- Migration: Create integrations table for Dropbox/Drive sync (Business plan)
-- Allows Business users to auto-sync uploaded files to cloud storage

CREATE TABLE IF NOT EXISTS integrations (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  integration_type VARCHAR(50) NOT NULL, -- 'dropbox', 'google_drive'
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

CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_integrations_active ON integrations(is_active);

COMMENT ON TABLE integrations IS 'Cloud storage integrations for Business plan users';
COMMENT ON COLUMN integrations.user_id IS 'User ID of the Business plan account owner';
COMMENT ON COLUMN integrations.integration_type IS 'Type of integration: dropbox or google_drive';
COMMENT ON COLUMN integrations.is_active IS 'Whether integration is currently active';
COMMENT ON COLUMN integrations.auto_sync IS 'Automatically sync files when uploaded';
COMMENT ON COLUMN integrations.sync_folder IS 'Folder path in cloud storage';
