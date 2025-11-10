/*
  # Create GigM8 Token Infrastructure

  1. New Tables
    - `token_config`
      - Global configuration for GigM8 token
      - Contract address, decimals, exchange rates

    - `token_balances`
      - Track GigM8 token balance for each user
      - Integrated with profiles

    - `token_transactions`
      - Complete history of all token movements
      - Tracks: transfers, rewards, payments, purchases

    - `token_exchange_rates`
      - Historical exchange rate tracking
      - USD to GigM8 conversion rates over time

    - `wallet_connections`
      - Links Solana wallets to user accounts
      - Multiple wallets per user supported

  2. Token Features
    - Dual-currency support (USD + GigM8)
    - Automatic balance tracking
    - Transaction logging
    - Exchange rate history
    - Reward distribution tracking

  3. Security
    - Enable RLS on all tables
    - Users can only view their own balances/transactions
    - Admin-only access to config and rates

  4. Indexes
    - Optimized for balance lookups
    - Fast transaction history queries
*/

-- Token configuration table (single row, admin managed)
CREATE TABLE IF NOT EXISTS token_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_name text DEFAULT 'GigM8' NOT NULL,
  token_symbol text DEFAULT 'GM8' NOT NULL,
  contract_address text,
  decimals integer DEFAULT 9 NOT NULL,
  current_usd_rate numeric(20, 10) DEFAULT 0.10 NOT NULL,
  treasury_wallet_address text,
  rewards_wallet_address text,
  is_active boolean DEFAULT false,
  total_supply bigint,
  circulating_supply bigint DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default config
INSERT INTO token_config (id, token_name, token_symbol, decimals, current_usd_rate, is_active)
VALUES (gen_random_uuid(), 'GigM8', 'GM8', 9, 0.10, false)
ON CONFLICT DO NOTHING;

-- Add token balance to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gigm8_balance bigint DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gigm8_earned_total bigint DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gigm8_spent_total bigint DEFAULT 0;

-- Token transactions table
CREATE TABLE IF NOT EXISTS token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  to_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  transaction_type text NOT NULL CHECK (transaction_type IN (
    'referral_reward',
    'event_reward',
    'booking_payment',
    'ticket_purchase',
    'merchandise_purchase',
    'subscription_payment',
    'staking_deposit',
    'staking_withdrawal',
    'platform_fee',
    'admin_grant',
    'transfer'
  )),
  reference_id uuid,
  reference_type text CHECK (reference_type IN ('booking', 'ticket', 'product', 'subscription', 'referral')),
  usd_value_at_transaction numeric(12, 2),
  exchange_rate_at_transaction numeric(20, 10),
  blockchain_tx_hash text,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Exchange rate history
CREATE TABLE IF NOT EXISTS token_exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate numeric(20, 10) NOT NULL,
  source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);

-- Wallet connections
CREATE TABLE IF NOT EXISTS wallet_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  wallet_address text NOT NULL,
  wallet_type text DEFAULT 'solana' CHECK (wallet_type IN ('solana', 'phantom', 'solflare', 'other')),
  is_primary boolean DEFAULT false,
  verified boolean DEFAULT false,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_token_transactions_from_user ON token_transactions(from_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_transactions_to_user ON token_transactions(to_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON token_transactions(transaction_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_transactions_reference ON token_transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_wallet_connections_user ON wallet_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_connections_address ON wallet_connections(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profiles_balance ON profiles(gigm8_balance) WHERE gigm8_balance > 0;

-- Enable RLS
ALTER TABLE token_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for token_config
CREATE POLICY "Anyone can view token config"
  ON token_config FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can modify token config"
  ON token_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for token_transactions
CREATE POLICY "Users can view their own transactions"
  ON token_transactions FOR SELECT
  TO authenticated
  USING (
    from_user_id = auth.uid() OR to_user_id = auth.uid()
  );

CREATE POLICY "System can insert transactions"
  ON token_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for token_exchange_rates
CREATE POLICY "Anyone can view exchange rates"
  ON token_exchange_rates FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can modify exchange rates"
  ON token_exchange_rates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for wallet_connections
CREATE POLICY "Users can view their own wallets"
  ON wallet_connections FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own wallets"
  ON wallet_connections FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to update token balance
CREATE OR REPLACE FUNCTION update_token_balance(
  p_user_id uuid,
  p_amount bigint,
  p_transaction_type text
)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET
    gigm8_balance = GREATEST(0, gigm8_balance + p_amount),
    gigm8_earned_total = CASE
      WHEN p_amount > 0 THEN gigm8_earned_total + p_amount
      ELSE gigm8_earned_total
    END,
    gigm8_spent_total = CASE
      WHEN p_amount < 0 THEN gigm8_spent_total + ABS(p_amount)
      ELSE gigm8_spent_total
    END
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process token transaction
CREATE OR REPLACE FUNCTION process_token_transaction(
  p_from_user_id uuid,
  p_to_user_id uuid,
  p_amount bigint,
  p_transaction_type text,
  p_reference_id uuid DEFAULT NULL,
  p_reference_type text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_transaction_id uuid;
  v_current_rate numeric(20, 10);
  v_usd_value numeric(12, 2);
BEGIN
  SELECT current_usd_rate INTO v_current_rate FROM token_config LIMIT 1;
  v_usd_value := (p_amount::numeric / 1000000000) * v_current_rate;

  INSERT INTO token_transactions (
    from_user_id,
    to_user_id,
    amount,
    transaction_type,
    reference_id,
    reference_type,
    usd_value_at_transaction,
    exchange_rate_at_transaction,
    notes,
    status
  ) VALUES (
    p_from_user_id,
    p_to_user_id,
    p_amount,
    p_transaction_type,
    p_reference_id,
    p_reference_type,
    v_usd_value,
    v_current_rate,
    p_notes,
    'completed'
  ) RETURNING id INTO v_transaction_id;

  IF p_from_user_id IS NOT NULL THEN
    PERFORM update_token_balance(p_from_user_id, -p_amount, p_transaction_type);
  END IF;

  IF p_to_user_id IS NOT NULL THEN
    PERFORM update_token_balance(p_to_user_id, p_amount, p_transaction_type);
  END IF;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award referral tokens
CREATE OR REPLACE FUNCTION award_referral_tokens()
RETURNS TRIGGER AS $$
DECLARE
  v_token_amount bigint;
  v_referrer_role text;
BEGIN
  IF NEW.referrer_id IS NULL OR NEW.referrer_tokens_awarded = true THEN
    RETURN NEW;
  END IF;

  SELECT role INTO v_referrer_role FROM profiles WHERE id = NEW.id;

  v_token_amount := CASE v_referrer_role
    WHEN 'musician' THEN 25000000000
    WHEN 'venue' THEN 50000000000
    WHEN 'fan' THEN 10000000000
    WHEN 'consumer' THEN 10000000000
    ELSE 10000000000
  END;

  PERFORM process_token_transaction(
    NULL,
    NEW.referrer_id,
    v_token_amount,
    'referral_reward',
    NEW.id,
    'referral',
    'Referral reward for signing up ' || NEW.id::text
  );

  UPDATE profiles
  SET referrer_tokens_awarded = true
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to award referral tokens
DROP TRIGGER IF EXISTS award_referral_tokens_trigger ON profiles;
CREATE TRIGGER award_referral_tokens_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION award_referral_tokens();

-- Function to convert USD to tokens
CREATE OR REPLACE FUNCTION usd_to_tokens(usd_amount numeric)
RETURNS bigint AS $$
DECLARE
  v_rate numeric(20, 10);
BEGIN
  SELECT current_usd_rate INTO v_rate FROM token_config LIMIT 1;
  RETURN FLOOR((usd_amount / v_rate) * 1000000000);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to convert tokens to USD
CREATE OR REPLACE FUNCTION tokens_to_usd(token_amount bigint)
RETURNS numeric AS $$
DECLARE
  v_rate numeric(20, 10);
BEGIN
  SELECT current_usd_rate INTO v_rate FROM token_config LIMIT 1;
  RETURN ROUND((token_amount::numeric / 1000000000) * v_rate, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- Add column to track token payments on existing tables
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_with_tokens boolean DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS token_amount bigint;

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS paid_with_tokens boolean DEFAULT false;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS token_amount bigint;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS paid_with_tokens boolean DEFAULT false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS token_amount bigint;

-- Add token flag to referrals
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referrer_tokens_awarded boolean DEFAULT false;
