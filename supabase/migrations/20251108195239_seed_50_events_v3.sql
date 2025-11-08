/*
  # Seed 50 Events for GigMate Platform

  This migration creates 50 events using existing venues and musicians in the database.

  ## New Data Created
  
  ### Events (50 total events)
  - Distributed across next 90 days
  - Mix of weekday and weekend shows with appropriate timing
  - Ticket prices range from $15-$45 based on venue size and day
  - Each event properly linked to existing venue and musician
  - Ticket quantities based on venue capacity (tickets_sold starts at 0)
  - All events start as "upcoming" status
  - Descriptive titles and genre-appropriate descriptions
  - Doors open 30 minutes before show starts
  
  ## Security
  - No changes to RLS policies (already configured)
  - Data only inserted if it doesn't already exist (prevents duplicates)
*/

-- Insert 50 events distributed across existing venues and musicians
DO $$
DECLARE
  venue_ids uuid[];
  musician_ids uuid[];
  v_id uuid;
  m_id uuid;
  new_event_date timestamp with time zone;
  event_counter integer := 0;
  venue_record record;
  musician_record record;
  venue_count integer;
  musician_count integer;
  show_start_time time;
  doors_open_time time;
BEGIN
  -- Get all venue IDs
  SELECT ARRAY_AGG(id), COUNT(*) INTO venue_ids, venue_count FROM venues;
  
  -- Get all musician IDs  
  SELECT ARRAY_AGG(id), COUNT(*) INTO musician_ids, musician_count FROM musicians;
  
  -- Only proceed if we have venues and musicians
  IF venue_count > 0 AND musician_count > 0 THEN
    -- Generate 50 events over the next 90 days
    FOR event_counter IN 1..50 LOOP
      -- Select venue and musician in round-robin fashion
      v_id := venue_ids[((event_counter - 1) % venue_count) + 1];
      m_id := musician_ids[((event_counter - 1) % musician_count) + 1];
      
      -- Calculate event date (spread over next 90 days)
      new_event_date := (CURRENT_DATE + ((event_counter * 1.8)::integer || ' days')::interval)::date;
      
      -- Calculate show start time based on day of week
      show_start_time := CASE 
        WHEN EXTRACT(DOW FROM new_event_date) IN (5, 6) THEN '20:00:00'::time -- Friday/Saturday evening
        WHEN EXTRACT(DOW FROM new_event_date) = 0 THEN '18:00:00'::time -- Sunday evening
        ELSE '19:00:00'::time -- Weekday evening
      END;
      
      -- Doors open 30 minutes before show
      doors_open_time := show_start_time - interval '30 minutes';
      
      -- Combine date and time for full timestamp
      new_event_date := new_event_date::date + show_start_time;
      
      -- Get venue and musician details
      SELECT * INTO venue_record FROM venues WHERE id = v_id;
      SELECT * INTO musician_record FROM musicians WHERE id = m_id;
      
      -- Create event (skip if venue already has event on this date/time)
      IF NOT EXISTS (
        SELECT 1 FROM events 
        WHERE events.venue_id = v_id 
        AND events.event_date::date = new_event_date::date
        AND events.show_starts = show_start_time
      ) THEN
        INSERT INTO events (
          venue_id,
          musician_id,
          title,
          description,
          event_date,
          doors_open,
          show_starts,
          ticket_price,
          total_tickets,
          tickets_sold,
          status
        ) VALUES (
          v_id,
          m_id,
          musician_record.stage_name || ' Live at ' || venue_record.venue_name,
          'Join us for an unforgettable evening of live music featuring ' || musician_record.stage_name || '. ' || 
          CASE 
            WHEN 'Country' = ANY(musician_record.genres) THEN 'Experience authentic Texas country music in an intimate Hill Country setting. Don''t miss this special performance!'
            WHEN 'Rock' = ANY(musician_record.genres) THEN 'Get ready to rock out with high-energy performances and crowd favorites. This is going to be electric!'
            WHEN 'Folk' = ANY(musician_record.genres) THEN 'Enjoy heartfelt storytelling through song in a cozy, acoustic atmosphere. Perfect for music lovers.'
            WHEN 'Jazz' = ANY(musician_record.genres) THEN 'Relax with smooth jazz, great company, and an unforgettable evening of musical artistry.'
            WHEN 'Blues' = ANY(musician_record.genres) THEN 'Feel the soul with authentic blues performances that will move you. True Texas blues at its finest.'
            WHEN 'Bluegrass' = ANY(musician_record.genres) THEN 'Tap your feet to authentic bluegrass music from talented local pickers. A true Hill Country experience!'
            WHEN 'Americana' = ANY(musician_record.genres) THEN 'Discover the roots of American music with heartfelt performances. An evening you won''t forget.'
            ELSE 'Don''t miss this special live performance. Limited tickets available!'
          END || ' Doors open 30 minutes before showtime. Food and drinks available.',
          new_event_date,
          doors_open_time,
          show_start_time,
          -- Ticket prices vary by venue size and day
          CASE 
            WHEN venue_record.capacity > 200 AND EXTRACT(DOW FROM new_event_date) IN (5, 6) THEN 35.00 + (RANDOM() * 10)::numeric(10,2)
            WHEN venue_record.capacity > 200 THEN 25.00 + (RANDOM() * 10)::numeric(10,2)
            WHEN EXTRACT(DOW FROM new_event_date) IN (5, 6) THEN 25.00 + (RANDOM() * 10)::numeric(10,2)
            ELSE 15.00 + (RANDOM() * 10)::numeric(10,2)
          END,
          venue_record.capacity,
          0, -- No tickets sold yet
          'upcoming'
        );
      END IF;
      
    END LOOP;
  END IF;
  
END $$;
