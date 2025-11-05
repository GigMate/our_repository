/*
  # Consolidate Multiple Permissive Policies

  1. Security Optimization
    - Combine multiple permissive SELECT policies into single policies
    - Reduces policy evaluation overhead
    - Improves query performance
    
  2. Changes
    - fan_rating_quotas: Consolidate "System can manage quotas" and "Users can view own quota"
    - ratings: Consolidate all SELECT policies into one comprehensive policy
*/

-- Fan rating quotas: Remove system policy, keep user policy
DROP POLICY IF EXISTS "System can manage quotas" ON fan_rating_quotas;

-- Ratings: Consolidate all SELECT policies into one
DROP POLICY IF EXISTS "Users can view ratings" ON ratings;
DROP POLICY IF EXISTS "Users can view own ratings" ON ratings;
DROP POLICY IF EXISTS "Premium fans can view all ratings" ON ratings;
DROP POLICY IF EXISTS "Gold+ musicians can view ratings" ON ratings;
DROP POLICY IF EXISTS "Regional+ venues can view ratings" ON ratings;
DROP POLICY IF EXISTS "Public basic stats" ON ratings;

CREATE POLICY "View ratings based on role and tier"
  ON ratings FOR SELECT
  TO authenticated
  USING (
    rater_id = (SELECT auth.uid())
    OR is_public = true
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND (
        (profiles.user_type = 'fan' AND profiles.fan_subscription_tier IN ('premium', 'vip'))
        OR (profiles.user_type = 'musician' AND profiles.tier_level IN ('gold', 'platinum'))
        OR (profiles.user_type = 'venue' AND profiles.venue_subscription_tier IN ('regional', 'state', 'national'))
      )
    )
  );