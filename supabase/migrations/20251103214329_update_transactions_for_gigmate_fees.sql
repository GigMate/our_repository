/*
  # Update Transactions Table for GigMate Fee Tracking

  1. Changes
    - Add `gigmate_fee_percentage` column to track percentage taken
    - Update platform_fee to be more explicit as gigmate_fee
    - Add venue_id and musician_id for better tracking
    - Add fan_id to track which fan made purchase

  2. Notes
    - Existing transactions table has: from_user_id, to_user_id, amount, platform_fee
    - We'll add new columns to enhance tracking
    - GigMate takes a percentage of all transactions (tickets, food, beverage, merchandise)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'gigmate_fee_percentage'
  ) THEN
    ALTER TABLE transactions ADD COLUMN gigmate_fee_percentage decimal(5,2) DEFAULT 10.00;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'venue_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN venue_id uuid REFERENCES venues(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'musician_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN musician_id uuid REFERENCES musicians(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'fan_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN fan_id uuid REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'category'
  ) THEN
    ALTER TABLE transactions ADD COLUMN category text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_venue ON transactions(venue_id);
CREATE INDEX IF NOT EXISTS idx_transactions_musician ON transactions(musician_id);
CREATE INDEX IF NOT EXISTS idx_transactions_fan ON transactions(fan_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);