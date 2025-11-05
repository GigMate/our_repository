/*
  # Remove Old Triggers and Insecure Functions

  1. Security Improvements
    - Remove triggers that depend on insecure function versions
    - Drop old function versions without proper search_path

  2. Changes
    - Drop on_booking_ratings_updated trigger
    - Drop on_booking_updated trigger
    - Drop old insecure function versions
*/

DROP TRIGGER IF EXISTS on_booking_ratings_updated ON bookings;
DROP TRIGGER IF EXISTS on_booking_updated ON bookings;

DROP FUNCTION IF EXISTS public.check_booking_ratings() CASCADE;
DROP FUNCTION IF EXISTS public.update_booking_status() CASCADE;
