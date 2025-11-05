/*
  # Create Ticketing System

  1. New Tables
    - `events` - Venue events with ticket sales
    - `ticket_purchases` - Fan ticket purchases
    - `payment_methods` - Stored payment information

  2. Security
    - RLS policies for all tables
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_status') THEN
    CREATE TYPE event_status AS ENUM ('upcoming', 'in_progress', 'completed', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
    CREATE TYPE ticket_status AS ENUM ('pending', 'confirmed', 'used', 'refunded');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  musician_id uuid NOT NULL REFERENCES musicians(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  doors_open time,
  show_starts time,
  ticket_price decimal(10,2) NOT NULL,
  total_tickets integer NOT NULL,
  tickets_sold integer DEFAULT 0,
  status event_status DEFAULT 'upcoming',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  fan_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  total_amount decimal(10,2) NOT NULL,
  gigmate_fee decimal(10,2) NOT NULL,
  payment_method_id uuid,
  qr_code text UNIQUE,
  status ticket_status DEFAULT 'pending',
  purchased_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_brand text NOT NULL,
  last_four text NOT NULL,
  expiry_month integer NOT NULL CHECK (expiry_month >= 1 AND expiry_month <= 12),
  expiry_year integer NOT NULL,
  is_default boolean DEFAULT false,
  stripe_payment_method_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view upcoming events"
  ON events
  FOR SELECT
  TO authenticated
  USING (status = 'upcoming');

CREATE POLICY "Venues can manage their events"
  ON events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM venues WHERE venues.id = events.venue_id AND venues.id = auth.uid()
    )
  );

CREATE POLICY "Musicians can view their events"
  ON events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM musicians WHERE musicians.id = events.musician_id AND musicians.id = auth.uid()
    )
  );

CREATE POLICY "Fans can view their ticket purchases"
  ON ticket_purchases
  FOR SELECT
  TO authenticated
  USING (fan_id = auth.uid());

CREATE POLICY "Fans can create ticket purchases"
  ON ticket_purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (fan_id = auth.uid());

CREATE POLICY "Venues can view tickets for their events"
  ON ticket_purchases
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      JOIN venues ON venues.id = events.venue_id
      WHERE events.id = ticket_purchases.event_id
      AND venues.id = auth.uid()
    )
  );

CREATE POLICY "Users can view their payment methods"
  ON payment_methods
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their payment methods"
  ON payment_methods
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_events_venue ON events(venue_id);
CREATE INDEX IF NOT EXISTS idx_events_musician ON events(musician_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_event ON ticket_purchases(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_fan ON ticket_purchases(fan_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);