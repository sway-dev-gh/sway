-- Migration: Update branding_settings table schema
-- Migrates from old schema (remove_branding, primary_color) to new simplified schema

-- Add/update columns for simplified branding
DO $$
BEGIN
  -- Rename primary_color to background_color if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branding_settings' AND column_name = 'primary_color') THEN
    ALTER TABLE branding_settings RENAME COLUMN primary_color TO background_color;
  END IF;

  -- Add text_color column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branding_settings' AND column_name = 'text_color') THEN
    ALTER TABLE branding_settings ADD COLUMN text_color VARCHAR(50) DEFAULT '#FFFFFF';
  END IF;

  -- Add accent_color column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branding_settings' AND column_name = 'accent_color') THEN
    ALTER TABLE branding_settings ADD COLUMN accent_color VARCHAR(50) DEFAULT '#FFFFFF';
  END IF;

  -- Add custom_message column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branding_settings' AND column_name = 'custom_message') THEN
    ALTER TABLE branding_settings ADD COLUMN custom_message TEXT;
  END IF;

  -- Add show_watermark column (replaces remove_branding with inverse logic)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branding_settings' AND column_name = 'remove_branding') THEN
    -- Add new column
    ALTER TABLE branding_settings ADD COLUMN show_watermark BOOLEAN;
    -- Copy data with inverse logic
    UPDATE branding_settings SET show_watermark = NOT remove_branding;
    -- Drop old column
    ALTER TABLE branding_settings DROP COLUMN remove_branding;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branding_settings' AND column_name = 'show_watermark') THEN
    ALTER TABLE branding_settings ADD COLUMN show_watermark BOOLEAN DEFAULT true;
  END IF;

  -- Add custom_css column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branding_settings' AND column_name = 'custom_css') THEN
    ALTER TABLE branding_settings ADD COLUMN custom_css TEXT;
  END IF;

  -- Add elements column (for future use, but not used in simplified version)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branding_settings' AND column_name = 'elements') THEN
    ALTER TABLE branding_settings ADD COLUMN elements JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_branding_user_id ON branding_settings(user_id);

-- Add comments
COMMENT ON TABLE branding_settings IS 'Custom branding settings for user upload pages';
COMMENT ON COLUMN branding_settings.show_watermark IS 'Whether to show "Powered by Sway" watermark';
COMMENT ON COLUMN branding_settings.custom_message IS 'Custom welcome message for upload pages';
