/*
  # Create Notifications System

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - User receiving the notification
      - `type` (enum) - Type of notification
      - `title` (text) - Notification title
      - `message` (text) - Notification message
      - `booking_id` (uuid) - Related booking (optional)
      - `transaction_id` (uuid) - Related transaction (optional)
      - `read` (boolean) - Whether notification has been read
      - `created_at` (timestamptz)

  2. Notification Types
    - payment_received, payment_sent, escrow_funded, escrow_released
    - payment_pending, payment_failed
    - booking_confirmed, booking_cancelled
    - dispute_opened, dispute_resolved
    - document_uploaded, document_approved, document_rejected
    - rating_received

  3. Security
    - Enable RLS on notifications table
    - Users can only view their own notifications
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM (
      'payment_received',
      'payment_sent',
      'escrow_funded',
      'escrow_released',
      'payment_pending',
      'payment_failed',
      'booking_confirmed',
      'booking_cancelled',
      'dispute_opened',
      'dispute_resolved',
      'document_uploaded',
      'document_approved',
      'document_rejected',
      'rating_received',
      'payout_processed',
      'subscription_renewed',
      'subscription_cancelled'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION notify_on_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    IF NEW.status = 'accepted' THEN
      INSERT INTO notifications (user_id, type, title, message, booking_id)
      VALUES (
        NEW.venue_id,
        'booking_confirmed',
        'Booking Accepted',
        'The musician has accepted your booking request.',
        NEW.id
      );
    ELSIF NEW.status = 'escrowed' THEN
      INSERT INTO notifications (user_id, type, title, message, booking_id)
      VALUES (
        NEW.musician_id,
        'escrow_funded',
        'Payment in Escrow',
        'The venue has funded the escrow account. Payment will be released after the event.',
        NEW.id
      );
    ELSIF NEW.status = 'completed' THEN
      INSERT INTO notifications (user_id, type, title, message, booking_id)
      VALUES (
        NEW.musician_id,
        'escrow_released',
        'Payment Released',
        'Your payment has been released from escrow.',
        NEW.id
      ),
      (
        NEW.venue_id,
        'booking_confirmed',
        'Booking Completed',
        'The booking has been marked as completed.',
        NEW.id
      );
    ELSIF NEW.status = 'cancelled' THEN
      INSERT INTO notifications (user_id, type, title, message, booking_id)
      VALUES (
        NEW.musician_id,
        'booking_cancelled',
        'Booking Cancelled',
        'A booking has been cancelled.',
        NEW.id
      ),
      (
        NEW.venue_id,
        'booking_cancelled',
        'Booking Cancelled',
        'The booking has been cancelled.',
        NEW.id
      );
    ELSIF NEW.status = 'disputed' THEN
      INSERT INTO notifications (user_id, type, title, message, booking_id)
      VALUES (
        NEW.musician_id,
        'dispute_opened',
        'Dispute Opened',
        'A dispute has been opened for this booking.',
        NEW.id
      ),
      (
        NEW.venue_id,
        'dispute_opened',
        'Dispute Opened',
        'A dispute has been opened for this booking.',
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_booking_status_change ON bookings;
CREATE TRIGGER notify_booking_status_change
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_booking_status_change();

CREATE OR REPLACE FUNCTION notify_on_document_upload()
RETURNS TRIGGER AS $$
DECLARE
  other_party_id uuid;
BEGIN
  SELECT CASE
    WHEN b.venue_id = NEW.uploaded_by THEN b.musician_id
    ELSE b.venue_id
  END INTO other_party_id
  FROM bookings b
  WHERE b.id = NEW.booking_id;

  IF other_party_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, booking_id)
    VALUES (
      other_party_id,
      'document_uploaded',
      'New Document Uploaded',
      'A new document has been uploaded to your booking.',
      NEW.booking_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_document_upload ON booking_documents;
CREATE TRIGGER notify_document_upload
  AFTER INSERT ON booking_documents
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_document_upload();

CREATE OR REPLACE FUNCTION notify_on_rating_received()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    NEW.rated_user_id,
    'rating_received',
    'New Rating Received',
    'You have received a new rating.',
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_rating_received ON ratings;
CREATE TRIGGER notify_rating_received
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_rating_received();
