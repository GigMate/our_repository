/*
  # Comprehensive Referral System

  1. New Tables
    - `referrals`
      - `id` (uuid, primary key)
      - `referrer_id` (uuid, references profiles) - Person who referred
      - `referee_id` (uuid, references profiles) - Person who signed up
      - `referee_type` (text) - Type of user referred (musician, venue, fan, consumer)
      - `referral_code` (text) - Code that was used
      - `status` (text) - pending, converted, paid
      - `conversion_date` (timestamptz) - When they completed qualifying action
      - `reward_amount` (numeric) - Amount earned
      - `reward_paid` (boolean) - Whether reward has been paid
      - `qualifying_transaction_id` (uuid) - Transaction that triggered conversion
      - `created_at` (timestamptz)

    - `referral_redemptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles) - Who redeemed the code
      - `referral_code` (text) - Code that was redeemed
      - `transaction_id` (uuid) - Transaction where code was used
      - `discount_amount` (numeric) - Discount given
      - `created_at` (timestamptz)

  2. Changes
    - Add `referral_code` to profiles (unique code for each user)
    - Add `referred_by_code` to profiles (track who referred them)
    - Add `total_referrals` to profiles (count of successful referrals)
    - Add `referral_earnings` to profiles (total earned from referrals)

  3. Security
    - Enable RLS on all tables
    - Users can view their own referral data
    - Users can create referrals when signing up
    - System can update conversion status via triggers
*/

-- Add referral fields to profiles if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referral_code text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'referred_by_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referred_by_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'total_referrals'
  ) THEN
    ALTER TABLE profiles ADD COLUMN total_referrals integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'referral_earnings'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referral_earnings numeric DEFAULT 0;
  END IF;
END $$;

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referee_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referee_type text NOT NULL,
  referral_code text NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'converted', 'paid')),
  conversion_date timestamptz,
  reward_amount numeric DEFAULT 0 NOT NULL,
  reward_paid boolean DEFAULT false NOT NULL,
  qualifying_transaction_id uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(referrer_id, referee_id)
);

-- Create referral_redemptions table
CREATE TABLE IF NOT EXISTS referral_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referral_code text NOT NULL,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  discount_amount numeric DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrals
CREATE POLICY "Users can view their own referrals as referrer"
  ON referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals where they are referee"
  ON referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referee_id);

CREATE POLICY "Users can create referral on signup"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referee_id);

CREATE POLICY "System can update referral status"
  ON referrals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for referral_redemptions
CREATE POLICY "Users can view their own redemptions"
  ON referral_redemptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create redemptions"
  ON referral_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate 8 character alphanumeric code
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = new_code) INTO code_exists;

    EXIT WHEN NOT code_exists;
  END LOOP;

  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign referral code to new users
CREATE OR REPLACE FUNCTION assign_referral_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to assign referral code on profile creation
DROP TRIGGER IF EXISTS assign_referral_code_trigger ON profiles;
CREATE TRIGGER assign_referral_code_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_referral_code();

-- Function to create referral record when user signs up with code
CREATE OR REPLACE FUNCTION create_referral_record()
RETURNS trigger AS $$
DECLARE
  referrer_profile profiles%ROWTYPE;
  reward_amt numeric;
BEGIN
  -- Only process if user signed up with a referral code
  IF NEW.referred_by_code IS NOT NULL THEN
    -- Find the referrer
    SELECT * INTO referrer_profile
    FROM profiles
    WHERE referral_code = NEW.referred_by_code;

    IF referrer_profile.id IS NOT NULL THEN
      -- Calculate reward based on referee type
      reward_amt := CASE NEW.user_type
        WHEN 'musician' THEN 25.00
        WHEN 'venue' THEN 50.00
        WHEN 'fan' THEN 10.00
        WHEN 'consumer' THEN 10.00
        ELSE 10.00
      END;

      -- Create referral record
      INSERT INTO referrals (
        referrer_id,
        referee_id,
        referee_type,
        referral_code,
        status,
        reward_amount
      ) VALUES (
        referrer_profile.id,
        NEW.id,
        NEW.user_type,
        NEW.referred_by_code,
        'pending',
        reward_amt
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create referral on profile creation
DROP TRIGGER IF EXISTS create_referral_record_trigger ON profiles;
CREATE TRIGGER create_referral_record_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_referral_record();

-- Function to convert referral when qualifying transaction occurs
CREATE OR REPLACE FUNCTION check_referral_conversion()
RETURNS trigger AS $$
DECLARE
  user_profile profiles%ROWTYPE;
  referral_record referrals%ROWTYPE;
  should_convert boolean := false;
BEGIN
  -- Only process successful transactions
  IF NEW.status = 'completed' THEN
    -- Get user profile
    SELECT * INTO user_profile FROM profiles WHERE id = NEW.user_id;

    -- Get pending referral for this user
    SELECT * INTO referral_record
    FROM referrals
    WHERE referee_id = NEW.user_id
    AND status = 'pending'
    LIMIT 1;

    -- Check if this transaction qualifies for conversion
    IF referral_record.id IS NOT NULL THEN
      should_convert := CASE
        -- Musician: First booking (escrow payment)
        WHEN user_profile.user_type = 'musician' AND NEW.transaction_type = 'escrow_payment' THEN true
        -- Venue: First subscription
        WHEN user_profile.user_type = 'venue' AND NEW.transaction_type = 'subscription' THEN true
        -- Fan: First ticket purchase
        WHEN user_profile.user_type = 'fan' AND NEW.transaction_type = 'ticket_purchase' THEN true
        -- Consumer: First product purchase
        WHEN user_profile.user_type = 'consumer' AND NEW.transaction_type = 'product_purchase' THEN true
        ELSE false
      END;

      IF should_convert THEN
        -- Update referral to converted
        UPDATE referrals SET
          status = 'converted',
          conversion_date = now(),
          qualifying_transaction_id = NEW.id
        WHERE id = referral_record.id;

        -- Update referrer's stats
        UPDATE profiles SET
          total_referrals = total_referrals + 1,
          referral_earnings = referral_earnings + referral_record.reward_amount
        WHERE id = referral_record.referrer_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check for referral conversion on transactions
DROP TRIGGER IF EXISTS check_referral_conversion_trigger ON transactions;
CREATE TRIGGER check_referral_conversion_trigger
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION check_referral_conversion();

-- Function to apply referral discount
CREATE OR REPLACE FUNCTION apply_referral_discount(
  p_user_id uuid,
  p_referral_code text,
  p_transaction_amount numeric
)
RETURNS TABLE(discount_amount numeric, new_total numeric) AS $$
DECLARE
  code_exists boolean;
  v_discount numeric := 0;
  v_new_total numeric;
BEGIN
  -- Check if code exists and is not user's own code
  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE referral_code = p_referral_code
    AND id != p_user_id
  ) INTO code_exists;

  IF code_exists THEN
    -- Give 10% discount up to $10 maximum
    v_discount := LEAST(p_transaction_amount * 0.10, 10.00);
    v_new_total := p_transaction_amount - v_discount;
  ELSE
    v_new_total := p_transaction_amount;
  END IF;

  RETURN QUERY SELECT v_discount, v_new_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by_code ON profiles(referred_by_code);
CREATE INDEX IF NOT EXISTS idx_referral_redemptions_user_id ON referral_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_redemptions_code ON referral_redemptions(referral_code);

-- Backfill referral codes for existing users
UPDATE profiles
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;
