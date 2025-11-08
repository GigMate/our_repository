/*
  # Investor Interest & Access Control System

  1. New Tables
    - `investor_interest_requests`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `full_name` (text)
      - `company` (text, optional)
      - `phone` (text, optional)
      - `investment_range` (text)
      - `message` (text)
      - `status` (text) - pending, approved, rejected
      - `nda_signed` (boolean)
      - `ip_agreement_signed` (boolean)
      - `non_compete_signed` (boolean)
      - `approved_by` (uuid, references profiles)
      - `approved_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on investor_interest_requests
    - Allow anyone to submit interest requests
    - Only admins can view and approve requests
    - Users can view their own requests

  3. Indexes
    - Index on email for lookups
    - Index on status for filtering
*/

-- Create investor interest requests table
CREATE TABLE IF NOT EXISTS investor_interest_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  company text,
  phone text,
  investment_range text NOT NULL,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  nda_signed boolean DEFAULT false,
  ip_agreement_signed boolean DEFAULT false,
  non_compete_signed boolean DEFAULT false,
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE investor_interest_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can submit investor interest"
  ON investor_interest_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own requests"
  ON investor_interest_requests FOR SELECT
  USING (email = auth.jwt()->>'email');

CREATE POLICY "Admins can view all requests"
  ON investor_interest_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email LIKE '%@gigmate.com'
    )
  );

CREATE POLICY "Admins can update requests"
  ON investor_interest_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email LIKE '%@gigmate.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email LIKE '%@gigmate.com'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_investor_interest_email ON investor_interest_requests(email);
CREATE INDEX IF NOT EXISTS idx_investor_interest_status ON investor_interest_requests(status);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_investor_interest_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER investor_interest_updated_at
  BEFORE UPDATE ON investor_interest_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_investor_interest_updated_at();

-- Add is_investor_approved field to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_investor_approved'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_investor_approved boolean DEFAULT false;
  END IF;
END $$;