/*
  # Update Transaction Fees Based on Subscription Tier
  
  1. Changes
    - Create function to get user's transaction fee percentage based on subscription
    - Update transaction processing to use tiered fees
    - Business tier users get 7.5% instead of 10% on non-ticket transactions
    - All tiers pay 12.5% on ticket sales
  
  2. Fee Structure
    - Free tier: 10% on transactions, 12.5% on tickets
    - Pro tier: 10% on transactions, 12.5% on tickets  
    - Business tier: 7.5% on transactions, 12.5% on tickets (SAVINGS!)
  
  3. Integration
    - All payment processing should call get_user_transaction_fee()
    - Automatically applies correct fee based on subscription
*/

-- Function to get user's transaction fee based on subscription and transaction type
CREATE OR REPLACE FUNCTION get_user_transaction_fee(
  p_user_id uuid,
  p_transaction_type text DEFAULT 'general'
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fee_percentage numeric;
BEGIN
  -- Check if this is a ticket sale (always 12.5%)
  IF p_transaction_type = 'ticket_sale' THEN
    RETURN 12.5;
  END IF;
  
  -- Get user's plan fee percentage for other transactions
  SELECT 
    CASE 
      WHEN p_transaction_type = 'ticket_sale' THEN sp.ticket_fee_percentage
      ELSE sp.transaction_fee_percentage
    END
  INTO v_fee_percentage
  FROM subscription_plans sp
  JOIN user_subscriptions us ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id 
    AND us.status = 'active';
  
  -- If no subscription found, use default free tier rates
  IF v_fee_percentage IS NULL THEN
    v_fee_percentage := CASE 
      WHEN p_transaction_type = 'ticket_sale' THEN 12.5
      ELSE 10.0
    END;
  END IF;
  
  RETURN v_fee_percentage;
END;
$$;

-- Function to calculate transaction fees with subscription tier support
CREATE OR REPLACE FUNCTION calculate_transaction_with_fees(
  p_user_id uuid,
  p_amount numeric,
  p_transaction_type text DEFAULT 'general'
)
RETURNS TABLE (
  gross_amount numeric,
  platform_fee_percentage numeric,
  platform_fee_amount numeric,
  net_amount numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fee_percentage numeric;
  v_platform_fee numeric;
  v_net_amount numeric;
BEGIN
  -- Get the appropriate fee percentage
  v_fee_percentage := get_user_transaction_fee(p_user_id, p_transaction_type);
  
  -- Calculate fees
  v_platform_fee := ROUND(p_amount * (v_fee_percentage / 100), 2);
  v_net_amount := p_amount - v_platform_fee;
  
  RETURN QUERY SELECT
    p_amount as gross_amount,
    v_fee_percentage as platform_fee_percentage,
    v_platform_fee as platform_fee_amount,
    v_net_amount as net_amount;
END;
$$;

-- Update the purchase credits function to use tiered fees
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
  v_fee_percentage numeric;
  v_new_balance integer;
BEGIN
  -- Get user's fee percentage (credits are not tickets, so general rate)
  v_fee_percentage := get_user_transaction_fee(p_user_id, 'credit_purchase');
  
  -- Calculate platform fee based on user's subscription tier
  v_platform_fee := ROUND(p_payment_amount * (v_fee_percentage / 100), 2);
  
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
    v_fee_percentage,
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

-- Create view showing fee savings by subscription tier (for Business tier users)
CREATE OR REPLACE VIEW subscription_fee_savings AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.user_type,
  sp.plan_name,
  sp.display_name as subscription_name,
  sp.transaction_fee_percentage,
  (10.0 - sp.transaction_fee_percentage) as fee_discount_percentage,
  COUNT(t.id) FILTER (WHERE t.category != 'ticket_sale') as non_ticket_transaction_count,
  SUM(t.amount) FILTER (WHERE t.category != 'ticket_sale') as total_transaction_volume,
  SUM(t.amount * 0.10) FILTER (WHERE t.category != 'ticket_sale') as would_have_paid_free_tier,
  SUM(t.platform_fee) FILTER (WHERE t.category != 'ticket_sale') as actually_paid,
  SUM(t.amount * 0.10) FILTER (WHERE t.category != 'ticket_sale') - 
    SUM(t.platform_fee) FILTER (WHERE t.category != 'ticket_sale') as total_savings
FROM profiles p
LEFT JOIN user_subscriptions us ON us.user_id = p.id
LEFT JOIN subscription_plans sp ON sp.id = us.plan_id
LEFT JOIN transactions t ON (t.to_user_id = p.id OR t.from_user_id = p.id)
WHERE sp.plan_name = 'business'
  AND t.created_at >= now() - interval '30 days'
GROUP BY p.id, p.full_name, p.user_type, sp.plan_name, sp.display_name, sp.transaction_fee_percentage;

-- Add helpful comments
COMMENT ON FUNCTION get_user_transaction_fee IS 'Returns transaction fee percentage based on user subscription tier';
COMMENT ON FUNCTION calculate_transaction_with_fees IS 'Calculates all fee components for a transaction with tier support';
COMMENT ON VIEW subscription_fee_savings IS 'Shows how much Business tier users save on transaction fees (2.5% savings = $2.50 per $100)';
