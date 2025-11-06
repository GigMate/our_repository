/*
  # Premium Fan Messaging System Enhancement

  1. Updates
    - Enhanced message_credits table for fan tier tracking
    - New messaging tiers for fans
    - Direct artist messaging premium feature
    - Fan-to-fan messaging tiers
  
  2. Features
    - Free venue inquiry for fans
    - Premium direct artist messaging
    - Tiered fan-to-fan messaging
    - Message unlock/pay-per-message
    - Bulk message packs for fans
  
  3. Revenue Model
    - Free: Venue inquiries, limited artist messages
    - Fan Premium ($4.99/mo): Direct artist access, unlimited venue
    - Fan VIP ($9.99/mo): Priority responses, unlimited messages
    - Pay-per-message: $0.99-2.99 per message
*/

-- Add fan messaging tiers to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'fan_messaging_tier'
  ) THEN
    ALTER TABLE profiles ADD COLUMN fan_messaging_tier text DEFAULT 'free' 
      CHECK (fan_messaging_tier IN ('free', 'premium', 'vip'));
  END IF;
END $$;

-- Add messaging unlock system
CREATE TABLE IF NOT EXISTS message_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  artist_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  unlock_type text NOT NULL CHECK (unlock_type IN (
    'single_message', 'conversation_24h', 'conversation_7day', 'unlimited'
  )),
  messages_remaining integer,
  expires_at timestamptz,
  price_paid_cents integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(fan_id, artist_id, unlock_type)
);

-- Track message unlock purchases
CREATE TABLE IF NOT EXISTS message_unlock_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  artist_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  unlock_type text NOT NULL,
  price_cents integer NOT NULL,
  payment_intent_id text,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded')),
  created_at timestamptz DEFAULT now()
);

-- Fan message packages
CREATE TABLE IF NOT EXISTS fan_message_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  message_count integer NOT NULL,
  price_cents integer NOT NULL,
  valid_days integer DEFAULT 30,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  best_value boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Fan message usage tracking
CREATE TABLE IF NOT EXISTS fan_message_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  artist_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message_id uuid NOT NULL,
  cost_type text NOT NULL CHECK (cost_type IN (
    'free_tier', 'premium_subscription', 'vip_subscription', 'pay_per_message', 'package', 'promotional'
  )),
  amount_paid_cents integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE message_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_unlock_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_message_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_message_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_unlocks
CREATE POLICY "Fans can view own message unlocks"
  ON message_unlocks FOR SELECT
  TO authenticated
  USING (auth.uid() = fan_id);

CREATE POLICY "Fans can manage own message unlocks"
  ON message_unlocks FOR ALL
  TO authenticated
  USING (auth.uid() = fan_id)
  WITH CHECK (auth.uid() = fan_id);

-- RLS Policies for message_unlock_purchases
CREATE POLICY "Fans can view own unlock purchases"
  ON message_unlock_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = fan_id);

CREATE POLICY "Fans can create unlock purchases"
  ON message_unlock_purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = fan_id);

-- RLS Policies for fan_message_packages
CREATE POLICY "Anyone can view active message packages"
  ON fan_message_packages FOR SELECT
  USING (is_active = true);

-- RLS Policies for fan_message_usage
CREATE POLICY "Fans can view own message usage"
  ON fan_message_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = fan_id);

CREATE POLICY "System can log fan message usage"
  ON fan_message_usage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = fan_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_message_unlocks_fan ON message_unlocks(fan_id);
CREATE INDEX IF NOT EXISTS idx_message_unlocks_artist ON message_unlocks(artist_id);
CREATE INDEX IF NOT EXISTS idx_message_unlocks_expires ON message_unlocks(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_unlock_purchases_fan ON message_unlock_purchases(fan_id);
CREATE INDEX IF NOT EXISTS idx_fan_usage_fan_artist ON fan_message_usage(fan_id, artist_id);

-- Insert fan message packages
INSERT INTO fan_message_packages (name, description, message_count, price_cents, valid_days, display_order, best_value) VALUES
  ('Starter Pack', 'Try direct artist messaging', 5, 499, 30, 1, false),
  ('Fan Pack', 'Connect with your favorite artists', 20, 1499, 30, 2, true),
  ('Super Fan Pack', 'Unlimited conversations', 100, 4999, 30, 3, false)
ON CONFLICT DO NOTHING;

-- Function to check if fan can message artist
CREATE OR REPLACE FUNCTION can_fan_message_artist(
  p_fan_id uuid,
  p_artist_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_fan_tier text;
  v_unlock record;
  v_result jsonb;
BEGIN
  SELECT fan_messaging_tier INTO v_fan_tier
  FROM profiles
  WHERE id = p_fan_id;
  
  -- VIP fans can message anyone unlimited
  IF v_fan_tier = 'vip' THEN
    RETURN jsonb_build_object(
      'can_message', true,
      'reason', 'vip_subscription',
      'cost_cents', 0,
      'remaining', -1
    );
  END IF;
  
  -- Premium fans can message with limits
  IF v_fan_tier = 'premium' THEN
    RETURN jsonb_build_object(
      'can_message', true,
      'reason', 'premium_subscription',
      'cost_cents', 0,
      'remaining', 50
    );
  END IF;
  
  -- Check for active unlocks
  SELECT * INTO v_unlock
  FROM message_unlocks
  WHERE fan_id = p_fan_id
    AND artist_id = p_artist_id
    AND (expires_at IS NULL OR expires_at > now())
    AND (messages_remaining IS NULL OR messages_remaining > 0);
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'can_message', true,
      'reason', v_unlock.unlock_type,
      'cost_cents', 0,
      'remaining', v_unlock.messages_remaining
    );
  END IF;
  
  -- Free tier: pay per message required
  RETURN jsonb_build_object(
    'can_message', false,
    'reason', 'payment_required',
    'cost_cents', 99,
    'options', jsonb_build_array(
      jsonb_build_object('type', 'single_message', 'price_cents', 99),
      jsonb_build_object('type', 'conversation_24h', 'price_cents', 299),
      jsonb_build_object('type', 'conversation_7day', 'price_cents', 999),
      jsonb_build_object('type', 'upgrade_premium', 'price_cents', 499)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unlock artist messaging
CREATE OR REPLACE FUNCTION unlock_artist_messaging(
  p_fan_id uuid,
  p_artist_id uuid,
  p_unlock_type text,
  p_price_cents integer,
  p_payment_intent_id text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_unlock_id uuid;
  v_expires_at timestamptz;
  v_messages_remaining integer;
BEGIN
  -- Calculate expiration and message limits
  v_expires_at := CASE p_unlock_type
    WHEN 'single_message' THEN NULL
    WHEN 'conversation_24h' THEN now() + interval '24 hours'
    WHEN 'conversation_7day' THEN now() + interval '7 days'
    WHEN 'unlimited' THEN NULL
  END;
  
  v_messages_remaining := CASE p_unlock_type
    WHEN 'single_message' THEN 1
    WHEN 'conversation_24h' THEN 20
    WHEN 'conversation_7day' THEN 100
    WHEN 'unlimited' THEN NULL
  END;
  
  -- Create unlock record
  INSERT INTO message_unlocks (
    fan_id,
    artist_id,
    unlock_type,
    messages_remaining,
    expires_at,
    price_paid_cents
  ) VALUES (
    p_fan_id,
    p_artist_id,
    p_unlock_type,
    v_messages_remaining,
    v_expires_at,
    p_price_cents
  )
  ON CONFLICT (fan_id, artist_id, unlock_type) 
  DO UPDATE SET
    messages_remaining = COALESCE(message_unlocks.messages_remaining, 0) + v_messages_remaining,
    expires_at = CASE 
      WHEN message_unlocks.expires_at IS NULL THEN v_expires_at
      WHEN v_expires_at IS NULL THEN NULL
      ELSE GREATEST(message_unlocks.expires_at, v_expires_at)
    END,
    price_paid_cents = message_unlocks.price_paid_cents + p_price_cents
  RETURNING id INTO v_unlock_id;
  
  -- Log purchase
  INSERT INTO message_unlock_purchases (
    fan_id,
    artist_id,
    unlock_type,
    price_cents,
    payment_intent_id,
    status
  ) VALUES (
    p_fan_id,
    p_artist_id,
    p_unlock_type,
    p_price_cents,
    p_payment_intent_id,
    'completed'
  );
  
  RETURN v_unlock_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement message unlock usage
CREATE OR REPLACE FUNCTION use_message_unlock(
  p_fan_id uuid,
  p_artist_id uuid,
  p_message_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_unlock record;
  v_cost_type text;
  v_fan_tier text;
BEGIN
  -- Get fan tier
  SELECT fan_messaging_tier INTO v_fan_tier
  FROM profiles
  WHERE id = p_fan_id;
  
  -- VIP unlimited
  IF v_fan_tier = 'vip' THEN
    INSERT INTO fan_message_usage (fan_id, artist_id, message_id, cost_type, amount_paid_cents)
    VALUES (p_fan_id, p_artist_id, p_message_id, 'vip_subscription', 0);
    RETURN true;
  END IF;
  
  -- Premium has limits but free
  IF v_fan_tier = 'premium' THEN
    INSERT INTO fan_message_usage (fan_id, artist_id, message_id, cost_type, amount_paid_cents)
    VALUES (p_fan_id, p_artist_id, p_message_id, 'premium_subscription', 0);
    RETURN true;
  END IF;
  
  -- Check for paid unlocks
  SELECT * INTO v_unlock
  FROM message_unlocks
  WHERE fan_id = p_fan_id
    AND artist_id = p_artist_id
    AND (expires_at IS NULL OR expires_at > now())
    AND (messages_remaining IS NULL OR messages_remaining > 0)
  ORDER BY 
    CASE 
      WHEN messages_remaining IS NULL THEN 0
      ELSE 1
    END,
    expires_at NULLS LAST
  LIMIT 1
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Decrement if limited
  IF v_unlock.messages_remaining IS NOT NULL THEN
    UPDATE message_unlocks
    SET messages_remaining = messages_remaining - 1
    WHERE id = v_unlock.id;
  END IF;
  
  -- Log usage
  INSERT INTO fan_message_usage (fan_id, artist_id, message_id, cost_type, amount_paid_cents)
  VALUES (p_fan_id, p_artist_id, p_message_id, 'pay_per_message', v_unlock.price_paid_cents);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update calculate_message_cost function for enhanced fan messaging
CREATE OR REPLACE FUNCTION calculate_message_cost(
  p_sender_type text,
  p_recipient_type text,
  p_message_type text,
  p_sender_id uuid DEFAULT NULL
)
RETURNS integer AS $$
DECLARE
  v_fan_tier text;
BEGIN
  -- If sender is a fan messaging an artist, check their tier
  IF p_sender_type = 'fan' AND p_recipient_type IN ('musician', 'venue') THEN
    
    -- Check venue messages (always free for fans)
    IF p_recipient_type = 'venue' THEN
      RETURN 0;
    END IF;
    
    -- Check fan tier for artist messages
    IF p_sender_id IS NOT NULL THEN
      SELECT fan_messaging_tier INTO v_fan_tier
      FROM profiles
      WHERE id = p_sender_id;
      
      -- VIP and Premium get free messages (handled by subscription)
      IF v_fan_tier IN ('vip', 'premium') THEN
        RETURN 0;
      END IF;
    END IF;
    
    -- Free tier fans need to pay per message to artists
    RETURN 99; -- $0.99 per message
  END IF;
  
  -- Fan to fan messaging
  IF p_sender_type = 'fan' AND p_recipient_type = 'fan' THEN
    IF p_sender_id IS NOT NULL THEN
      SELECT fan_messaging_tier INTO v_fan_tier
      FROM profiles
      WHERE id = p_sender_id;
      
      IF v_fan_tier = 'vip' THEN
        RETURN 0; -- VIP unlimited
      ELSIF v_fan_tier = 'premium' THEN
        RETURN 49; -- $0.49 per message for premium
      ELSE
        RETURN 99; -- $0.99 per message for free tier
      END IF;
    END IF;
    
    RETURN 99;
  END IF;
  
  -- Original logic for non-fan senders
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
    WHEN p_recipient_type = 'fan' THEN 1
    ELSE 1
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
