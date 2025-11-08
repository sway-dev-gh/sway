-- Migration: Create branding_settings table
-- Stores user's custom branding settings for upload pages

CREATE TABLE IF NOT EXISTS branding_settings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  logo_url VARCHAR(500),
  background_color VARCHAR(50) DEFAULT '#000000',
  text_color VARCHAR(50) DEFAULT '#FFFFFF',
  accent_color VARCHAR(50) DEFAULT '#FFFFFF',
  custom_message TEXT,
  show_watermark BOOLEAN DEFAULT true,
  custom_css TEXT,
  elements JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_branding_user_id ON branding_settings(user_id);

COMMENT ON TABLE branding_settings IS 'Custom branding settings for user upload pages';
COMMENT ON COLUMN branding_settings.elements IS 'JSON array of custom UI elements (text, images, buttons)';
COMMENT ON COLUMN branding_settings.custom_css IS 'Additional custom CSS for advanced styling';
