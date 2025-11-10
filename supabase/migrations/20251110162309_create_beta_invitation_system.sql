/*
  # Beta Invitation System

  1. New Tables
    - `beta_invitations` - Track invitation codes and who sent them
    - `beta_registrations` - Track registration completions

  2. Features
    - Unique invitation codes
    - Email-based invitations
    - Track invitation status (pending, accepted, expired)
    - Auto-expire invitations after 14 days
    - Flag users as beta testers on registration

  3. Security
    - Enable RLS on all tables
    - Public can validate codes for registration
    - Track all beta tester activity
*/

-- Beta invitations table
CREATE TABLE IF NOT EXISTS beta_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_code text UNIQUE NOT NULL,
  invited_email text NOT NULL,
  invited_by_email text,
  status text DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'expired', 'revoked'
  )),
  used_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at timestamptz DEFAULT (now() + interval '14 days'),
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz
);

-- Beta registrations tracking
CREATE TABLE IF NOT EXISTS beta_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  invitation_code text REFERENCES beta_invitations(invitation_code) ON DELETE SET NULL,
  registration_source text CHECK (registration_source IN (
    'invitation', 'direct', 'waitlist'
  )),
  onboarding_completed boolean DEFAULT false,
  onboarding_step text,
  tour_completed boolean DEFAULT false,
  nda_signed boolean DEFAULT false,
  ip_agreement_signed boolean DEFAULT false,
  non_compete_signed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Add beta tester flag to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_beta_tester'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_beta_tester boolean DEFAULT false;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE beta_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for beta_invitations
CREATE POLICY "Anyone can view valid invitations by code"
  ON beta_invitations FOR SELECT
  USING (
    status = 'pending' 
    AND expires_at > now()
  );

CREATE POLICY "Authenticated users can create beta invitations"
  ON beta_invitations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all invitations"
  ON beta_invitations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update invitations"
  ON beta_invitations FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for beta_registrations
CREATE POLICY "Users can view own beta registration"
  ON beta_registrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own beta registration"
  ON beta_registrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own beta registration"
  ON beta_registrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_beta_invitations_code ON beta_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_beta_invitations_email ON beta_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_beta_invitations_status ON beta_invitations(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_beta_registrations_user ON beta_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_registrations_invitation ON beta_registrations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_profiles_beta_tester ON profiles(is_beta_tester) WHERE is_beta_tester = true;

-- Function to generate unique invitation code
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS text AS $$
DECLARE
  v_code text;
  v_exists boolean;
BEGIN
  LOOP
    v_code := upper(substring(md5(random()::text) from 1 for 8));
    
    SELECT EXISTS(
      SELECT 1 FROM beta_invitations WHERE invitation_code = v_code
    ) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create beta invitation
CREATE OR REPLACE FUNCTION create_beta_invitation(
  p_email text,
  p_invited_by_email text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_code text;
  v_invitation_id uuid;
BEGIN
  -- Check if email already has pending invitation
  IF EXISTS (
    SELECT 1 FROM beta_invitations 
    WHERE invited_email = p_email 
    AND status = 'pending' 
    AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'This email already has a pending invitation';
  END IF;
  
  -- Generate unique code
  v_code := generate_invitation_code();
  
  -- Create invitation
  INSERT INTO beta_invitations (
    invitation_code,
    invited_email,
    invited_by_email
  ) VALUES (
    v_code,
    p_email,
    p_invited_by_email
  )
  RETURNING id INTO v_invitation_id;
  
  RETURN jsonb_build_object(
    'invitation_id', v_invitation_id,
    'invitation_code', v_code,
    'invited_email', p_email,
    'expires_at', now() + interval '14 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate invitation code
CREATE OR REPLACE FUNCTION validate_invitation_code(p_code text)
RETURNS jsonb AS $$
DECLARE
  v_invitation beta_invitations%ROWTYPE;
BEGIN
  SELECT * INTO v_invitation
  FROM beta_invitations
  WHERE invitation_code = p_code
  AND status = 'pending'
  AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Invalid or expired invitation code'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'invited_email', v_invitation.invited_email,
    'expires_at', v_invitation.expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept invitation and complete registration
CREATE OR REPLACE FUNCTION accept_beta_invitation(
  p_code text,
  p_user_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_invitation_id uuid;
BEGIN
  -- Check if invitation is valid
  SELECT id INTO v_invitation_id
  FROM beta_invitations
  WHERE invitation_code = p_code
  AND status = 'pending'
  AND expires_at > now();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation code';
  END IF;
  
  -- Update invitation
  UPDATE beta_invitations
  SET status = 'accepted',
      used_by = p_user_id,
      accepted_at = now()
  WHERE id = v_invitation_id;
  
  -- Flag user as beta tester
  UPDATE profiles
  SET is_beta_tester = true
  WHERE id = p_user_id;
  
  -- Create beta registration record
  INSERT INTO beta_registrations (
    user_id,
    invitation_code,
    registration_source
  ) VALUES (
    p_user_id,
    p_code,
    'invitation'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET invitation_code = p_code;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Beta invitation accepted successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update onboarding progress
CREATE OR REPLACE FUNCTION update_onboarding_progress(
  p_user_id uuid,
  p_step text,
  p_completed boolean DEFAULT false
)
RETURNS void AS $$
BEGIN
  UPDATE beta_registrations
  SET 
    onboarding_step = p_step,
    onboarding_completed = p_completed,
    completed_at = CASE WHEN p_completed THEN now() ELSE completed_at END
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark tour completed
CREATE OR REPLACE FUNCTION mark_tour_completed(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE beta_registrations
  SET tour_completed = true
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track legal document signatures
CREATE OR REPLACE FUNCTION track_beta_legal_signature(
  p_user_id uuid,
  p_document_type text
)
RETURNS void AS $$
BEGIN
  CASE p_document_type
    WHEN 'beta_tester_nda' THEN
      UPDATE beta_registrations
      SET nda_signed = true
      WHERE user_id = p_user_id;
    WHEN 'beta_tester_ip_agreement' THEN
      UPDATE beta_registrations
      SET ip_agreement_signed = true
      WHERE user_id = p_user_id;
    WHEN 'beta_tester_non_compete' THEN
      UPDATE beta_registrations
      SET non_compete_signed = true
      WHERE user_id = p_user_id;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
