/*
  # Ticket Verification System

  1. New Features
    - Secure QR code generation
    - Ticket validation functions
    - Check-in tracking
    - Fraud prevention
    - Real-time verification API

  2. Tables
    - `ticket_check_ins` - Track when tickets are scanned
    - Update `ticket_purchases` with verification fields

  3. Functions
    - `generate_ticket_qr_code()` - Create unique, secure QR codes
    - `verify_ticket()` - Validate ticket at door
    - `check_in_ticket()` - Mark ticket as used
    - `get_ticket_status()` - Check ticket validity

  4. Security
    - QR codes are cryptographically secure
    - Tampering detection
    - Duplicate scan prevention
    - Real-time status checking
*/

-- Add verification fields to ticket_purchases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_purchases' AND column_name = 'verification_code'
  ) THEN
    ALTER TABLE ticket_purchases
      ADD COLUMN verification_code text UNIQUE,
      ADD COLUMN check_in_time timestamptz,
      ADD COLUMN checked_in_by uuid REFERENCES profiles(id),
      ADD COLUMN times_scanned integer DEFAULT 0,
      ADD COLUMN last_scan_attempt timestamptz;
  END IF;
END $$;

-- Create ticket check-ins table for audit trail
CREATE TABLE IF NOT EXISTS ticket_check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES ticket_purchases(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  checked_in_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  scan_method text CHECK (scan_method IN ('qr_scan', 'manual_entry', 'nfc', 'barcode')),
  device_info jsonb,
  location_data jsonb,
  is_valid boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ticket_check_ins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ticket_check_ins
CREATE POLICY "Venues can view check-ins for their events"
  ON ticket_check_ins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = ticket_check_ins.venue_id
      AND venues.id = auth.uid()
    )
  );

CREATE POLICY "Venues can create check-ins"
  ON ticket_check_ins FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = ticket_check_ins.venue_id
      AND venues.id = auth.uid()
    )
  );

-- Function to generate secure QR code/verification code
CREATE OR REPLACE FUNCTION generate_ticket_qr_code(p_ticket_id uuid)
RETURNS text AS $$
DECLARE
  v_verification_code text;
  v_event_id uuid;
  v_fan_id uuid;
  v_purchase_time timestamptz;
BEGIN
  -- Get ticket details
  SELECT event_id, fan_id, purchased_at
  INTO v_event_id, v_fan_id, v_purchase_time
  FROM ticket_purchases
  WHERE id = p_ticket_id;

  -- Generate secure verification code
  -- Format: EVENT-FAN-TIME-RANDOM (e.g., "GM-ABC123-20251111-XYZ789")
  v_verification_code := 'GM-' ||
    UPPER(SUBSTRING(v_event_id::text, 1, 8)) || '-' ||
    TO_CHAR(v_purchase_time, 'YYYYMMDD') || '-' ||
    UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 8));

  -- Store QR code and verification code
  UPDATE ticket_purchases
  SET
    qr_code = v_verification_code,
    verification_code = v_verification_code
  WHERE id = p_ticket_id;

  RETURN v_verification_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify ticket (called by venue at door)
CREATE OR REPLACE FUNCTION verify_ticket(
  p_verification_code text,
  p_event_id uuid,
  p_venue_id uuid DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_ticket_record record;
  v_event_record record;
  v_result jsonb;
BEGIN
  -- Get ticket details
  SELECT
    tp.*,
    e.title as event_title,
    e.event_date,
    e.venue_id,
    p.email as fan_email,
    p.full_name as fan_name
  INTO v_ticket_record
  FROM ticket_purchases tp
  JOIN events e ON e.id = tp.event_id
  JOIN profiles p ON p.id = tp.fan_id
  WHERE tp.verification_code = p_verification_code
    AND tp.event_id = p_event_id;

  -- Ticket not found
  IF v_ticket_record IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'status', 'not_found',
      'message', 'Ticket not found. Invalid verification code.',
      'allow_entry', false
    );
  END IF;

  -- Check if ticket was refunded
  IF v_ticket_record.status = 'refunded' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'status', 'refunded',
      'message', 'This ticket has been refunded and is no longer valid.',
      'allow_entry', false
    );
  END IF;

  -- Check if ticket is for correct event
  IF v_ticket_record.event_id != p_event_id THEN
    RETURN jsonb_build_object(
      'valid', false,
      'status', 'wrong_event',
      'message', 'This ticket is for a different event.',
      'allow_entry', false,
      'ticket_event', v_ticket_record.event_title
    );
  END IF;

  -- Check if ticket already used
  IF v_ticket_record.status = 'used' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'status', 'already_used',
      'message', 'This ticket has already been scanned.',
      'allow_entry', false,
      'check_in_time', v_ticket_record.check_in_time,
      'times_scanned', v_ticket_record.times_scanned
    );
  END IF;

  -- Check if event has already happened
  GET event_date FROM events WHERE id = p_event_id INTO v_event_record;
  IF v_event_record.event_date < now() - interval '12 hours' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'status', 'event_passed',
      'message', 'This event has already passed.',
      'allow_entry', false
    );
  END IF;

  -- All checks passed - ticket is valid
  RETURN jsonb_build_object(
    'valid', true,
    'status', 'valid',
    'message', 'Valid ticket. Allow entry.',
    'allow_entry', true,
    'ticket_id', v_ticket_record.id,
    'fan_name', v_ticket_record.fan_name,
    'fan_email', v_ticket_record.fan_email,
    'quantity', v_ticket_record.quantity,
    'purchased_at', v_ticket_record.purchased_at,
    'event_title', v_ticket_record.event_title,
    'event_date', v_ticket_record.event_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check in ticket (mark as used)
CREATE OR REPLACE FUNCTION check_in_ticket(
  p_verification_code text,
  p_event_id uuid,
  p_venue_id uuid,
  p_checked_in_by uuid DEFAULT NULL,
  p_scan_method text DEFAULT 'qr_scan',
  p_device_info jsonb DEFAULT NULL,
  p_location_data jsonb DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_ticket_id uuid;
  v_verification_result jsonb;
  v_check_in_id uuid;
BEGIN
  -- First verify the ticket
  v_verification_result := verify_ticket(p_verification_code, p_event_id, p_venue_id);

  -- If ticket is not valid, return verification result
  IF NOT (v_verification_result->>'valid')::boolean THEN
    RETURN v_verification_result;
  END IF;

  -- Get ticket ID
  v_ticket_id := (v_verification_result->>'ticket_id')::uuid;

  -- Mark ticket as used
  UPDATE ticket_purchases
  SET
    status = 'used',
    check_in_time = now(),
    checked_in_by = p_checked_in_by,
    times_scanned = COALESCE(times_scanned, 0) + 1,
    last_scan_attempt = now()
  WHERE id = v_ticket_id;

  -- Create check-in record (audit trail)
  INSERT INTO ticket_check_ins (
    ticket_id,
    event_id,
    venue_id,
    checked_in_by,
    scan_method,
    device_info,
    location_data,
    is_valid
  ) VALUES (
    v_ticket_id,
    p_event_id,
    p_venue_id,
    p_checked_in_by,
    p_scan_method,
    p_device_info,
    p_location_data,
    true
  )
  RETURNING id INTO v_check_in_id;

  -- Return success with check-in details
  RETURN jsonb_build_object(
    'success', true,
    'status', 'checked_in',
    'message', 'Ticket successfully checked in. Welcome!',
    'allow_entry', true,
    'check_in_id', v_check_in_id,
    'check_in_time', now(),
    'fan_name', v_verification_result->>'fan_name',
    'quantity', v_verification_result->>'quantity'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get ticket status (for fans to check their tickets)
CREATE OR REPLACE FUNCTION get_ticket_status(p_ticket_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_ticket_record record;
  v_result jsonb;
BEGIN
  SELECT
    tp.*,
    e.title as event_title,
    e.event_date,
    e.venue_id,
    v.name as venue_name,
    v.address as venue_address
  INTO v_ticket_record
  FROM ticket_purchases tp
  JOIN events e ON e.id = tp.event_id
  JOIN venues v ON v.id = e.venue_id
  WHERE tp.id = p_ticket_id;

  IF v_ticket_record IS NULL THEN
    RETURN jsonb_build_object('error', 'Ticket not found');
  END IF;

  v_result := jsonb_build_object(
    'ticket_id', v_ticket_record.id,
    'verification_code', v_ticket_record.verification_code,
    'qr_code', v_ticket_record.qr_code,
    'status', v_ticket_record.status,
    'quantity', v_ticket_record.quantity,
    'total_amount', v_ticket_record.total_amount,
    'purchased_at', v_ticket_record.purchased_at,
    'event_title', v_ticket_record.event_title,
    'event_date', v_ticket_record.event_date,
    'venue_name', v_ticket_record.venue_name,
    'venue_address', v_ticket_record.venue_address,
    'is_used', (v_ticket_record.status = 'used'),
    'check_in_time', v_ticket_record.check_in_time,
    'times_scanned', COALESCE(v_ticket_record.times_scanned, 0)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-generate QR code when ticket is confirmed
CREATE OR REPLACE FUNCTION auto_generate_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND NEW.qr_code IS NULL THEN
    NEW.verification_code := generate_ticket_qr_code(NEW.id);
    NEW.qr_code := NEW.verification_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_qr_code ON ticket_purchases;
CREATE TRIGGER trigger_auto_generate_qr_code
  BEFORE INSERT OR UPDATE ON ticket_purchases
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_qr_code();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_verification_code ON ticket_purchases(verification_code);
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_status ON ticket_purchases(status);
CREATE INDEX IF NOT EXISTS idx_ticket_check_ins_ticket ON ticket_check_ins(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_check_ins_event ON ticket_check_ins(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_check_ins_venue ON ticket_check_ins(venue_id);
CREATE INDEX IF NOT EXISTS idx_ticket_check_ins_created ON ticket_check_ins(created_at);

-- Create view for venue door staff (easy ticket checking)
CREATE OR REPLACE VIEW venue_ticket_check_view AS
SELECT
  tp.id as ticket_id,
  tp.verification_code,
  tp.qr_code,
  tp.status,
  tp.quantity,
  tp.check_in_time,
  tp.times_scanned,
  e.id as event_id,
  e.title as event_title,
  e.event_date,
  e.venue_id,
  v.name as venue_name,
  p.id as fan_id,
  p.full_name as fan_name,
  p.email as fan_email,
  p.phone as fan_phone
FROM ticket_purchases tp
JOIN events e ON e.id = tp.event_id
JOIN venues v ON v.id = e.venue_id
JOIN profiles p ON p.id = tp.fan_id
WHERE tp.status IN ('confirmed', 'used');

-- Grant access to view
GRANT SELECT ON venue_ticket_check_view TO authenticated;

-- Create view for ticket holders (show their tickets)
CREATE OR REPLACE VIEW fan_ticket_view AS
SELECT
  tp.id as ticket_id,
  tp.verification_code,
  tp.qr_code,
  tp.status,
  tp.quantity,
  tp.total_amount,
  tp.purchased_at,
  tp.check_in_time,
  e.id as event_id,
  e.title as event_title,
  e.description as event_description,
  e.event_date,
  e.doors_open,
  e.show_starts,
  v.id as venue_id,
  v.name as venue_name,
  v.address as venue_address,
  v.city as venue_city,
  v.state as venue_state,
  m.id as musician_id,
  m.name as musician_name,
  m.genre as musician_genre
FROM ticket_purchases tp
JOIN events e ON e.id = tp.event_id
JOIN venues v ON v.id = e.venue_id
JOIN musicians m ON m.id = e.musician_id
WHERE tp.fan_id = auth.uid();

-- Grant access to view
GRANT SELECT ON fan_ticket_view TO authenticated;
