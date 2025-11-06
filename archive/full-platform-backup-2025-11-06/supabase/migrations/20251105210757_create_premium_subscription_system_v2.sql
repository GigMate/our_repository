/*
  # Create Premium Subscription System
  
  1. New Tables
    - `subscription_plans`
      - `id` (uuid, primary key)
      - `plan_name` (text) - 'free', 'pro', 'business'
      - `display_name` (text) - 'Free Forever', 'GigMate Pro', 'GigMate Business'
      - `price_monthly` (numeric)
      - `price_yearly` (numeric) - discounted annual price
      - `transaction_fee_percentage` (numeric) - reduced fees for higher tiers
      - `features` (jsonb) - feature flags and limits
      - `stripe_price_id_monthly` (text)
      - `stripe_price_id_yearly` (text)
      - `active` (boolean)
      - `created_at` (timestamptz)
    
    - `user_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `plan_id` (uuid, references subscription_plans)
      - `status` (text) - 'active', 'canceled', 'past_due', 'trialing'
      - `billing_cycle` (text) - 'monthly', 'yearly'
      - `current_period_start` (timestamptz)
      - `current_period_end` (timestamptz)
      - `cancel_at_period_end` (boolean)
      - `stripe_subscription_id` (text)
      - `stripe_customer_id` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `subscription_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid)
      - `plan_name` (text)
      - `action` (text) - 'subscribed', 'upgraded', 'downgraded', 'canceled', 'renewed'
      - `billing_cycle` (text)
      - `amount_paid` (numeric)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)
    
    - `feature_usage`
      - `id` (uuid, primary key)
      - `user_id` (uuid)
      - `feature_name` (text) - 'image_uploads', 'email_blasts', 'api_calls'
      - `usage_count` (integer)
      - `limit_count` (integer)
      - `period_start` (date)
      - `period_end` (date)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Users can read their own subscription data
    - Only system can modify subscription data
    - Public can read plan information
  
  3. Functions
    - `get_user_subscription_plan()` - Returns user's current plan with features
    - `check_feature_access()` - Validates if user can access a feature
    - `track_feature_usage()` - Increments usage counter
    - `upsert_user_subscription()` - Handles plan changes
    - `cancel_user_subscription()` - Cancels at period end
  
  4. Revenue Analytics
    - Create views for MRR, churn, upgrades
    - Daily/monthly subscription metrics
*/

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric NOT NULL DEFAULT 0,
  transaction_fee_percentage numeric NOT NULL DEFAULT 10.0,
  ticket_fee_percentage numeric NOT NULL DEFAULT 12.5,
  features jsonb DEFAULT '{}'::jsonb,
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) NOT NULL,
  status text NOT NULL DEFAULT 'active',
  billing_cycle text DEFAULT 'monthly',
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamptz,
  stripe_subscription_id text,
  stripe_customer_id text,
  trial_ends_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('monthly', 'yearly'))
);

-- Create subscription history table
CREATE TABLE IF NOT EXISTS subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_name text NOT NULL,
  action text NOT NULL,
  billing_cycle text,
  amount_paid numeric DEFAULT 0,
  previous_plan text,
  new_plan text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_action CHECK (action IN ('subscribed', 'upgraded', 'downgraded', 'canceled', 'renewed', 'reactivated', 'expired'))
);

-- Create feature usage tracking table
CREATE TABLE IF NOT EXISTS feature_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  feature_name text NOT NULL,
  usage_count integer DEFAULT 0,
  limit_count integer DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, feature_name, period_start)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period_end ON user_subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created_at ON subscription_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_feature ON feature_usage(user_id, feature_name);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (public read)
CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans FOR SELECT
  USING (active = true);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions"
  ON user_subscriptions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for subscription_history
CREATE POLICY "Users can view own subscription history"
  ON subscription_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for feature_usage
CREATE POLICY "Users can view own feature usage"
  ON feature_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can track feature usage"
  ON feature_usage FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert default subscription plans
INSERT INTO subscription_plans (plan_name, display_name, description, price_monthly, price_yearly, transaction_fee_percentage, ticket_fee_percentage, features, sort_order) VALUES
(
  'free',
  'Free Forever',
  'Perfect for getting started',
  0,
  0,
  10.0,
  12.5,
  '{
    "image_uploads": 25,
    "featured_placement": false,
    "verified_badge": false,
    "advanced_analytics": false,
    "custom_url": false,
    "priority_support": false,
    "email_blasts": 0,
    "api_access": false,
    "multi_user_accounts": false,
    "white_label_widget": false,
    "unlimited_images": false
  }'::jsonb,
  1
),
(
  'pro',
  'GigMate Pro',
  'For serious musicians and venues',
  19.99,
  199.00,
  10.0,
  12.5,
  '{
    "image_uploads": -1,
    "featured_placement": true,
    "verified_badge": true,
    "advanced_analytics": true,
    "custom_url": true,
    "priority_support": true,
    "email_blasts": 1,
    "api_access": false,
    "multi_user_accounts": false,
    "white_label_widget": false,
    "unlimited_images": true
  }'::jsonb,
  2
),
(
  'business',
  'GigMate Business',
  'For venues, agencies, and promoters',
  49.99,
  499.00,
  7.5,
  12.5,
  '{
    "image_uploads": -1,
    "featured_placement": true,
    "verified_badge": true,
    "advanced_analytics": true,
    "custom_url": true,
    "priority_support": true,
    "email_blasts": 4,
    "api_access": true,
    "multi_user_accounts": true,
    "white_label_widget": true,
    "unlimited_images": true
  }'::jsonb,
  3
)
ON CONFLICT (plan_name) DO NOTHING;

-- Function to get user's current subscription with features
CREATE OR REPLACE FUNCTION get_user_subscription_plan(p_user_id uuid)
RETURNS TABLE (
  plan_name text,
  display_name text,
  features jsonb,
  status text,
  expires_at timestamptz,
  transaction_fee_percentage numeric,
  ticket_fee_percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.plan_name,
    sp.display_name,
    sp.features,
    COALESCE(us.status, 'active') as status,
    us.current_period_end as expires_at,
    sp.transaction_fee_percentage,
    sp.ticket_fee_percentage
  FROM subscription_plans sp
  LEFT JOIN user_subscriptions us ON us.plan_id = sp.id AND us.user_id = p_user_id
  WHERE us.user_id = p_user_id 
     OR (us.user_id IS NULL AND sp.plan_name = 'free')
  ORDER BY sp.sort_order DESC
  LIMIT 1;
END;
$$;

-- Function to check if user has access to a feature
CREATE OR REPLACE FUNCTION check_feature_access(
  p_user_id uuid,
  p_feature_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_access boolean;
  v_features jsonb;
  v_feature_value jsonb;
BEGIN
  -- Get user's plan features
  SELECT features INTO v_features
  FROM subscription_plans sp
  LEFT JOIN user_subscriptions us ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id
     OR (us.user_id IS NULL AND sp.plan_name = 'free')
  ORDER BY sp.sort_order DESC
  LIMIT 1;
  
  -- Check if feature exists and is enabled
  v_feature_value := v_features -> p_feature_name;
  
  IF v_feature_value IS NULL THEN
    RETURN false;
  END IF;
  
  -- If boolean, return directly
  IF jsonb_typeof(v_feature_value) = 'boolean' THEN
    RETURN (v_feature_value)::text::boolean;
  END IF;
  
  -- If number, check if it's > 0 or -1 (unlimited)
  IF jsonb_typeof(v_feature_value) = 'number' THEN
    RETURN (v_feature_value)::text::numeric != 0;
  END IF;
  
  RETURN false;
END;
$$;

-- Function to track feature usage
CREATE OR REPLACE FUNCTION track_feature_usage(
  p_user_id uuid,
  p_feature_name text,
  p_increment integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer;
  v_current_usage integer;
  v_period_start date;
  v_period_end date;
BEGIN
  -- Get current period (monthly)
  v_period_start := date_trunc('month', CURRENT_DATE);
  v_period_end := (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date;
  
  -- Get feature limit from user's plan
  SELECT (features -> p_feature_name)::text::integer INTO v_limit
  FROM subscription_plans sp
  LEFT JOIN user_subscriptions us ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id
     OR (us.user_id IS NULL AND sp.plan_name = 'free')
  ORDER BY sp.sort_order DESC
  LIMIT 1;
  
  -- If unlimited (-1), allow
  IF v_limit = -1 THEN
    RETURN true;
  END IF;
  
  -- Get or create usage record
  INSERT INTO feature_usage (user_id, feature_name, usage_count, limit_count, period_start, period_end)
  VALUES (p_user_id, p_feature_name, 0, v_limit, v_period_start, v_period_end)
  ON CONFLICT (user_id, feature_name, period_start)
  DO NOTHING;
  
  -- Get current usage
  SELECT usage_count INTO v_current_usage
  FROM feature_usage
  WHERE user_id = p_user_id 
    AND feature_name = p_feature_name 
    AND period_start = v_period_start;
  
  -- Check if under limit
  IF v_current_usage + p_increment > v_limit THEN
    RETURN false;
  END IF;
  
  -- Increment usage
  UPDATE feature_usage
  SET usage_count = usage_count + p_increment,
      updated_at = now()
  WHERE user_id = p_user_id 
    AND feature_name = p_feature_name 
    AND period_start = v_period_start;
  
  RETURN true;
END;
$$;

-- Function to create or upgrade subscription
CREATE OR REPLACE FUNCTION upsert_user_subscription(
  p_user_id uuid,
  p_plan_name text,
  p_billing_cycle text DEFAULT 'monthly',
  p_stripe_subscription_id text DEFAULT NULL,
  p_stripe_customer_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id uuid;
  v_subscription_id uuid;
  v_previous_plan text;
  v_action text;
  v_amount numeric;
  v_period_end timestamptz;
BEGIN
  -- Get plan ID and price
  SELECT id, 
         CASE WHEN p_billing_cycle = 'yearly' THEN price_yearly ELSE price_monthly END
  INTO v_plan_id, v_amount
  FROM subscription_plans
  WHERE plan_name = p_plan_name AND active = true;
  
  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Invalid plan name: %', p_plan_name;
  END IF;
  
  -- Calculate period end
  v_period_end := CASE 
    WHEN p_billing_cycle = 'yearly' THEN now() + interval '1 year'
    ELSE now() + interval '1 month'
  END;
  
  -- Get previous plan for history
  SELECT sp.plan_name INTO v_previous_plan
  FROM user_subscriptions us
  JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = p_user_id;
  
  -- Determine action
  IF v_previous_plan IS NULL THEN
    v_action := 'subscribed';
  ELSIF v_previous_plan = 'free' AND p_plan_name != 'free' THEN
    v_action := 'upgraded';
  ELSIF v_previous_plan != 'free' AND p_plan_name = 'free' THEN
    v_action := 'downgraded';
  ELSE
    v_action := 'upgraded';
  END IF;
  
  -- Upsert subscription
  INSERT INTO user_subscriptions (
    user_id, 
    plan_id, 
    status, 
    billing_cycle, 
    current_period_start,
    current_period_end,
    stripe_subscription_id,
    stripe_customer_id
  )
  VALUES (
    p_user_id,
    v_plan_id,
    'active',
    p_billing_cycle,
    now(),
    v_period_end,
    p_stripe_subscription_id,
    p_stripe_customer_id
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    plan_id = v_plan_id,
    status = 'active',
    billing_cycle = p_billing_cycle,
    current_period_start = now(),
    current_period_end = v_period_end,
    cancel_at_period_end = false,
    canceled_at = NULL,
    stripe_subscription_id = COALESCE(p_stripe_subscription_id, user_subscriptions.stripe_subscription_id),
    stripe_customer_id = COALESCE(p_stripe_customer_id, user_subscriptions.stripe_customer_id),
    updated_at = now()
  RETURNING id INTO v_subscription_id;
  
  -- Record in history
  INSERT INTO subscription_history (
    user_id,
    plan_name,
    action,
    billing_cycle,
    amount_paid,
    previous_plan,
    new_plan
  ) VALUES (
    p_user_id,
    p_plan_name,
    v_action,
    p_billing_cycle,
    v_amount,
    v_previous_plan,
    p_plan_name
  );
  
  RETURN v_subscription_id;
END;
$$;

-- Function to cancel subscription
CREATE OR REPLACE FUNCTION cancel_user_subscription(
  p_user_id uuid,
  p_immediate boolean DEFAULT false
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_name text;
BEGIN
  -- Get current plan
  SELECT sp.plan_name INTO v_plan_name
  FROM user_subscriptions us
  JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = p_user_id;
  
  IF p_immediate THEN
    -- Cancel immediately - downgrade to free
    UPDATE user_subscriptions
    SET status = 'canceled',
        canceled_at = now(),
        cancel_at_period_end = false,
        plan_id = (SELECT id FROM subscription_plans WHERE plan_name = 'free'),
        updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    -- Cancel at period end
    UPDATE user_subscriptions
    SET cancel_at_period_end = true,
        canceled_at = now(),
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
  
  -- Record in history
  INSERT INTO subscription_history (user_id, plan_name, action, previous_plan, new_plan)
  VALUES (p_user_id, v_plan_name, 'canceled', v_plan_name, 'free');
  
  RETURN true;
END;
$$;

-- Create view for subscription revenue analytics
CREATE OR REPLACE VIEW subscription_revenue_summary AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  plan_name,
  billing_cycle,
  action,
  COUNT(*) as transaction_count,
  SUM(amount_paid) as revenue,
  SUM(CASE WHEN action = 'subscribed' THEN amount_paid ELSE 0 END) as new_subscriber_revenue,
  SUM(CASE WHEN action = 'upgraded' THEN amount_paid ELSE 0 END) as upgrade_revenue,
  SUM(CASE WHEN action = 'renewed' THEN amount_paid ELSE 0 END) as renewal_revenue
FROM subscription_history
WHERE amount_paid > 0
GROUP BY DATE_TRUNC('day', created_at), plan_name, billing_cycle, action
ORDER BY date DESC;

-- Create view for MRR (Monthly Recurring Revenue)
CREATE OR REPLACE VIEW monthly_recurring_revenue AS
SELECT 
  sp.plan_name,
  sp.display_name,
  sp.price_monthly,
  sp.sort_order,
  COUNT(us.id) as active_subscribers,
  COUNT(us.id) * sp.price_monthly as mrr,
  COUNT(CASE WHEN us.cancel_at_period_end THEN 1 END) as churning_subscribers
FROM subscription_plans sp
LEFT JOIN user_subscriptions us ON us.plan_id = sp.id AND us.status = 'active'
WHERE sp.plan_name != 'free'
GROUP BY sp.plan_name, sp.display_name, sp.price_monthly, sp.sort_order
ORDER BY sp.sort_order;

-- Initialize all existing users with free plan
INSERT INTO user_subscriptions (user_id, plan_id, status)
SELECT 
  p.id,
  (SELECT id FROM subscription_plans WHERE plan_name = 'free'),
  'active'
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM user_subscriptions WHERE user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Add helpful comments
COMMENT ON TABLE subscription_plans IS 'Available subscription tiers with features and pricing';
COMMENT ON TABLE user_subscriptions IS 'Active user subscriptions and billing information';
COMMENT ON TABLE subscription_history IS 'Audit trail of all subscription changes';
COMMENT ON TABLE feature_usage IS 'Tracks usage against plan limits';
COMMENT ON FUNCTION get_user_subscription_plan IS 'Returns user current plan with all features';
COMMENT ON FUNCTION check_feature_access IS 'Validates if user can access a premium feature';
COMMENT ON FUNCTION track_feature_usage IS 'Increments usage counter and enforces limits';
COMMENT ON VIEW monthly_recurring_revenue IS 'MRR broken down by plan';
