/*
  # Fix Venue Spotlight Function

  Fix the get_current_spotlight_venue function to use correct columns:
  - Use v.description instead of p.bio
  - Remove p.website (doesn't exist)
  - Use p.phone (exists in profiles)
  - Use p.email (exists in profiles)
*/

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
    v.description as bio,
    NULL::text as website,
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
