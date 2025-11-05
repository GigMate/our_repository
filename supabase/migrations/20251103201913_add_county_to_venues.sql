/*
  # Add county column to venues table

  1. Changes
    - Add `county` column to `venues` table to store county information
    - This allows filtering and organizing venues by Texas county
  
  2. Notes
    - Column is nullable to support existing data
    - No default value set as county varies by venue
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'venues' AND column_name = 'county'
  ) THEN
    ALTER TABLE venues ADD COLUMN county text;
  END IF;
END $$;
