/*
  # GigMate Credit Economy System

  1. New Tables
    - `user_credits` - Credit balances and history
    - `credit_transactions` - All credit movements
    - `credit_packages` - Purchasable credit packages
    - `message_credits` - Track credit costs per message
    - `promotional_credits` - Bonus/promo credit tracking
  
  2. Features
    - Credit purchase and management
    - Message cost calculation
    - Credit rollover rules by tier
    - Promotional credit system
    - Transaction history
    - Audit trail
  
  3. Security
    - Enable RLS on all tables
    - Prevent negative balances
    - Audit all transactions
    - Fraud detection ready
*/

-- User credit balances
CREATE TABLE IF NOT EXISTS user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance integer DEFAULT 0 CHECK (balance >= 0),
  monthly_allocation integer DEFAULT 0,
  rollover_balance integer DEFAULT 0,
  max_rollover integer DEFAULT 0,
  total_purchased integer DEFAULT 0,
  total_earned integer DEFAULT 0,
  total_spent integer DEFAULT 0,
  last_monthly_reset timestamptz,
  subscription_tier text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Credit transaction log
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN (
    'purchase', 'monthly_allocation', 'spent', 'refund', 
    'promotional', 'bonus', 'rollover', 'expired'
  )),
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  reason text NOT NULL,
  related_entity_type text CHECK (related_entity_type IN (
    'message', 'profile_action', 'search', 'promotion', 'subscription', 'purchase'
  )),
  related_entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Credit packages for purchase
CREATE TABLE IF NOT EXISTS credit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  credits integer NOT NULL,
  price_cents integer NOT NULL,
  bonus_credits integer DEFAULT 0,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  popular boolean DEFAULT false,
  best_value boolean DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Message credit costs tracking
CREATE TABLE IF NOT EXISTS message_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  credit_cost integer NOT NULL,
  message_type text NOT NULL CHECK (message_type IN (
    'initial_contact', 'reply', 'media_attachment', 'priority', 
    'booking_request', 'contract_share', 'broadcast'
  )),
  sender_type text NOT NULL,
  recipient_type text NOT NULL,
  was_free boolean DEFAULT false,
  reason_for_cost text,
  created_at timestamptz DEFAULT now()
);

-- Promotional credits
CREATE TABLE IF NOT EXISTS promotional_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  credits integer NOT NULL,
  description text,
  max_uses integer,
  times_used integer DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  user_restrictions text[] DEFAULT ARRAY[]::text[],
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Track who used which promo codes
CREATE TABLE IF NOT EXISTS promotional_credit_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id uuid REFERENCES promotional_credits(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  credits_awarded integer NOT NULL,
  used_at timestamptz DEFAULT now(),
  UNIQUE(promo_id, user_id)
);

-- Enable RLS
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotional_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotional_credit_uses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_credits
CREATE POLICY "Users can view own credit balance"
  ON user_credits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage credits"
  ON user_credits FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view own credit transactions"
  ON credit_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can log credit transactions"
  ON credit_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for credit_packages
CREATE POLICY "Anyone can view active credit packages"
  ON credit_packages FOR SELECT
  USING (is_active = true);

-- RLS Policies for message_credits
CREATE POLICY "Users can view own message credit costs"
  ON message_credits FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "System can log message credit costs"
  ON message_credits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- RLS Policies for promotional_credits
CREATE POLICY "Anyone can view active promo codes"
  ON promotional_credits FOR SELECT
  USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- RLS Policies for promotional_credit_uses
CREATE POLICY "Users can view own promo uses"
  ON promotional_credit_uses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can redeem promos"
  ON promotional_credit_uses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_credits_user ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_message_credits_sender ON message_credits(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_credits_message ON message_credits(message_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes ON promotional_credits(code) WHERE is_active = true;

-- Insert default credit packages
INSERT INTO credit_packages (name, credits, price_cents, bonus_credits, display_order, description) VALUES
  ('Starter Pack', 25, 499, 0, 1, 'Perfect for trying out premium features'),
  ('Value Pack', 100, 1499, 10, 2, 'Best for regular users'),
  ('Power Pack', 250, 2999, 50, 3, 'Great value for active users'),
  ('Ultimate Pack', 1000, 9999, 250, 4, 'For power users and venues')
ON CONFLICT DO NOTHING;

-- Mark popular and best value
UPDATE credit_packages SET popular = true WHERE credits = 100;
UPDATE credit_packages SET best_value = true WHERE credits = 250;

-- Function to initialize user credits based on subscription tier
CREATE OR REPLACE FUNCTION initialize_user_credits(p_user_id uuid, p_tier text)
RETURNS void AS $$
DECLARE
  v_allocation integer;
  v_max_rollover integer;
BEGIN
  v_allocation := CASE p_tier
    WHEN 'bronze' THEN 50
    WHEN 'silver' THEN 150
    WHEN 'gold' THEN 500
    ELSE 10
  END;
  
  v_max_rollover := CASE p_tier
    WHEN 'bronze' THEN 25
    WHEN 'silver' THEN 75
    WHEN 'gold' THEN 250
    ELSE 0
  END;
  
  INSERT INTO user_credits (
    user_id, 
    balance, 
    monthly_allocation, 
    max_rollover,
    subscription_tier,
    last_monthly_reset
  ) VALUES (
    p_user_id,
    v_allocation,
    v_allocation,
    v_max_rollover,
    p_tier,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    monthly_allocation = v_allocation,
    max_rollover = v_max_rollover,
    subscription_tier = p_tier,
    updated_at = now();
    
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    reason
  ) VALUES (
    p_user_id,
    'monthly_allocation',
    v_allocation,
    v_allocation,
    'Initial monthly allocation for ' || p_tier || ' tier'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to spend credits
CREATE OR REPLACE FUNCTION spend_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_current_balance integer;
  v_new_balance integer;
BEGIN
  SELECT balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'User credit account not found';
  END IF;
  
  IF v_current_balance < p_amount THEN
    RETURN false;
  END IF;
  
  v_new_balance := v_current_balance - p_amount;
  
  UPDATE user_credits
  SET 
    balance = v_new_balance,
    total_spent = total_spent + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    reason,
    related_entity_type,
    related_entity_id
  ) VALUES (
    p_user_id,
    'spent',
    -p_amount,
    v_new_balance,
    p_reason,
    p_entity_type,
    p_entity_id
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits (purchase or promotion)
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id uuid,
  p_amount integer,
  p_transaction_type text,
  p_reason text
)
RETURNS void AS $$
DECLARE
  v_new_balance integer;
BEGIN
  UPDATE user_credits
  SET 
    balance = balance + p_amount,
    total_purchased = CASE 
      WHEN p_transaction_type = 'purchase' THEN total_purchased + p_amount
      ELSE total_purchased
    END,
    total_earned = CASE
      WHEN p_transaction_type IN ('promotional', 'bonus') THEN total_earned + p_amount
      ELSE total_earned
    END,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    reason
  ) VALUES (
    p_user_id,
    p_transaction_type,
    p_amount,
    v_new_balance,
    p_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle monthly credit reset with rollover
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void AS $$
DECLARE
  v_user record;
  v_rollover integer;
  v_new_balance integer;
BEGIN
  FOR v_user IN 
    SELECT user_id, balance, monthly_allocation, max_rollover
    FROM user_credits
    WHERE last_monthly_reset < date_trunc('month', now())
  LOOP
    v_rollover := LEAST(v_user.balance, v_user.max_rollover);
    v_new_balance := v_user.monthly_allocation + v_rollover;
    
    UPDATE user_credits
    SET 
      balance = v_new_balance,
      rollover_balance = v_rollover,
      last_monthly_reset = now(),
      updated_at = now()
    WHERE user_id = v_user.user_id;
    
    INSERT INTO credit_transactions (
      user_id,
      transaction_type,
      amount,
      balance_after,
      reason
    ) VALUES (
      v_user.user_id,
      'monthly_allocation',
      v_user.monthly_allocation,
      v_new_balance,
      'Monthly credit reset with ' || v_rollover || ' rollover credits'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate message cost
CREATE OR REPLACE FUNCTION calculate_message_cost(
  p_sender_type text,
  p_recipient_type text,
  p_message_type text
)
RETURNS integer AS $$
BEGIN
  RETURN CASE
    WHEN p_message_type = 'priority' THEN 5
    WHEN p_message_type = 'broadcast' THEN 10
    WHEN p_message_type = 'contract_share' THEN 2
    WHEN p_message_type = 'booking_request' THEN 3
    WHEN p_message_type = 'media_attachment' THEN 1
    WHEN p_message_type = 'initial_contact' AND p_sender_type IN ('musician', 'venue') AND p_recipient_type IN ('musician', 'venue') THEN 2
    WHEN p_message_type = 'initial_contact' AND p_sender_type = p_recipient_type THEN 1
    WHEN p_message_type = 'reply' AND p_sender_type IN ('musician', 'venue') AND p_recipient_type IN ('musician', 'venue') THEN 1
    WHEN p_message_type = 'reply' AND p_sender_type = p_recipient_type THEN 0
    WHEN p_sender_type = 'fan' AND p_recipient_type IN ('musician', 'venue') THEN 0
    WHEN p_recipient_type = 'fan' THEN 1
    ELSE 1
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
