/*
  # Create Rating Update Functions

  1. Functions
    - `update_user_rating_stats` - Recalculates average rating and total ratings
    - `update_user_tier` - Updates tier level based on average rating
    - `handle_new_rating` - Trigger function to update stats when new rating is added

  2. Tier Logic
    - Platinum: 5 stars average
    - Gold: 4.0 to 4.99 stars average
    - Standard: Below 4 stars or no ratings

  3. Triggers
    - After INSERT on ratings, update the rated user's stats and tier
*/

CREATE OR REPLACE FUNCTION update_user_rating_stats(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_rating decimal(3,2);
  rating_count integer;
BEGIN
  SELECT 
    COALESCE(AVG(rating), 0.00)::decimal(3,2),
    COUNT(*)::integer
  INTO avg_rating, rating_count
  FROM ratings
  WHERE rated_user_id = user_id;

  UPDATE profiles
  SET 
    average_rating = avg_rating,
    total_ratings = rating_count
  WHERE id = user_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_user_tier(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_rating decimal(3,2);
  new_tier tier_level;
BEGIN
  SELECT average_rating INTO avg_rating
  FROM profiles
  WHERE id = user_id;

  IF avg_rating >= 5.00 THEN
    new_tier := 'platinum';
  ELSIF avg_rating >= 4.00 THEN
    new_tier := 'gold';
  ELSE
    new_tier := 'standard';
  END IF;

  UPDATE profiles
  SET tier_level = new_tier
  WHERE id = user_id;
END;
$$;

CREATE OR REPLACE FUNCTION handle_new_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM update_user_rating_stats(NEW.rated_user_id);
  PERFORM update_user_tier(NEW.rated_user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_rating_created ON ratings;

CREATE TRIGGER on_rating_created
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_rating();