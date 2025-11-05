/*
  # Remove Unused Indexes

  1. Performance Optimization
    - Remove indexes that are not being used by queries
    - Reduces storage overhead and write operation costs
    - Improves INSERT/UPDATE/DELETE performance
    
  2. Changes
    - Drop unused indexes identified by database analysis
    - Keep only actively used indexes for query optimization
*/

-- Remove unused coordinate indexes (will be recreated if geographic search is implemented)
DROP INDEX IF EXISTS idx_musicians_coordinates;
DROP INDEX IF EXISTS idx_venues_coordinates;

-- Remove unused rating quota index
DROP INDEX IF EXISTS idx_fan_quota_month;

-- Remove unused rating indexes
DROP INDEX IF EXISTS idx_ratings_category;
DROP INDEX IF EXISTS idx_ratings_event;
DROP INDEX IF EXISTS idx_ratings_booking;
DROP INDEX IF EXISTS idx_ratings_verified;
DROP INDEX IF EXISTS idx_ratings_public;

-- Remove unused contract indexes (replaced with new foreign key indexes)
DROP INDEX IF EXISTS idx_contracts_booking;
DROP INDEX IF EXISTS idx_contracts_venue;
DROP INDEX IF EXISTS idx_contracts_musician;

-- Remove unused image indexes
DROP INDEX IF EXISTS idx_images_entity;
DROP INDEX IF EXISTS idx_images_user;
DROP INDEX IF EXISTS idx_images_primary;

-- Remove unused conversation indexes (replaced with new ones)
DROP INDEX IF EXISTS idx_conversations_participants;
DROP INDEX IF EXISTS idx_conversations_last_message;

-- Remove unused message indexes (replaced with new ones)
DROP INDEX IF EXISTS idx_messages_conversation;
DROP INDEX IF EXISTS idx_messages_sender;

-- Remove unused video indexes
DROP INDEX IF EXISTS idx_musician_videos_musician;

-- Remove unused testimonial indexes
DROP INDEX IF EXISTS idx_testimonials_subject;
DROP INDEX IF EXISTS idx_testimonials_author;