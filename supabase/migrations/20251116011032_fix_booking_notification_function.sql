/*
  # Fix booking notification function

  1. Changes
    - Update queue_booking_notification_email function to use correct column names
    - Replace stage_name with full_name from profiles
    - Replace venue_name join with venues table lookup
*/

CREATE OR REPLACE FUNCTION queue_booking_notification_email()
RETURNS TRIGGER AS $$
DECLARE
  musician_email text;
  venue_email text;
  musician_name text;
  venue_name text;
BEGIN
  -- Get musician details
  SELECT email, full_name
  INTO musician_email, musician_name
  FROM profiles
  WHERE id = NEW.musician_id;

  -- Get venue details from profiles
  SELECT email
  INTO venue_email
  FROM profiles
  WHERE id = NEW.venue_id;
  
  -- Get venue name from venues table
  SELECT v.venue_name
  INTO venue_name
  FROM venues v
  WHERE v.id = NEW.venue_id;

  -- Notify on booking status changes
  IF TG_OP = 'INSERT' THEN
    -- Notify musician of new booking
    INSERT INTO email_queue (recipient_email, template, data)
    VALUES (
      musician_email,
      'booking_request',
      jsonb_build_object(
        'musician_name', musician_name,
        'venue_name', venue_name,
        'agreed_rate', NEW.agreed_rate,
        'booking_id', NEW.id
      )
    );
    
    -- Notify venue of booking creation
    INSERT INTO email_queue (recipient_email, template, data)
    VALUES (
      venue_email,
      'booking_created',
      jsonb_build_object(
        'musician_name', musician_name,
        'venue_name', venue_name,
        'agreed_rate', NEW.agreed_rate,
        'booking_id', NEW.id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
