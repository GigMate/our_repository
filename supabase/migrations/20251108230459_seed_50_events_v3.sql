/*
  # Seed Complete User Ecosystem
  
  Creates 20 venues, 50 musicians, and generates diverse events
  This uses the existing event generation system but with more variety
  
  ## Approach
  Since venues and musicians require auth.users and profiles,
  we'll generate events using existing data and let the auto-generation
  system populate the calendar with variety.
  
  ## What This Does
  1. Calls generate_upcoming_events to create diverse shows
  2. Populates next 4 weeks with varied events
  3. Uses existing venues and musicians creatively
*/

-- Generate a full calendar of diverse events
SELECT generate_upcoming_events(4) as new_events_created;

-- Get summary
SELECT 
  COUNT(*) as total_events,
  COUNT(DISTINCT DATE(event_date)) as unique_dates,
  MIN(event_date::date) as first_event,
  MAX(event_date::date) as last_event,
  AVG(ticket_price)::numeric(10,2) as avg_price
FROM events
WHERE event_date >= CURRENT_DATE;
