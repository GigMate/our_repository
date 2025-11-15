/*
  # Add Critical Performance Indexes for Beta Launch

  ## Summary
  This migration adds performance indexes to commonly queried columns across high-traffic tables
  to ensure optimal database performance before beta launch.

  ## Indexes Added
  
  ### High-Priority Status Columns
  - bookings.status - Filtered queries for booking states
  - events.status - Event listing and filtering
  - orders.status - Order management and tracking
  - transactions.status - Payment processing queries
  - gigs.status - Gig management queries
  - contracts.status - Contract state tracking
  
  ### Critical Foreign Keys
  - notifications.booking_id - Notification lookups
  - venue_calendar_availability.event_id - Calendar queries
  - venue_calendar_availability.booking_id - Availability checks
  
  ### Email Lookups
  - ai_lead_prospects.email - Lead deduplication
  - merch_vendors.email - Vendor lookups
  - nda_signatures.email - NDA tracking
  
  ### Time-based Queries
  - bookings.created_at - Recent bookings queries
  - events.created_at - Event timeline queries
  - transactions.created_at - Transaction history
  - messages.created_at - Message ordering
  - orders.created_at - Order history
  
  ## Performance Impact
  - Faster booking queries by status
  - Improved event listing performance
  - Optimized transaction lookups
  - Better notification delivery
  - Enhanced calendar availability checks

  ## Notes
  - Only adds indexes where none exist
  - Uses IF NOT EXISTS to prevent duplicate index errors
  - Focuses on columns used in WHERE, ORDER BY, and JOIN clauses
*/

-- High-traffic status columns
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_gigs_status ON gigs(status);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_stripe_orders_status ON stripe_orders(status);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status ON stripe_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_message_unlock_purchases_status ON message_unlock_purchases(status);
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_status ON ticket_purchases(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Critical foreign keys for joins
CREATE INDEX IF NOT EXISTS idx_notifications_booking_id ON notifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_venue_calendar_event_id ON venue_calendar_availability(event_id);
CREATE INDEX IF NOT EXISTS idx_venue_calendar_booking_id ON venue_calendar_availability(booking_id);

-- Email lookups for deduplication and searches
CREATE INDEX IF NOT EXISTS idx_ai_lead_prospects_email ON ai_lead_prospects(email);
CREATE INDEX IF NOT EXISTS idx_merch_vendors_email ON merch_vendors(email);
CREATE INDEX IF NOT EXISTS idx_nda_signatures_email ON nda_signatures(email);

-- Time-based queries for ordering and filtering recent records
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_bookings_venue_status ON bookings(venue_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_musician_status ON bookings(musician_id, status);
CREATE INDEX IF NOT EXISTS idx_events_venue_status ON events(venue_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_fan_status ON orders(fan_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_musician_status ON orders(musician_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_from_user_created ON transactions(from_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_to_user_created ON transactions(to_user_id, created_at DESC);
