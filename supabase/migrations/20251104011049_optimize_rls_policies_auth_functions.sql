/*
  # Optimize RLS Policies for Performance

  1. Performance Improvements
    - Wrap auth.uid() calls with SELECT to prevent re-evaluation for each row
    - This significantly improves query performance at scale

  2. Tables Updated
    - profiles: Users can insert/update own profile
    - musicians: Musicians can insert/update own profile
    - venues: Venues can insert/update own profile
    - gigs: Musicians and venues can manage their gigs
    - merchandise: Musicians can manage own merchandise
    - orders: Fans can create/view orders, musicians can update/view
    - order_items: Fans can create items, users can view accessible items
    - transactions: System can create, users can view own
    - ratings: Users can create ratings, view own ratings, top tier users view all
    - events: Musicians and venues can view/manage their events
    - ticket_purchases: Fans can create/view purchases, venues can view tickets
    - payment_methods: Users can manage/view their payment methods
    - bookings: Musicians and venues can view/update their bookings, venues can create
    - payout_accounts: Users can manage/view their payout accounts
*/

-- Drop and recreate policies for profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Drop and recreate policies for musicians
DROP POLICY IF EXISTS "Musicians can insert own profile" ON musicians;
DROP POLICY IF EXISTS "Musicians can update own profile" ON musicians;

CREATE POLICY "Musicians can insert own profile"
  ON musicians FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Musicians can update own profile"
  ON musicians FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Drop and recreate policies for venues
DROP POLICY IF EXISTS "Venues can insert own profile" ON venues;
DROP POLICY IF EXISTS "Venues can update own profile" ON venues;

CREATE POLICY "Venues can insert own profile"
  ON venues FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Venues can update own profile"
  ON venues FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Drop and recreate policies for gigs
DROP POLICY IF EXISTS "Musicians can manage their gigs" ON gigs;
DROP POLICY IF EXISTS "Venues can manage their gigs" ON gigs;

CREATE POLICY "Musicians can manage their gigs"
  ON gigs FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = musician_id)
  WITH CHECK ((SELECT auth.uid()) = musician_id);

CREATE POLICY "Venues can manage their gigs"
  ON gigs FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = venue_id)
  WITH CHECK ((SELECT auth.uid()) = venue_id);

-- Drop and recreate policies for merchandise
DROP POLICY IF EXISTS "Musicians can manage own merchandise" ON merchandise;

CREATE POLICY "Musicians can manage own merchandise"
  ON merchandise FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = musician_id)
  WITH CHECK ((SELECT auth.uid()) = musician_id);

-- Drop and recreate policies for orders
DROP POLICY IF EXISTS "Fans can create orders" ON orders;
DROP POLICY IF EXISTS "Fans can view own orders" ON orders;
DROP POLICY IF EXISTS "Musicians can update order status" ON orders;
DROP POLICY IF EXISTS "Musicians can view orders for their merchandise" ON orders;

CREATE POLICY "Fans can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = fan_id);

CREATE POLICY "Fans can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = fan_id);

CREATE POLICY "Musicians can update order status"
  ON orders FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = musician_id)
  WITH CHECK ((SELECT auth.uid()) = musician_id);

CREATE POLICY "Musicians can view orders for their merchandise"
  ON orders FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = musician_id);

-- Drop and recreate policies for order_items
DROP POLICY IF EXISTS "Fans can create order items for own orders" ON order_items;
DROP POLICY IF EXISTS "Users can view order items for accessible orders" ON order_items;

CREATE POLICY "Fans can create order items for own orders"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.fan_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can view order items for accessible orders"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.fan_id = (SELECT auth.uid()) OR orders.musician_id = (SELECT auth.uid()))
    )
  );

-- Drop and recreate policies for transactions
DROP POLICY IF EXISTS "System can create transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;

CREATE POLICY "System can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = from_user_id);

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = from_user_id OR (SELECT auth.uid()) = to_user_id);

-- Drop and recreate policies for ratings
DROP POLICY IF EXISTS "Users can create ratings" ON ratings;
DROP POLICY IF EXISTS "Users can view their own ratings" ON ratings;
DROP POLICY IF EXISTS "Top tier users can view all ratings" ON ratings;

CREATE POLICY "Users can create ratings"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (rater_id = (SELECT auth.uid()));

CREATE POLICY "Users can view their own ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (rated_user_id = (SELECT auth.uid()) OR rater_id = (SELECT auth.uid()));

CREATE POLICY "Top tier users can view all ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.tier_level IN ('platinum', 'gold')
    )
  );

-- Drop and recreate policies for events
DROP POLICY IF EXISTS "Musicians can view their events" ON events;
DROP POLICY IF EXISTS "Venues can manage their events" ON events;

CREATE POLICY "Musicians can view their events"
  ON events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM musicians
      WHERE musicians.id = events.musician_id
      AND musicians.id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Venues can manage their events"
  ON events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = events.venue_id
      AND venues.id = (SELECT auth.uid())
    )
  );

-- Drop and recreate policies for ticket_purchases
DROP POLICY IF EXISTS "Fans can create ticket purchases" ON ticket_purchases;
DROP POLICY IF EXISTS "Fans can view their ticket purchases" ON ticket_purchases;
DROP POLICY IF EXISTS "Venues can view tickets for their events" ON ticket_purchases;

CREATE POLICY "Fans can create ticket purchases"
  ON ticket_purchases FOR INSERT
  TO authenticated
  WITH CHECK (fan_id = (SELECT auth.uid()));

CREATE POLICY "Fans can view their ticket purchases"
  ON ticket_purchases FOR SELECT
  TO authenticated
  USING (fan_id = (SELECT auth.uid()));

CREATE POLICY "Venues can view tickets for their events"
  ON ticket_purchases FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      JOIN venues ON venues.id = events.venue_id
      WHERE events.id = ticket_purchases.event_id
      AND venues.id = (SELECT auth.uid())
    )
  );

-- Drop and recreate policies for payment_methods
DROP POLICY IF EXISTS "Users can manage their payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can view their payment methods" ON payment_methods;

CREATE POLICY "Users can manage their payment methods"
  ON payment_methods FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view their payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Drop and recreate policies for bookings
DROP POLICY IF EXISTS "Musicians can update their bookings" ON bookings;
DROP POLICY IF EXISTS "Musicians can view their bookings" ON bookings;
DROP POLICY IF EXISTS "Venues can create bookings" ON bookings;
DROP POLICY IF EXISTS "Venues can update their bookings" ON bookings;
DROP POLICY IF EXISTS "Venues can view their bookings" ON bookings;

CREATE POLICY "Musicians can update their bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM musicians
      WHERE musicians.id = bookings.musician_id
      AND musicians.id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Musicians can view their bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM musicians
      WHERE musicians.id = bookings.musician_id
      AND musicians.id = (SELECT auth.uid())
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

CREATE POLICY "Venues can update their bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = bookings.venue_id
      AND venues.id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Venues can view their bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = bookings.venue_id
      AND venues.id = (SELECT auth.uid())
    )
  );

-- Drop and recreate policies for payout_accounts
DROP POLICY IF EXISTS "Users can manage their payout accounts" ON payout_accounts;
DROP POLICY IF EXISTS "Users can view their payout accounts" ON payout_accounts;

CREATE POLICY "Users can manage their payout accounts"
  ON payout_accounts FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view their payout accounts"
  ON payout_accounts FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
