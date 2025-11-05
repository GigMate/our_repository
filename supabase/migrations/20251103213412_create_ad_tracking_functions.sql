/*
  # Create Advertisement Tracking Functions

  1. Functions
    - `increment_ad_impressions` - Safely increment impression count
    - `increment_ad_clicks` - Safely increment click count

  2. Notes
    - Functions use atomic updates to prevent race conditions
    - No authentication required as these are public actions
*/

CREATE OR REPLACE FUNCTION increment_ad_impressions(ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE advertisements
  SET impressions = impressions + 1
  WHERE id = ad_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_ad_clicks(ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE advertisements
  SET clicks = clicks + 1
  WHERE id = ad_id;
END;
$$;