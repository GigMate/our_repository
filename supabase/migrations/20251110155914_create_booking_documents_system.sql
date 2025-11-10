/*
  # Create Booking Documents System

  1. New Tables
    - `booking_documents`
      - `id` (uuid, primary key)
      - `booking_id` (uuid) - References bookings table
      - `document_type` (enum) - contract, insurance, rider, setlist, invoice, receipt, other
      - `file_url` (text) - URL to stored document
      - `file_name` (text) - Original filename
      - `uploaded_by` (uuid) - User who uploaded the document
      - `status` (enum) - pending_review, approved, rejected, expired
      - `reviewed_by` (uuid) - User who reviewed the document
      - `review_notes` (text) - Optional notes from reviewer
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on booking_documents table
    - Users can view documents for their bookings
    - Users can upload documents to their bookings
    - Both parties can approve/reject documents
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
    CREATE TYPE document_type AS ENUM (
      'contract',
      'insurance',
      'rider',
      'setlist',
      'invoice',
      'receipt',
      'other'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
    CREATE TYPE document_status AS ENUM (
      'pending_review',
      'approved',
      'rejected',
      'expired'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS booking_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status document_status DEFAULT 'pending_review',
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  review_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_documents_booking_id ON booking_documents(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_documents_uploaded_by ON booking_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_booking_documents_status ON booking_documents(status);

ALTER TABLE booking_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents for their bookings"
  ON booking_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_documents.booking_id
      AND (
        bookings.venue_id = auth.uid()
        OR bookings.musician_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can upload documents to their bookings"
  ON booking_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_documents.booking_id
      AND (
        bookings.venue_id = auth.uid()
        OR bookings.musician_id = auth.uid()
      )
    )
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Users can update documents for their bookings"
  ON booking_documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_documents.booking_id
      AND (
        bookings.venue_id = auth.uid()
        OR bookings.musician_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_documents.booking_id
      AND (
        bookings.venue_id = auth.uid()
        OR bookings.musician_id = auth.uid()
      )
    )
  );

CREATE OR REPLACE FUNCTION update_booking_document_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_booking_documents_timestamp ON booking_documents;
CREATE TRIGGER update_booking_documents_timestamp
  BEFORE UPDATE ON booking_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_document_timestamp();
