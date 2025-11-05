/*
  # Add Geographic Coordinates for Map Search

  1. Schema Changes
    - Add latitude and longitude columns to venues table
    - Add latitude and longitude columns to musicians table
    - These will enable distance-based searches using Google Maps

  2. Features Enabled
    - Location-based search for nearby venues and musicians
    - Tier-based radius restrictions (county, state, national)
    - Real-time geolocation for "find near me" functionality

  Note: Coordinates can be populated via geocoding API or manual entry
*/

-- Add geographic coordinates to venues
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'venues' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE venues ADD COLUMN latitude numeric(10, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'venues' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE venues ADD COLUMN longitude numeric(11, 8);
  END IF;
END $$;

-- Add geographic coordinates to musicians
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'musicians' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE musicians ADD COLUMN latitude numeric(10, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'musicians' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE musicians ADD COLUMN longitude numeric(11, 8);
  END IF;
END $$;

-- Create index for geographic queries on venues
CREATE INDEX IF NOT EXISTS idx_venues_coordinates 
ON venues(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create index for geographic queries on musicians
CREATE INDEX IF NOT EXISTS idx_musicians_coordinates 
ON musicians(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create helper function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 numeric,
  lon1 numeric,
  lat2 numeric,
  lon2 numeric
)
RETURNS numeric
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  r numeric := 3959; -- Earth's radius in miles
  dlat numeric;
  dlon numeric;
  a numeric;
  c numeric;
BEGIN
  -- Convert degrees to radians
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  -- Haversine formula
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN r * c;
END;
$$;
