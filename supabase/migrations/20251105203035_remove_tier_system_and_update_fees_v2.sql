/*
  # Remove Tier System and Update to Free Model with New Fee Structure
  
  1. Changes
    - Remove tier columns from profiles table
    - Remove venue_subscriptions table (no longer needed)
    - Remove subscription_tiers table (no longer needed)
    - Update GigMate fee structure:
      * 12.5% for ticket sales
      * 10% for all other transactions (food, drinks, merchandise)
    - Update all related functions and constraints
  
  2. Fee Structure
    - Ticket Sales: 12.5% platform fee
    - Other Sales (Food/Drinks/Merch): 10% platform fee
    - All accounts are now FREE - no subscription costs
  
  3. Security
    - Maintain existing RLS policies
    - Update transaction processing for new fee structure
*/

-- Drop tier-related tables
DROP TABLE IF EXISTS venue_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_tiers CASCADE;

-- Remove tier columns from profiles
ALTER TABLE profiles 
  DROP COLUMN IF EXISTS tier CASCADE,
  DROP COLUMN IF EXISTS tier_expires_at CASCADE,
  DROP COLUMN IF EXISTS subscription_status CASCADE;

-- Add transaction category if it doesn't exist
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS transaction_category text CHECK (transaction_category IN ('ticket_sale', 'merchandise', 'food_beverage', 'other')) DEFAULT 'other';

-- Update the gigmate_fee_percentage column default based on transaction type
-- We'll use a trigger to set this dynamically

-- Create or replace function to set fee percentage on transaction insert
CREATE OR REPLACE FUNCTION set_transaction_fee_percentage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set transaction category if not provided
  IF NEW.transaction_category IS NULL THEN
    NEW.transaction_category := CASE 
      WHEN NEW.transaction_type::text IN ('ticket_purchase', 'ticket_sale') THEN 'ticket_sale'
      WHEN NEW.transaction_type::text = 'merchandise_sale' THEN 'merchandise'
      WHEN NEW.category = 'food' OR NEW.category = 'beverage' THEN 'food_beverage'
      ELSE 'other'
    END;
  END IF;
  
  -- Set fee percentage: 12.5% for tickets, 10% for everything else
  IF NEW.transaction_category = 'ticket_sale' THEN
    NEW.gigmate_fee_percentage := 12.5;
  ELSE
    NEW.gigmate_fee_percentage := 10.0;
  END IF;
  
  -- Calculate platform_fee based on the percentage
  NEW.platform_fee := ROUND(NEW.amount * (NEW.gigmate_fee_percentage / 100), 2);
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_transaction_fee_trigger ON transactions;

-- Create trigger to automatically set fee percentage
CREATE TRIGGER set_transaction_fee_trigger
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION set_transaction_fee_percentage();

-- Update existing transactions to set proper categories and fees
UPDATE transactions 
SET 
  transaction_category = CASE 
    WHEN transaction_type::text IN ('ticket_purchase', 'ticket_sale') THEN 'ticket_sale'
    WHEN transaction_type::text = 'merchandise_sale' THEN 'merchandise'
    WHEN category = 'food' OR category = 'beverage' THEN 'food_beverage'
    ELSE 'other'
  END,
  gigmate_fee_percentage = CASE 
    WHEN transaction_type::text IN ('ticket_purchase', 'ticket_sale') THEN 12.5
    ELSE 10.0
  END
WHERE transaction_category IS NULL OR gigmate_fee_percentage NOT IN (10.0, 12.5);

-- Recalculate platform_fee for existing transactions
UPDATE transactions
SET platform_fee = ROUND(amount * (gigmate_fee_percentage / 100), 2)
WHERE platform_fee != ROUND(amount * (gigmate_fee_percentage / 100), 2);

-- Drop old subscription-related functions if they exist
DROP FUNCTION IF EXISTS check_venue_subscription_limits CASCADE;
DROP FUNCTION IF EXISTS update_venue_subscription CASCADE;
DROP FUNCTION IF EXISTS check_subscription_expiry CASCADE;

-- Create view for revenue analytics with new fee structure
CREATE OR REPLACE VIEW gigmate_revenue_summary AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  transaction_category,
  COUNT(*) as transaction_count,
  SUM(amount) as gross_revenue,
  SUM(platform_fee) as platform_revenue,
  SUM(amount - platform_fee) as merchant_revenue,
  AVG(gigmate_fee_percentage) as avg_fee_percentage
FROM transactions
WHERE status::text = 'completed'
GROUP BY DATE_TRUNC('day', created_at), transaction_category
ORDER BY date DESC, transaction_category;

-- Add helpful comment
COMMENT ON TABLE transactions IS 'All platform transactions with dynamic fee structure: 12.5% for ticket sales, 10% for all other transactions (food, drinks, merchandise)';
COMMENT ON COLUMN transactions.gigmate_fee_percentage IS 'Platform fee percentage: 12.5% for ticket_sale, 10.0% for all other transaction categories';
COMMENT ON COLUMN transactions.platform_fee IS 'Calculated platform fee based on gigmate_fee_percentage';
