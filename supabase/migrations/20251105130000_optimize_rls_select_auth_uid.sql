/*
  # Optimize RLS Policies with SELECT auth.uid()

  1. Performance Optimization
    - Replace direct auth.uid() calls with (SELECT auth.uid()) in RLS policies
    - Prevents re-evaluation of auth functions for each row
    - Significantly improves query performance at scale
    
  2. Changes
    - Update all RLS policies to use (SELECT auth.uid()) pattern
    - Uses correct column names from actual schema
*/

-- Fan rating quotas policies
DROP POLICY IF EXISTS "Users can view own quota" ON fan_rating_quotas;
CREATE POLICY "Users can view own quota"
  ON fan_rating_quotas FOR SELECT
  TO authenticated
  USING (fan_id = (SELECT auth.uid()));

-- Rating helpful votes policies  
DROP POLICY IF EXISTS "Users can vote helpful" ON rating_helpful_votes;
CREATE POLICY "Users can vote helpful"
  ON rating_helpful_votes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Ratings policies
DROP POLICY IF EXISTS "Users can view own ratings" ON ratings;
CREATE POLICY "Users can view own ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (rater_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Premium fans can view all ratings" ON ratings;
CREATE POLICY "Premium fans can view all ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.user_type = 'fan'
      AND profiles.fan_subscription_tier IN ('premium', 'vip')
    )
  );

DROP POLICY IF EXISTS "Gold+ musicians can view ratings" ON ratings;
CREATE POLICY "Gold+ musicians can view ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.user_type = 'musician'
      AND profiles.tier_level IN ('gold', 'platinum')
    )
  );

DROP POLICY IF EXISTS "Regional+ venues can view ratings" ON ratings;
CREATE POLICY "Regional+ venues can view ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.user_type = 'venue'
      AND profiles.venue_subscription_tier IN ('regional', 'state', 'national')
    )
  );

DROP POLICY IF EXISTS "Users can create ratings" ON ratings;
CREATE POLICY "Users can create ratings"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (rater_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Gold+ can respond to ratings" ON ratings;
CREATE POLICY "Gold+ can respond to ratings"
  ON ratings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND (
        (profiles.user_type = 'musician' AND profiles.tier_level IN ('gold', 'platinum'))
        OR (profiles.user_type = 'venue' AND profiles.venue_subscription_tier IN ('state', 'national'))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND (
        (profiles.user_type = 'musician' AND profiles.tier_level IN ('gold', 'platinum'))
        OR (profiles.user_type = 'venue' AND profiles.venue_subscription_tier IN ('state', 'national'))
      )
    )
  );

-- Images policies
DROP POLICY IF EXISTS "Users can insert their own images" ON images;
CREATE POLICY "Users can insert their own images"
  ON images FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own images" ON images;
CREATE POLICY "Users can update their own images"
  ON images FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own images" ON images;
CREATE POLICY "Users can delete their own images"
  ON images FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Conversations policies
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = participant_1 OR (SELECT auth.uid()) = participant_2);

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = participant_1 OR (SELECT auth.uid()) = participant_2);

-- Messages policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.participant_1 = (SELECT auth.uid()) OR conversations.participant_2 = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.participant_1 = (SELECT auth.uid()) OR conversations.participant_2 = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can update their message read status" ON messages;
CREATE POLICY "Users can update their message read status"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.participant_1 = (SELECT auth.uid()) OR conversations.participant_2 = (SELECT auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.participant_1 = (SELECT auth.uid()) OR conversations.participant_2 = (SELECT auth.uid()))
    )
  );

-- Contracts policies
DROP POLICY IF EXISTS "Users can view their contracts" ON contracts;
CREATE POLICY "Users can view their contracts"
  ON contracts FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = venue_id OR (SELECT auth.uid()) = musician_id);

DROP POLICY IF EXISTS "Venues can create contracts" ON contracts;
CREATE POLICY "Venues can create contracts"
  ON contracts FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = venue_id);

DROP POLICY IF EXISTS "Parties can sign contracts" ON contracts;
CREATE POLICY "Parties can sign contracts"
  ON contracts FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = venue_id OR (SELECT auth.uid()) = musician_id)
  WITH CHECK ((SELECT auth.uid()) = venue_id OR (SELECT auth.uid()) = musician_id);

-- Musician videos policies
DROP POLICY IF EXISTS "Musicians can manage their videos" ON musician_videos;
CREATE POLICY "Musicians can manage their videos"
  ON musician_videos FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = musician_id);

DROP POLICY IF EXISTS "Musicians can update their videos" ON musician_videos;
CREATE POLICY "Musicians can update their videos"
  ON musician_videos FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = musician_id)
  WITH CHECK ((SELECT auth.uid()) = musician_id);

DROP POLICY IF EXISTS "Musicians can delete their videos" ON musician_videos;
CREATE POLICY "Musicians can delete their videos"
  ON musician_videos FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = musician_id);

-- Testimonials policies
DROP POLICY IF EXISTS "Users can create testimonials" ON testimonials;
CREATE POLICY "Users can create testimonials"
  ON testimonials FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors can update their testimonials" ON testimonials;
CREATE POLICY "Authors can update their testimonials"
  ON testimonials FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = author_id)
  WITH CHECK ((SELECT auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors can delete their testimonials" ON testimonials;
CREATE POLICY "Authors can delete their testimonials"
  ON testimonials FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = author_id);