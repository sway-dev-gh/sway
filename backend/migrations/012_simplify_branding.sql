-- Migration: Simplify branding_settings table
-- Remove complex features and keep only: logo_url, background_color, remove_branding

DO $$
BEGIN
  -- Add remove_branding column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branding_settings' AND column_name = 'remove_branding') THEN
    ALTER TABLE branding_settings ADD COLUMN remove_branding BOOLEAN DEFAULT true;

    -- If show_watermark exists, convert it to remove_branding (inverse logic)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branding_settings' AND column_name = 'show_watermark') THEN
      UPDATE branding_settings SET remove_branding = NOT show_watermark;
    END IF;
  END IF;

  -- Drop unused columns
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branding_settings' AND column_name = 'show_watermark') THEN
    ALTER TABLE branding_settings DROP COLUMN show_watermark;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branding_settings' AND column_name = 'text_color') THEN
    ALTER TABLE branding_settings DROP COLUMN text_color;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branding_settings' AND column_name = 'accent_color') THEN
    ALTER TABLE branding_settings DROP COLUMN accent_color;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branding_settings' AND column_name = 'custom_message') THEN
    ALTER TABLE branding_settings DROP COLUMN custom_message;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branding_settings' AND column_name = 'custom_css') THEN
    ALTER TABLE branding_settings DROP COLUMN custom_css;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branding_settings' AND column_name = 'elements') THEN
    ALTER TABLE branding_settings DROP COLUMN elements;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branding_settings' AND column_name = 'request_type_designs') THEN
    ALTER TABLE branding_settings DROP COLUMN request_type_designs;
  END IF;

  -- Ensure background_color has proper default
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branding_settings' AND column_name = 'background_color') THEN
    ALTER TABLE branding_settings ALTER COLUMN background_color SET DEFAULT '#FFFFFF';
  END IF;
END $$;
