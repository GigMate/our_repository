/*
  # Digital Agreements System

  1. New Tables
    - `agreements` - Digital contracts between venues and musicians
    - `agreement_signatures` - Track digital signatures
    - `agreement_payments` - Track payments tied to agreements
  
  2. Features
    - Digital agreement creation and signing
    - Payment processing tied to agreements
    - Multiple payment schedules (upfront, on completion, split, milestone)
    - Auto-activation when both parties sign
  
  3. Security
    - Enable RLS on all tables
    - Both parties must sign agreements
    - Create indexes for performance
*/

-- Create digital agreements table
CREATE TABLE IF NOT EXISTS agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  venue_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  musician_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  terms text NOT NULL,
  payment_amount numeric NOT NULL,
  payment_schedule text NOT NULL CHECK (payment_schedule IN ('upfront', 'on_completion', 'split', 'milestone')),
  payment_milestones jsonb,
  deposit_amount numeric,
  deposit_paid boolean DEFAULT false,
  deposit_payment_intent_id text,
  final_payment_amount numeric,
  final_payment_paid boolean DEFAULT false,
  final_payment_intent_id text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending_signatures', 'active', 'completed', 'cancelled')),
  created_by uuid REFERENCES profiles(id) NOT NULL,
  cancellation_policy text,
  refund_policy text,
  equipment_requirements text,
  sound_check_time timestamptz,
  performance_duration_minutes integer,
  additional_terms jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agreement signatures table
CREATE TABLE IF NOT EXISTS agreement_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid REFERENCES agreements(id) ON DELETE CASCADE NOT NULL,
  signer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  signature_data text NOT NULL,
  ip_address text,
  user_agent text,
  signed_at timestamptz DEFAULT now(),
  UNIQUE(agreement_id, signer_id)
);

-- Create agreement payments table
CREATE TABLE IF NOT EXISTS agreement_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid REFERENCES agreements(id) ON DELETE CASCADE NOT NULL,
  payment_type text NOT NULL CHECK (payment_type IN ('deposit', 'milestone', 'final', 'refund')),
  amount numeric NOT NULL,
  stripe_payment_intent_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  milestone_description text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agreements
CREATE POLICY "Users can view agreements they're part of"
  ON agreements FOR SELECT
  TO authenticated
  USING (auth.uid() IN (venue_id, musician_id));

CREATE POLICY "Users can create agreements for their bookings"
  ON agreements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (venue_id, musician_id) AND auth.uid() = created_by);

CREATE POLICY "Users can update their own agreements"
  ON agreements FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (venue_id, musician_id))
  WITH CHECK (auth.uid() IN (venue_id, musician_id));

-- RLS Policies for signatures
CREATE POLICY "Users can view signatures on their agreements"
  ON agreement_signatures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agreements
      WHERE agreements.id = agreement_signatures.agreement_id
      AND auth.uid() IN (venue_id, musician_id)
    )
  );

CREATE POLICY "Users can sign their own agreements"
  ON agreement_signatures FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agreements
      WHERE agreements.id = agreement_signatures.agreement_id
      AND auth.uid() IN (venue_id, musician_id)
    )
    AND auth.uid() = signer_id
  );

-- RLS Policies for payments
CREATE POLICY "Users can view payments for their agreements"
  ON agreement_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agreements
      WHERE agreements.id = agreement_payments.agreement_id
      AND auth.uid() IN (venue_id, musician_id)
    )
  );

CREATE POLICY "Service can create payment records"
  ON agreement_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agreements
      WHERE agreements.id = agreement_payments.agreement_id
      AND auth.uid() IN (venue_id, musician_id)
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agreements_booking ON agreements(booking_id);
CREATE INDEX IF NOT EXISTS idx_agreements_venue ON agreements(venue_id);
CREATE INDEX IF NOT EXISTS idx_agreements_musician ON agreements(musician_id);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(status);
CREATE INDEX IF NOT EXISTS idx_agreement_signatures_agreement ON agreement_signatures(agreement_id);
CREATE INDEX IF NOT EXISTS idx_agreement_payments_agreement ON agreement_payments(agreement_id);
CREATE INDEX IF NOT EXISTS idx_agreement_payments_status ON agreement_payments(status);

-- Function to auto-activate agreement when both parties sign
CREATE OR REPLACE FUNCTION check_agreement_signatures()
RETURNS TRIGGER AS $$
DECLARE
  venue_signed boolean;
  musician_signed boolean;
  agreement_venue_id uuid;
  agreement_musician_id uuid;
BEGIN
  SELECT venue_id, musician_id
  INTO agreement_venue_id, agreement_musician_id
  FROM agreements
  WHERE id = NEW.agreement_id;

  SELECT EXISTS(
    SELECT 1 FROM agreement_signatures
    WHERE agreement_id = NEW.agreement_id AND signer_id = agreement_venue_id
  ) INTO venue_signed;

  SELECT EXISTS(
    SELECT 1 FROM agreement_signatures
    WHERE agreement_id = NEW.agreement_id AND signer_id = agreement_musician_id
  ) INTO musician_signed;

  IF venue_signed AND musician_signed THEN
    UPDATE agreements
    SET status = 'active', updated_at = now()
    WHERE id = NEW.agreement_id AND status = 'pending_signatures';
    
    INSERT INTO email_queue (recipient_email, template, data)
    SELECT 
      p.email,
      'agreement_activated',
      jsonb_build_object(
        'agreement_title', a.title,
        'other_party', CASE 
          WHEN p.id = a.venue_id THEN (SELECT full_name FROM profiles WHERE id = a.musician_id)
          ELSE (SELECT full_name FROM profiles WHERE id = a.venue_id)
        END,
        'payment_amount', a.payment_amount,
        'link', 'https://gigmate.us/agreements/' || a.id
      )
    FROM agreements a
    JOIN profiles p ON p.id IN (a.venue_id, a.musician_id)
    WHERE a.id = NEW.agreement_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check signatures and activate agreement
DROP TRIGGER IF EXISTS on_agreement_signed ON agreement_signatures;
CREATE TRIGGER on_agreement_signed
  AFTER INSERT ON agreement_signatures
  FOR EACH ROW
  EXECUTE FUNCTION check_agreement_signatures();
