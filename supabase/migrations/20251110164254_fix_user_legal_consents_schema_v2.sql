/*
  # Fix user_legal_consents Schema v2

  1. Issue
    - user_legal_consents is missing critical columns
    - IP address conversion needs null handling
    
  2. Solution
    - Add missing columns
    - Handle IP address conversion properly
    - Migrate data safely
*/

-- Add missing columns
ALTER TABLE user_legal_consents ADD COLUMN IF NOT EXISTS document_type text;
ALTER TABLE user_legal_consents ADD COLUMN IF NOT EXISTS consented_at timestamptz;
ALTER TABLE user_legal_consents ADD COLUMN IF NOT EXISTS consent_method text;
ALTER TABLE user_legal_consents ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Update consented_at from consent_given_at or created_at
UPDATE user_legal_consents 
SET consented_at = COALESCE(consent_given_at, created_at, now())
WHERE consented_at IS NULL;

-- Drop consent_given_at after migration
ALTER TABLE user_legal_consents DROP COLUMN IF EXISTS consent_given_at;

-- Create temp inet column
ALTER TABLE user_legal_consents ADD COLUMN IF NOT EXISTS ip_address_inet inet;

-- Convert IP addresses, setting NULL for invalid ones
UPDATE user_legal_consents 
SET ip_address_inet = CASE 
  WHEN ip_address IS NULL OR ip_address = 'unknown' OR ip_address = '' THEN NULL
  ELSE ip_address::inet
END
WHERE ip_address_inet IS NULL;

-- Drop old column and rename new one
ALTER TABLE user_legal_consents DROP COLUMN IF EXISTS ip_address;
ALTER TABLE user_legal_consents RENAME COLUMN ip_address_inet TO ip_address;

-- Add constraints
DO $$
BEGIN
  ALTER TABLE user_legal_consents 
  ADD CONSTRAINT user_legal_consents_consent_method_check 
  CHECK (consent_method IN ('registration', 'profile_update', 'feature_access', 'explicit_agreement'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE user_legal_consents 
  ADD CONSTRAINT user_legal_consents_user_document_unique 
  UNIQUE (user_id, document_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Migrate data from user_consents if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_consents') THEN
    INSERT INTO user_legal_consents (
      user_id, 
      document_id, 
      document_type, 
      document_version,
      consented_at, 
      ip_address, 
      user_agent, 
      consent_method,
      is_active,
      signature_data
    )
    SELECT 
      user_id, 
      document_id, 
      document_type, 
      document_version,
      consented_at, 
      ip_address, 
      user_agent, 
      COALESCE(consent_method, 'explicit_agreement'),
      COALESCE(is_active, true),
      NULL
    FROM user_consents
    ON CONFLICT (user_id, document_id) DO UPDATE SET
      document_type = EXCLUDED.document_type,
      document_version = EXCLUDED.document_version,
      consented_at = EXCLUDED.consented_at,
      consent_method = EXCLUDED.consent_method,
      is_active = EXCLUDED.is_active;
    
    DROP TABLE user_consents CASCADE;
  END IF;
END $$;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_user_legal_consents_user ON user_legal_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_legal_consents_document ON user_legal_consents(document_id);
CREATE INDEX IF NOT EXISTS idx_user_legal_consents_type ON user_legal_consents(document_type) WHERE document_type IS NOT NULL;

-- Ensure RLS
ALTER TABLE user_legal_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own consents" ON user_legal_consents;
DROP POLICY IF EXISTS "Users can create own consents" ON user_legal_consents;

CREATE POLICY "Users can view own consents"
  ON user_legal_consents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own consents"
  ON user_legal_consents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE user_legal_consents IS 'User consent tracking for all legal documents';
