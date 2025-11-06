/*
  # Add Location Fields to Musicians Table

  1. Changes
    - Add `city` column to store musician's city
    - Add `state` column to store musician's state
    - Add `zip_code` column to store musician's zip code
    - Add `county` column to store musician's county
    
  2. Notes
    - Using IF NOT EXISTS to prevent errors if columns already exist
    - All location fields are optional to maintain backward compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'musicians' AND column_name = 'city'
  ) THEN
    ALTER TABLE musicians ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'musicians' AND column_name = 'state'
  ) THEN
    ALTER TABLE musicians ADD COLUMN state text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'musicians' AND column_name = 'zip_code'
  ) THEN
    ALTER TABLE musicians ADD COLUMN zip_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'musicians' AND column_name = 'county'
  ) THEN
    ALTER TABLE musicians ADD COLUMN county text;
  END IF;
END $$;