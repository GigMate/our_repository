/*
  # Add Anonymous Public Read Access for Home Page

  1. Changes
    - Add SELECT policies for anonymous users on events, venues, and musicians tables
    - Allows home page to display upcoming events without requiring login
    - Only allows viewing upcoming/public events, not all data
  
  2. Security
    - Anonymous users can ONLY read public data
    - Cannot insert, update, or delete
    - Cannot see cancelled or private events
*/

-- Allow anonymous users to view upcoming events
CREATE POLICY "Anonymous users can view upcoming events"
  ON events
  FOR SELECT
  TO anon
  USING (status = 'upcoming');

-- Allow anonymous users to view all venues (public business listings)
CREATE POLICY "Anonymous users can view venues"
  ON venues
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to view all musicians (public artist profiles)
CREATE POLICY "Anonymous users can view musicians"
  ON musicians
  FOR SELECT
  TO anon
  USING (true);
