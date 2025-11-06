/*
  # Complete Venue Subscription System

  1. Schema Changes
    - Add venue_subscription_tier for venues' access to musician database
    - Update existing standard tier values to bronze
    - Create helper functions for radius calculation

  2. Tier Definitions
    Musicians (Rating-Based - FREE):
    - Bronze: Default tier, 0-10 ratings, county access (50 miles)
    - Silver: 10-25 ratings, 3.5+ avg, regional access (100 miles)
    - Gold: 25-50 ratings, 4.0+ avg, state access (300 miles)
    - Platinum: 50+ ratings, 4.5+ avg, national access (3000 miles)

    Venues (Subscription-Based - PAID):
    - Local: County musician database (50 miles)
    - Regional: Multi-county musician database (100 miles)
    - State: Statewide musician database (300 miles)
    - National: Nationwide musician database (3000 miles)
*/

-- Create new enum for venue subscription tiers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'venue_subscription_tier') THEN
    CREATE TYPE venue_subscription_tier AS ENUM ('local', 'regional', 'state', 'national');
  END IF;
END $$;

-- Add venue_subscription_tier column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'venue_subscription_tier'
  ) THEN
    ALTER TABLE profiles ADD COLUMN venue_subscription_tier venue_subscription_tier DEFAULT 'local';
  END IF;
END $$;

-- Update existing data
UPDATE profiles 
SET venue_subscription_tier = 'local'
WHERE venue_subscription_tier IS NULL;

UPDATE profiles 
SET tier_level = 'bronze'
WHERE tier_level = 'standard';

ALTER TABLE profiles 
  ALTER COLUMN tier_level SET DEFAULT 'bronze';

-- Update the tier update function
CREATE OR REPLACE FUNCTION public.update_user_tier(user_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  user_rating decimal;
  user_rating_count int;
  new_tier text;
BEGIN
  SELECT average_rating, total_ratings
  INTO user_rating, user_rating_count
  FROM public.profiles
  WHERE id = user_id;

  IF user_rating_count >= 50 AND user_rating >= 4.5 THEN
    new_tier := 'platinum';
  ELSIF user_rating_count >= 25 AND user_rating >= 4.0 THEN
    new_tier := 'gold';
  ELSIF user_rating_count >= 10 AND user_rating >= 3.5 THEN
    new_tier := 'silver';
  ELSE
    new_tier := 'bronze';
  END IF;

  UPDATE public.profiles
  SET tier_level = new_tier::public.tier_level
  WHERE id = user_id;
END;
$$;

-- Create helper function to get search radius based on user type
CREATE OR REPLACE FUNCTION public.get_user_search_radius(user_id uuid)
RETURNS numeric
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  user_type_val text;
  musician_tier public.tier_level;
  venue_tier public.venue_subscription_tier;
  radius numeric;
BEGIN
  SELECT user_type INTO user_type_val
  FROM public.profiles
  WHERE id = user_id;

  IF user_type_val = 'musician' THEN
    SELECT tier_level INTO musician_tier
    FROM public.profiles
    WHERE id = user_id;

    CASE musician_tier
      WHEN 'platinum' THEN radius := 3000;
      WHEN 'gold' THEN radius := 300;
      WHEN 'silver' THEN radius := 100;
      ELSE radius := 50;
    END CASE;
  ELSIF user_type_val = 'venue' THEN
    SELECT venue_subscription_tier INTO venue_tier
    FROM public.profiles
    WHERE id = user_id;

    CASE venue_tier
      WHEN 'national' THEN radius := 3000;
      WHEN 'state' THEN radius := 300;
      WHEN 'regional' THEN radius := 100;
      ELSE radius := 50;
    END CASE;
  ELSE
    radius := 50;
  END IF;

  RETURN radius;
END;
$$;
