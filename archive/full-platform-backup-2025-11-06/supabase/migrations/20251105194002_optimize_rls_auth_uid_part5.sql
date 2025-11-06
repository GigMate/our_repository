/*
  # Optimize RLS Policies - Part 5
  
  Final batch of RLS optimizations for dropship, vendor, and agreement tables.
*/

-- dropship_orders
DROP POLICY IF EXISTS "Users can view own dropship orders" ON dropship_orders;
CREATE POLICY "Users can view own dropship orders"
  ON dropship_orders FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = purchaser_id);

DROP POLICY IF EXISTS "Users can create dropship orders" ON dropship_orders;
CREATE POLICY "Users can create dropship orders"
  ON dropship_orders FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = purchaser_id);

DROP POLICY IF EXISTS "Vendors can update own orders" ON dropship_orders;
CREATE POLICY "Vendors can update own orders"
  ON dropship_orders FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IN (SELECT user_id FROM merch_vendors WHERE id = vendor_id))
  WITH CHECK ((select auth.uid()) IN (SELECT user_id FROM merch_vendors WHERE id = vendor_id));

-- vendor_shipping_options
DROP POLICY IF EXISTS "Vendors can manage own shipping options" ON vendor_shipping_options;
CREATE POLICY "Vendors can manage own shipping options"
  ON vendor_shipping_options FOR ALL
  TO authenticated
  USING ((select auth.uid()) IN (SELECT user_id FROM merch_vendors WHERE id = vendor_id))
  WITH CHECK ((select auth.uid()) IN (SELECT user_id FROM merch_vendors WHERE id = vendor_id));

-- agreements
DROP POLICY IF EXISTS "Users can view agreements they're part of" ON agreements;
CREATE POLICY "Users can view agreements they're part of"
  ON agreements FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) IN (
      SELECT venue_id FROM bookings WHERE id = booking_id
      UNION
      SELECT musician_id FROM bookings WHERE id = booking_id
    )
  );

DROP POLICY IF EXISTS "Users can create agreements for their bookings" ON agreements;
CREATE POLICY "Users can create agreements for their bookings"
  ON agreements FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) IN (
      SELECT venue_id FROM bookings WHERE id = booking_id
      UNION
      SELECT musician_id FROM bookings WHERE id = booking_id
    )
  );

DROP POLICY IF EXISTS "Users can update their own agreements" ON agreements;
CREATE POLICY "Users can update their own agreements"
  ON agreements FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

-- agreement_signatures
DROP POLICY IF EXISTS "Users can view signatures on their agreements" ON agreement_signatures;
CREATE POLICY "Users can view signatures on their agreements"
  ON agreement_signatures FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) IN (
      SELECT venue_id FROM bookings WHERE id IN (
        SELECT booking_id FROM agreements WHERE id = agreement_id
      )
      UNION
      SELECT musician_id FROM bookings WHERE id IN (
        SELECT booking_id FROM agreements WHERE id = agreement_id
      )
    )
  );

DROP POLICY IF EXISTS "Users can sign their own agreements" ON agreement_signatures;
CREATE POLICY "Users can sign their own agreements"
  ON agreement_signatures FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = signer_id);

-- agreement_payments
DROP POLICY IF EXISTS "Users can view payments for their agreements" ON agreement_payments;
CREATE POLICY "Users can view payments for their agreements"
  ON agreement_payments FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) IN (
      SELECT venue_id FROM bookings WHERE id IN (
        SELECT booking_id FROM agreements WHERE id = agreement_id
      )
      UNION
      SELECT musician_id FROM bookings WHERE id IN (
        SELECT booking_id FROM agreements WHERE id = agreement_id
      )
    )
  );
