/*
  # Fix Function Search Paths - Version 2
  
  Set immutable search_path on all functions, handling overloaded functions.
*/

ALTER FUNCTION check_booking_conflicts SET search_path = public, pg_temp;
ALTER FUNCTION queue_booking_notification_email SET search_path = public, pg_temp;
ALTER FUNCTION queue_ticket_purchase_email SET search_path = public, pg_temp;
ALTER FUNCTION queue_subscription_email SET search_path = public, pg_temp;
ALTER FUNCTION check_agreement_signatures SET search_path = public, pg_temp;
ALTER FUNCTION analyze_user_preferences SET search_path = public, pg_temp;
ALTER FUNCTION calculate_purchase_likelihood SET search_path = public, pg_temp;
ALTER FUNCTION generate_revenue_recommendations SET search_path = public, pg_temp;
ALTER FUNCTION initialize_user_credits SET search_path = public, pg_temp;
ALTER FUNCTION spend_credits SET search_path = public, pg_temp;
ALTER FUNCTION add_credits SET search_path = public, pg_temp;
ALTER FUNCTION reset_monthly_credits SET search_path = public, pg_temp;

-- Handle overloaded calculate_message_cost functions
ALTER FUNCTION calculate_message_cost(text, text, text) SET search_path = public, pg_temp;
ALTER FUNCTION calculate_message_cost(text, text, text, uuid) SET search_path = public, pg_temp;

ALTER FUNCTION can_fan_message_artist SET search_path = public, pg_temp;
ALTER FUNCTION unlock_artist_messaging SET search_path = public, pg_temp;
ALTER FUNCTION use_message_unlock SET search_path = public, pg_temp;
ALTER FUNCTION check_user_consents SET search_path = public, pg_temp;
ALTER FUNCTION record_user_consent SET search_path = public, pg_temp;
ALTER FUNCTION calculate_dropship_delivery_date SET search_path = public, pg_temp;
ALTER FUNCTION find_emergency_replacement_musicians SET search_path = public, pg_temp;
ALTER FUNCTION is_premium_venue SET search_path = public, pg_temp;
ALTER FUNCTION trigger_emergency_replacement_search SET search_path = public, pg_temp;
ALTER FUNCTION update_emergency_replacement_candidates SET search_path = public, pg_temp;
