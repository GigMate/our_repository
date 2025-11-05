/*
  # Consolidate Remaining Multiple Permissive Policies

  1. Security & Performance Improvements
    - Merge remaining multiple permissive policies where possible
    - Reduces policy evaluation overhead
    - Simplifies security model

  2. Tables Updated
    - bookings: Merge view and update policies for musicians/venues
    - gigs: Merge insert/update/delete policies for musicians/venues
    - orders: Merge view policies for fans/musicians
    - ticket_purchases: Merge view policies for fans/venues

  Note: Some tables legitimately need separate policies for different user types
  with different access patterns. We'll consolidate where the logic can be unified.
*/

-- Fix bookings - merge view and update policies
DROP POLICY IF EXISTS "Musicians can view their bookings" ON bookings;
DROP POLICY IF EXISTS "Venues can view their bookings" ON bookings;
DROP POLICY IF EXISTS "Musicians can update their bookings" ON bookings;
DROP POLICY IF EXISTS "Venues can update their bookings" ON bookings;
DROP POLICY IF EXISTS "Venues can create bookings" ON bookings;

CREATE POLICY "Users can view their bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM musicians
      WHERE musicians.id = bookings.musician_id
      AND musicians.id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = bookings.venue_id
      AND venues.id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update their bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM musicians
      WHERE musicians.id = bookings.musician_id
      AND musicians.id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = bookings.venue_id
      AND venues.id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM musicians
      WHERE musicians.id = bookings.musician_id
      AND musicians.id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = bookings.venue_id
      AND venues.id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Venues can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = bookings.venue_id
      AND venues.id = (SELECT auth.uid())
    )
  );

-- Fix gigs - merge insert/update/delete policies
DROP POLICY IF EXISTS "Musicians can manage their gigs" ON gigs;
DROP POLICY IF EXISTS "Musicians can update their gigs" ON gigs;
DROP POLICY IF EXISTS "Musicians can delete their gigs" ON gigs;
DROP POLICY IF EXISTS "Venues can manage their gigs" ON gigs;
DROP POLICY IF EXISTS "Venues can update their gigs" ON gigs;
DROP POLICY IF EXISTS "Venues can delete their gigs" ON gigs;
DROP POLICY IF EXISTS "Users can view gigs" ON gigs;

CREATE POLICY "Anyone can view gigs"
  ON gigs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their gigs"
  ON gigs FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = musician_id 
    OR (SELECT auth.uid()) = venue_id
  );

CREATE POLICY "Users can update their gigs"
  ON gigs FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = musician_id 
    OR (SELECT auth.uid()) = venue_id
  )
  WITH CHECK (
    (SELECT auth.uid()) = musician_id 
    OR (SELECT auth.uid()) = venue_id
  );

CREATE POLICY "Users can delete their gigs"
  ON gigs FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = musician_id 
    OR (SELECT auth.uid()) = venue_id
  );

-- Fix orders - merge view policies
DROP POLICY IF EXISTS "Fans can view own orders" ON orders;
DROP POLICY IF EXISTS "Musicians can view orders for their merchandise" ON orders;
DROP POLICY IF EXISTS "Fans can create orders" ON orders;
DROP POLICY IF EXISTS "Musicians can update order status" ON orders;

CREATE POLICY "Users can view orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = fan_id 
    OR (SELECT auth.uid()) = musician_id
  );

CREATE POLICY "Fans can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = fan_id);

CREATE POLICY "Musicians can update order status"
  ON orders FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = musician_id)
  WITH CHECK ((SELECT auth.uid()) = musician_id);

-- Fix ticket_purchases - merge view policies
DROP POLICY IF EXISTS "Fans can view their ticket purchases" ON ticket_purchases;
DROP POLICY IF EXISTS "Venues can view tickets for their events" ON ticket_purchases;
DROP POLICY IF EXISTS "Fans can create ticket purchases" ON ticket_purchases;

CREATE POLICY "Users can view ticket purchases"
  ON ticket_purchases FOR SELECT
  TO authenticated
  USING (
    fan_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM events
      JOIN venues ON venues.id = events.venue_id
      WHERE events.id = ticket_purchases.event_id
      AND venues.id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Fans can create ticket purchases"
  ON ticket_purchases FOR INSERT
  TO authenticated
  WITH CHECK (fan_id = (SELECT auth.uid()));
