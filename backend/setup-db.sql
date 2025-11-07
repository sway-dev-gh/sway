-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  plan VARCHAR(20) DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  storage_limit_gb INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- File requests table
CREATE TABLE IF NOT EXISTS file_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  short_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  request_type TEXT,
  time_limit_days INTEGER,
  custom_fields JSONB,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Uploads table
CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES file_requests(id) ON DELETE CASCADE,
  uploader_name TEXT NOT NULL,
  uploader_email TEXT,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  storage_path TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_requests_user ON file_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_code ON file_requests(short_code);
CREATE INDEX IF NOT EXISTS idx_uploads_request ON uploads(request_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);
