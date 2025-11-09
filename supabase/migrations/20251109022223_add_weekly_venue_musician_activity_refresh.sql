/*
  # Weekly Venue & Musician Activity Refresh
  
  Creates a system to keep venues and musicians looking active by:
  1. Rotating "featured" status weekly
  2. Updating "last_active" timestamps
  3. Adding subtle activity indicators
  4. Making the platform look constantly busy
  
  ## Why This Matters
  - Static profiles look abandoned
  - Users want to see activity and engagement
  - Featured rotation gives everyone visibility
  - Creates perception of thriving community
  
  ## How It Works
  - Every week, different venues/musicians get featured
  - Activity timestamps update to show recent engagement
  - Creates rotating spotlight effect
  - Fair distribution of visibility
*/

-- Add activity tracking columns if they don't exist
ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS last_active timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS feature_expires_at timestamptz;

ALTER TABLE musicians
ADD COLUMN IF NOT EXISTS last_active timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS feature_expires_at timestamptz;

-- Create indexes for featured queries
CREATE INDEX IF NOT EXISTS idx_venues_featured ON venues(is_featured, feature_expires_at) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_musicians_featured ON musicians(is_featured, feature_expires_at) WHERE is_featured = true;

-- Function to rotate featured venues (picks 10 random venues weekly)
CREATE OR REPLACE FUNCTION rotate_featured_venues()
RETURNS integer AS $$
DECLARE
  featured_count integer;
BEGIN
  -- Clear expired features
  UPDATE venues
  SET is_featured = false,
      feature_expires_at = NULL
  WHERE is_featured = true 
  AND (feature_expires_at IS NULL OR feature_expires_at < now());
  
  -- Feature 10 random venues for the week
  WITH random_venues AS (
    SELECT id
    FROM venues
    WHERE latitude IS NOT NULL 
    AND longitude IS NOT NULL
    AND (NOT is_featured OR is_featured IS NULL)
    ORDER BY random()
    LIMIT 10
  )
  UPDATE venues v
  SET is_featured = true,
      feature_expires_at = now() + interval '7 days',
      last_active = now()
  FROM random_venues rv
  WHERE v.id = rv.id;
  
  GET DIAGNOSTICS featured_count = ROW_COUNT;
  RETURN featured_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to rotate featured musicians (picks 20 random musicians weekly)
CREATE OR REPLACE FUNCTION rotate_featured_musicians()
RETURNS integer AS $$
DECLARE
  featured_count integer;
BEGIN
  -- Clear expired features
  UPDATE musicians
  SET is_featured = false,
      feature_expires_at = NULL
  WHERE is_featured = true 
  AND (feature_expires_at IS NULL OR feature_expires_at < now());
  
  -- Feature 20 random musicians for the week
  WITH random_musicians AS (
    SELECT id
    FROM musicians
    WHERE latitude IS NOT NULL 
    AND longitude IS NOT NULL
    AND (NOT is_featured OR is_featured IS NULL)
    ORDER BY random()
    LIMIT 20
  )
  UPDATE musicians m
  SET is_featured = true,
      feature_expires_at = now() + interval '7 days',
      last_active = now()
  FROM random_musicians rm
  WHERE m.id = rm.id;
  
  GET DIAGNOSTICS featured_count = ROW_COUNT;
  RETURN featured_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update activity timestamps (makes profiles look active)
CREATE OR REPLACE FUNCTION refresh_activity_timestamps()
RETURNS jsonb AS $$
DECLARE
  venue_count integer;
  musician_count integer;
BEGIN
  -- Update random 30% of venues to show recent activity
  WITH random_venues AS (
    SELECT id FROM venues
    WHERE random() < 0.3
  )
  UPDATE venues v
  SET last_active = now() - (random() * interval '3 days')
  FROM random_venues rv
  WHERE v.id = rv.id;
  
  GET DIAGNOSTICS venue_count = ROW_COUNT;
  
  -- Update random 40% of musicians to show recent activity
  WITH random_musicians AS (
    SELECT id FROM musicians
    WHERE random() < 0.4
  )
  UPDATE musicians m
  SET last_active = now() - (random() * interval '2 days')
  FROM random_musicians rm
  WHERE m.id = rm.id;
  
  GET DIAGNOSTICS musician_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'venues_updated', venue_count,
    'musicians_updated', musician_count,
    'timestamp', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Combined weekly refresh function
CREATE OR REPLACE FUNCTION weekly_platform_refresh()
RETURNS jsonb AS $$
DECLARE
  events_created integer;
  events_cleaned integer;
  venues_featured integer;
  musicians_featured integer;
  activity_result jsonb;
BEGIN
  -- Generate new events
  SELECT generate_upcoming_events(4) INTO events_created;
  
  -- Clean up old events
  SELECT cleanup_past_events() INTO events_cleaned;
  
  -- Rotate featured venues
  SELECT rotate_featured_venues() INTO venues_featured;
  
  -- Rotate featured musicians
  SELECT rotate_featured_musicians() INTO musicians_featured;
  
  -- Refresh activity timestamps
  SELECT refresh_activity_timestamps() INTO activity_result;
  
  RETURN jsonb_build_object(
    'success', true,
    'events_created', events_created,
    'events_cleaned', events_cleaned,
    'venues_featured', venues_featured,
    'musicians_featured', musicians_featured,
    'activity_refresh', activity_result,
    'timestamp', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the cron job to use the comprehensive refresh
SELECT cron.unschedule('auto-generate-weekly-events') 
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'auto-generate-weekly-events'
);

-- Schedule comprehensive weekly refresh (Every Monday at 3 AM UTC)
SELECT cron.schedule(
  'weekly-platform-refresh',
  '0 3 * * 1', -- Every Monday at 3 AM
  $$
  SELECT weekly_platform_refresh();
  $$
);

-- Run initial feature rotation
SELECT rotate_featured_venues() as venues_featured;
SELECT rotate_featured_musicians() as musicians_featured;

-- Show active cron jobs
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname LIKE '%weekly%' OR jobname LIKE '%refresh%';
