-- Migration: Add request_type_designs column to branding_settings table
-- This allows different branding for each request type

ALTER TABLE branding_settings
ADD COLUMN IF NOT EXISTS request_type_designs TEXT;

COMMENT ON COLUMN branding_settings.request_type_designs IS 'JSON object mapping request type IDs to their branding designs (backgroundColor, elements array)';
