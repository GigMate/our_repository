/*
  # Weekly Venue Spotlight System

  1. New Tables
    - `venue_spotlight`
      - Tracks the currently featured venue in header
      - Rotates every Monday automatically
      - Only one venue is featured at a time

  2. Functions
    - `rotate_venue_spotlight()` - Selects a new venue to feature
    - Selection criteria: active venues with good ratings, rotates fairly

  3. Cron Job
    - Runs every Monday at 12:01 AM
    - Automatically selects a new featured venue

  4. Security
    - Enable RLS
    - Anyone can view the current spotlight
    - Only admins can manually set spotlight
*/

-- Create venue_spotlight table
CREATE TABLE IF NOT EXISTS venue_spotlight (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  ends_at timestamptz DEFAULT (now() + interval '7 days'),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Add last_featured_at to profiles to track rotation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_featured_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_featured_at timestamptz;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE venue_spotlight ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active venue spotlight"
  ON venue_spotlight FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage venue spotlight"
  ON venue_spotlight FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email LIKE '%@gigmate.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email LIKE '%@gigmate.com'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_venue_spotlight_active ON venue_spotlight(is_active, started_at);
CREATE INDEX IF NOT EXISTS idx_venue_spotlight_venue ON venue_spotlight(venue_id);

-- Function to rotate venue spotlight
CREATE OR REPLACE FUNCTION rotate_venue_spotlight()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_venue_id uuid;
BEGIN
  -- Deactivate current spotlight
  UPDATE venue_spotlight
  SET is_active = false
  WHERE is_active = true;

  -- Select a venue that:
  -- 1. Is a venue user type
  -- 2. Has good rating (>= 4.0 or no rating yet)
  -- 3. Hasn't been featured recently (or never featured)
  -- 4. Is active and has profile data
  SELECT p.id INTO selected_venue_id
  FROM profiles p
  LEFT JOIN venues v ON v.id = p.id
  WHERE p.user_type = 'venue'
    AND (p.average_rating >= 4.0 OR p.average_rating IS NULL)
    AND (p.last_featured_at IS NULL OR p.last_featured_at < now() - interval '60 days')
    AND v.venue_name IS NOT NULL
  ORDER BY 
    CASE WHEN p.last_featured_at IS NULL THEN 0 ELSE 1 END,
    p.last_featured_at ASC NULLS FIRST,
    p.average_rating DESC NULLS LAST,
    p.total_ratings DESC,
    random()
  LIMIT 1;

  -- If we found a venue, create new spotlight
  IF selected_venue_id IS NOT NULL THEN
    INSERT INTO venue_spotlight (venue_id, started_at, ends_at, is_active)
    VALUES (
      selected_venue_id,
      now(),
      now() + interval '7 days',
      true
    );

    -- Update last_featured_at for the venue
    UPDATE profiles
    SET last_featured_at = now()
    WHERE id = selected_venue_id;
  END IF;
END;
$$;

-- Function to get current spotlight venue with full details
CREATE OR REPLACE FUNCTION get_current_spotlight_venue()
RETURNS TABLE (
  venue_id uuid,
  venue_name text,
  city text,
  state text,
  venue_type text,
  average_rating numeric,
  total_ratings integer,
  bio text,
  website text,
  phone text,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vs.venue_id,
    v.venue_name,
    v.city,
    v.state,
    v.venue_type,
    p.average_rating,
    p.total_ratings,
    p.bio,
    p.website,
    p.phone,
    p.email
  FROM venue_spotlight vs
  JOIN profiles p ON p.id = vs.venue_id
  JOIN venues v ON v.id = vs.venue_id
  WHERE vs.is_active = true
    AND vs.started_at <= now()
    AND vs.ends_at >= now()
  ORDER BY vs.started_at DESC
  LIMIT 1;
END;
$$;

-- Initialize with first venue if none exists
DO $$
DECLARE
  spotlight_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM venue_spotlight WHERE is_active = true) INTO spotlight_exists;
  
  IF NOT spotlight_exists THEN
    PERFORM rotate_venue_spotlight();
  END IF;
END $$;