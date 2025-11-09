/*
  # Improve Event Generation - Proximity & Volume
  
  Updates the auto-generation system to:
  1. Match musicians with nearby venues (within 20 miles)
  2. Use ALL available venues and musicians (not just 10)
  3. Generate more events to keep platform active
  4. Create geographic variety
  
  ## Changes
  - Remove LIMIT 10 restrictions
  - Add 20-mile proximity matching using Haversine formula
  - Increase events per venue to ensure busy calendar
  - Prioritize local matches over distant ones
  
  ## Why 20 Miles?
  - Musicians typically willing to drive 15-30 miles for gigs
  - Fans will travel 10-20 miles for good shows
  - Creates realistic local music scenes
  - Prevents Austin musicians playing in El Paso
*/

-- Function to calculate distance between two points in miles
CREATE OR REPLACE FUNCTION calculate_distance_miles(
  lat1 numeric,
  lon1 numeric,
  lat2 numeric,
  lon2 numeric
)
RETURNS numeric AS $$
DECLARE
  R numeric := 3959; -- Earth's radius in miles
  dLat numeric;
  dLon numeric;
  a numeric;
  c numeric;
BEGIN
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  
  a := sin(dLat/2) * sin(dLat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dLon/2) * sin(dLon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- Updated auto-generation function with proximity matching
CREATE OR REPLACE FUNCTION generate_upcoming_events(weeks_ahead integer DEFAULT 4)
RETURNS integer AS $$
DECLARE
  event_count integer := 0;
  v_record RECORD;
  m_record RECORD;
  t_record RECORD;
  target_date date;
  show_time time;
  doors_time time;
  random_price numeric;
  random_capacity integer;
  tickets_presold integer;
  event_title text;
  event_desc text;
  distance_miles numeric;
  events_per_combo integer;
BEGIN
  -- Loop through ALL venues that have coordinates
  FOR v_record IN 
    SELECT 
      id, 
      venue_name, 
      latitude, 
      longitude,
      city,
      county
    FROM venues 
    WHERE latitude IS NOT NULL 
    AND longitude IS NOT NULL
  LOOP
    -- Find musicians within 20 miles of this venue
    FOR m_record IN 
      SELECT 
        m.id, 
        m.stage_name,
        m.latitude,
        m.longitude,
        calculate_distance_miles(v_record.latitude, v_record.longitude, m.latitude, m.longitude) as distance
      FROM musicians m
      WHERE m.latitude IS NOT NULL 
      AND m.longitude IS NOT NULL
      AND calculate_distance_miles(v_record.latitude, v_record.longitude, m.latitude, m.longitude) <= 20
      ORDER BY random() -- Add variety
    LOOP
      distance_miles := m_record.distance;
      
      -- Closer musicians get more gigs (realistic)
      events_per_combo := CASE
        WHEN distance_miles < 5 THEN 2 + floor(random() * 3)::integer  -- 2-4 events
        WHEN distance_miles < 10 THEN 1 + floor(random() * 2)::integer -- 1-2 events
        ELSE 1 -- 1 event for musicians 10-20 miles away
      END;
      
      -- Generate multiple events for this venue/musician combo
      FOR i IN 1..events_per_combo LOOP
        -- Pick random template
        SELECT * INTO t_record 
        FROM event_templates 
        WHERE is_active = true 
        ORDER BY random() 
        LIMIT 1;
        
        IF t_record IS NOT NULL THEN
          -- Pick a date within the weeks_ahead period
          target_date := CURRENT_DATE + (floor(random() * (weeks_ahead * 7))::integer || ' days')::interval;
          
          -- Adjust to preferred day of week if specified
          IF t_record.preferred_day_of_week IS NOT NULL AND array_length(t_record.preferred_day_of_week, 1) > 0 THEN
            WHILE NOT (extract(dow from target_date)::integer = ANY(t_record.preferred_day_of_week)) LOOP
              target_date := target_date + interval '1 day';
              EXIT WHEN target_date > CURRENT_DATE + (weeks_ahead * 7 || ' days')::interval;
            END LOOP;
          END IF;
          
          -- Skip if date is too far
          CONTINUE WHEN target_date > CURRENT_DATE + (weeks_ahead * 7 || ' days')::interval;
          
          -- Get time from preferred slot
          show_time := get_time_for_slot(
            t_record.preferred_time_slots[1 + floor(random() * array_length(t_record.preferred_time_slots, 1))::integer]
          );
          doors_time := (show_time - interval '30 minutes')::time;
          
          -- Randomize price and capacity within template ranges
          random_price := (t_record.min_price + random() * (t_record.max_price - t_record.min_price))::numeric(10,2);
          random_capacity := (t_record.min_capacity + floor(random() * (t_record.max_capacity - t_record.min_capacity)))::integer;
          tickets_presold := floor(random() * random_capacity * 0.5)::integer;
          
          -- Replace [ARTIST] placeholder
          event_title := replace(t_record.title_template, '[ARTIST]', m_record.stage_name);
          event_desc := replace(t_record.description_template, '[ARTIST]', m_record.stage_name);
          
          -- Insert event if it doesn't conflict
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
          )
          SELECT
            v_record.id,
            m_record.id,
            event_title,
            event_desc,
            target_date + show_time,
            doors_time,
            show_time,
            random_price,
            random_capacity,
            tickets_presold,
            'upcoming'
          WHERE NOT EXISTS (
            SELECT 1 FROM events e
            WHERE e.venue_id = v_record.id
            AND e.event_date::date = target_date
            AND abs(extract(epoch from (e.show_starts::time - show_time))/60) < 60 -- Within 1 hour
          );
          
          IF FOUND THEN
            event_count := event_count + 1;
          END IF;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
  
  RETURN event_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for faster distance calculations
CREATE INDEX IF NOT EXISTS idx_venues_lat_lng ON venues(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_musicians_lat_lng ON musicians(latitude, longitude) WHERE latitude IS NOT NULL;

-- Refresh events with new logic
SELECT generate_upcoming_events(4) as new_events_generated;
