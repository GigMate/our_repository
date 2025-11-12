import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SeedRequest {
  musicians?: number;
  venues?: number;
  fans?: number;
  sponsors?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { musicians = 250, venues = 60, fans = 2000, sponsors = 25 } = await req.json() as SeedRequest;

    const messages: string[] = [];
    const log = (msg: string) => {
      console.log(msg);
      messages.push(msg);
    };

    log(`Starting database seeding: ${musicians} musicians, ${venues} venues, ${fans} fans, ${sponsors} sponsors...`);

    const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa', 'Anthony', 'Betty', 'Mark', 'Margaret', 'Donald', 'Sandra'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];
    const musicGenres = ['Country', 'Texas Country', 'Red Dirt', 'Honky Tonk', 'Western Swing', 'Rock', 'Blues', 'Americana', 'Folk', 'Jazz', 'R&B', 'Pop', 'Southern Rock', 'Outlaw Country', 'Progressive Country'];

    const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    // Real Texas Hill Country Venues (30 real venues)
    const realVenues = [
      { name: 'Gruene Hall', city: 'New Braunfels', capacity: 600, lat: 29.7374, lng: -98.1029, county: 'Comal', state: 'TX' },
      { name: 'The Roundup', city: 'Bandera', capacity: 350, lat: 29.7220, lng: -99.0734, county: 'Bandera', state: 'TX' },
      { name: 'Luckenbach Texas', city: 'Luckenbach', capacity: 400, lat: 30.2453, lng: -98.9101, county: 'Gillespie', state: 'TX' },
      { name: 'Whitewater Amphitheatre', city: 'New Braunfels', capacity: 2500, lat: 29.8555, lng: -98.1758, county: 'Comal', state: 'TX' },
      { name: '11th Street Cowboy Bar', city: 'Bandera', capacity: 250, lat: 29.7274, lng: -99.0734, county: 'Bandera', state: 'TX' },
      { name: 'Arkey Blues Silver Dollar', city: 'Bandera', capacity: 200, lat: 29.7266, lng: -99.0731, county: 'Bandera', state: 'TX' },
      { name: 'The Twisted X Saloon', city: 'Bandera', capacity: 175, lat: 29.7280, lng: -99.0720, county: 'Bandera', state: 'TX' },
      { name: 'Old 300 BBQ', city: 'Blanco', capacity: 150, lat: 30.0984, lng: -98.4212, county: 'Blanco', state: 'TX' },
      { name: 'Redbud Cafe & Pub', city: 'Blanco', capacity: 100, lat: 30.0982, lng: -98.4218, county: 'Blanco', state: 'TX' },
      { name: 'Devil\'s Backbone Tavern', city: 'Fischer', capacity: 300, lat: 29.9694, lng: -98.2689, county: 'Comal', state: 'TX' },
      { name: 'The Bunker Live Music', city: 'Blanco', capacity: 120, lat: 30.0975, lng: -98.4225, county: 'Blanco', state: 'TX' },
      { name: 'Hondo\'s on Main', city: 'Fredericksburg', capacity: 225, lat: 30.2752, lng: -98.8714, county: 'Gillespie', state: 'TX' },
      { name: 'Luckenbach Dance Hall', city: 'Luckenbach', capacity: 500, lat: 30.2447, lng: -98.9095, county: 'Gillespie', state: 'TX' },
      { name: 'The Dodging Duck Brewhaus', city: 'Boerne', capacity: 180, lat: 29.7947, lng: -98.7317, county: 'Kendall', state: 'TX' },
      { name: 'Cibolo Creek Brewing Co', city: 'Boerne', capacity: 200, lat: 29.7885, lng: -98.7303, county: 'Kendall', state: 'TX' },
      { name: 'The River Road Icehouse', city: 'New Braunfels', capacity: 225, lat: 29.7030, lng: -98.1245, county: 'Comal', state: 'TX' },
      { name: 'Krause\'s Cafe & Biergarten', city: 'New Braunfels', capacity: 350, lat: 29.7019, lng: -98.1175, county: 'Comal', state: 'TX' },
      { name: 'The Alamo Beer Company', city: 'San Antonio', capacity: 400, lat: 29.4252, lng: -98.4946, county: 'Bexar', state: 'TX' },
      { name: 'Freiheit Country Store', city: 'New Braunfels', capacity: 275, lat: 29.7350, lng: -98.1392, county: 'Comal', state: 'TX' },
      { name: 'The Pour House', city: 'Boerne', capacity: 150, lat: 29.7951, lng: -98.7322, county: 'Kendall', state: 'TX' },
      { name: 'Old German Beer Garden', city: 'Fredericksburg', capacity: 300, lat: 30.2758, lng: -98.8722, county: 'Gillespie', state: 'TX' },
      { name: 'Alamo Springs Cafe', city: 'Fredericksburg', capacity: 175, lat: 30.1945, lng: -98.9156, county: 'Gillespie', state: 'TX' },
      { name: 'Ausländer Biergarten', city: 'Fredericksburg', capacity: 400, lat: 30.2741, lng: -98.8701, county: 'Gillespie', state: 'TX' },
      { name: 'Cabernet Grill', city: 'Fredericksburg', capacity: 125, lat: 30.2749, lng: -98.8718, county: 'Gillespie', state: 'TX' },
      { name: 'The Vaudeville', city: 'San Antonio', capacity: 450, lat: 29.4241, lng: -98.4936, county: 'Bexar', state: 'TX' },
      { name: 'Lonesome Rose', city: 'San Antonio', capacity: 350, lat: 29.4258, lng: -98.4945, county: 'Bexar', state: 'TX' },
      { name: 'Sam\'s Burger Joint', city: 'San Antonio', capacity: 525, lat: 29.4368, lng: -98.4615, county: 'Bexar', state: 'TX' },
      { name: 'The Rustic', city: 'San Antonio', capacity: 600, lat: 29.4251, lng: -98.4947, county: 'Bexar', state: 'TX' },
      { name: 'Paper Tiger', city: 'San Antonio', capacity: 800, lat: 29.4362, lng: -98.4612, county: 'Bexar', state: 'TX' },
      { name: 'Gruene River Grill', city: 'New Braunfels', capacity: 200, lat: 29.7368, lng: -98.1034, county: 'Comal', state: 'TX' },
    ];

    // Create real venues first
    log(`Creating ${realVenues.length} real Texas Hill Country venues...`);
    for (let i = 0; i < realVenues.length; i++) {
      const venue = realVenues[i];
      const email = `${venue.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@venue.gigmate.us`;
      const password = 'testpass123';

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: venue.name,
          user_type: 'venue',
        },
      });

      if (authError) {
        log(`Error creating venue ${venue.name}: ${authError.message}`);
        continue;
      }

      if (authData.user) {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          email,
          full_name: venue.name,
          user_type: 'venue',
          venue_name: venue.name,
          capacity: venue.capacity,
          city: venue.city,
          state: venue.state,
          county: venue.county,
          latitude: venue.lat,
          longitude: venue.lng,
        });
      }
    }
    log(`✓ Created ${realVenues.length} real venues`);

    // Create additional synthetic venues if needed
    const remainingVenues = venues - realVenues.length;
    if (remainingVenues > 0) {
      log(`Creating ${remainingVenues} additional venues...`);
      const venueTypes = ['Bar', 'Tavern', 'Honky Tonk', 'Saloon', 'Dance Hall', 'Music Hall', 'Roadhouse', 'Icehouse'];
      const venueAdjectives = ['Rusty', 'Silver', 'Golden', 'Blue', 'Red', 'Lonesome', 'Happy', 'Wild'];

      for (let i = 0; i < remainingVenues; i++) {
        const venueName = `${randomItem(venueAdjectives)} ${randomItem(venueTypes)}`;
        const email = `venue${realVenues.length + i + 1}@test.gigmate.us`;
        const password = 'testpass123';

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: venueName,
            user_type: 'venue',
          },
        });

        if (authError) {
          log(`Error creating venue ${i + 1}: ${authError.message}`);
          continue;
        }

        if (authData.user) {
          await supabase.from('profiles').upsert({
            id: authData.user.id,
            email,
            full_name: venueName,
            user_type: 'venue',
            venue_name: venueName,
            capacity: 100 + Math.floor(Math.random() * 400),
            city: randomItem(['Austin', 'San Antonio', 'Fredericksburg', 'Boerne', 'New Braunfels']),
            state: 'TX',
            latitude: 29.5 + Math.random() * 1.5,
            longitude: -98.5 - Math.random() * 1.0,
          });
        }

        if ((i + 1) % 10 === 0) {
          log(`Created ${realVenues.length + i + 1}/${venues} total venues`);
        }
      }
    }

    // Create musicians
    log(`Creating ${musicians} musicians...`);
    for (let i = 0; i < musicians; i++) {
      const email = `musician${i + 1}@test.gigmate.us`;
      const password = 'testpass123';

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
          user_type: 'musician',
        },
      });

      if (authError) {
        log(`Error creating musician ${i + 1}: ${authError.message}`);
        continue;
      }

      if (authData.user) {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          email,
          full_name: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
          user_type: 'musician',
          genres: [randomItem(musicGenres), randomItem(musicGenres)],
          city: randomItem(['Austin', 'San Antonio', 'Fredericksburg', 'Boerne', 'New Braunfels', 'Bandera', 'Blanco']),
          state: 'TX',
          latitude: 29.5 + Math.random() * 1.5,
          longitude: -98.5 - Math.random() * 1.0,
        });
      }

      if ((i + 1) % 50 === 0) {
        log(`Created ${i + 1}/${musicians} musicians`);
      }
    }

    // Create fans
    log(`Creating ${fans} fans...`);
    for (let i = 0; i < fans; i++) {
      const email = `fan${i + 1}@test.gigmate.us`;
      const password = 'testpass123';

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
          user_type: 'fan',
        },
      });

      if (authError) {
        log(`Error creating fan ${i + 1}: ${authError.message}`);
        continue;
      }

      if (authData.user) {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          email,
          full_name: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
          user_type: 'fan',
        });
      }

      if ((i + 1) % 100 === 0) {
        log(`Created ${i + 1}/${fans} fans`);
      }
    }

    // Create sponsors
    log(`Creating ${sponsors} sponsors...`);
    const sponsorBusinesses = [
      'Shiner Beer', 'Real Ale Brewing', 'Lone Star Beer', 'Pearl Brewing', 'Ranger Creek Brewing',
      'Freetail Brewing', 'Boerne Brewing', 'Fredericksburg Brewing', 'New Braunfels Brewing',
      'Hill Country BBQ', 'Texas Hill Country Olive Oil', 'Becker Vineyards', 'Pedernales Cellars',
      'Grape Creek Vineyards', 'Texas Hills Vineyard', 'Lost Maples Winery', 'Chisholm Trail Winery',
      'Cooper\'s BBQ', 'Rudy\'s BBQ', 'Bill Miller BBQ', 'Clear Springs Restaurant', 'Cibolo Meat Market',
      'Texas Farm Bureau', 'San Antonio Express-News', 'Texas Monthly'
    ];

    for (let i = 0; i < sponsors; i++) {
      const sponsorName = i < sponsorBusinesses.length ? sponsorBusinesses[i] : `Sponsor Business ${i + 1}`;
      const email = `sponsor${i + 1}@test.gigmate.us`;
      const password = 'testpass123';

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: sponsorName,
          user_type: 'consumer',
        },
      });

      if (authError) {
        log(`Error creating sponsor ${i + 1}: ${authError.message}`);
        continue;
      }

      if (authData.user) {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          email,
          full_name: sponsorName,
          user_type: 'consumer',
        });
      }
    }
    log(`✓ Created ${sponsors} sponsors`);

    log('✓ Database seeding completed successfully!');
    log(`Total: ${musicians + venues + fans + sponsors} accounts created`);
    log(`  - ${venues} venues (${realVenues.length} real Texas Hill Country venues!)`);
    log(`  - ${musicians} musicians`);
    log(`  - ${fans} fans`);
    log(`  - ${sponsors} sponsors`);
    log('Password for all test accounts: testpass123');

    return new Response(
      JSON.stringify({ success: true, messages }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Seeding error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
