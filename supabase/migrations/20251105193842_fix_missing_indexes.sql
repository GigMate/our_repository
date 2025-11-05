/*
  # Fix Missing Foreign Key Indexes

  Add indexes for all unindexed foreign keys to improve query performance.
*/

CREATE INDEX IF NOT EXISTS idx_agreement_signatures_signer_id ON agreement_signatures(signer_id);
CREATE INDEX IF NOT EXISTS idx_agreements_created_by ON agreements(created_by);
CREATE INDEX IF NOT EXISTS idx_bookings_rescheduled_from ON bookings(rescheduled_from);
CREATE INDEX IF NOT EXISTS idx_contracts_booking_id ON contracts(booking_id);
CREATE INDEX IF NOT EXISTS idx_contracts_musician_id ON contracts(musician_id);
CREATE INDEX IF NOT EXISTS idx_contracts_venue_id ON contracts(venue_id);
CREATE INDEX IF NOT EXISTS idx_dropship_orders_event_id ON dropship_orders(event_id);
CREATE INDEX IF NOT EXISTS idx_emergency_replacements_original_booking_id ON emergency_replacements(original_booking_id);
CREATE INDEX IF NOT EXISTS idx_emergency_replacements_selected_musician_id ON emergency_replacements(selected_musician_id);
CREATE INDEX IF NOT EXISTS idx_fan_message_usage_artist_id ON fan_message_usage(artist_id);
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_message_credits_recipient_id ON message_credits(recipient_id);
CREATE INDEX IF NOT EXISTS idx_message_unlock_purchases_artist_id ON message_unlock_purchases(artist_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_musician_videos_musician_id ON musician_videos(musician_id);
CREATE INDEX IF NOT EXISTS idx_promotional_credit_uses_user_id ON promotional_credit_uses(user_id);
CREATE INDEX IF NOT EXISTS idx_promotional_credits_created_by ON promotional_credits(created_by);
CREATE INDEX IF NOT EXISTS idx_ratings_booking_id ON ratings(booking_id);
CREATE INDEX IF NOT EXISTS idx_ratings_event_id ON ratings(event_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_clicks_user_id ON recommendation_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_author_id ON testimonials(author_id);
CREATE INDEX IF NOT EXISTS idx_vendor_shipping_options_vendor_id ON vendor_shipping_options(vendor_id);
