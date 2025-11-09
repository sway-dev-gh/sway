-- Migration: Add field_requirements column to file_requests
-- This allows storing which fields (name, email, custom fields) are required for each request

DO $$
BEGIN
  -- Add field_requirements column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'file_requests' AND column_name = 'field_requirements') THEN
    ALTER TABLE file_requests ADD COLUMN field_requirements JSONB DEFAULT NULL;

    RAISE NOTICE 'Added field_requirements column to file_requests table';
  ELSE
    RAISE NOTICE 'field_requirements column already exists in file_requests table';
  END IF;
END $$;
