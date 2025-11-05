/*
  # User Behavior Tracking and AI Recommendation System

  1. New Tables
    - `user_behavior_events` - Track all user interactions and behaviors
    - `user_preferences` - Learned preferences from behavior patterns
    - `recommendation_queue` - AI-generated recommendations for users
    - `recommendation_clicks` - Track recommendation effectiveness
    - `purchase_patterns` - Analyze spending habits
    - `search_history` - Track search patterns for better targeting
  
  2. Features
    - Comprehensive event tracking (views, clicks, purchases, searches)
    - Machine learning-ready data structure
    - Recommendation scoring system
    - Revenue opportunity tracking
    - A/B testing support
  
  3. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Analytics aggregation functions
*/

-- Track all user behavior events
CREATE TABLE IF NOT EXISTS user_behavior_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'page_view', 'profile_view', 'event_view', 'booking_view',
    'search', 'filter_apply', 'click', 'share',
    'ticket_purchase', 'merchandise_purchase', 'booking_request',
    'message_sent', 'favorite_add', 'rating_submit',
    'video_play', 'audio_play', 'image_view',
    'agreement_view', 'agreement_sign', 'payment_complete'
  )),
  event_category text NOT NULL CHECK (event_category IN (
    'discovery', 'engagement', 'transaction', 'communication', 'content'
  )),
  target_type text CHECK (target_type IN (
    'musician', 'venue', 'event', 'merchandise', 'booking', 'user'
  )),
  target_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  session_id text,
  device_type text,
  referrer_url text,
  page_url text,
  created_at timestamptz DEFAULT now()
);

-- Learned user preferences from behavior analysis
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  favorite_genres text[] DEFAULT ARRAY[]::text[],
  genre_scores jsonb DEFAULT '{}'::jsonb,
  preferred_price_range_min numeric,
  preferred_price_range_max numeric,
  preferred_venues uuid[] DEFAULT ARRAY[]::uuid[],
  preferred_musicians uuid[] DEFAULT ARRAY[]::uuid[],
  preferred_event_times jsonb DEFAULT '{}'::jsonb,
  preferred_days_of_week text[] DEFAULT ARRAY[]::text[],
  geographic_preference jsonb DEFAULT '{}'::jsonb,
  spending_tier text CHECK (spending_tier IN ('budget', 'moderate', 'premium', 'luxury')),
  engagement_score numeric DEFAULT 0,
  likelihood_to_purchase numeric DEFAULT 0,
  last_analyzed_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI-generated recommendations
CREATE TABLE IF NOT EXISTS recommendation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recommendation_type text NOT NULL CHECK (recommendation_type IN (
    'event', 'musician', 'venue', 'merchandise', 'upgrade', 'booking_opportunity'
  )),
  target_id uuid,
  target_type text NOT NULL,
  title text NOT NULL,
  description text,
  recommendation_reason text,
  confidence_score numeric DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  priority_score numeric DEFAULT 0,
  expected_revenue numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  shown_at timestamptz,
  clicked_at timestamptz,
  converted_at timestamptz,
  dismissed_at timestamptz,
  ab_test_variant text,
  created_at timestamptz DEFAULT now()
);

-- Track recommendation effectiveness
CREATE TABLE IF NOT EXISTS recommendation_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id uuid REFERENCES recommendation_queue(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  clicked_at timestamptz DEFAULT now(),
  converted boolean DEFAULT false,
  conversion_value numeric,
  time_to_conversion interval,
  created_at timestamptz DEFAULT now()
);

-- Analyze purchase patterns
CREATE TABLE IF NOT EXISTS purchase_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  purchase_type text NOT NULL CHECK (purchase_type IN (
    'ticket', 'merchandise', 'subscription', 'booking', 'tip'
  )),
  amount numeric NOT NULL,
  target_id uuid,
  target_type text,
  purchase_frequency text,
  average_transaction_value numeric,
  total_lifetime_value numeric,
  last_purchase_at timestamptz,
  next_predicted_purchase timestamptz,
  churn_risk_score numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Search history for targeting
CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  search_query text NOT NULL,
  search_type text CHECK (search_type IN ('musician', 'venue', 'event', 'genre', 'location')),
  filters_applied jsonb DEFAULT '{}'::jsonb,
  results_count integer,
  result_clicked uuid,
  session_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_behavior_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_behavior_events
CREATE POLICY "Users can view own behavior events"
  ON user_behavior_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own behavior events"
  ON user_behavior_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for recommendation_queue
CREATE POLICY "Users can view own recommendations"
  ON recommendation_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON recommendation_queue FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can create recommendations"
  ON recommendation_queue FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for recommendation_clicks
CREATE POLICY "Users can view own recommendation clicks"
  ON recommendation_clicks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can track own recommendation clicks"
  ON recommendation_clicks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for purchase_patterns
CREATE POLICY "Users can view own purchase patterns"
  ON purchase_patterns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for search_history
CREATE POLICY "Users can view own search history"
  ON search_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can create search history"
  ON search_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_behavior_events_user ON user_behavior_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_events_type ON user_behavior_events(event_type, event_category);
CREATE INDEX IF NOT EXISTS idx_behavior_events_target ON user_behavior_events(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_behavior_events_session ON user_behavior_events(session_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommendation_queue(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_type ON recommendation_queue(recommendation_type, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_expires ON recommendation_queue(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recommendation_clicks_rec ON recommendation_clicks(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_purchase_patterns_user ON purchase_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(search_query);

-- Function to update user preferences based on behavior
CREATE OR REPLACE FUNCTION analyze_user_preferences()
RETURNS void AS $$
BEGIN
  INSERT INTO user_preferences (user_id, last_analyzed_at)
  SELECT DISTINCT user_id, now()
  FROM user_behavior_events
  WHERE user_id NOT IN (SELECT user_id FROM user_preferences)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE user_preferences up
  SET 
    engagement_score = (
      SELECT COUNT(*)::numeric / NULLIF(EXTRACT(days FROM (now() - MIN(created_at))), 0)
      FROM user_behavior_events
      WHERE user_id = up.user_id
    ),
    last_analyzed_at = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate likelihood to purchase
CREATE OR REPLACE FUNCTION calculate_purchase_likelihood(p_user_id uuid)
RETURNS numeric AS $$
DECLARE
  v_event_count integer;
  v_purchase_count integer;
  v_recent_activity integer;
  v_likelihood numeric;
BEGIN
  SELECT COUNT(*) INTO v_event_count
  FROM user_behavior_events
  WHERE user_id = p_user_id
    AND created_at > now() - interval '30 days';

  SELECT COUNT(*) INTO v_purchase_count
  FROM user_behavior_events
  WHERE user_id = p_user_id
    AND event_category = 'transaction'
    AND created_at > now() - interval '90 days';

  SELECT COUNT(*) INTO v_recent_activity
  FROM user_behavior_events
  WHERE user_id = p_user_id
    AND created_at > now() - interval '7 days';

  v_likelihood := LEAST(1.0, (
    (v_purchase_count::numeric / NULLIF(v_event_count, 0) * 0.4) +
    (v_recent_activity::numeric / 100 * 0.3) +
    (CASE WHEN v_purchase_count > 0 THEN 0.3 ELSE 0 END)
  ));

  UPDATE user_preferences
  SET likelihood_to_purchase = COALESCE(v_likelihood, 0)
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_likelihood, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate revenue recommendations
CREATE OR REPLACE FUNCTION generate_revenue_recommendations()
RETURNS void AS $$
BEGIN
  INSERT INTO recommendation_queue (
    user_id,
    recommendation_type,
    target_id,
    target_type,
    title,
    description,
    recommendation_reason,
    confidence_score,
    priority_score,
    expected_revenue,
    expires_at
  )
  SELECT DISTINCT
    ube.user_id,
    'event',
    e.id,
    'event',
    e.title,
    'Based on your recent activity, you might enjoy this event',
    'Viewed similar events recently',
    0.7 + (RANDOM() * 0.3),
    0.8,
    e.ticket_price * 1.5,
    now() + interval '7 days'
  FROM user_behavior_events ube
  JOIN events e ON e.genres && (
    SELECT COALESCE(favorite_genres, ARRAY[]::text[])
    FROM user_preferences
    WHERE user_id = ube.user_id
  )
  WHERE ube.event_type = 'event_view'
    AND ube.created_at > now() - interval '7 days'
    AND ube.user_id NOT IN (
      SELECT user_id
      FROM recommendation_queue
      WHERE target_id = e.id
        AND created_at > now() - interval '24 hours'
    )
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
