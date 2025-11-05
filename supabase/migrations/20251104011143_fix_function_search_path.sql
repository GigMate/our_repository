/*
  # Fix Function Search Path Security

  1. Security Improvements
    - Set search_path to empty for all functions to prevent SQL injection
    - Use schema-qualified names in function bodies
    - This prevents malicious users from creating objects that could hijack function calls

  2. Functions Updated
    - handle_new_rating
    - increment_ad_impressions
    - increment_ad_clicks
    - update_user_rating_stats
    - update_user_tier
    - update_booking_status
    - check_booking_ratings

  Note: Functions will be recreated with explicit search_path settings
*/

-- Fix handle_new_rating function
CREATE OR REPLACE FUNCTION public.handle_new_rating()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.update_user_rating_stats(NEW.rated_user_id);
  PERFORM public.update_user_tier(NEW.rated_user_id);
  RETURN NEW;
END;
$$;

-- Fix increment_ad_impressions function
CREATE OR REPLACE FUNCTION public.increment_ad_impressions(ad_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.advertisements
  SET impressions = impressions + 1
  WHERE id = ad_id;
END;
$$;

-- Fix increment_ad_clicks function
CREATE OR REPLACE FUNCTION public.increment_ad_clicks(ad_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.advertisements
  SET clicks = clicks + 1
  WHERE id = ad_id;
END;
$$;

-- Fix update_user_rating_stats function
CREATE OR REPLACE FUNCTION public.update_user_rating_stats(user_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  avg_rating decimal;
  rating_count int;
BEGIN
  SELECT 
    COALESCE(AVG(rating), 0),
    COUNT(*)
  INTO avg_rating, rating_count
  FROM public.ratings
  WHERE rated_user_id = user_id;

  UPDATE public.profiles
  SET 
    average_rating = avg_rating,
    total_ratings = rating_count
  WHERE id = user_id;
END;
$$;

-- Fix update_user_tier function
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

-- Fix update_booking_status function
CREATE OR REPLACE FUNCTION public.update_booking_status(
  booking_id uuid,
  new_status text
)
RETURNS void
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.bookings
  SET status = new_status::public.booking_status
  WHERE id = booking_id;
  
  IF new_status = 'completed' THEN
    PERFORM public.check_booking_ratings(booking_id);
  END IF;
END;
$$;

-- Fix check_booking_ratings function
CREATE OR REPLACE FUNCTION public.check_booking_ratings(booking_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  booking_record record;
  venue_rated boolean;
  musician_rated boolean;
BEGIN
  SELECT musician_id, venue_id
  INTO booking_record
  FROM public.bookings
  WHERE id = booking_id;

  SELECT EXISTS(
    SELECT 1 FROM public.ratings
    WHERE rater_id = booking_record.venue_id
    AND rated_user_id = booking_record.musician_id
    AND booking_id = check_booking_ratings.booking_id
  ) INTO venue_rated;

  SELECT EXISTS(
    SELECT 1 FROM public.ratings
    WHERE rater_id = booking_record.musician_id
    AND rated_user_id = booking_record.venue_id
    AND booking_id = check_booking_ratings.booking_id
  ) INTO musician_rated;

  IF venue_rated AND musician_rated THEN
    UPDATE public.bookings
    SET both_parties_rated = true
    WHERE id = booking_id;
  END IF;
END;
$$;
