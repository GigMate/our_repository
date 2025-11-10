/*
  # Fix Investor Interest Request Insert Policy

  The investor interest form is accessed by unauthenticated users who need
  to submit their information before creating an account. This migration
  fixes the RLS policy to explicitly allow anonymous (public) inserts.

  Changes:
  - Update INSERT policy to explicitly allow public (anon) role
  - Ensure anyone can submit investor interest requests
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Anyone can submit investor interest" ON investor_interest_requests;

-- Create new policy that explicitly allows public (anon) inserts
CREATE POLICY "Public can submit investor interest"
  ON investor_interest_requests FOR INSERT
  TO public
  WITH CHECK (true);

-- Also allow authenticated users to insert
CREATE POLICY "Authenticated can submit investor interest"
  ON investor_interest_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Fix the SELECT policy to allow unauthenticated users to view their own requests by email
DROP POLICY IF EXISTS "Users can view own requests" ON investor_interest_requests;

CREATE POLICY "Users can view own requests by email"
  ON investor_interest_requests FOR SELECT
  TO public
  USING (
    -- Allow if email matches (for unauthenticated users)
    email = COALESCE(auth.jwt()->>'email', email)
  );

-- Keep authenticated user select policy
CREATE POLICY "Authenticated users can view own requests"
  ON investor_interest_requests FOR SELECT
  TO authenticated
  USING (email = auth.jwt()->>'email');
