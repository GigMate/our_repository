/*
  # Fix Advertisements RLS Policies

  1. Changes
    - Add INSERT policy for authenticated users to create advertisements
    - Add UPDATE policy for authenticated users to manage advertisements
    - Add DELETE policy for authenticated users to remove advertisements

  2. Security
    - Only authenticated users can create/update/delete ads
    - Public users can only view active ads
*/

CREATE POLICY "Authenticated users can create advertisements"
  ON advertisements
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update advertisements"
  ON advertisements
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete advertisements"
  ON advertisements
  FOR DELETE
  TO authenticated
  USING (true);