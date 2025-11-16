/*
  # Add Public Read Access to Bookings

  This migration adds a SELECT policy to allow anonymous and authenticated users
  to view accepted and escrowed bookings. This is necessary for the homepage to
  display venues with confirmed shows to visitors who are not logged in.

  1. Changes
    - Add SELECT policy for bookings table that allows reading accepted/escrowed bookings
    - Policy allows both anonymous and authenticated users
    - Only exposes bookings that are confirmed (accepted or escrowed status)
*/

-- Drop existing policy if it exists
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view confirmed bookings" ON bookings;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Allow anonymous and authenticated users to view accepted/escrowed bookings
CREATE POLICY "Anyone can view confirmed bookings"
  ON bookings FOR SELECT
  TO anon, authenticated
  USING (status IN ('accepted', 'escrowed'));
