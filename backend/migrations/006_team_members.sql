-- Migration: Create team_members table for Business plan team access feature
-- Allows Business users to invite up to 5 team members

CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'member' or 'admin'
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'removed'
  invited_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  removed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(owner_id, email)
);

CREATE INDEX IF NOT EXISTS idx_team_members_owner_id ON team_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

COMMENT ON TABLE team_members IS 'Team members for Business plan users (max 5 per account)';
COMMENT ON COLUMN team_members.owner_id IS 'User ID of the Business plan account owner';
COMMENT ON COLUMN team_members.email IS 'Email of the invited team member';
COMMENT ON COLUMN team_members.role IS 'Role of team member: member or admin';
COMMENT ON COLUMN team_members.status IS 'Status: pending (invited), active (accepted), removed';
