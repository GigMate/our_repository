/*
  # Create Escrow System for Venue-Musician Payments

  1. New Tables
    - `bookings`
      - `id` (uuid, primary key)
      - `venue_id` (uuid) - References venues
      - `musician_id` (uuid) - References musicians
      - `event_id` (uuid) - References events (optional)
      - `agreed_rate` (decimal) - Payment amount
      - `gigmate_fee` (decimal) - GigMate's cut
      - `total_amount` (decimal) - Total held in escrow
      - `status` (enum) - pending, accepted, escrowed, completed, disputed, cancelled
      - `escrow_released_at` (timestamptz) - When funds were released
      - `dispute_reason` (text)
      - `mediation_fee` (decimal) - Additional 10% if mediation required
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Payment Flow
    - Venue creates booking with agreed rate
    - Musician accepts booking
    - Venue pays total (agreed_rate + gigmate_fee) into escrow
    - After event, both parties confirm completion
    - Funds released to musician (minus GigMate fee)
    - If disputed, mediation adds 10% fee

  3. Security
    - RLS policies for bookings
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE booking_status AS ENUM (
      'pending',
      'accepted',
      'escrowed',
      'completed',
      'disputed',
      'mediation',
      'cancelled'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  musician_id uuid NOT NULL REFERENCES musicians(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  agreed_rate decimal(10,2) NOT NULL,
  gigmate_fee decimal(10,2) NOT NULL,
  gigmate_fee_percentage decimal(5,2) DEFAULT 10.00,
  total_amount decimal(10,2) NOT NULL,
  status booking_status DEFAULT 'pending',
  venue_confirmed boolean DEFAULT false,
  musician_confirmed boolean DEFAULT false,
  escrow_released_at timestamptz,
  dispute_reason text,
  mediation_fee decimal(10,2) DEFAULT 0.00,
  mediation_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venues can view their bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM venues WHERE venues.id = bookings.venue_id AND venues.id = auth.uid()
    )
  );

CREATE POLICY "Venues can create bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venues WHERE venues.id = venue_id AND venues.id = auth.uid()
    )
  );

CREATE POLICY "Venues can update their bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM venues WHERE venues.id = bookings.venue_id AND venues.id = auth.uid()
    )
  );

CREATE POLICY "Musicians can view their bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM musicians WHERE musicians.id = bookings.musician_id AND musicians.id = auth.uid()
    )
  );

CREATE POLICY "Musicians can update their bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM musicians WHERE musicians.id = bookings.musician_id AND musicians.id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION update_booking_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.venue_confirmed = true AND NEW.musician_confirmed = true AND NEW.status = 'escrowed' THEN
    NEW.status := 'completed';
    NEW.escrow_released_at := now();
  END IF;

  IF NEW.mediation_required = true AND NEW.mediation_fee = 0.00 THEN
    NEW.mediation_fee := NEW.agreed_rate * 0.10;
    NEW.status := 'mediation';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_updated ON bookings;

CREATE TRIGGER on_booking_updated
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_status();

CREATE INDEX IF NOT EXISTS idx_bookings_venue ON bookings(venue_id);
CREATE INDEX IF NOT EXISTS idx_bookings_musician ON bookings(musician_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);