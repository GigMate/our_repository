/*
  # Fix Function Search Path Issues

  1. Security Optimization
    - Set explicit search_path for functions to prevent security vulnerabilities
    - Ensures functions use correct schema and cannot be hijacked
    
  2. Changes
    - Update update_images_updated_at function with SECURITY INVOKER and explicit search_path
    - Update ensure_single_primary_image function with SECURITY INVOKER and explicit search_path
*/

-- Update images updated_at function
CREATE OR REPLACE FUNCTION update_images_updated_at()
RETURNS TRIGGER
SECURITY INVOKER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update ensure single primary image function
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER
SECURITY INVOKER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE images
    SET is_primary = false
    WHERE entity_type = NEW.entity_type
      AND entity_id = NEW.entity_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$;