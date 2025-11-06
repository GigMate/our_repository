/*
  # Create Payout Accounts and Update Escrow System

  1. New Tables
    - `payout_accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - References profiles (musician or venue)
      - `payout_type` (enum) - bank_account, venmo, cashapp
      - `account_holder_name` (text)
      - `bank_name` (text) - For bank accounts
      - `account_number_last_four` (text) - Last 4 digits for security
      - `routing_number` (text) - For bank accounts (encrypted)
      - `venmo_username` (text) - For Venmo
      - `cashapp_username` (text) - For CashApp
      - `is_default` (boolean)
      - `is_verified` (boolean)
      - `stripe_account_id` (text) - For Stripe Connect
      - `created_at` (timestamptz)

  2. Changes to bookings table
    - Add `venue_rating` (integer) - Venue's rating of musician
    - Add `musician_rating` (integer) - Musician's rating of venue
    - Add `venue_rating_comment` (text)
    - Add `musician_rating_comment` (text)
    - Add `can_release_funds` (boolean) - Computed: both ratings >= 4
    - Add `payout_account_id` (uuid) - Which account to pay to

  3. Changes to transactions
    - Add `credit_card_processing_fee` (decimal) - 2.9% + $0.30
    - Add `processing_fee_percentage` (decimal)

  4. Business Rules
    - Both parties must rate each other 4+ stars to release funds
    - If either rating is below 4, automatic mediation (10% fee)
    - Credit card processing fees (2.9% + $0.30) passed to consumer

  5. Security
    - RLS on payout_accounts
    - Only account owner can view/manage their payout methods
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_type') THEN
    CREATE TYPE payout_type AS ENUM ('bank_account', 'venmo', 'cashapp');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS payout_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payout_type payout_type NOT NULL,
  account_holder_name text NOT NULL,
  bank_name text,
  account_number_last_four text,
  routing_number text,
  venmo_username text,
  cashapp_username text,
  is_default boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  stripe_account_id text,
  created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'venue_rating'
  ) THEN
    ALTER TABLE bookings ADD COLUMN venue_rating integer CHECK (venue_rating >= 1 AND venue_rating <= 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'musician_rating'
  ) THEN
    ALTER TABLE bookings ADD COLUMN musician_rating integer CHECK (musician_rating >= 1 AND musician_rating <= 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'venue_rating_comment'
  ) THEN
    ALTER TABLE bookings ADD COLUMN venue_rating_comment text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'musician_rating_comment'
  ) THEN
    ALTER TABLE bookings ADD COLUMN musician_rating_comment text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'can_release_funds'
  ) THEN
    ALTER TABLE bookings ADD COLUMN can_release_funds boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payout_account_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payout_account_id uuid REFERENCES payout_accounts(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'credit_card_processing_fee'
  ) THEN
    ALTER TABLE transactions ADD COLUMN credit_card_processing_fee decimal(10,2) DEFAULT 0.00;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'processing_fee_percentage'
  ) THEN
    ALTER TABLE transactions ADD COLUMN processing_fee_percentage decimal(5,2) DEFAULT 2.90;
  END IF;
END $$;

ALTER TABLE payout_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their payout accounts"
  ON payout_accounts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their payout accounts"
  ON payout_accounts
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION check_booking_ratings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.venue_rating IS NOT NULL AND NEW.musician_rating IS NOT NULL THEN
    IF NEW.venue_rating >= 4 AND NEW.musician_rating >= 4 THEN
      NEW.can_release_funds := true;
      NEW.status := 'completed';
      NEW.escrow_released_at := now();
      
      INSERT INTO ratings (rater_id, rated_user_id, rating, comment, transaction_type)
      VALUES 
        (NEW.venue_id, NEW.musician_id, NEW.venue_rating, NEW.venue_rating_comment, 'booking'),
        (NEW.musician_id, NEW.venue_id, NEW.musician_rating, NEW.musician_rating_comment, 'booking');
    ELSE
      NEW.status := 'disputed';
      NEW.mediation_required := true;
      NEW.mediation_fee := NEW.agreed_rate * 0.10;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_ratings_updated ON bookings;

CREATE TRIGGER on_booking_ratings_updated
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  WHEN (NEW.venue_rating IS NOT NULL AND NEW.musician_rating IS NOT NULL)
  EXECUTE FUNCTION check_booking_ratings();

CREATE INDEX IF NOT EXISTS idx_payout_accounts_user ON payout_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_accounts_default ON payout_accounts(user_id, is_default) WHERE is_default = true;