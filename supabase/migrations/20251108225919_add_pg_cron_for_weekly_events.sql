/*
  # Schedule Weekly Event Generation

  Sets up pg_cron to automatically generate events every week.
  This ensures the platform always has fresh events without manual intervention.

  ## What This Does
  
  1. Enables pg_cron extension for scheduled jobs
  2. Creates a weekly job that runs every Monday at 3 AM
  3. Automatically generates new events for the next 4 weeks
  4. Cleans up old completed events
  
  ## Frequency
  - Runs: Every Monday at 3:00 AM UTC
  - Generates: Events for next 4 weeks
  - Cleanup: Removes events older than 7 days
  
  ## Security
  - Uses service role for cron execution
  - Maintains RLS policies on events table
*/

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing job if it exists
SELECT cron.unschedule('auto-generate-weekly-events') 
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'auto-generate-weekly-events'
);

-- Schedule weekly event generation (Every Monday at 3 AM UTC)
SELECT cron.schedule(
  'auto-generate-weekly-events',
  '0 3 * * 1', -- Cron expression: Every Monday at 3 AM
  $$
  SELECT generate_upcoming_events(4);
  SELECT cleanup_past_events();
  $$
);

-- Also create a manual trigger function for admins
CREATE OR REPLACE FUNCTION trigger_event_generation()
RETURNS jsonb AS $$
DECLARE
  events_created integer;
  events_cleaned integer;
BEGIN
  -- Generate events
  SELECT generate_upcoming_events(4) INTO events_created;
  
  -- Clean up old events
  SELECT cleanup_past_events() INTO events_cleaned;
  
  RETURN jsonb_build_object(
    'success', true,
    'events_created', events_created,
    'events_cleaned', events_cleaned,
    'timestamp', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Show current cron jobs
SELECT jobname, schedule, active, jobid
FROM cron.job
WHERE jobname = 'auto-generate-weekly-events';
