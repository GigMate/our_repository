/*
  # Add Missing Foreign Key Indexes

  1. Performance Improvements
    - Add indexes on foreign key columns to improve query performance
    - Indexes for bookings, order_items, and orders tables

  2. Changes
    - Create index on bookings.payout_account_id
    - Create index on order_items.merchandise_id
    - Create index on order_items.order_id
    - Create index on orders.pickup_gig_id
*/

-- Add index for bookings.payout_account_id foreign key
CREATE INDEX IF NOT EXISTS idx_bookings_payout_account_id 
ON bookings(payout_account_id);

-- Add index for order_items.merchandise_id foreign key
CREATE INDEX IF NOT EXISTS idx_order_items_merchandise_id 
ON order_items(merchandise_id);

-- Add index for order_items.order_id foreign key
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
ON order_items(order_id);

-- Add index for orders.pickup_gig_id foreign key
CREATE INDEX IF NOT EXISTS idx_orders_pickup_gig_id 
ON orders(pickup_gig_id);
