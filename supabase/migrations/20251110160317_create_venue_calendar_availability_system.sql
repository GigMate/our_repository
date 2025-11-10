/*
  # Create Venue Calendar Availability System

  1. New Tables
    - `venue_calendar_availability`
      - `id` (uuid, primary key)
      - `venue_id` (uuid) - References venues table
      - `date` (date) - Specific date
      - `status` (enum) - available, booked, blocked, tentative
      - `booking_id` (uuid) - Reference to booking if booked (optional)
      - `event_id` (uuid) - Reference to event if booked (optional)
      - `notes` (text) - Optional notes about availability
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Features
    - Venues can mark dates as available, blocked, or booked
    - Automatic updates when bookings are confirmed
    - Public visibility for musicians to see available dates
    - Integration with existing events and bookings

  3. Security
    - Enable RLS
    - Public can view availability (for discovery)
    - Only venue owners can modify their calendar
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'venue_availability_status') THEN
    CREATE TYPE venue_availability_status AS ENUM (
      'available',
      'booked',
      'blocked',
      'tentative'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS venue_calendar_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  date date NOT NULL,
  status venue_availability_status DEFAULT 'available',
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(venue_id, date)
);

CREATE INDEX IF NOT EXISTS idx_venue_calendar_venue_id ON venue_calendar_availability(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_calendar_date ON venue_calendar_availability(date);
CREATE INDEX IF NOT EXISTS idx_venue_calendar_status ON venue_calendar_availability(status);
CREATE INDEX IF NOT EXISTS idx_venue_calendar_venue_date ON venue_calendar_availability(venue_id, date);

ALTER TABLE venue_calendar_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view venue calendar availability"
  ON venue_calendar_availability
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Venue owners can manage their calendar"
  ON venue_calendar_availability
  FOR ALL
  TO authenticated
  USING (venue_id = auth.uid())
  WITH CHECK (venue_id = auth.uid());

CREATE OR REPLACE FUNCTION update_venue_calendar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_venue_calendar_timestamp ON venue_calendar_availability;
CREATE TRIGGER update_venue_calendar_timestamp
  BEFORE UPDATE ON venue_calendar_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_venue_calendar_timestamp();

CREATE OR REPLACE FUNCTION auto_update_venue_calendar_on_booking()
RETURNS TRIGGER AS $$
DECLARE
  venue_event_date date;
BEGIN
  IF NEW.status IN ('accepted', 'escrowed') AND NEW.event_id IS NOT NULL THEN
    SELECT event_date::date INTO venue_event_date
    FROM events
    WHERE id = NEW.event_id;

    IF venue_event_date IS NOT NULL THEN
      INSERT INTO venue_calendar_availability (venue_id, date, status, booking_id, event_id)
      VALUES (NEW.venue_id, venue_event_date, 'booked', NEW.id, NEW.event_id)
      ON CONFLICT (venue_id, date)
      DO UPDATE SET
        status = 'booked',
        booking_id = NEW.id,
        event_id = NEW.event_id,
        updated_at = now();
    END IF;
  END IF;

  IF NEW.status IN ('cancelled', 'completed') AND OLD.status IN ('accepted', 'escrowed') AND NEW.event_id IS NOT NULL THEN
    SELECT event_date::date INTO venue_event_date
    FROM events
    WHERE id = NEW.event_id;

    IF venue_event_date IS NOT NULL THEN
      UPDATE venue_calendar_availability
      SET status = 'available',
          booking_id = NULL,
          event_id = NULL,
          updated_at = now()
      WHERE venue_id = NEW.venue_id
        AND date = venue_event_date
        AND booking_id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_update_venue_calendar ON bookings;
CREATE TRIGGER auto_update_venue_calendar
  AFTER INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_venue_calendar_on_booking();

CREATE OR REPLACE FUNCTION auto_mark_calendar_from_events()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.venue_id IS NOT NULL THEN
    INSERT INTO venue_calendar_availability (venue_id, date, status, event_id)
    VALUES (NEW.venue_id, NEW.event_date::date, 'booked', NEW.id)
    ON CONFLICT (venue_id, date)
    DO UPDATE SET
      status = 'booked',
      event_id = NEW.id,
      updated_at = now()
    WHERE venue_calendar_availability.status != 'booked';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_mark_calendar_from_events ON events;
CREATE TRIGGER auto_mark_calendar_from_events
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION auto_mark_calendar_from_events();
