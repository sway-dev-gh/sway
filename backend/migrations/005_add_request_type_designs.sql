-- Migration: Add request_type_designs column to branding_settings table
-- This allows different branding for each request type

ALTER TABLE branding_settings
ADD COLUMN IF NOT EXISTS request_type_designs TEXT;

-- Migrate existing canvas_elements data to request_type_designs if needed
-- This ensures backward compatibility
UPDATE branding_settings
SET request_type_designs = json_build_object('general-upload', json_build_object(
  'backgroundColor', background_color,
  'elements', canvas_elements::json
))::text
WHERE request_type_designs IS NULL
  AND canvas_elements IS NOT NULL;

COMMENT ON COLUMN branding_settings.request_type_designs IS 'JSON object mapping request type IDs to their branding designs (backgroundColor, elements array)';
