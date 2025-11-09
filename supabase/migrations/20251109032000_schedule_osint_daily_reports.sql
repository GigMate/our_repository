/*
  # Schedule OSINT Daily Reports with pg_cron

  1. Purpose
    - Run OSINT investigations daily at 5:00 AM
    - Generate comprehensive report email
    - Send to admin automatically

  2. Schedule Details
    - Time: 5:00 AM every day
    - Timezone: UTC (adjust as needed)
    - Function: send-osint-daily-report edge function

  3. Process Flow
    - pg_cron triggers at 5:00 AM
    - Calls send-osint-daily-report function
    - Function runs osint-investigator first
    - Collects all investigations from last 24h
    - Generates email with recommendations
    - Sends to admin email

  4. Requirements
    - pg_cron extension must be enabled
    - Edge functions must be deployed
    - ADMIN_EMAIL environment variable set
*/

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing OSINT cron job if exists
SELECT cron.unschedule('osint-daily-report')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'osint-daily-report'
);

-- Schedule OSINT daily report at 5:00 AM UTC every day
SELECT cron.schedule(
  'osint-daily-report',
  '0 5 * * *', -- 5:00 AM UTC daily
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-osint-daily-report',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Create a helper function to manually trigger OSINT report (for testing)
CREATE OR REPLACE FUNCTION trigger_osint_report()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-osint-daily-report',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users (admins only via RLS)
GRANT EXECUTE ON FUNCTION trigger_osint_report() TO authenticated;

-- Create a view to check cron job status
CREATE OR REPLACE VIEW osint_report_schedule AS
SELECT
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
WHERE jobname = 'osint-daily-report';

-- Grant select on view to authenticated users
GRANT SELECT ON osint_report_schedule TO authenticated;

-- Create RLS policy for the view
ALTER VIEW osint_report_schedule SET (security_invoker = on);

-- Add helpful comment
COMMENT ON FUNCTION trigger_osint_report IS 'Manually trigger OSINT daily report generation and email. Useful for testing or on-demand reports.';

-- Log the schedule creation
DO $$
BEGIN
  RAISE NOTICE 'OSINT daily report scheduled successfully at 5:00 AM UTC';
  RAISE NOTICE 'To manually trigger report: SELECT trigger_osint_report();';
  RAISE NOTICE 'To check schedule: SELECT * FROM osint_report_schedule;';
END $$;
