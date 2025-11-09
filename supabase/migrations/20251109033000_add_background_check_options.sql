/*
  # Add Background Check Options for Investors

  1. Changes to investor_interest_requests
    - Add background_check_status (pending/uploaded/mayday_requested/mayday_paid/completed/not_required)
    - Add background_check_upload_url (for self-uploaded checks)
    - Add background_check_upload_date (when uploaded)
    - Add background_check_expiry_date (must be within 2 weeks)
    - Add mayday_check_requested (boolean)
    - Add mayday_check_paid (boolean)
    - Add mayday_check_payment_date (timestamp)
    - Add mayday_check_request_sent (boolean)
    - Add mayday_check_request_date (timestamp)
    - Add background_check_notes (admin notes)

  2. Purpose
    - Allow investors to upload recent background checks
    - Enable $50 Mayday Investigations background check option
    - Track background check status throughout process
    - Automatically send KYC data to Mayday investigators

  3. Workflow
    - OSINT shows low score → offer background check options
    - Option 1: Upload existing check (< 2 weeks old)
    - Option 2: Pay Mayday Investigations $50 for new check
    - If Option 2 selected → send KYC data to jon@maydaypi.com, jt@maydaypi.com
    - Admin reviews uploaded check or waits for Mayday results
    - Approve when satisfied

  4. Security
    - RLS policies for sensitive background check data
    - Only admins can view uploads
    - Investors can view their own status
*/

-- Add background check fields to investor_interest_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'background_check_status'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN background_check_status text DEFAULT 'pending'
      CHECK (background_check_status IN ('pending', 'uploaded', 'mayday_requested', 'mayday_paid', 'completed', 'not_required', 'expired'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'background_check_upload_url'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN background_check_upload_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'background_check_upload_date'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN background_check_upload_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'background_check_expiry_date'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN background_check_expiry_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'mayday_check_requested'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN mayday_check_requested boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'mayday_check_paid'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN mayday_check_paid boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'mayday_check_payment_date'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN mayday_check_payment_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'mayday_check_request_sent'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN mayday_check_request_sent boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'mayday_check_request_date'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN mayday_check_request_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'background_check_notes'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN background_check_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'background_check_approved_by_admin'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN background_check_approved_by_admin boolean DEFAULT false;
  END IF;
END $$;

-- Create storage bucket for background check uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('background-checks', 'background-checks', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for background-checks bucket
CREATE POLICY IF NOT EXISTS "Admins can view all background checks"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'background-checks' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email LIKE '%@gigmate.com'
    )
  );

CREATE POLICY IF NOT EXISTS "Investors can upload their own background checks"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'background-checks' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY IF NOT EXISTS "Investors can view their own background checks"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'background-checks' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Function to check if background check is expired (older than 2 weeks)
CREATE OR REPLACE FUNCTION is_background_check_expired(check_date timestamptz)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN check_date < now() - interval '14 days';
END;
$$;

-- Function to automatically update background check status based on expiry
CREATE OR REPLACE FUNCTION update_background_check_expiry()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE investor_interest_requests
  SET background_check_status = 'expired'
  WHERE background_check_status = 'uploaded'
    AND background_check_expiry_date IS NOT NULL
    AND background_check_expiry_date < now();
END;
$$;

-- Create index for background check status
CREATE INDEX IF NOT EXISTS idx_investor_background_check_status
  ON investor_interest_requests(background_check_status);

-- Add helpful comments
COMMENT ON COLUMN investor_interest_requests.background_check_status IS
  'Status: pending (awaiting upload/decision), uploaded (investor uploaded), mayday_requested (investor wants Mayday check), mayday_paid (paid for Mayday), completed (approved), not_required (OSINT score high enough), expired (check too old)';

COMMENT ON COLUMN investor_interest_requests.mayday_check_requested IS
  'True if investor chose to pay Mayday Investigations for background check';

COMMENT ON FUNCTION update_background_check_expiry IS
  'Automatically mark background checks as expired if older than 14 days';
