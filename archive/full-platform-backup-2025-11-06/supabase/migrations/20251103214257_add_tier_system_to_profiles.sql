/*
  # Add Tier System to Profiles

  1. Changes
    - Add `tier_level` to profiles (platinum, gold, standard)
    - Add `average_rating` to profiles
    - Add `total_ratings` to profiles

  2. Notes
    - Tier levels based on average rating:
      - Platinum: 5 stars
      - Gold: 4-4.99 stars
      - Standard: Below 4 stars or no ratings
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tier_level') THEN
    CREATE TYPE tier_level AS ENUM ('platinum', 'gold', 'standard');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'tier_level'
  ) THEN
    ALTER TABLE profiles ADD COLUMN tier_level tier_level DEFAULT 'standard';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'average_rating'
  ) THEN
    ALTER TABLE profiles ADD COLUMN average_rating decimal(3,2) DEFAULT 0.00;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'total_ratings'
  ) THEN
    ALTER TABLE profiles ADD COLUMN total_ratings integer DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(tier_level);