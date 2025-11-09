-- Add password protection field to file_requests
ALTER TABLE file_requests ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add require_email and require_name flags
ALTER TABLE file_requests ADD COLUMN IF NOT EXISTS require_email BOOLEAN DEFAULT false;
ALTER TABLE file_requests ADD COLUMN IF NOT EXISTS require_name BOOLEAN DEFAULT false;
