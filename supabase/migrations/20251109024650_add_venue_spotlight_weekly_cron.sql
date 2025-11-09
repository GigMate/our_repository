/*
  # Add Weekly Venue Spotlight Rotation Cron Job

  1. Cron Job
    - Runs every Monday at 12:01 AM
    - Calls rotate_venue_spotlight() function
    - Automatically selects and features a new venue

  2. Notes
    - Uses pg_cron extension
    - Timezone: UTC (adjust as needed)
    - Ensures fair rotation of venues
*/

-- Ensure pg_cron extension is enabled (should already be from previous migrations)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the venue spotlight rotation for every Monday at 12:01 AM UTC
-- Cron format: minute hour day-of-month month day-of-week
-- 1 0 * * 1 = Every Monday at 12:01 AM
SELECT cron.schedule(
  'weekly-venue-spotlight-rotation',
  '1 0 * * 1',
  $$SELECT rotate_venue_spotlight()$$
);

-- Also add a manual trigger option that admins can call
CREATE OR REPLACE FUNCTION manually_rotate_spotlight()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email LIKE '%@gigmate.com'
  ) THEN
    RAISE EXCEPTION 'Only admins can manually rotate spotlight';
  END IF;

  -- Perform the rotation
  PERFORM rotate_venue_spotlight();

  -- Get the new spotlight venue
  SELECT json_build_object(
    'success', true,
    'message', 'Venue spotlight rotated successfully',
    'venue', (SELECT row_to_json(vs.*) FROM get_current_spotlight_venue() vs LIMIT 1)
  ) INTO result;

  RETURN result;
END;
$$;