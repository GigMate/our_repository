/*
  # Create Advertisements Table

  1. New Tables
    - `advertisements`
      - `id` (uuid, primary key)
      - `advertiser_name` (text) - Name of the advertiser
      - `ad_tier` (enum) - premium, standard, basic
      - `title` (text) - Ad headline
      - `description` (text) - Ad description
      - `image_url` (text) - Ad image
      - `link_url` (text) - Where the ad links to
      - `placement` (text) - Where ad should appear (fan_dashboard, musician_dashboard, venue_dashboard, all)
      - `is_active` (boolean) - Whether ad is currently active
      - `start_date` (timestamptz) - When ad campaign starts
      - `end_date` (timestamptz) - When ad campaign ends
      - `impressions` (integer) - Track views
      - `clicks` (integer) - Track clicks
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `advertisements` table
    - Add policy for public read access to active ads
    - Add policy for authenticated users to view all ads (for admin purposes)
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ad_tier') THEN
    CREATE TYPE ad_tier AS ENUM ('premium', 'standard', 'basic');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_name text NOT NULL,
  ad_tier ad_tier NOT NULL DEFAULT 'basic',
  title text NOT NULL,
  description text,
  image_url text,
  link_url text,
  placement text NOT NULL DEFAULT 'all',
  is_active boolean DEFAULT true,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active advertisements"
  ON advertisements
  FOR SELECT
  USING (
    is_active = true 
    AND start_date <= now() 
    AND (end_date IS NULL OR end_date >= now())
  );

CREATE POLICY "Authenticated users can view all advertisements"
  ON advertisements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_advertisements_placement ON advertisements(placement);
CREATE INDEX IF NOT EXISTS idx_advertisements_active ON advertisements(is_active, start_date, end_date);