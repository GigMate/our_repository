/*
  # Add Platform Fee to All Credit and Messaging Transactions
  
  1. Changes
    - Add platform_fee_percentage column to credit_transactions
    - Add platform_fee_amount column to credit_transactions
    - Update credit purchase function to include 10% platform fee
    - Update premium messaging to include platform fee in cost
    - Create function to process credit purchases with fees
  
  2. Fee Structure
    - Credit Purchases: 10% platform fee added to purchase price
    - Premium Messages: 10% platform fee included in credit cost
    - All other credit spending: Tracked for revenue analytics
  
  3. Revenue Tracking
    - Platform earns 10% on every transaction
    - Credit purchases generate immediate revenue
    - Credit spending tracked for analytics
*/

-- Add platform fee tracking to credit transactions
ALTER TABLE credit_transactions 
  ADD COLUMN IF NOT EXISTS platform_fee_percentage numeric DEFAULT 10.0,
  ADD COLUMN IF NOT EXISTS platform_fee_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gross_amount numeric DEFAULT 0;

-- Add comment
COMMENT ON COLUMN credit_transactions.platform_fee_percentage IS 'GigMate platform fee percentage (typically 10%)';
COMMENT ON COLUMN credit_transactions.platform_fee_amount IS 'Actual dollar amount of platform fee collected';
COMMENT ON COLUMN credit_transactions.gross_amount IS 'Total amount including platform fee';

-- Create function to purchase credits with platform fee
CREATE OR REPLACE FUNCTION purchase_credits_with_fee(
  p_user_id uuid,
  p_credits_to_add integer,
  p_payment_amount numeric
)
RETURNS TABLE (
  transaction_id uuid,
  total_cost numeric,
  platform_fee numeric,
  credits_received integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id uuid;
  v_platform_fee numeric;
  v_new_balance integer;
BEGIN
  -- Calculate 10% platform fee
  v_platform_fee := ROUND(p_payment_amount * 0.10, 2);
  
  -- Update user credit balance
  UPDATE user_credits
  SET 
    balance = balance + p_credits_to_add,
    total_purchased = total_purchased + p_credits_to_add,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  -- Record the credit transaction with fee tracking
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    reason,
    platform_fee_percentage,
    platform_fee_amount,
    gross_amount
  ) VALUES (
    p_user_id,
    'purchase',
    p_credits_to_add,
    v_new_balance,
    'Credit purchase',
    10.0,
    v_platform_fee,
    p_payment_amount + v_platform_fee
  ) RETURNING id INTO v_transaction_id;
  
  -- Return transaction details
  RETURN QUERY SELECT 
    v_transaction_id,
    p_payment_amount + v_platform_fee as total_cost,
    v_platform_fee,
    p_credits_to_add;
END;
$$;

-- Create function to spend credits with fee tracking (for analytics)
CREATE OR REPLACE FUNCTION spend_credits_with_tracking(
  p_user_id uuid,
  p_credits_to_spend integer,
  p_reason text,
  p_related_entity_type text DEFAULT NULL,
  p_related_entity_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id uuid;
  v_new_balance integer;
  v_current_balance integer;
BEGIN
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id;
  
  -- Check if user has enough credits
  IF v_current_balance < p_credits_to_spend THEN
    RAISE EXCEPTION 'Insufficient credits. Balance: %, Required: %', v_current_balance, p_credits_to_spend;
  END IF;
  
  -- Deduct credits
  UPDATE user_credits
  SET 
    balance = balance - p_credits_to_spend,
    total_spent = total_spent + p_credits_to_spend,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  -- Record the transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    reason,
    related_entity_type,
    related_entity_id,
    metadata
  ) VALUES (
    p_user_id,
    'spend',
    -p_credits_to_spend,
    v_new_balance,
    p_reason,
    p_related_entity_type,
    p_related_entity_id,
    p_metadata
  ) RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$;

-- Create view for credit revenue analytics
CREATE OR REPLACE VIEW credit_revenue_summary AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  transaction_type,
  COUNT(*) as transaction_count,
  SUM(CASE WHEN transaction_type = 'purchase' THEN amount ELSE 0 END) as credits_sold,
  SUM(CASE WHEN transaction_type = 'spend' THEN ABS(amount) ELSE 0 END) as credits_spent,
  SUM(platform_fee_amount) as platform_revenue,
  SUM(gross_amount) as gross_revenue
FROM credit_transactions
GROUP BY DATE_TRUNC('day', created_at), transaction_type
ORDER BY date DESC, transaction_type;

-- Update existing credit transactions to have default fee values
UPDATE credit_transactions
SET 
  platform_fee_percentage = 10.0,
  platform_fee_amount = 0,
  gross_amount = 0
WHERE platform_fee_percentage IS NULL;

-- Add helpful comments
COMMENT ON FUNCTION purchase_credits_with_fee IS 'Purchases credits with 10% platform fee added to total cost';
COMMENT ON FUNCTION spend_credits_with_tracking IS 'Spends credits and tracks the transaction for analytics';
COMMENT ON VIEW credit_revenue_summary IS 'Daily summary of credit purchase revenue and platform fees';
