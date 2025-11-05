/*
  # Email Notification System

  1. New Tables
    - `email_queue` - Queue for outbound emails with retry logic
  
  2. Functions
    - `queue_booking_notification_email` - Trigger to queue emails on booking events
    - `queue_ticket_purchase_email` - Trigger to queue emails on ticket purchases
  
  3. Security
    - Enable RLS on email_queue (admin only)
    - Add indexes for performance
  
  4. Email Templates
    - booking_request - New booking request notification
    - booking_accepted - Booking acceptance confirmation
    - booking_declined - Booking decline notification
    - booking_reminder - 24-hour event reminder
    - ticket_purchase - Ticket purchase confirmation
    - subscription_activated - Subscription confirmation
*/

-- Create notification queue table
CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  template text NOT NULL,
  data jsonb NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts integer DEFAULT 0,
  last_attempt_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Only service role can access email queue
CREATE POLICY "Service role can manage email queue"
  ON email_queue FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created ON email_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_pending ON email_queue(status, attempts) WHERE status = 'pending';

-- Function to queue booking notification emails
CREATE OR REPLACE FUNCTION queue_booking_notification_email()
RETURNS TRIGGER AS $$
DECLARE
  musician_email text;
  venue_email text;
  musician_name text;
  venue_name text;
BEGIN
  -- Get musician details
  SELECT email, COALESCE(stage_name, full_name)
  INTO musician_email, musician_name
  FROM profiles
  WHERE id = NEW.musician_id;

  -- Get venue details
  SELECT email, COALESCE(venue_name, full_name)
  INTO venue_email, venue_name
  FROM profiles
  WHERE id = NEW.venue_id;

  -- Notify musician of new request
  IF NEW.request_status = 'pending' AND (OLD IS NULL OR OLD.request_status IS NULL) THEN
    INSERT INTO email_queue (recipient_email, template, data)
    VALUES (
      musician_email,
      'booking_request',
      jsonb_build_object(
        'title', NEW.title,
        'venue_name', venue_name,
        'date', NEW.start_time,
        'payment', NEW.offered_payment,
        'description', NEW.description,
        'link', 'https://gigmate.us/bookings/' || NEW.id
      )
    );
  END IF;

  -- Notify venue of acceptance
  IF NEW.request_status = 'accepted' AND OLD.request_status = 'pending' THEN
    INSERT INTO email_queue (recipient_email, template, data)
    VALUES (
      venue_email,
      'booking_accepted',
      jsonb_build_object(
        'title', NEW.title,
        'musician_name', musician_name,
        'date', NEW.start_time,
        'payment', NEW.offered_payment,
        'link', 'https://gigmate.us/bookings/' || NEW.id
      )
    );
  END IF;

  -- Notify venue of decline
  IF NEW.request_status = 'declined' AND OLD.request_status = 'pending' THEN
    INSERT INTO email_queue (recipient_email, template, data)
    VALUES (
      venue_email,
      'booking_declined',
      jsonb_build_object(
        'title', NEW.title,
        'musician_name', musician_name,
        'date', NEW.start_time,
        'reason', NEW.cancellation_reason,
        'link', 'https://gigmate.us/bookings/' || NEW.id
      )
    );
  END IF;

  -- Notify venue of counter offer
  IF NEW.request_status = 'counter_offered' AND OLD.request_status = 'pending' THEN
    INSERT INTO email_queue (recipient_email, template, data)
    VALUES (
      venue_email,
      'booking_counter_offer',
      jsonb_build_object(
        'title', NEW.title,
        'musician_name', musician_name,
        'date', NEW.start_time,
        'original_payment', NEW.offered_payment,
        'counter_offer', NEW.counter_offer_amount,
        'notes', NEW.counter_offer_notes,
        'link', 'https://gigmate.us/bookings/' || NEW.id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for booking status changes
DROP TRIGGER IF EXISTS on_booking_status_change ON bookings;
CREATE TRIGGER on_booking_status_change
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION queue_booking_notification_email();

-- Function to queue ticket purchase emails
CREATE OR REPLACE FUNCTION queue_ticket_purchase_email()
RETURNS TRIGGER AS $$
DECLARE
  fan_email text;
  event_title text;
  event_date timestamptz;
  venue_name text;
BEGIN
  -- Get fan email
  SELECT email INTO fan_email
  FROM profiles
  WHERE id = NEW.fan_id;

  -- Get event details
  SELECT e.title, e.event_date, COALESCE(v.venue_name, p.full_name)
  INTO event_title, event_date, venue_name
  FROM events e
  LEFT JOIN venues v ON e.venue_id = v.id
  LEFT JOIN profiles p ON v.user_id = p.id
  WHERE e.id = NEW.event_id;

  -- Send ticket purchase confirmation
  INSERT INTO email_queue (recipient_email, template, data)
  VALUES (
    fan_email,
    'ticket_purchase',
    jsonb_build_object(
      'event_name', event_title,
      'quantity', NEW.quantity,
      'total', NEW.total_amount,
      'event_date', event_date,
      'venue_name', venue_name,
      'ticket_id', NEW.id,
      'link', 'https://gigmate.us/tickets/' || NEW.id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for ticket purchases
DROP TRIGGER IF EXISTS on_ticket_purchase ON ticket_purchases;
CREATE TRIGGER on_ticket_purchase
  AFTER INSERT ON ticket_purchases
  FOR EACH ROW
  EXECUTE FUNCTION queue_ticket_purchase_email();

-- Function to queue subscription activation emails
CREATE OR REPLACE FUNCTION queue_subscription_email()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
BEGIN
  -- Get user email
  SELECT email INTO user_email
  FROM profiles
  WHERE id = NEW.user_id;

  -- Send subscription activation email
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
    INSERT INTO email_queue (recipient_email, template, data)
    VALUES (
      user_email,
      'subscription_activated',
      jsonb_build_object(
        'subscription_type', NEW.subscription_type,
        'current_period_end', NEW.current_period_end,
        'link', 'https://gigmate.us/subscription'
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for subscriptions
DROP TRIGGER IF EXISTS on_subscription_change ON subscriptions;
CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION queue_subscription_email();
