/*
  # Beta Tester Lifetime Benefits

  1. Changes
    - Add is_lifetime_subscriber flag to user_subscriptions
    - Add beta_tester_discount_percentage to profiles
    - Grant all beta testers lifetime Pro membership
    - Apply 50% discount for Business tier upgrades
    - Track beta tester benefits in metadata

  2. Beta Tester Benefits
    - Lifetime "Pro" membership ($19.99/mo value = $239.88/year)
    - 50% discount on Business tier ($49.99/mo → $24.99/mo)
    - Beta Tester badge
    - 100 free credits ($50 value)
    - Priority support

  3. Security
    - Only system can modify lifetime subscription status
    - Beta testers automatically get benefits when flagged
*/

-- Add lifetime subscription flag
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' AND column_name = 'is_lifetime_subscriber'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN is_lifetime_subscriber boolean DEFAULT false;
    ALTER TABLE user_subscriptions ADD COLUMN lifetime_plan_name text;
    ALTER TABLE user_subscriptions ADD COLUMN discount_percentage numeric DEFAULT 0;
  END IF;
END $$;

-- Add beta tester benefits tracking to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'beta_tester_benefits_granted'
  ) THEN
    ALTER TABLE profiles ADD COLUMN beta_tester_benefits_granted boolean DEFAULT false;
    ALTER TABLE profiles ADD COLUMN beta_tester_since timestamptz;
  END IF;
END $$;

-- Create index for beta testers
CREATE INDEX IF NOT EXISTS idx_profiles_beta_tester_benefits ON profiles(is_beta_tester, beta_tester_benefits_granted) 
WHERE is_beta_tester = true;

-- Function to grant beta tester lifetime benefits
CREATE OR REPLACE FUNCTION grant_beta_tester_benefits(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_pro_plan_id uuid;
  v_result jsonb;
BEGIN
  -- Get Pro plan ID
  SELECT id INTO v_pro_plan_id
  FROM subscription_plans
  WHERE plan_name = 'pro' AND active = true;
  
  IF v_pro_plan_id IS NULL THEN
    RAISE EXCEPTION 'Pro plan not found';
  END IF;
  
  -- Update profile with beta tester info
  UPDATE profiles
  SET 
    beta_tester_benefits_granted = true,
    beta_tester_since = COALESCE(beta_tester_since, now())
  WHERE id = p_user_id;
  
  -- Grant lifetime Pro subscription
  INSERT INTO user_subscriptions (
    user_id,
    plan_id,
    status,
    billing_cycle,
    current_period_start,
    current_period_end,
    is_lifetime_subscriber,
    lifetime_plan_name,
    discount_percentage,
    metadata
  ) VALUES (
    p_user_id,
    v_pro_plan_id,
    'active',
    'yearly',
    now(),
    now() + interval '100 years',
    true,
    'pro',
    50.0,
    jsonb_build_object(
      'beta_tester', true,
      'lifetime_granted', now(),
      'reason', 'Beta Tester Reward',
      'business_discount', 50.0
    )
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    plan_id = v_pro_plan_id,
    status = 'active',
    is_lifetime_subscriber = true,
    lifetime_plan_name = 'pro',
    discount_percentage = 50.0,
    current_period_end = now() + interval '100 years',
    metadata = jsonb_build_object(
      'beta_tester', true,
      'lifetime_granted', now(),
      'reason', 'Beta Tester Reward',
      'business_discount', 50.0
    ),
    updated_at = now();
  
  -- Record in subscription history
  INSERT INTO subscription_history (
    user_id,
    plan_name,
    action,
    billing_cycle,
    amount_paid,
    metadata
  ) VALUES (
    p_user_id,
    'pro',
    'subscribed',
    'yearly',
    0,
    jsonb_build_object(
      'beta_tester_reward', true,
      'lifetime_subscription', true
    )
  );
  
  -- Grant 100 free credits
  INSERT INTO user_credits (user_id, balance, total_earned, earned_source)
  VALUES (
    p_user_id,
    100,
    100,
    'beta_tester_reward'
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = user_credits.balance + 100,
    total_earned = user_credits.total_earned + 100,
    updated_at = now();
  
  v_result := jsonb_build_object(
    'success', true,
    'benefits', jsonb_build_object(
      'lifetime_pro_subscription', true,
      'business_discount_percentage', 50.0,
      'credits_granted', 100,
      'total_value', '$289.88/year'
    )
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate subscription price with beta tester discount
CREATE OR REPLACE FUNCTION get_subscription_price_for_user(
  p_user_id uuid,
  p_plan_name text,
  p_billing_cycle text DEFAULT 'monthly'
)
RETURNS jsonb AS $$
DECLARE
  v_base_price numeric;
  v_discount_percentage numeric := 0;
  v_final_price numeric;
  v_is_beta_tester boolean;
  v_has_lifetime_pro boolean;
BEGIN
  -- Check if user is beta tester with lifetime pro
  SELECT 
    COALESCE(p.is_beta_tester, false),
    COALESCE(us.is_lifetime_subscriber AND us.lifetime_plan_name = 'pro', false)
  INTO v_is_beta_tester, v_has_lifetime_pro
  FROM profiles p
  LEFT JOIN user_subscriptions us ON us.user_id = p.id
  WHERE p.id = p_user_id;
  
  -- Get base price
  SELECT 
    CASE WHEN p_billing_cycle = 'yearly' THEN price_yearly ELSE price_monthly END
  INTO v_base_price
  FROM subscription_plans
  WHERE plan_name = p_plan_name AND active = true;
  
  -- If already has lifetime Pro and trying to subscribe to Pro, it's free
  IF v_has_lifetime_pro AND p_plan_name = 'pro' THEN
    RETURN jsonb_build_object(
      'plan_name', p_plan_name,
      'base_price', v_base_price,
      'discount_percentage', 100,
      'discount_amount', v_base_price,
      'final_price', 0,
      'message', 'You have lifetime Pro membership'
    );
  END IF;
  
  -- Apply beta tester discount for Business tier
  IF v_is_beta_tester AND p_plan_name = 'business' THEN
    v_discount_percentage := 50.0;
  END IF;
  
  v_final_price := v_base_price * (1 - v_discount_percentage / 100.0);
  
  RETURN jsonb_build_object(
    'plan_name', p_plan_name,
    'base_price', v_base_price,
    'discount_percentage', v_discount_percentage,
    'discount_amount', v_base_price - v_final_price,
    'final_price', v_final_price,
    'is_beta_tester', v_is_beta_tester,
    'has_lifetime_pro', v_has_lifetime_pro
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user needs beta tester benefits
CREATE OR REPLACE FUNCTION check_beta_tester_benefits_status(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_is_beta_tester boolean;
  v_benefits_granted boolean;
  v_result jsonb;
BEGIN
  SELECT 
    COALESCE(is_beta_tester, false),
    COALESCE(beta_tester_benefits_granted, false)
  INTO v_is_beta_tester, v_benefits_granted
  FROM profiles
  WHERE id = p_user_id;
  
  IF v_is_beta_tester AND NOT v_benefits_granted THEN
    -- Grant benefits automatically
    v_result := grant_beta_tester_benefits(p_user_id);
    RETURN v_result;
  ELSIF v_is_beta_tester AND v_benefits_granted THEN
    RETURN jsonb_build_object(
      'has_benefits', true,
      'message', 'Beta tester benefits already granted'
    );
  ELSE
    RETURN jsonb_build_object(
      'has_benefits', false,
      'message', 'Not a beta tester'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically grant benefits when user becomes beta tester
CREATE OR REPLACE FUNCTION trigger_grant_beta_benefits()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_beta_tester = true AND (OLD.is_beta_tester IS NULL OR OLD.is_beta_tester = false) THEN
    IF NEW.beta_tester_benefits_granted IS NULL OR NEW.beta_tester_benefits_granted = false THEN
      PERFORM grant_beta_tester_benefits(NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_grant_beta_benefits ON profiles;
CREATE TRIGGER auto_grant_beta_benefits
  AFTER INSERT OR UPDATE OF is_beta_tester ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_grant_beta_benefits();

-- Update get_user_subscription_plan to respect lifetime subscriptions
DROP FUNCTION IF EXISTS get_user_subscription_plan(uuid);
CREATE OR REPLACE FUNCTION get_user_subscription_plan(p_user_id uuid)
RETURNS TABLE (
  plan_name text,
  display_name text,
  features jsonb,
  status text,
  expires_at timestamptz,
  transaction_fee_percentage numeric,
  ticket_fee_percentage numeric,
  is_lifetime boolean,
  discount_percentage numeric
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
    sp.ticket_fee_percentage,
    COALESCE(us.is_lifetime_subscriber, false) as is_lifetime,
    COALESCE(us.discount_percentage, 0) as discount_percentage
  FROM subscription_plans sp
  LEFT JOIN user_subscriptions us ON us.plan_id = sp.id AND us.user_id = p_user_id
  WHERE us.user_id = p_user_id 
     OR (us.user_id IS NULL AND sp.plan_name = 'free')
  ORDER BY sp.sort_order DESC
  LIMIT 1;
END;
$$;

-- Grant benefits to all existing beta testers
DO $$
DECLARE
  v_beta_tester RECORD;
BEGIN
  FOR v_beta_tester IN 
    SELECT id 
    FROM profiles 
    WHERE is_beta_tester = true 
    AND (beta_tester_benefits_granted IS NULL OR beta_tester_benefits_granted = false)
  LOOP
    PERFORM grant_beta_tester_benefits(v_beta_tester.id);
  END LOOP;
END $$;

-- Add helpful comments
COMMENT ON COLUMN user_subscriptions.is_lifetime_subscriber IS 'True for beta testers with lifetime Pro membership';
COMMENT ON COLUMN user_subscriptions.discount_percentage IS 'Discount percentage for upgrades (50% for beta testers on Business)';
COMMENT ON FUNCTION grant_beta_tester_benefits IS 'Grants lifetime Pro membership and credits to beta testers';
COMMENT ON FUNCTION get_subscription_price_for_user IS 'Returns pricing with beta tester discounts applied';
