/*
  # Add KYC (Know Your Customer) Fields to Investor System

  1. Changes to investor_interest_requests
    - Add physical_address_line1 (required)
    - Add physical_address_line2 (optional)
    - Add physical_city (required)
    - Add physical_state (required)
    - Add physical_zip (required)
    - Add physical_country (required, default 'USA')
    - Add mailing_address_line1 (required)
    - Add mailing_address_line2 (optional)
    - Add mailing_city (required)
    - Add mailing_state (required)
    - Add mailing_zip (required)
    - Add mailing_country (required, default 'USA')
    - Add mailing_same_as_physical (boolean)
    - Add kyc_consent_given (boolean, required)
    - Add kyc_consent_timestamp (timestamptz)
    - Add kyc_consent_ip (text)

  2. Purpose
    - Comply with investor verification requirements
    - Enable due diligence background checks
    - Meet KYC (Know Your Customer) standards
    - Provide legal protection for platform

  3. Security
    - All fields encrypted at rest in Supabase
    - Only admins can view full addresses
    - Investors can view their own data
*/

-- Add address and KYC fields to investor_interest_requests
DO $$
BEGIN
  -- Physical Address Fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'physical_address_line1'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN physical_address_line1 text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'physical_address_line2'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN physical_address_line2 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'physical_city'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN physical_city text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'physical_state'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN physical_state text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'physical_zip'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN physical_zip text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'physical_country'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN physical_country text NOT NULL DEFAULT 'USA';
  END IF;

  -- Mailing Address Fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'mailing_address_line1'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN mailing_address_line1 text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'mailing_address_line2'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN mailing_address_line2 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'mailing_city'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN mailing_city text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'mailing_state'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN mailing_state text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'mailing_zip'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN mailing_zip text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'mailing_country'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN mailing_country text NOT NULL DEFAULT 'USA';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'mailing_same_as_physical'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN mailing_same_as_physical boolean DEFAULT false;
  END IF;

  -- KYC Consent Fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'kyc_consent_given'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN kyc_consent_given boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'kyc_consent_timestamp'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN kyc_consent_timestamp timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'kyc_consent_ip'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN kyc_consent_ip text;
  END IF;
END $$;

-- Remove default empty strings after adding columns (for existing rows)
ALTER TABLE investor_interest_requests ALTER COLUMN physical_address_line1 DROP DEFAULT;
ALTER TABLE investor_interest_requests ALTER COLUMN physical_city DROP DEFAULT;
ALTER TABLE investor_interest_requests ALTER COLUMN physical_state DROP DEFAULT;
ALTER TABLE investor_interest_requests ALTER COLUMN physical_zip DROP DEFAULT;
ALTER TABLE investor_interest_requests ALTER COLUMN mailing_address_line1 DROP DEFAULT;
ALTER TABLE investor_interest_requests ALTER COLUMN mailing_city DROP DEFAULT;
ALTER TABLE investor_interest_requests ALTER COLUMN mailing_state DROP DEFAULT;
ALTER TABLE investor_interest_requests ALTER COLUMN mailing_zip DROP DEFAULT;
ALTER TABLE investor_interest_requests ALTER COLUMN kyc_consent_given DROP DEFAULT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_investor_kyc_consent ON investor_interest_requests(kyc_consent_given);
