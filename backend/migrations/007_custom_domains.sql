-- Migration: Create custom_domains table for Business plan custom domain feature
-- Allows Business users to use their own domain (e.g., files.yourcompany.com)

CREATE TABLE IF NOT EXISTS custom_domains (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  domain VARCHAR(255) NOT NULL UNIQUE,
  verification_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'failed'
  verification_token VARCHAR(255),
  dns_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_domains_user_id ON custom_domains(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON custom_domains(domain);
CREATE INDEX IF NOT EXISTS idx_custom_domains_status ON custom_domains(verification_status);

COMMENT ON TABLE custom_domains IS 'Custom domains for Business plan users';
COMMENT ON COLUMN custom_domains.user_id IS 'User ID of the Business plan account owner';
COMMENT ON COLUMN custom_domains.domain IS 'Custom domain (e.g., files.yourcompany.com)';
COMMENT ON COLUMN custom_domains.verification_status IS 'DNS verification status';
COMMENT ON COLUMN custom_domains.verification_token IS 'Token for DNS TXT record verification';
