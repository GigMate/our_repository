/*
  # Configure Authentication Security Settings for Beta Launch

  ## Summary
  This migration configures authentication security settings and creates monitoring views
  for tracking authentication activity and potential abuse.

  ## Security Features Configured
  
  1. **Auth Activity Monitoring**
     - Tracks failed login attempts
     - Monitors signup patterns
     - Detects potential abuse
  
  2. **Rate Limiting Tracking**
     - Records authentication attempts by IP
     - Enables manual review of suspicious activity
  
  3. **Admin Security Monitoring**
     - Tracks admin access
     - Logs security-sensitive operations

  ## Auth Configuration Notes
  
  The following settings must be configured in Supabase Dashboard:
  - Email confirmation: ENABLED (via Dashboard > Authentication > Settings)
  - Password strength: Minimum 8 characters (already configured)
  - Rate limiting: ENABLED for signup/login endpoints
  - CAPTCHA: Configure via Dashboard > Authentication > Settings
  - MFA: Enable for admin accounts via Dashboard > Settings > Team
  
  SSL/HTTPS is automatically enforced by Supabase for all connections.

  ## Monitoring Tables
  
  ### auth_activity_log
  - Tracks all authentication events
  - Identifies patterns of abuse
  - Enables security auditing
*/

-- Create auth activity monitoring table
CREATE TABLE IF NOT EXISTS auth_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('signup', 'login', 'logout', 'password_reset', 'failed_login', 'mfa_challenge')),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  ip_address text,
  user_agent text,
  success boolean DEFAULT true,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE auth_activity_log ENABLE ROW LEVEL SECURITY;

-- Admin can view all auth activity
CREATE POLICY "Admins can view all auth activity"
  ON auth_activity_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'admin'
    )
  );

-- System can insert auth activity
CREATE POLICY "System can log auth activity"
  ON auth_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add indexes for monitoring queries
CREATE INDEX IF NOT EXISTS idx_auth_activity_event_type ON auth_activity_log(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_activity_created_at ON auth_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_activity_user_id ON auth_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_activity_email ON auth_activity_log(email);
CREATE INDEX IF NOT EXISTS idx_auth_activity_ip ON auth_activity_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_auth_activity_success ON auth_activity_log(success) WHERE success = false;

-- Create view for suspicious activity detection
CREATE OR REPLACE VIEW suspicious_auth_activity AS
SELECT 
  email,
  ip_address,
  COUNT(*) as failed_attempts,
  MAX(created_at) as last_attempt,
  array_agg(DISTINCT event_type) as event_types
FROM auth_activity_log
WHERE success = false
  AND created_at > now() - interval '1 hour'
GROUP BY email, ip_address
HAVING COUNT(*) >= 3
ORDER BY failed_attempts DESC, last_attempt DESC;

-- Create view for recent auth activity summary
CREATE OR REPLACE VIEW recent_auth_summary AS
SELECT 
  event_type,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE success = true) as successful,
  COUNT(*) FILTER (WHERE success = false) as failed,
  COUNT(DISTINCT email) as unique_users,
  COUNT(DISTINCT ip_address) as unique_ips
FROM auth_activity_log
WHERE created_at > now() - interval '24 hours'
GROUP BY event_type
ORDER BY event_type;

-- Add security check function for rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_email text,
  p_ip_address text,
  p_event_type text,
  p_time_window interval DEFAULT '15 minutes',
  p_max_attempts int DEFAULT 5
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt_count int;
BEGIN
  SELECT COUNT(*)
  INTO v_attempt_count
  FROM auth_activity_log
  WHERE (email = p_email OR ip_address = p_ip_address)
    AND event_type = p_event_type
    AND created_at > now() - p_time_window;
  
  RETURN v_attempt_count < p_max_attempts;
END;
$$;

-- Add function to log auth events
CREATE OR REPLACE FUNCTION log_auth_event(
  p_event_type text,
  p_user_id uuid DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_success boolean DEFAULT true,
  p_error_message text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO auth_activity_log (
    event_type,
    user_id,
    email,
    ip_address,
    user_agent,
    success,
    error_message,
    metadata
  ) VALUES (
    p_event_type,
    p_user_id,
    p_email,
    p_ip_address,
    p_user_agent,
    p_success,
    p_error_message,
    p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Create table for security configuration
CREATE TABLE IF NOT EXISTS security_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE security_config ENABLE ROW LEVEL SECURITY;

-- Only admins can view/edit security config
CREATE POLICY "Admins can manage security config"
  ON security_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'admin'
    )
  );

-- Insert default security configuration
INSERT INTO security_config (key, value, description) VALUES
  ('email_confirmation_required', 'true'::jsonb, 'Require email confirmation on signup'),
  ('mfa_enabled', 'false'::jsonb, 'Multi-factor authentication enabled'),
  ('password_min_length', '8'::jsonb, 'Minimum password length'),
  ('rate_limit_login', '{"window": "15m", "max_attempts": 5}'::jsonb, 'Rate limit for login attempts'),
  ('rate_limit_signup', '{"window": "1h", "max_attempts": 3}'::jsonb, 'Rate limit for signup attempts'),
  ('captcha_enabled', 'false'::jsonb, 'CAPTCHA protection enabled'),
  ('session_timeout', '{"hours": 24}'::jsonb, 'Session timeout duration'),
  ('require_password_change_days', '90'::jsonb, 'Days before password change required')
ON CONFLICT (key) DO NOTHING;

-- Create function to get security config
CREATE OR REPLACE FUNCTION get_security_config(p_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_value jsonb;
BEGIN
  SELECT value INTO v_value
  FROM security_config
  WHERE key = p_key;
  
  RETURN v_value;
END;
$$;

-- Add comment for documentation
COMMENT ON TABLE auth_activity_log IS 'Tracks all authentication events for security monitoring and abuse detection';
COMMENT ON TABLE security_config IS 'Stores security configuration settings for the platform';
COMMENT ON FUNCTION check_rate_limit IS 'Checks if user has exceeded rate limit for authentication attempts';
COMMENT ON FUNCTION log_auth_event IS 'Logs authentication events for monitoring and auditing';
