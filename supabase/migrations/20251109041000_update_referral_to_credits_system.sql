/*
  # Update Referral System to Credits-Based Model

  1. Changes
    - Rename `referral_earnings` to `referral_credits` in profiles
    - Update referrals table to track credits instead of cash
    - Credits are redeemable ONLY at GigMate events (ticket purchases)
    - Credits have dollar value but are not cash payouts

  2. New Tables
    - `credit_redemptions`
      - Tracks when users redeem credits at events
      - Links to ticket purchases
      - Prevents double-spending

  3. Credit Values
    - Refer a Musician → 25 credits ($25 value)
    - Refer a Venue → 50 credits ($50 value)
    - Refer a Fan → 10 credits ($10 value)
    - Refer a Consumer → 10 credits ($10 value)

  4. Redemption Rules
    - Credits only work on GigMate event ticket purchases
    - Cannot be cashed out
    - Cannot be transferred between users
    - Applied at checkout like a gift card
*/

-- Rename referral_earnings to referral_credits
ALTER TABLE profiles RENAME COLUMN referral_earnings TO referral_credits;

-- Update referrals table columns
ALTER TABLE referrals RENAME COLUMN reward_amount TO reward_credits;
ALTER TABLE referrals RENAME COLUMN reward_paid TO credits_awarded;

-- Drop the old referral_redemptions table (was for discounts, not credits)
DROP TABLE IF EXISTS referral_redemptions CASCADE;

-- Create credit_redemptions table
CREATE TABLE IF NOT EXISTS credit_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  ticket_purchase_id uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  credits_used numeric NOT NULL,
  dollar_value numeric NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE credit_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for credit_redemptions
CREATE POLICY "Users can view their own credit redemptions"
  ON credit_redemptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create credit redemptions"
  ON credit_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update the referral conversion function to use credits
CREATE OR REPLACE FUNCTION check_referral_conversion()
RETURNS trigger AS $$
DECLARE
  user_profile profiles%ROWTYPE;
  referral_record referrals%ROWTYPE;
  should_convert boolean := false;
BEGIN
  IF NEW.status = 'completed' THEN
    SELECT * INTO user_profile FROM profiles WHERE id = NEW.user_id;

    SELECT * INTO referral_record
    FROM referrals
    WHERE referee_id = NEW.user_id
    AND status = 'pending'
    LIMIT 1;

    IF referral_record.id IS NOT NULL THEN
      should_convert := CASE
        WHEN user_profile.user_type = 'musician' AND NEW.transaction_type = 'escrow_payment' THEN true
        WHEN user_profile.user_type = 'venue' AND NEW.transaction_type = 'subscription' THEN true
        WHEN user_profile.user_type = 'fan' AND NEW.transaction_type = 'ticket_purchase' THEN true
        WHEN user_profile.user_type = 'consumer' AND NEW.transaction_type = 'product_purchase' THEN true
        ELSE false
      END;

      IF should_convert THEN
        UPDATE referrals SET
          status = 'converted',
          conversion_date = now(),
          qualifying_transaction_id = NEW.id,
          credits_awarded = true
        WHERE id = referral_record.id;

        UPDATE profiles SET
          total_referrals = total_referrals + 1,
          referral_credits = referral_credits + referral_record.reward_credits
        WHERE id = referral_record.referrer_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply credits to ticket purchase
CREATE OR REPLACE FUNCTION apply_credits_to_ticket_purchase(
  p_user_id uuid,
  p_ticket_amount numeric,
  p_credits_to_use numeric
)
RETURNS TABLE(
  available_credits numeric,
  credits_applied numeric,
  remaining_credits numeric,
  new_ticket_price numeric
) AS $$
DECLARE
  user_credits numeric;
  credits_used numeric;
  final_price numeric;
BEGIN
  SELECT referral_credits INTO user_credits
  FROM profiles
  WHERE id = p_user_id;

  IF user_credits IS NULL THEN
    user_credits := 0;
  END IF;

  credits_used := LEAST(p_credits_to_use, user_credits, p_ticket_amount);
  final_price := GREATEST(0, p_ticket_amount - credits_used);

  RETURN QUERY SELECT
    user_credits,
    credits_used,
    user_credits - credits_used,
    final_price;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to redeem credits (called after successful payment)
CREATE OR REPLACE FUNCTION redeem_credits_for_ticket(
  p_user_id uuid,
  p_ticket_id uuid,
  p_credits_used numeric
)
RETURNS boolean AS $$
DECLARE
  user_credits numeric;
BEGIN
  SELECT referral_credits INTO user_credits
  FROM profiles
  WHERE id = p_user_id;

  IF user_credits < p_credits_used THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  UPDATE profiles
  SET referral_credits = referral_credits - p_credits_used
  WHERE id = p_user_id;

  INSERT INTO credit_redemptions (user_id, ticket_purchase_id, credits_used, dollar_value)
  VALUES (p_user_id, p_ticket_id, p_credits_used, p_credits_used);

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove the old discount function (no longer needed)
DROP FUNCTION IF EXISTS apply_referral_discount(uuid, text, numeric);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_credit_redemptions_user_id ON credit_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_redemptions_ticket_id ON credit_redemptions(ticket_purchase_id);

-- Update existing data
UPDATE profiles SET referral_credits = 0 WHERE referral_credits IS NULL;
UPDATE referrals SET credits_awarded = false WHERE credits_awarded IS NULL;
