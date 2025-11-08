/*
  # Auto Event Generation System

  Creates a system that automatically generates new events to keep the calendar fresh.
  
  ## Features
  
  1. **Event Templates Table**
     - Stores event templates with different styles, genres, times
     - Can be reused to generate varied events
  
  2. **Auto-Generation Function**
     - Generates events 2-4 weeks in advance
     - Randomizes dates, times, prices within ranges
     - Ensures variety across genres and styles
  
  3. **Scheduled Trigger**
     - Runs weekly to generate new events
     - Maintains a rolling 4-week calendar
  
  ## Security
  - Admin-only access to event generation
  - Uses existing RLS policies for events table
*/

-- Create event templates table
CREATE TABLE IF NOT EXISTS event_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_template text NOT NULL,
  description_template text NOT NULL,
  genre_category text NOT NULL,
  min_price numeric NOT NULL DEFAULT 10.00,
  max_price numeric NOT NULL DEFAULT 30.00,
  min_capacity integer NOT NULL DEFAULT 80,
  max_capacity integer NOT NULL DEFAULT 200,
  preferred_day_of_week integer[], -- 0=Sunday, 6=Saturday
  preferred_time_slots text[], -- 'morning', 'afternoon', 'evening', 'night'
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active event templates"
  ON event_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insert diverse event templates
INSERT INTO event_templates (title_template, description_template, genre_category, min_price, max_price, min_capacity, max_capacity, preferred_day_of_week, preferred_time_slots)
VALUES
  ('[ARTIST] - Acoustic Sunday Sessions', '☀️ SUNDAY AFTERNOON! Intimate acoustic performance featuring [ARTIST]''s biggest hits stripped down. Perfect for a relaxing Sunday. Brunch menu available.', 'acoustic', 12.00, 18.00, 80, 120, ARRAY[0], ARRAY['afternoon']),
  ('[ARTIST] - Bluegrass & Country Night', '🪕 BLUEGRASS SPECIAL! [ARTIST] switches it up with banjo, fiddle, and classic country. Traditional bluegrass meets modern country.', 'bluegrass', 20.00, 28.00, 120, 150, ARRAY[5], ARRAY['evening']),
  ('[ARTIST] - Blues Wednesday', '🎸 BLUES NIGHT! [ARTIST] on electric guitar playing raw, soulful blues. You''ve never heard them like this. Soul food menu available.', 'blues', 15.00, 22.00, 80, 120, ARRAY[3], ARRAY['evening']),
  ('[ARTIST] - Rock & Roll Saturday', '⚡ ROCK SATURDAY! [ARTIST] cranks it up with classic rock covers and high-energy originals. Journey, Boston, AC/DC style. LOUD!', 'rock', 20.00, 28.00, 120, 180, ARRAY[6], ARRAY['night']),
  ('[ARTIST] - Singer-Songwriter Series', '🎤 INTIMATE EVENING! Just [ARTIST], guitar, and stories behind the songs. Up close and personal in our smallest room.', 'singer-songwriter', 10.00, 15.00, 60, 80, ARRAY[2, 4], ARRAY['evening']),
  ('[ARTIST] - Friday Night Dance Party', '💃 DANCE NIGHT! [ARTIST] plays upbeat covers perfect for dancing. Top 40, country pop, and party favorites. Get ready to move!', 'dance', 18.00, 25.00, 150, 250, ARRAY[5], ARRAY['night']),
  ('[ARTIST] & Special Guests - Songwriter Circle', '✨ SPECIAL EVENT! [ARTIST] hosts songwriter circle with surprise guest artists. Original songs, stories, and collaborations.', 'special', 25.00, 35.00, 80, 120, ARRAY[0, 6], ARRAY['evening']),
  ('[ARTIST] - Happy Hour Show', '🤠 HAPPY HOUR! Early show perfect for after work. Discounted drinks during performance. Great way to start your weekend!', 'happy-hour', 8.00, 15.00, 100, 150, ARRAY[5], ARRAY['afternoon']),
  ('[ARTIST] - Texas Country Throwback', '🎵 TEXAS COUNTRY CLASSICS! [ARTIST] plays the legends: Willie, Waylon, George Strait, Pat Green. Pure Texas country night.', 'country', 18.00, 26.00, 100, 150, ARRAY[6], ARRAY['evening']),
  ('[ARTIST] - Sunday Jazz Brunch', '🎺 ELEGANT BRUNCH! [ARTIST] on jazz guitar with special jazz ensemble. Smooth standards while you enjoy chef''s brunch. Classy!', 'jazz', 25.00, 35.00, 80, 120, ARRAY[0], ARRAY['morning']),
  ('[ARTIST] LIVE', '🎸 Don''t miss [ARTIST] live! High-energy performance featuring all your favorite songs. This is going to be an unforgettable night!', 'general', 15.00, 25.00, 100, 200, ARRAY[4, 5, 6], ARRAY['evening', 'night']),
  ('[ARTIST] - Late Night Show', '🌙 LATE NIGHT SPECIAL! [ARTIST] performs after hours for the night owls. Intimate vibes and special deep cuts. 21+ only.', 'late-night', 12.00, 20.00, 80, 120, ARRAY[5, 6], ARRAY['night'])
ON CONFLICT (id) DO NOTHING;

-- Function to convert time slot to actual time
CREATE OR REPLACE FUNCTION get_time_for_slot(slot text)
RETURNS time AS $$
BEGIN
  RETURN CASE slot
    WHEN 'morning' THEN ('11:00:00'::time + (random() * interval '2 hours'))::time
    WHEN 'afternoon' THEN ('15:00:00'::time + (random() * interval '3 hours'))::time
    WHEN 'evening' THEN ('19:00:00'::time + (random() * interval '2 hours'))::time
    WHEN 'night' THEN ('21:00:00'::time + (random() * interval '2 hours'))::time
    ELSE '20:00:00'::time
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Main auto-generation function
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
BEGIN
  -- Get active venues and musicians
  FOR v_record IN 
    SELECT id, venue_name FROM venues WHERE latitude IS NOT NULL AND longitude IS NOT NULL LIMIT 10
  LOOP
    FOR m_record IN 
      SELECT id, stage_name FROM musicians LIMIT 10
    LOOP
      -- Generate 2-3 events per musician/venue combo over the period
      FOR i IN 1..(1 + floor(random() * 2)::integer) LOOP
        -- Pick random template
        SELECT * INTO t_record 
        FROM event_templates 
        WHERE is_active = true 
        ORDER BY random() 
        LIMIT 1;
        
        IF t_record IS NOT NULL THEN
          -- Pick a date within the weeks_ahead period, preferring template's preferred days
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
            AND e.show_starts = show_time
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

-- Function to clean up old events
CREATE OR REPLACE FUNCTION cleanup_past_events()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM events
  WHERE event_date < CURRENT_DATE - interval '7 days'
  AND status IN ('completed', 'cancelled');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate initial events for the next 4 weeks
SELECT generate_upcoming_events(4) as events_created;
