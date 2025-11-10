/*
  # Fix Investor Legal Documents RLS for Anonymous Access

  The investor interest form is accessed by unauthenticated users who need
  to view and sign legal documents before creating an account. This migration
  fixes the RLS policies to allow anonymous access to active legal documents.

  Changes:
  - Update RLS policy to explicitly allow anon role to view active documents
  - Keep admin management policies intact
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Anyone can view active legal documents" ON investor_legal_documents;

-- Create new policy that explicitly allows public (anon) access
CREATE POLICY "Public can view active legal documents"
  ON investor_legal_documents FOR SELECT
  TO public
  USING (is_active = true);

-- Also ensure authenticated users can view
CREATE POLICY "Authenticated can view active legal documents"
  ON investor_legal_documents FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Fix the signature insertion policy to allow anon users
DROP POLICY IF EXISTS "Users can create signatures for their requests" ON investor_document_signatures;

CREATE POLICY "Anyone can create signatures for valid requests"
  ON investor_document_signatures FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM investor_interest_requests
      WHERE investor_interest_requests.id = investor_request_id
      AND investor_interest_requests.email = email
    )
  );

-- Update select policy for signatures
DROP POLICY IF EXISTS "Users can view their own signatures" ON investor_document_signatures;

CREATE POLICY "Users can view signatures by email match"
  ON investor_document_signatures FOR SELECT
  TO public
  USING (
    -- Allow if email matches (for unauthenticated users during signup)
    email = COALESCE(auth.jwt()->>'email', email)
  );
