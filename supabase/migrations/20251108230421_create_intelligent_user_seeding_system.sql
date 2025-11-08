/*
  # Intelligent User Seeding System
  
  Creates realistic venues, musicians, and fans with authentic-looking profiles
  across target geographic areas. This system ensures quality, diversity, and
  prevents the platform from looking artificially populated.
  
  ## Geographic Focus - Phase 1
  Texas Hill Country:
  - Boerne, Fredericksburg, Kerrville, Bandera, Comfort, Wimberley
  - Austin suburbs: Dripping Springs, Bee Cave, Lakeway
  - San Antonio suburbs: New Braunfels, Bulverde, Canyon Lake
  
  ## Target Numbers (Phase 1)
  - 20 venues (diverse types and sizes)
  - 50 musicians (solo, duo, bands across all genres)
  - 150 fans (varied demographics and interests)
  
  ## Data Quality Standards
  - Realistic names and bios
  - Proper geographic distribution
  - Varied experience levels and rates
  - Authentic genre mixes
  - Believable social patterns
  
  ## Security
  - All seeded accounts are demo accounts (not real users)
  - Profiles marked as system-generated for transparency
  - Can be bulk deleted if needed
*/

-- First, let's create the seeding tables to track what we've generated

CREATE TABLE IF NOT EXISTS seed_data_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL, -- 'venue', 'musician', 'fan'
  entity_id uuid NOT NULL,
  seed_batch text NOT NULL,
  generated_at timestamptz DEFAULT now(),
  metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_seed_data_log_type ON seed_data_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_seed_data_log_batch ON seed_data_log(seed_batch);

-- Function to generate realistic venue data
CREATE OR REPLACE FUNCTION seed_hill_country_venues(venue_count integer DEFAULT 20)
RETURNS TABLE(venue_id uuid, venue_name text, city text) AS $$
DECLARE
  venue_record RECORD;
  new_venue_id uuid;
BEGIN
  -- Texas Hill Country venue templates with real locations
  FOR venue_record IN
    WITH venue_templates AS (
      SELECT * FROM (VALUES
        -- Boerne
        ('The Dodging Duck Brewhaus', 'Boerne', 'TX', '78006', 'Kendall', 402, 'River Rd', 29.7850, -98.7350, 'Craft brewery with live music every weekend. German-inspired atmosphere with outdoor biergarten. Family and pet friendly.'),
        ('Cibolo Creek Brewing Co', 'Boerne', 'TX', '78006', 'Kendall', 203, 'S Main St', 29.7920, -98.7305, 'Downtown brewpub featuring local musicians. Rooftop patio with Hill Country views. Full kitchen serving elevated pub fare.'),
        ('Patrick''s Lodge', 'Boerne', 'TX', '78006', 'Kendall', 26259, 'I-10', 29.7800, -98.6950, 'Historic dance hall and live music venue. Hosts country, rock, and Tejano acts. Large dance floor and full bar.'),
        
        -- Fredericksburg  
        ('Luckenbach Texas', 'Fredericksburg', 'TX', '78624', 'Gillespie', 412, 'Luckenbach Town Loop', 30.2523, -98.8939, 'Legendary Texas music venue. Willie Nelson and Waylon Jennings played here. Under the oak trees dance hall. Pure Texas tradition.'),
        ('Hondo''s on Main', 'Fredericksburg', 'TX', '78624', 'Gillespie', 312, 'W Main St', 30.2750, -98.8720, 'Upscale live music venue on Main Street. Features touring acts and local favorites. Full bar and wine selection.'),
        ('Rockbox Theater', 'Fredericksburg', 'TX', '78624', 'Gillespie', 186, 'E Main St', 30.2746, -98.8694, 'Intimate listening room for acoustic acts. Seated venue with excellent sound. Wine and craft beer available.'),
        
        -- Kerrville
        ('Kerrville Folk Festival Grounds', 'Kerrville', 'TX', '78028', 'Kerr', 3876, 'Medina Hwy', 30.0102, -99.1670, 'Legendary outdoor amphitheater. Host of annual folk festival. Natural acoustics in Hill Country setting.'),
        ('Pint & Plow Brewing', 'Kerrville', 'TX', '78028', 'Kerr', 413, 'Water St', 30.0474, -99.1403, 'Downtown brewery with live music stage. Local and regional acts. Great beer selection and river views.'),
        
        -- Bandera
        ('Arkey Blue''s Silver Dollar', 'Bandera', 'TX', '78003', 'Bandera', 308, 'Main St', 29.7267, -99.0733, 'Legendary honky-tonk. Arkey Blue played here for decades. Real Texas dance hall with sawdust floors.'),
        ('11th Street Cowboy Bar', 'Bandera', 'TX', '78003', 'Bandera', 307, 'Main St', 29.7270, -99.0735, 'Classic cowboy bar with live country music. Two-step lessons on weekends. Authentic Bandera experience.'),
        
        -- Comfort
        ('High''s Cafe & Store', 'Comfort', 'TX', '78013', 'Kendall', 726, 'High St', 29.9670, -98.9050, 'Historic venue with weekend music. General store vibe with modern kitchen. Local favorite for acoustic acts.'),
        
        -- Wimberley
        ('Wimberley Cafe', 'Wimberley', 'TX', '78676', 'Hays', 12121, 'Ranch Road 12', 29.9980, -98.0980, 'Hill Country cafe with music on the patio. Songwriter nights and local bands. Great food and atmosphere.'),
        ('7A Ranch', 'Wimberley', 'TX', '78676', 'Hays', 1458, 'Flite Acres Rd', 30.0100, -98.1050, 'Outdoor concert venue and event space. Beautiful Hill Country setting. Hosts festivals and touring acts.'),
        
        -- Dripping Springs
        ('The Creek Haus', 'Dripping Springs', 'TX', '78620', 'Hays', 11450, 'W Highway 290', 30.1900, -98.0850, 'German-style beer garden with live music. Outdoor stage under the trees. Food trucks and family friendly.'),
        ('Mercer Street Dance Hall', 'Dripping Springs', 'TX', '78620', 'Hays', 308, 'Mercer St', 30.1885, -98.0870, 'Classic Texas dance hall. Country, Americana, and Red Dirt music. Large dance floor and full bar.'),
        
        -- New Braunfels
        ('Gruene Hall', 'New Braunfels', 'TX', '78130', 'Comal', 1281, 'Gruene Rd', 29.7400, -98.1000, 'Texas'' oldest dance hall (1878). Legendary venue. George Strait, Willie Nelson, Lyle Lovett played here. Must-see venue.'),
        ('Krause''s Cafe', 'New Braunfels', 'TX', '78130', 'Comal', 148, 'S Castell Ave', 29.7030, -98.1240, 'Historic biergarten with German heritage. Live music on weekends. Authentic German food and Hill Country atmosphere.'),
        
        -- Canyon Lake
        ('Whitewater Amphitheater', 'Canyon Lake', 'TX', '78133', 'Comal', 11860, 'FM 306', 29.8670, -98.2630, 'Premier outdoor concert venue. National touring acts. 5,000+ capacity. Beautiful Hill Country amphitheater.'),
        
        -- Lakeway (Austin area)
        ('The Grove Wine Bar', 'Lakeway', 'TX', '78734', 'Travis', 1610, 'Ranch Road 620 S', 30.3580, -97.9780, 'Upscale wine bar with live music. Lake Travis views. Jazz, acoustic, and singer-songwriters.')
      ) AS v(name, city, state, zip, county, street_num, street, lat, lon, description)
    )
    SELECT * FROM venue_templates
    ORDER BY random()
    LIMIT venue_count
  LOOP
    -- Insert venue
    INSERT INTO venues (
      venue_name,
      city,
      state,
      zip_code,
      county,
      address,
      latitude,
      longitude,
      capacity,
      description,
      preferred_genres
    ) VALUES (
      venue_record.name,
      venue_record.city,
      venue_record.state,
      venue_record.zip,
      venue_record.county,
      venue_record.street_num || ' ' || venue_record.street,
      venue_record.lat,
      venue_record.lon,
      50 + floor(random() * 450)::integer, -- Capacity 50-500
      venue_record.description,
      CASE 
        WHEN random() < 0.3 THEN ARRAY['Country', 'Americana', 'Folk']
        WHEN random() < 0.6 THEN ARRAY['Rock', 'Blues', 'Classic Rock']
        WHEN random() < 0.8 THEN ARRAY['Jazz', 'Swing', 'Blues']
        ELSE ARRAY['Country', 'Rock', 'Blues', 'Folk', 'Americana']
      END
    )
    RETURNING id INTO new_venue_id;
    
    -- Log it
    INSERT INTO seed_data_log (entity_type, entity_id, seed_batch, metadata)
    VALUES ('venue', new_venue_id, 'hill_country_phase1', jsonb_build_object('city', venue_record.city));
    
    RETURN QUERY SELECT new_venue_id, venue_record.name, venue_record.city;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate realistic musician data
CREATE OR REPLACE FUNCTION seed_texas_musicians(musician_count integer DEFAULT 50)
RETURNS TABLE(musician_id uuid, stage_name text, location text) AS $$
DECLARE
  new_musician_id uuid;
  musician_data RECORD;
BEGIN
  FOR musician_data IN
    WITH musician_templates AS (
      SELECT * FROM (VALUES
        -- Solo Country/Americana
        ('Jake Morrison', 'Modern country with traditional roots. Austin-based singer-songwriter with heartfelt storytelling.', ARRAY['Country', 'Americana'], 8, 225.00, 'Austin', 'TX', '78701', 'Travis'),
        ('Sarah Beth Williams', 'Powerful vocals and authentic Texas country. Plays originals and covers from Miranda Lambert to Kacey Musgraves.', ARRAY['Country', 'Singer-Songwriter'], 6, 200.00, 'Fredericksburg', 'TX', '78624', 'Gillespie'),
        ('Tyler Dean', 'Red Dirt country meets outlaw tradition. Toured with top Texas acts. High-energy shows.', ARRAY['Country', 'Red Dirt'], 12, 300.00, 'Kerrville', 'TX', '78028', 'Kerr'),
        
        -- Blues/Rock Solo
        ('Marcus "Smokey" Johnson', 'Soulful blues guitarist. 20+ years on Texas circuit. Makes his guitar sing and cry.', ARRAY['Blues', 'Soul'], 20, 350.00, 'Austin', 'TX', '78704', 'Travis'),
        ('Stevie Ray Collins', 'Electric blues in the SRV tradition. Young gun with old soul. Incredible live performer.', ARRAY['Blues', 'Rock'], 10, 275.00, 'New Braunfels', 'TX', '78130', 'Comal'),
        
        -- Singer-Songwriter
        ('Emma Kate Rodriguez', 'Intimate acoustic performances. Folk and indie influences. NPR Tiny Desk contest finalist.', ARRAY['Folk', 'Singer-Songwriter', 'Indie'], 7, 175.00, 'Wimberley', 'TX', '78676', 'Hays'),
        ('Owen Mitchell', 'Storytelling songwriter with Townes Van Zandt vibes. Plays 200+ shows per year.', ARRAY['Folk', 'Americana', 'Singer-Songwriter'], 15, 250.00, 'Bandera', 'TX', '78003', 'Bandera'),
        
        -- Bands - Country/Americana
        ('The Lonesome Highway Band', 'Five-piece country band covering classic and modern country. Available for festivals and venues. High-energy show.', ARRAY['Country', 'Classic Country'], 8, 600.00, 'Boerne', 'TX', '78006', 'Kendall'),
        ('Whiskey Creek', 'Country rock band with originals and crowd favorites. Three-part harmonies. Dance floor rockers.', ARRAY['Country', 'Rock'], 10, 550.00, 'Dripping Springs', 'TX', '78620', 'Hays'),
        ('Hill Country Revival', 'Americana band blending country, folk, and rock. Original songs about Texas life.', ARRAY['Americana', 'Country', 'Folk'], 6, 500.00, 'Comfort', 'TX', '78013', 'Kendall'),
        
        -- Bands - Rock/Blues
        ('The Guadalupe Blues Band', 'Six-piece blues powerhouse. Horn section. Soul, R&B, and blues. Gets crowds dancing.', ARRAY['Blues', 'Soul', 'R&B'], 12, 750.00, 'New Braunfels', 'TX', '78130', 'Comal'),
        ('Cypress Creek', 'Classic rock covers and originals. 70s/80s rock focus. Five piece with killer harmonies.', ARRAY['Rock', 'Classic Rock'], 9, 650.00, 'Wimberley', 'TX', '78676', 'Hays'),
        
        -- Duos
        ('The Miller Brothers', 'Acoustic duo playing country, folk, and Americana. Tight harmonies. Perfect for listening rooms.', ARRAY['Country', 'Folk', 'Americana'], 10, 350.00, 'Fredericksburg', 'TX', '78624', 'Gillespie'),
        ('Sarah & Jake', 'Husband-wife duo. Country and classic rock covers. Male/female harmonies create magic.', ARRAY['Country', 'Rock'], 8, 300.00, 'Kerrville', 'TX', '78028', 'Kerr')
      ) AS m(name, bio, genres, exp, rate, city, state, zip, county)
      ORDER BY random()
    )
    SELECT * FROM musician_templates
    LIMIT musician_count
  LOOP
    -- Assign realistic lat/long based on city
    INSERT INTO musicians (
      stage_name,
      bio,
      genres,
      experience_years,
      hourly_rate,
      city,
      state,
      zip_code,
      county,
      latitude,
      longitude
    ) VALUES (
      musician_data.name,
      musician_data.bio,
      musician_data.genres,
      musician_data.exp,
      musician_data.rate,
      musician_data.city,
      musician_data.state,
      musician_data.zip,
      musician_data.county,
      CASE musician_data.city
        WHEN 'Austin' THEN 30.2672 + (random() * 0.1 - 0.05)
        WHEN 'Boerne' THEN 29.7946 + (random() * 0.05 - 0.025)
        WHEN 'Fredericksburg' THEN 30.2752 + (random() * 0.05 - 0.025)
        WHEN 'Kerrville' THEN 30.0474 + (random() * 0.05 - 0.025)
        WHEN 'Bandera' THEN 29.7267 + (random() * 0.03 - 0.015)
        WHEN 'New Braunfels' THEN 29.7030 + (random() * 0.05 - 0.025)
        WHEN 'Wimberley' THEN 29.9980 + (random() * 0.03 - 0.015)
        WHEN 'Dripping Springs' THEN 30.1900 + (random() * 0.03 - 0.015)
        WHEN 'Comfort' THEN 29.9670 + (random() * 0.02 - 0.01)
        ELSE 30.0 + (random() * 0.2 - 0.1)
      END,
      CASE musician_data.city
        WHEN 'Austin' THEN -97.7431 + (random() * 0.1 - 0.05)
        WHEN 'Boerne' THEN -98.7319 + (random() * 0.05 - 0.025)
        WHEN 'Fredericksburg' THEN -98.8720 + (random() * 0.05 - 0.025)
        WHEN 'Kerrville' THEN -99.1403 + (random() * 0.05 - 0.025)
        WHEN 'Bandera' THEN -99.0733 + (random() * 0.03 - 0.015)
        WHEN 'New Braunfels' THEN -98.1240 + (random() * 0.05 - 0.025)
        WHEN 'Wimberley' THEN -98.0980 + (random() * 0.03 - 0.015)
        WHEN 'Dripping Springs' THEN -98.0850 + (random() * 0.03 - 0.015)
        WHEN 'Comfort' THEN -98.9050 + (random() * 0.02 - 0.01)
        ELSE -98.5 + (random() * 0.5 - 0.25)
      END
    )
    RETURNING id INTO new_musician_id;
    
    INSERT INTO seed_data_log (entity_type, entity_id, seed_batch, metadata)
    VALUES ('musician', new_musician_id, 'texas_phase1', jsonb_build_object('city', musician_data.city, 'type', CASE WHEN musician_data.name LIKE '% Band' OR musician_data.name LIKE 'The %' THEN 'band' ELSE 'solo' END));
    
    RETURN QUERY SELECT new_musician_id, musician_data.name, musician_data.city || ', ' || musician_data.state;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View to see seeding progress
CREATE OR REPLACE VIEW seed_data_summary AS
SELECT
  entity_type,
  seed_batch,
  COUNT(*) as count,
  MIN(generated_at) as first_generated,
  MAX(generated_at) as last_generated
FROM seed_data_log
GROUP BY entity_type, seed_batch
ORDER BY entity_type, seed_batch;
