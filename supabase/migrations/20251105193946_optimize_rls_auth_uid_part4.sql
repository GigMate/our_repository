/*
  # Optimize RLS Policies - Part 4
  
  Continue optimizing messaging and content-related policies.
*/

-- content_rights
DROP POLICY IF EXISTS "Users can view own content rights" ON content_rights;
CREATE POLICY "Users can view own content rights"
  ON content_rights FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = original_owner_id);

DROP POLICY IF EXISTS "Users can insert own content rights" ON content_rights;
CREATE POLICY "Users can insert own content rights"
  ON content_rights FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = original_owner_id
    AND rights_agreement_accepted = true
  );

-- message_unlocks
DROP POLICY IF EXISTS "Fans can view own message unlocks" ON message_unlocks;
CREATE POLICY "Fans can view own message unlocks"
  ON message_unlocks FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = fan_id);

DROP POLICY IF EXISTS "Fans can manage own message unlocks" ON message_unlocks;
CREATE POLICY "Fans can manage own message unlocks"
  ON message_unlocks FOR ALL
  TO authenticated
  USING ((select auth.uid()) = fan_id)
  WITH CHECK ((select auth.uid()) = fan_id);

-- message_unlock_purchases
DROP POLICY IF EXISTS "Fans can view own unlock purchases" ON message_unlock_purchases;
CREATE POLICY "Fans can view own unlock purchases"
  ON message_unlock_purchases FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = fan_id);

DROP POLICY IF EXISTS "Fans can create unlock purchases" ON message_unlock_purchases;
CREATE POLICY "Fans can create unlock purchases"
  ON message_unlock_purchases FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = fan_id);

-- fan_message_usage
DROP POLICY IF EXISTS "Fans can view own message usage" ON fan_message_usage;
CREATE POLICY "Fans can view own message usage"
  ON fan_message_usage FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = fan_id);

-- user_consents
DROP POLICY IF EXISTS "Users can view own consents" ON user_consents;
CREATE POLICY "Users can view own consents"
  ON user_consents FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own consents" ON user_consents;
CREATE POLICY "Users can create own consents"
  ON user_consents FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- merch_vendors
DROP POLICY IF EXISTS "Vendors can manage own profile" ON merch_vendors;
CREATE POLICY "Vendors can manage own profile"
  ON merch_vendors FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- vendor_inventory
DROP POLICY IF EXISTS "Vendors can manage own inventory" ON vendor_inventory;
CREATE POLICY "Vendors can manage own inventory"
  ON vendor_inventory FOR ALL
  TO authenticated
  USING ((select auth.uid()) IN (SELECT user_id FROM merch_vendors WHERE id = vendor_id))
  WITH CHECK ((select auth.uid()) IN (SELECT user_id FROM merch_vendors WHERE id = vendor_id));
