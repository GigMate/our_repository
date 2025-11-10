/*
  # Fix Seed Musicians Function to Create Profiles

  1. Problem
    - seed_texas_musicians() tries to insert musicians without profiles
    - musicians.id has FK constraint to profiles table
    
  2. Solution
    - Create auth user and profile first
    - Then create musician with same ID
    
  3. Security
    - Demo accounts for testing only
    - Marked as system-generated
*/

CREATE OR REPLACE FUNCTION seed_texas_musicians(musician_count integer DEFAULT 50)
RETURNS TABLE(musician_id uuid, stage_name text, location text) AS $$
DECLARE
  new_musician_id uuid;
  new_user_id uuid;
  musician_data RECORD;
  demo_email text;
  demo_password text;
BEGIN
  FOR musician_data IN
    WITH musician_templates AS (
      SELECT * FROM (VALUES
        -- Solo Country/Americana
        ('Jake Morrison', 'Modern country with traditional roots. Austin-based singer-songwriter with heartfelt storytelling.', ARRAY['Country', 'Americana'], 8, 225.00, 'Austin', 'TX', '78701', 'Travis'),
        ('Sarah Beth Williams', 'Powerful vocals and authentic Texas country. Plays originals and covers from Miranda Lambert to Kacey Musgraves.', ARRAY['Country', 'Singer-Songwriter'], 6, 200.00, 'Fredericksburg', 'TX', '78624', 'Gillespie'),
        ('Tyler Dean', 'Red Dirt country meets outlaw tradition. Toured with top Texas acts. High-energy shows.', ARRAY['Country', 'Red Dirt'], 12, 300.00, 'Kerrville', 'TX', '78028', 'Kerr'),
        ('Marcus Johnson', 'Soulful blues guitarist. 20+ years on Texas circuit. Makes his guitar sing and cry.', ARRAY['Blues', 'Soul'], 20, 350.00, 'Austin', 'TX', '78704', 'Travis'),
        ('Stevie Ray Collins', 'Electric blues in the SRV tradition. Young gun with old soul. Incredible live performer.', ARRAY['Blues', 'Rock'], 10, 275.00, 'New Braunfels', 'TX', '78130', 'Comal'),
        ('Emma Kate Rodriguez', 'Intimate acoustic performances. Folk and indie influences. NPR Tiny Desk contest finalist.', ARRAY['Folk', 'Singer-Songwriter', 'Indie'], 7, 175.00, 'Wimberley', 'TX', '78676', 'Hays'),
        ('Owen Mitchell', 'Storytelling songwriter with Townes Van Zandt vibes. Plays 200+ shows per year.', ARRAY['Folk', 'Americana', 'Singer-Songwriter'], 15, 250.00, 'Bandera', 'TX', '78003', 'Bandera'),
        ('The Lonesome Highway Band', 'Five-piece country band covering classic and modern country. Available for festivals and venues.', ARRAY['Country', 'Classic Country'], 8, 600.00, 'Boerne', 'TX', '78006', 'Kendall'),
        ('Whiskey Creek', 'Country rock band with originals and crowd favorites. Three-part harmonies. Dance floor rockers.', ARRAY['Country', 'Rock'], 10, 550.00, 'Dripping Springs', 'TX', '78620', 'Hays'),
        ('Hill Country Revival', 'Americana band blending country, folk, and rock. Original songs about Texas life.', ARRAY['Americana', 'Country', 'Folk'], 6, 500.00, 'Comfort', 'TX', '78013', 'Kendall'),
        ('The Guadalupe Blues Band', 'Six-piece blues powerhouse. Horn section. Soul, R&B, and blues. Gets crowds dancing.', ARRAY['Blues', 'Soul', 'R&B'], 12, 750.00, 'New Braunfels', 'TX', '78130', 'Comal'),
        ('Cypress Creek', 'Classic rock covers and originals. 70s/80s rock focus. Five piece with killer harmonies.', ARRAY['Rock', 'Classic Rock'], 9, 650.00, 'Wimberley', 'TX', '78676', 'Hays'),
        ('The Miller Brothers', 'Acoustic duo playing country, folk, and Americana. Tight harmonies. Perfect for listening rooms.', ARRAY['Country', 'Folk', 'Americana'], 10, 350.00, 'Fredericksburg', 'TX', '78624', 'Gillespie'),
        ('Sarah and Jake', 'Husband-wife duo. Country and classic rock covers. Male/female harmonies create magic.', ARRAY['Country', 'Rock'], 8, 300.00, 'Kerrville', 'TX', '78028', 'Kerr'),
        ('Austin Reed', 'Singer-songwriter with compelling narratives. Influences from John Prine to Jason Isbell.', ARRAY['Americana', 'Singer-Songwriter'], 9, 220.00, 'Austin', 'TX', '78702', 'Travis'),
        ('Megan Hart', 'Powerhouse country vocalist. Traditional and contemporary country. Crowd favorite.', ARRAY['Country'], 11, 280.00, 'Boerne', 'TX', '78006', 'Kendall'),
        ('The Bandera Boys', 'Classic Texas country band. Western swing, honky-tonk, and dancehall favorites.', ARRAY['Country', 'Western Swing'], 14, 650.00, 'Bandera', 'TX', '78003', 'Bandera'),
        ('Blue Ridge', 'Bluegrass and folk. Traditional instrumentation. Perfect for festivals and listening rooms.', ARRAY['Bluegrass', 'Folk'], 12, 500.00, 'Wimberley', 'TX', '78676', 'Hays'),
        ('Canyon Lake Sound', 'Jam band mixing rock, funk, and country. Improvisational style. High energy performances.', ARRAY['Rock', 'Funk', 'Jam Band'], 7, 475.00, 'Canyon Lake', 'TX', '78133', 'Comal'),
        ('Lisa Morgan', 'Jazz and soul vocalist. Standards and originals. Elegant performances for upscale venues.', ARRAY['Jazz', 'Soul'], 16, 325.00, 'Fredericksburg', 'TX', '78624', 'Gillespie')
      ) AS m(name, bio, genres, exp, rate, city, state, zip, county)
      ORDER BY random()
    )
    SELECT * FROM musician_templates
    LIMIT musician_count
  LOOP
    -- Generate unique ID
    new_musician_id := gen_random_uuid();
    
    -- Create demo email
    demo_email := 'demo.' || lower(replace(musician_data.name, ' ', '.')) || '.' || substr(md5(random()::text), 1, 8) || '@gigmate.demo';
    demo_password := 'DemoPass' || floor(random() * 10000)::text;
    
    -- Create auth user
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      new_musician_id,
      demo_email,
      crypt(demo_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('demo_account', true, 'stage_name', musician_data.name),
      false,
      'authenticated'
    );
    
    -- Create profile
    INSERT INTO profiles (
      id,
      user_type,
      full_name,
      email
    ) VALUES (
      new_musician_id,
      'musician',
      musician_data.name,
      demo_email
    );
    
    -- Create musician
    INSERT INTO musicians (
      id,
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
      new_musician_id,
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
        WHEN 'Canyon Lake' THEN 29.8670 + (random() * 0.03 - 0.015)
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
        WHEN 'Canyon Lake' THEN -98.2630 + (random() * 0.03 - 0.015)
        ELSE -98.5 + (random() * 0.5 - 0.25)
      END
    );
    
    INSERT INTO seed_data_log (entity_type, entity_id, seed_batch, metadata)
    VALUES ('musician', new_musician_id, 'texas_phase1', jsonb_build_object('city', musician_data.city, 'type', CASE WHEN musician_data.name LIKE '% Band' OR musician_data.name LIKE 'The %' THEN 'band' ELSE 'solo' END));
    
    RETURN QUERY SELECT new_musician_id, musician_data.name, musician_data.city || ', ' || musician_data.state;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
