-- Add Stripe and plan-related fields to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS storage_limit_gb INTEGER DEFAULT 1;

-- Create index on stripe_subscription_id for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);
