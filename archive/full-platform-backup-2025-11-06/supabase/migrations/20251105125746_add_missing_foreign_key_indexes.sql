/*
  # Add Missing Foreign Key Indexes

  1. Performance Optimization
    - Add indexes for all unindexed foreign keys to improve query performance
    - Covers bookings, conversations, events, gigs, orders, testimonials, transactions, and more
    
  2. Changes
    - Create indexes on foreign key columns that lack covering indexes
    - Improves JOIN performance and foreign key constraint checking
*/

-- Bookings table indexes
CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_musician_id ON bookings(musician_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payout_account_id ON bookings(payout_account_id);
CREATE INDEX IF NOT EXISTS idx_bookings_venue_id ON bookings(venue_id);

-- Conversations table indexes
CREATE INDEX IF NOT EXISTS idx_conversations_booking_id ON conversations(booking_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON conversations(participant_2);

-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_musician_id ON events(musician_id);
CREATE INDEX IF NOT EXISTS idx_events_venue_id ON events(venue_id);

-- Gigs table indexes
CREATE INDEX IF NOT EXISTS idx_gigs_musician_id ON gigs(musician_id);
CREATE INDEX IF NOT EXISTS idx_gigs_venue_id ON gigs(venue_id);

-- Order items table indexes
CREATE INDEX IF NOT EXISTS idx_order_items_merchandise_id ON order_items(merchandise_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_musician_id ON orders(musician_id);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_gig_id ON orders(pickup_gig_id);

-- Rating helpful votes table indexes
CREATE INDEX IF NOT EXISTS idx_rating_helpful_votes_user_id ON rating_helpful_votes(user_id);

-- Testimonials table indexes
CREATE INDEX IF NOT EXISTS idx_testimonials_booking_id ON testimonials(booking_id);

-- Ticket purchases table indexes
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_event_id ON ticket_purchases(event_id);

-- Transactions table indexes
CREATE INDEX IF NOT EXISTS idx_transactions_musician_id ON transactions(musician_id);
CREATE INDEX IF NOT EXISTS idx_transactions_venue_id ON transactions(venue_id);