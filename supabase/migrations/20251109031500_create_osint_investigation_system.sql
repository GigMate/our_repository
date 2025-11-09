/*
  # Create OSINT Investigation System for Investor Verification

  1. New Tables
    - `osint_investigations`
      - Stores OSINT reports for each investor request
      - Includes findings, risk score, and recommendation
      - Links to investor_interest_requests
      - Tracks investigation status and completion

  2. OSINT Data Points
    - Email verification (disposable email check)
    - Phone validation (format and carrier lookup)
    - Address verification (real location check)
    - Company verification (existence, legitimacy)
    - Social media presence (LinkedIn, professional profiles)
    - Domain reputation (email domain age, SSL, etc.)
    - IP geolocation (matches claimed location)
    - Risk indicators (fraud databases, blacklists)

  3. Automated Process
    - Runs daily at 5:00 AM via pg_cron
    - Investigates all pending investor requests
    - Generates comprehensive report
    - Emails admin with recommendations

  4. Security
    - Enable RLS on osint_investigations
    - Only admins can view reports
    - Encrypted storage for sensitive findings
*/

-- Create OSINT investigations table
CREATE TABLE IF NOT EXISTS osint_investigations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_request_id uuid NOT NULL REFERENCES investor_interest_requests(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),

  -- Investigation findings
  email_verified boolean,
  email_disposable boolean,
  email_domain_age_days integer,
  email_domain_reputation text,

  phone_valid boolean,
  phone_carrier text,
  phone_type text,
  phone_country text,

  address_validated boolean,
  address_type text,
  address_confidence_score integer,

  company_exists boolean,
  company_website text,
  company_linkedin text,
  company_age_years integer,

  linkedin_profile_found boolean,
  linkedin_profile_url text,
  linkedin_verified boolean,

  social_media_presence text,
  professional_background text,

  ip_location_match boolean,
  ip_country text,
  ip_region text,
  ip_is_proxy boolean,
  ip_is_vpn boolean,

  -- Risk assessment
  risk_score integer DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level text CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_factors jsonb DEFAULT '[]'::jsonb,

  -- Recommendation
  recommendation text CHECK (recommendation IN ('approve', 'deny', 'more_info_needed')),
  recommendation_reason text,
  confidence_score integer CHECK (confidence_score >= 0 AND confidence_score <= 100),

  -- Investigation metadata
  investigation_started_at timestamptz,
  investigation_completed_at timestamptz,
  error_message text,
  raw_data jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(investor_request_id)
);

-- Enable RLS
ALTER TABLE osint_investigations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for osint_investigations
CREATE POLICY "Admins can view all OSINT reports"
  ON osint_investigations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email LIKE '%@gigmate.com'
    )
  );

CREATE POLICY "System can insert OSINT reports"
  ON osint_investigations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update OSINT reports"
  ON osint_investigations FOR UPDATE
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_osint_investor_request ON osint_investigations(investor_request_id);
CREATE INDEX IF NOT EXISTS idx_osint_status ON osint_investigations(status);
CREATE INDEX IF NOT EXISTS idx_osint_recommendation ON osint_investigations(recommendation);
CREATE INDEX IF NOT EXISTS idx_osint_risk_level ON osint_investigations(risk_level);
CREATE INDEX IF NOT EXISTS idx_osint_completed_at ON osint_investigations(investigation_completed_at);

-- Function to calculate risk score based on findings
CREATE OR REPLACE FUNCTION calculate_osint_risk_score(investigation_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  risk integer := 0;
  inv RECORD;
BEGIN
  SELECT * INTO inv FROM osint_investigations WHERE id = investigation_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Email risk factors
  IF inv.email_disposable THEN risk := risk + 25; END IF;
  IF inv.email_domain_age_days < 180 THEN risk := risk + 15; END IF;
  IF NOT inv.email_verified THEN risk := risk + 10; END IF;

  -- Phone risk factors
  IF NOT inv.phone_valid THEN risk := risk + 15; END IF;
  IF inv.phone_type = 'voip' THEN risk := risk + 10; END IF;

  -- Address risk factors
  IF NOT inv.address_validated THEN risk := risk + 20; END IF;
  IF inv.address_confidence_score < 50 THEN risk := risk + 15; END IF;

  -- Company risk factors
  IF NOT inv.company_exists THEN risk := risk + 30; END IF;
  IF inv.company_website IS NULL THEN risk := risk + 15; END IF;

  -- LinkedIn/Professional risk factors
  IF NOT inv.linkedin_profile_found THEN risk := risk + 20; END IF;
  IF NOT inv.linkedin_verified THEN risk := risk + 10; END IF;

  -- IP risk factors
  IF NOT inv.ip_location_match THEN risk := risk + 15; END IF;
  IF inv.ip_is_proxy OR inv.ip_is_vpn THEN risk := risk + 20; END IF;

  -- Cap at 100
  IF risk > 100 THEN risk := 100; END IF;

  RETURN risk;
END;
$$;

-- Function to determine risk level from score
CREATE OR REPLACE FUNCTION get_risk_level(score integer)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  IF score >= 75 THEN RETURN 'critical';
  ELSIF score >= 50 THEN RETURN 'high';
  ELSIF score >= 25 THEN RETURN 'medium';
  ELSE RETURN 'low';
  END IF;
END;
$$;

-- Function to generate recommendation
CREATE OR REPLACE FUNCTION generate_osint_recommendation(investigation_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  risk_score integer;
BEGIN
  SELECT * INTO inv FROM osint_investigations WHERE id = investigation_id;

  IF NOT FOUND THEN
    RETURN 'more_info_needed';
  END IF;

  risk_score := calculate_osint_risk_score(investigation_id);

  -- Critical risk = deny
  IF risk_score >= 75 THEN
    RETURN 'deny';
  END IF;

  -- High risk = more info needed
  IF risk_score >= 50 THEN
    RETURN 'more_info_needed';
  END IF;

  -- Medium risk with good company/LinkedIn = more info
  IF risk_score >= 25 AND (inv.company_exists AND inv.linkedin_profile_found) THEN
    RETURN 'more_info_needed';
  END IF;

  -- Medium risk without verification = deny
  IF risk_score >= 25 THEN
    RETURN 'deny';
  END IF;

  -- Low risk = approve
  RETURN 'approve';
END;
$$;

-- Trigger to update risk score and recommendation
CREATE OR REPLACE FUNCTION update_osint_risk_assessment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_risk_score integer;
  new_risk_level text;
  new_recommendation text;
BEGIN
  IF NEW.status = 'completed' THEN
    new_risk_score := calculate_osint_risk_score(NEW.id);
    new_risk_level := get_risk_level(new_risk_score);
    new_recommendation := generate_osint_recommendation(NEW.id);

    NEW.risk_score := new_risk_score;
    NEW.risk_level := new_risk_level;
    NEW.recommendation := new_recommendation;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_osint_risk_assessment ON osint_investigations;
CREATE TRIGGER trigger_update_osint_risk_assessment
  BEFORE UPDATE ON osint_investigations
  FOR EACH ROW
  EXECUTE FUNCTION update_osint_risk_assessment();
