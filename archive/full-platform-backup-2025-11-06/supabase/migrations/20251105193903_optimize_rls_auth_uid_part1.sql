/*
  # Optimize RLS Policies - Part 1
  
  Replace auth.uid() with (select auth.uid()) for better performance.
  This prevents re-evaluation for each row.
*/

-- subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- payment_intents
DROP POLICY IF EXISTS "Users can view own payment intents" ON payment_intents;
CREATE POLICY "Users can view own payment intents"
  ON payment_intents FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- availability_slots
DROP POLICY IF EXISTS "Users can manage own availability" ON availability_slots;
CREATE POLICY "Users can manage own availability"
  ON availability_slots FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- social_media_accounts
DROP POLICY IF EXISTS "Users can view own social media accounts" ON social_media_accounts;
CREATE POLICY "Users can view own social media accounts"
  ON social_media_accounts FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own social media accounts" ON social_media_accounts;
CREATE POLICY "Users can insert own social media accounts"
  ON social_media_accounts FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own social media accounts" ON social_media_accounts;
CREATE POLICY "Users can update own social media accounts"
  ON social_media_accounts FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own social media accounts" ON social_media_accounts;
CREATE POLICY "Users can delete own social media accounts"
  ON social_media_accounts FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- social_media_posts
DROP POLICY IF EXISTS "Users can view own social media posts" ON social_media_posts;
CREATE POLICY "Users can view own social media posts"
  ON social_media_posts FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own social media posts" ON social_media_posts;
CREATE POLICY "Users can insert own social media posts"
  ON social_media_posts FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own social media posts" ON social_media_posts;
CREATE POLICY "Users can update own social media posts"
  ON social_media_posts FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own social media posts" ON social_media_posts;
CREATE POLICY "Users can delete own social media posts"
  ON social_media_posts FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
