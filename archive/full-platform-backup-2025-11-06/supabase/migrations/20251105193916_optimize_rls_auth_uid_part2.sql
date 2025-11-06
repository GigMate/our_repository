/*
  # Optimize RLS Policies - Part 2
  
  Continue optimizing RLS policies with (select auth.uid()).
*/

-- user_behavior_events
DROP POLICY IF EXISTS "Users can view own behavior events" ON user_behavior_events;
CREATE POLICY "Users can view own behavior events"
  ON user_behavior_events FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own behavior events" ON user_behavior_events;
CREATE POLICY "Users can create own behavior events"
  ON user_behavior_events FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- user_preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- recommendation_queue
DROP POLICY IF EXISTS "Users can view own recommendations" ON recommendation_queue;
CREATE POLICY "Users can view own recommendations"
  ON recommendation_queue FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own recommendations" ON recommendation_queue;
CREATE POLICY "Users can update own recommendations"
  ON recommendation_queue FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- recommendation_clicks
DROP POLICY IF EXISTS "Users can view own recommendation clicks" ON recommendation_clicks;
CREATE POLICY "Users can view own recommendation clicks"
  ON recommendation_clicks FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can track own recommendation clicks" ON recommendation_clicks;
CREATE POLICY "Users can track own recommendation clicks"
  ON recommendation_clicks FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- purchase_patterns
DROP POLICY IF EXISTS "Users can view own purchase patterns" ON purchase_patterns;
CREATE POLICY "Users can view own purchase patterns"
  ON purchase_patterns FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- search_history
DROP POLICY IF EXISTS "Users can view own search history" ON search_history;
CREATE POLICY "Users can view own search history"
  ON search_history FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Anyone can create search history" ON search_history;
CREATE POLICY "Anyone can create search history"
  ON search_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR (select auth.uid()) = user_id);
