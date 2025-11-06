/*
  # Remove Unused Indexes

  1. Performance & Storage Improvements
    - Remove indexes that haven't been used to reduce storage overhead
    - Indexes consume disk space and slow down INSERT/UPDATE operations
    - Can be recreated later if usage patterns change

  2. Indexes Removed
    - Rating indexes: created timestamp index
    - Transaction indexes: venue, musician, category
    - Gig indexes: musician, venue, date
    - Merchandise indexes: active flag
    - Order indexes: musician, pickup_gig_id
    - Order items indexes: merchandise_id, order_id
    - Booking indexes: event, status, created, venue, musician, payout_account_id
    - Profile indexes: tier
    - Event indexes: venue, musician, date, status
    - Ticket purchase indexes: event
    - Payout account indexes: default flag

  Note: Keep primary key and unique constraint indexes as they're essential
*/

-- Remove unused rating indexes
DROP INDEX IF EXISTS idx_ratings_created;

-- Remove unused transaction indexes
DROP INDEX IF EXISTS idx_transactions_venue;
DROP INDEX IF EXISTS idx_transactions_musician;
DROP INDEX IF EXISTS idx_transactions_category;

-- Remove unused gig indexes
DROP INDEX IF EXISTS idx_gigs_musician;
DROP INDEX IF EXISTS idx_gigs_venue;
DROP INDEX IF EXISTS idx_gigs_date;

-- Remove unused merchandise indexes
DROP INDEX IF EXISTS idx_merchandise_active;

-- Remove unused order indexes
DROP INDEX IF EXISTS idx_orders_musician;
DROP INDEX IF EXISTS idx_orders_pickup_gig_id;

-- Remove unused order_items indexes
DROP INDEX IF EXISTS idx_order_items_merchandise_id;
DROP INDEX IF EXISTS idx_order_items_order_id;

-- Remove unused booking indexes
DROP INDEX IF EXISTS idx_bookings_event;
DROP INDEX IF EXISTS idx_bookings_status;
DROP INDEX IF EXISTS idx_bookings_created;
DROP INDEX IF EXISTS idx_bookings_venue;
DROP INDEX IF EXISTS idx_bookings_musician;
DROP INDEX IF EXISTS idx_bookings_payout_account_id;

-- Remove unused profile indexes
DROP INDEX IF EXISTS idx_profiles_tier;

-- Remove unused event indexes
DROP INDEX IF EXISTS idx_events_venue;
DROP INDEX IF EXISTS idx_events_musician;
DROP INDEX IF EXISTS idx_events_date;
DROP INDEX IF EXISTS idx_events_status;

-- Remove unused ticket_purchases indexes
DROP INDEX IF EXISTS idx_ticket_purchases_event;

-- Remove unused payout_accounts indexes
DROP INDEX IF EXISTS idx_payout_accounts_default;
