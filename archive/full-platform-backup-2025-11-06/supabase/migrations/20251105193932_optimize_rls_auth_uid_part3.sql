/*
  # Optimize RLS Policies - Part 3
  
  Continue optimizing emergency and credit-related policies.
*/

-- emergency_availability
DROP POLICY IF EXISTS "Musicians can manage own emergency availability" ON emergency_availability;
CREATE POLICY "Musicians can manage own emergency availability"
  ON emergency_availability FOR ALL
  TO authenticated
  USING ((select auth.uid()) IN (SELECT id FROM musicians WHERE id = musician_id))
  WITH CHECK ((select auth.uid()) IN (SELECT id FROM musicians WHERE id = musician_id));

DROP POLICY IF EXISTS "Venues can view available emergency musicians" ON emergency_availability;
CREATE POLICY "Venues can view available emergency musicians"
  ON emergency_availability FOR SELECT
  TO authenticated
  USING (
    is_available = true
    AND (select auth.uid()) IN (SELECT id FROM venues)
  );

-- emergency_replacements
DROP POLICY IF EXISTS "Venues can view own emergency replacements" ON emergency_replacements;
CREATE POLICY "Venues can view own emergency replacements"
  ON emergency_replacements FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = venue_id);

DROP POLICY IF EXISTS "Premium venues can create emergency replacements" ON emergency_replacements;
CREATE POLICY "Premium venues can create emergency replacements"
  ON emergency_replacements FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = venue_id
    AND (select auth.uid()) IN (
      SELECT s.user_id FROM subscriptions s
      WHERE s.status = 'active' 
      AND s.subscription_type LIKE 'venue_%'
      AND s.subscription_type IN ('venue_regional', 'venue_state', 'venue_national')
    )
  );

DROP POLICY IF EXISTS "Venues can update own emergency replacements" ON emergency_replacements;
CREATE POLICY "Venues can update own emergency replacements"
  ON emergency_replacements FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = venue_id)
  WITH CHECK ((select auth.uid()) = venue_id);

DROP POLICY IF EXISTS "Musicians can view emergency replacements for their genres" ON emergency_replacements;
CREATE POLICY "Musicians can view emergency replacements for their genres"
  ON emergency_replacements FOR SELECT
  TO authenticated
  USING (
    status = 'candidates_found'
    AND (select auth.uid()) IN (
      SELECT m.id FROM musicians m
      WHERE m.genres && required_genres
    )
  );

-- user_credits
DROP POLICY IF EXISTS "Users can view own credit balance" ON user_credits;
CREATE POLICY "Users can view own credit balance"
  ON user_credits FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- credit_transactions
DROP POLICY IF EXISTS "Users can view own credit transactions" ON credit_transactions;
CREATE POLICY "Users can view own credit transactions"
  ON credit_transactions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- message_credits
DROP POLICY IF EXISTS "Users can view own message credit costs" ON message_credits;
CREATE POLICY "Users can view own message credit costs"
  ON message_credits FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = sender_id);

-- promotional_credit_uses
DROP POLICY IF EXISTS "Users can view own promo uses" ON promotional_credit_uses;
CREATE POLICY "Users can view own promo uses"
  ON promotional_credit_uses FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can redeem promos" ON promotional_credit_uses;
CREATE POLICY "Users can redeem promos"
  ON promotional_credit_uses FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
