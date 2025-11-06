/*
  # Add Preferred Genres to Venues

  1. Changes
    - Add `preferred_genres` array column to venues table
    - Allows venues to specify what genres of music they prefer to host
    - Helps musicians find venues that match their style

  2. Notes
    - Using array type to support multiple genres
    - Optional field to maintain backward compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'venues' AND column_name = 'preferred_genres'
  ) THEN
    ALTER TABLE venues ADD COLUMN preferred_genres text[] DEFAULT '{}';
  END IF;
END $$;