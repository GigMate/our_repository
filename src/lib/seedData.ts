import { supabase } from './supabase';

// Sample data pools
const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
  'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen',
  'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra',
  'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa', 'Timothy', 'Deborah',
  'Ronald', 'Stephanie', 'Edward', 'Rebecca', 'Jason', 'Sharon', 'Jeffrey', 'Laura', 'Ryan', 'Cynthia',
  'Jacob', 'Kathleen', 'Gary', 'Amy', 'Nicholas', 'Angela', 'Eric', 'Shirley', 'Jonathan', 'Anna',
  'Stephen', 'Brenda', 'Larry', 'Pamela', 'Justin', 'Emma', 'Scott', 'Nicole', 'Brandon', 'Helen',
  'Benjamin', 'Samantha', 'Samuel', 'Katherine', 'Raymond', 'Christine', 'Gregory', 'Debra', 'Frank', 'Rachel',
  'Alexander', 'Carolyn', 'Patrick', 'Janet', 'Jack', 'Catherine', 'Dennis', 'Maria', 'Jerry', 'Heather'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez'
];

const musicGenres = [
  'Rock', 'Jazz', 'Blues', 'Country', 'Pop', 'Hip Hop', 'R&B', 'Electronic', 'Folk', 'Classical',
  'Metal', 'Punk', 'Reggae', 'Soul', 'Funk', 'Indie', 'Alternative', 'Latin', 'Bluegrass', 'Gospel'
];

const instruments = [
  'Guitar', 'Piano', 'Drums', 'Bass', 'Vocals', 'Saxophone', 'Trumpet', 'Violin', 'Keyboard', 'Flute',
  'Clarinet', 'Trombone', 'Cello', 'Banjo', 'Harmonica', 'Accordion', 'Mandolin', 'Ukulele'
];

const venueTypes = [
  'Bar', 'Restaurant', 'Club', 'Theater', 'Arena', 'Coffee Shop', 'Brewery', 'Winery', 'Hotel', 'Casino'
];

const realVenues = [
  { name: 'The Roundup', city: 'Boerne', state: 'TX', county: 'Kendall', lat: 29.7847, lng: -98.7319, type: 'Music Hall', capacity: 300, genres: ['Country', 'Rock', 'Texas Country'] },
  { name: 'Sisterdale Saloon', city: 'Sisterdale', state: 'TX', county: 'Kendall', lat: 29.8533, lng: -98.6961, type: 'Saloon', capacity: 150, genres: ['Country', 'Americana', 'Blues'] },
  { name: 'The Cibolo Creek', city: 'Boerne', state: 'TX', county: 'Kendall', lat: 29.7952, lng: -98.7320, type: 'Bar', capacity: 200, genres: ['Country', 'Rock', 'Folk'] },
  { name: 'Rockbox Theater', city: 'Fredericksburg', state: 'TX', county: 'Gillespie', lat: 30.2752, lng: -98.8714, type: 'Theater', capacity: 400, genres: ['Rock', 'Country', 'Blues', 'Comedy'] },
  { name: 'Luckenbach Texas', city: 'Luckenbach', state: 'TX', county: 'Gillespie', lat: 30.2461, lng: -98.9072, type: 'Dance Hall', capacity: 350, genres: ['Country', 'Outlaw Country', 'Western Swing'] },
  { name: 'Hondo\'s On Main', city: 'Fredericksburg', state: 'TX', county: 'Gillespie', lat: 30.2752, lng: -98.8714, type: 'Bar', capacity: 180, genres: ['Country', 'Singer-Songwriter', 'Gospel'] },
  { name: 'Crossroads Saloon & Steakhouse', city: 'Fredericksburg', state: 'TX', county: 'Gillespie', lat: 30.2752, lng: -98.8714, type: 'Saloon', capacity: 250, genres: ['Country', 'Rock', 'Dance'] },
  { name: 'Hill Top Café', city: 'Fredericksburg', state: 'TX', county: 'Gillespie', lat: 30.2752, lng: -98.8714, type: 'Restaurant', capacity: 120, genres: ['Gospel', 'Blues', 'Acoustic'] },
  { name: 'The Hive', city: 'Fredericksburg', state: 'TX', county: 'Gillespie', lat: 30.2752, lng: -98.8714, type: 'Bar', capacity: 200, genres: ['Country', 'Rock', 'Dance'] },
  { name: 'Yee Haw Saloon', city: 'Fredericksburg', state: 'TX', county: 'Gillespie', lat: 30.2752, lng: -98.8714, type: 'Saloon', capacity: 150, genres: ['Country', 'Texas Country'] },
  { name: 'Texas Cannon', city: 'Blanco', state: 'TX', county: 'Blanco', lat: 30.0969, lng: -98.4203, type: 'Bar', capacity: 100, genres: ['Country', 'Folk', 'Singer-Songwriter'] },
  { name: 'Red Bud Cafe', city: 'Blanco', state: 'TX', county: 'Blanco', lat: 30.0969, lng: -98.4203, type: 'Restaurant', capacity: 80, genres: ['Acoustic', 'Folk', 'Country'] },
  { name: 'Old 300 BBQ', city: 'Blanco', state: 'TX', county: 'Blanco', lat: 30.0969, lng: -98.4203, type: 'Restaurant', capacity: 120, genres: ['Country', 'Blues', 'Americana'] },
  { name: 'Whitewater Amphitheatre', city: 'New Braunfels', state: 'TX', county: 'Comal', lat: 29.7030, lng: -98.1245, type: 'Amphitheater', capacity: 3000, genres: ['Country', 'Rock', 'Pop', 'Alternative'] },
  { name: 'Gruene Hall', city: 'New Braunfels', state: 'TX', county: 'Comal', lat: 29.7410, lng: -98.1020, type: 'Dance Hall', capacity: 500, genres: ['Country', 'Blues', 'Rock', 'Singer-Songwriter'] },
  { name: 'The Brauntex Theatre', city: 'New Braunfels', state: 'TX', county: 'Comal', lat: 29.7030, lng: -98.1245, type: 'Theater', capacity: 450, genres: ['Rock', 'Jazz', 'Classical', 'Theater'] },
  { name: 'Billy\'s Ice', city: 'New Braunfels', state: 'TX', county: 'Comal', lat: 29.7030, lng: -98.1245, type: 'Bar', capacity: 250, genres: ['Country', 'Rock', 'Dance'] },
  { name: 'Watering Hole Saloon', city: 'New Braunfels', state: 'TX', county: 'Comal', lat: 29.7030, lng: -98.1245, type: 'Saloon', capacity: 300, genres: ['Country', 'Texas Country', 'Dance'] },
  { name: 'Freiheit Country Store', city: 'New Braunfels', state: 'TX', county: 'Comal', lat: 29.7030, lng: -98.1245, type: 'Bar', capacity: 200, genres: ['Country', 'Americana', 'Rock'] },
  { name: 'Krause\'s Café', city: 'New Braunfels', state: 'TX', county: 'Comal', lat: 29.7030, lng: -98.1245, type: 'Restaurant', capacity: 180, genres: ['Polka', 'German', 'Folk'] },
  { name: '11th Street Cowboy Bar', city: 'Bandera', state: 'TX', county: 'Bandera', lat: 29.7267, lng: -99.0731, type: 'Bar', capacity: 250, genres: ['Country', 'Western Swing', 'Honky-Tonk'] },
  { name: 'Arkey Blue\'s Silver Dollar', city: 'Bandera', state: 'TX', county: 'Bandera', lat: 29.7267, lng: -99.0731, type: 'Saloon', capacity: 200, genres: ['Country', 'Honky-Tonk', 'Western'] },
  { name: 'Longhorn Saloon', city: 'Bandera', state: 'TX', county: 'Bandera', lat: 29.7267, lng: -99.0731, type: 'Saloon', capacity: 180, genres: ['Country', 'Dance', 'Texas Country'] },
  { name: 'Ridge Rock Amphitheater', city: 'Kerrville', state: 'TX', county: 'Kerr', lat: 30.0474, lng: -99.1403, type: 'Amphitheater', capacity: 500, genres: ['Country', 'Blues', 'Folk', 'Christian'] },
  { name: 'Cailloux Theater', city: 'Kerrville', state: 'TX', county: 'Kerr', lat: 30.0474, lng: -99.1403, type: 'Theater', capacity: 830, genres: ['Classical', 'Jazz', 'Symphony'] },
  { name: 'Arcadia Live Theatre', city: 'Kerrville', state: 'TX', county: 'Kerr', lat: 30.0474, lng: -99.1403, type: 'Theater', capacity: 300, genres: ['Rock', 'Country', 'Comedy'] },
  { name: 'Azul Lounge', city: 'Kerrville', state: 'TX', county: 'Kerr', lat: 30.0474, lng: -99.1403, type: 'Bar', capacity: 100, genres: ['Blues', 'Jazz', 'R&B'] },
  { name: 'The Inn Pub', city: 'Kerrville', state: 'TX', county: 'Kerr', lat: 30.0474, lng: -99.1403, type: 'Bar', capacity: 150, genres: ['Country', 'Western', 'Rock'] },
  { name: 'Pint & Plow Brewing Co.', city: 'Kerrville', state: 'TX', county: 'Kerr', lat: 30.0474, lng: -99.1403, type: 'Brewery', capacity: 120, genres: ['Acoustic', 'Folk', 'Indie'] },
];

const cities = [
  { name: 'Nashville', state: 'TN', county: 'Davidson', lat: 36.1627, lng: -86.7816 },
  { name: 'Austin', state: 'TX', county: 'Travis', lat: 30.2672, lng: -97.7431 },
  { name: 'Los Angeles', state: 'CA', county: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  { name: 'New York', state: 'NY', county: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'Chicago', state: 'IL', county: 'Cook', lat: 41.8781, lng: -87.6298 },
  { name: 'Seattle', state: 'WA', county: 'King', lat: 47.6062, lng: -122.3321 },
  { name: 'Portland', state: 'OR', county: 'Multnomah', lat: 45.5152, lng: -122.6784 },
  { name: 'Denver', state: 'CO', county: 'Denver', lat: 39.7392, lng: -104.9903 },
  { name: 'Atlanta', state: 'GA', county: 'Fulton', lat: 33.7490, lng: -84.3880 },
  { name: 'Miami', state: 'FL', county: 'Miami-Dade', lat: 25.7617, lng: -80.1918 },
  { name: 'Boston', state: 'MA', county: 'Suffolk', lat: 42.3601, lng: -71.0589 },
  { name: 'San Francisco', state: 'CA', county: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  { name: 'Philadelphia', state: 'PA', county: 'Philadelphia', lat: 39.9526, lng: -75.1652 },
  { name: 'Phoenix', state: 'AZ', county: 'Maricopa', lat: 33.4484, lng: -112.0740 },
  { name: 'New Orleans', state: 'LA', county: 'Orleans', lat: 29.9511, lng: -90.0715 }
];

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}


export async function seedDatabase(onProgress?: (message: string) => void) {
  const log = (message: string) => {
    console.log(message);
    if (onProgress) onProgress(message);
  };

  log('Starting database seeding...');

  try {
    const musicians = [];
    const venues = [];
    const fans = [];

    // Refresh session periodically during long operation
    let lastRefresh = Date.now();
    const refreshIfNeeded = async () => {
      if (Date.now() - lastRefresh > 90 * 1000) { // Every 90 seconds
        log('[System] Refreshing session to prevent timeout...');
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          log(`[Warning] Session refresh failed: ${error.message}`);
        }
        lastRefresh = Date.now();
      }
    };

    // Create 100 Musicians
    log('Creating 100 musicians...');
    for (let i = 0; i < 100; i++) {
      await refreshIfNeeded();
      const firstName = randomItem(firstNames);
      const lastName = randomItem(lastNames);
      const city = randomItem(cities);
      const genres = randomItems(musicGenres, Math.floor(Math.random() * 3) + 1);
      const instrumentList = randomItems(instruments, Math.floor(Math.random() * 3) + 1);

      const email = `${lastName.toLowerCase()}.musician${i + 1}@gigmate.us`;
      const password = 'password123';

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${firstName} ${lastName}`,
            user_type: 'musician'
          },
          emailRedirectTo: undefined
        }
      });

      if (authError) {
        console.error(`Error creating musician ${i + 1}:`, authError.message);
        continue;
      }

      const userId = authData.user?.id;
      if (!userId) {
        console.error(`No user ID returned for musician ${i + 1}`);
        continue;
      }

      await supabase.from('profiles').upsert({
        id: userId,
        full_name: `${firstName} ${lastName}`,
        email,
        user_type: 'musician',
        stage_name: `${firstName} ${randomItem(['and the', '&'])} ${randomItem(['Band', 'Group', 'Trio'])}`,
        bio: `Professional ${genres.join(', ')} musician with ${5 + Math.floor(Math.random() * 20)} years experience.`,
        genres,
        instruments: instrumentList,
        experience_years: 5 + Math.floor(Math.random() * 20),
        hourly_rate: 50 + Math.floor(Math.random() * 200),
        rating_average: 3.5 + Math.random() * 1.5,
        rating_count: Math.floor(Math.random() * 50),
        city: city.name,
        state: city.state,
        county: city.county,
        latitude: city.lat + (Math.random() - 0.5) * 0.2,
        longitude: city.lng + (Math.random() - 0.5) * 0.2,
      });

      musicians.push({ id: userId, name: `${firstName} ${lastName}`, email });

      const today = new Date();
      for (let j = 0; j < 5; j++) {
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + Math.floor(Math.random() * 30) + 1);
        const startHour = 18 + Math.floor(Math.random() * 4);
        const startTime = new Date(futureDate);
        startTime.setHours(startHour, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setHours(startHour + 2 + Math.floor(Math.random() * 2), 0, 0, 0);

        await supabase.from('availability_slots').insert({
          user_id: userId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          is_available: Math.random() > 0.3,
        });
      }

      log(`Created musician ${i + 1}/100`);
    }

    log('Creating 100 venues (prioritizing real TX Hill Country venues)...');
    for (let i = 0; i < 100; i++) {
      await refreshIfNeeded();
      const firstName = randomItem(firstNames);
      const lastName = randomItem(lastNames);

      let venueName: string;
      let venueCity: string;
      let venueState: string;
      let venueCounty: string;
      let venueLat: number;
      let venueLng: number;
      let venueType: string;
      let venueCapacity: number;
      let venueGenres: string[];

      if (i < realVenues.length) {
        const realVenue = realVenues[i];
        venueName = realVenue.name;
        venueCity = realVenue.city;
        venueState = realVenue.state;
        venueCounty = realVenue.county;
        venueLat = realVenue.lat;
        venueLng = realVenue.lng;
        venueType = realVenue.type;
        venueCapacity = realVenue.capacity;
        venueGenres = realVenue.genres;
      } else {
        const city = randomItem(cities);
        venueType = randomItem(venueTypes);
        venueName = `${randomItem(['The', 'Blue', 'Red', 'Golden', 'Silver'])} ${randomItem(['Note', 'Stage', 'Lounge', 'Hall', 'Room'])}`;
        venueCity = city.name;
        venueState = city.state;
        venueCounty = city.county;
        venueLat = city.lat + (Math.random() - 0.5) * 0.2;
        venueLng = city.lng + (Math.random() - 0.5) * 0.2;
        venueCapacity = 50 + Math.floor(Math.random() * 450);
        venueGenres = randomItems(musicGenres, Math.floor(Math.random() * 4) + 2);
      }

      const email = `${lastName.toLowerCase()}.venue${i + 1}@gigmate.us`;
      const password = 'password123';

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${firstName} ${lastName}`,
            user_type: 'venue'
          },
          emailRedirectTo: undefined
        }
      });

      if (authError) {
        console.error(`Error creating venue ${i + 1}:`, authError.message);
        continue;
      }

      const userId = authData.user?.id;
      if (!userId) {
        console.error(`No user ID returned for venue ${i + 1}`);
        continue;
      }

      await supabase.from('profiles').upsert({
        id: userId,
        full_name: `${firstName} ${lastName}`,
        email,
        user_type: 'venue',
        venue_name: venueName,
        bio: i < realVenues.length
          ? `${venueName} is a real live music venue in ${venueCity}, Texas featuring ${venueGenres.join(', ')} music.`
          : `${venueName} is a premier ${venueType.toLowerCase()} featuring live music.`,
        venue_type: venueType,
        capacity: venueCapacity,
        preferred_genres: venueGenres,
        city: venueCity,
        state: venueState,
        county: venueCounty,
        latitude: venueLat,
        longitude: venueLng,
        rating_average: 3.5 + Math.random() * 1.5,
        rating_count: Math.floor(Math.random() * 100),
      });

      venues.push({ id: userId, name: venueName, email });
      log(`Created venue ${i + 1}/100: ${venueName}`);
    }

    log('Creating 100 fans...');
    for (let i = 0; i < 100; i++) {
      await refreshIfNeeded();
      const firstName = randomItem(firstNames);
      const lastName = randomItem(lastNames);
      const city = randomItem(cities);
      const favoriteGenres = randomItems(musicGenres, Math.floor(Math.random() * 4) + 1);

      const email = `${lastName.toLowerCase()}.fan${i + 1}@gigmate.us`;
      const password = 'password123';

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${firstName} ${lastName}`,
            user_type: 'fan'
          },
          emailRedirectTo: undefined
        }
      });

      if (authError) {
        console.error(`Error creating fan ${i + 1}:`, authError.message);
        continue;
      }

      const userId = authData.user?.id;
      if (!userId) {
        console.error(`No user ID returned for fan ${i + 1}`);
        continue;
      }

      await supabase.from('profiles').upsert({
        id: userId,
        full_name: `${firstName} ${lastName}`,
        email,
        user_type: 'fan',
        bio: `Music enthusiast who loves ${favoriteGenres.join(', ')}.`,
        favorite_genres: favoriteGenres,
        city: city.name,
        state: city.state,
        county: city.county,
        latitude: city.lat + (Math.random() - 0.5) * 0.2,
        longitude: city.lng + (Math.random() - 0.5) * 0.2,
      });

      fans.push({ id: userId, name: `${firstName} ${lastName}`, email });
      log(`Created fan ${i + 1}/100`);
    }

    log('Creating events, bookings, and interactions...');

    for (let i = 0; i < 50; i++) {
      const venue = randomItem(venues);
      const musician = randomItem(musicians);
      const genres = randomItems(musicGenres, 2);

      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 60));
      eventDate.setHours(19 + Math.floor(Math.random() * 4), 0, 0, 0);

      await supabase.from('events').insert({
        venue_id: venue.id,
        musician_id: musician.id,
        title: `Live ${genres.join(' & ')} Night`,
        description: `Join us for ${genres.join(' and ')} music!`,
        event_date: eventDate.toISOString(),
        ticket_price: 10 + Math.floor(Math.random() * 40),
        available_tickets: 50 + Math.floor(Math.random() * 150),
        genres,
      });
    }

    for (let i = 0; i < 30; i++) {
      const venue = randomItem(venues);
      const musician = randomItem(musicians);

      const startTime = new Date();
      startTime.setDate(startTime.getDate() + Math.floor(Math.random() * 45) + 15);
      startTime.setHours(19, 0, 0, 0);
      const endTime = new Date(startTime);
      endTime.setHours(22, 0, 0, 0);

      await supabase.from('bookings').insert({
        venue_id: venue.id,
        musician_id: musician.id,
        title: `Performance ${new Date(startTime).toLocaleDateString()}`,
        description: 'Live music performance',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        offered_payment: 200 + Math.floor(Math.random() * 600),
        request_status: randomItem(['pending', 'accepted']),
      });
    }

    log('Initializing credit accounts and subscriptions...');
    for (const musician of musicians) {
      await supabase.rpc('initialize_user_credits', { p_user_id: musician.id, p_tier: 'free' });
      await supabase.rpc('upsert_user_subscription', {
        p_user_id: musician.id,
        p_plan_name: 'free',
        p_billing_cycle: 'monthly'
      });
    }

    for (const venue of venues) {
      await supabase.rpc('initialize_user_credits', { p_user_id: venue.id, p_tier: 'free' });
      await supabase.rpc('upsert_user_subscription', {
        p_user_id: venue.id,
        p_plan_name: 'free',
        p_billing_cycle: 'monthly'
      });
    }

    for (const fan of fans) {
      await supabase.rpc('initialize_user_credits', { p_user_id: fan.id, p_tier: 'free' });
      await supabase.rpc('upsert_user_subscription', {
        p_user_id: fan.id,
        p_plan_name: 'free',
        p_billing_cycle: 'monthly'
      });
    }

    log('Creating sample message threads with credit tracking...');
    const messageScenarios = [
      {
        from: randomItem(venues),
        to: randomItem(musicians),
        fromType: 'venue',
        toType: 'musician',
        messages: [
          { text: "Hi! I'm interested in booking you for a Friday night show. Are you available the last weekend of next month?", type: 'initial_contact', cost: 2 },
          { text: "Thanks for reaching out! Yes, I'm available that weekend. What's your budget range?", type: 'reply', cost: 1, fromRecipient: true },
          { text: "We typically pay $400-600 depending on the set length. Would you be interested in a 2-hour set for $500?", type: 'booking_request', cost: 3 },
          { text: "That works for me! I can do a 2-hour set. Do you need me to bring my own sound equipment?", type: 'reply', cost: 1, fromRecipient: true },
          { text: "No, we have a full PA system. I'll send over the contract shortly.", type: 'contract_share', cost: 2 },
        ]
      },
      {
        from: randomItem(musicians),
        to: randomItem(venues),
        fromType: 'musician',
        toType: 'venue',
        messages: [
          { text: "Hello! I'm a country/folk artist looking for gigs in the area. Would you be interested in having me perform?", type: 'initial_contact', cost: 2 },
          { text: "Hi! We're always looking for new talent. Do you have a demo or EPK you can share?", type: 'reply', cost: 1, fromRecipient: true },
          { text: "Absolutely! Here's a link to my latest EP and some live performance videos.", type: 'media_attachment', cost: 2 },
          { text: "Great sound! We'd love to have you. How about Thursday, March 15th?", type: 'reply', cost: 1, fromRecipient: true },
        ]
      },
      {
        from: randomItem(musicians),
        to: randomItem(musicians),
        fromType: 'musician',
        toType: 'musician',
        messages: [
          { text: "Hey! Love your music. Would you be interested in collaborating on a show together?", type: 'initial_contact', cost: 1 },
          { text: "Thanks! I'd be down for that. Were you thinking co-headlining or opening slots?", type: 'reply', cost: 0, fromRecipient: true },
          { text: "Co-headlining would be awesome! We could split the door 50/50. I know a great venue.", type: 'reply', cost: 0 },
        ]
      },
      {
        from: randomItem(fans),
        to: randomItem(musicians),
        fromType: 'fan',
        toType: 'musician',
        messages: [
          { text: "I saw you perform last month and you were amazing! Any shows coming up soon?", type: 'initial_contact', cost: 0 },
          { text: "Thank you so much! Yes, I'm playing at The Roundup on the 23rd. Hope to see you there!", type: 'reply', cost: 0, fromRecipient: true },
          { text: "Perfect! I'll bring some friends. Do you have any merch available?", type: 'reply', cost: 1 },
          { text: "Absolutely! I have t-shirts, CDs, and vinyl at my shows. Also available on my GigMate profile!", type: 'reply', cost: 0, fromRecipient: true },
        ]
      },
      {
        from: randomItem(venues),
        to: randomItem(venues),
        fromType: 'venue',
        toType: 'venue',
        messages: [
          { text: "Hey, we have a band that cancelled for Saturday. Do you happen to have any recommendations for last-minute acts?", type: 'initial_contact', cost: 1 },
          { text: "Actually yes! The Sarah Johnson Band is fantastic and might be available. Highly recommend!", type: 'reply', cost: 0, fromRecipient: true },
        ]
      },
    ];

    for (const scenario of messageScenarios) {
      const conversationId = crypto.randomUUID();

      for (const msg of scenario.messages) {
        const senderId = msg.fromRecipient ? scenario.to.id : scenario.from.id;
        const recipientId = msg.fromRecipient ? scenario.from.id : scenario.to.id;
        const senderType = msg.fromRecipient ? scenario.toType : scenario.fromType;
        const recipientType = msg.fromRecipient ? scenario.fromType : scenario.toType;

        const { data: messageData } = await supabase.from('messages').insert({
          sender_id: senderId,
          recipient_id: recipientId,
          content: msg.text,
          conversation_id: conversationId,
        }).select().single();

        if (messageData && msg.cost > 0) {
          const spent = await supabase.rpc('spend_credits', {
            p_user_id: senderId,
            p_amount: msg.cost,
            p_reason: `Message to ${recipientType}: ${msg.type}`,
            p_entity_type: 'message',
            p_entity_id: messageData.id
          });

          if (spent) {
            await supabase.from('message_credits').insert({
              message_id: messageData.id,
              sender_id: senderId,
              recipient_id: recipientId,
              credit_cost: msg.cost,
              message_type: msg.type,
              sender_type: senderType,
              recipient_type: recipientType,
              was_free: false,
              reason_for_cost: `${senderType} → ${recipientType}: ${msg.type}`
            });
          }
        }
      }
    }

    log('Running weekly platform refresh...');
    await supabase.rpc('weekly_platform_refresh');

    log('Database seeding completed!');
    log('\nLogin format: lastname.musician#@gigmate.us');
    log('Password: password123');
    log('\nAll accounts are FREE with access to all features!');
    log('\nCredit System: Initialized for all users');
    log('Sample messages: Created with credit tracking');

    return { success: true, musicians, venues, fans };
  } catch (error) {
    console.error('Seeding error:', error);
    return { success: false, error };
  }
}

export const demoUsers = [
  {
    email: 'demo.fan@gigmate.us',
    password: 'demo123',
    full_name: 'Alex Thompson',
    user_type: 'fan' as const,
  },
  {
    email: 'demo.musician@gigmate.us',
    password: 'demo123',
    full_name: 'Jordan Rivers',
    user_type: 'musician' as const,
  },
  {
    email: 'demo.venue@gigmate.us',
    password: 'demo123',
    full_name: 'Sarah Martinez',
    user_type: 'venue' as const,
  },
];

export const demoVenues = [
  {
    venue_name: 'The Rustic Barn',
    description: 'Historic barn venue with authentic Texas charm and excellent acoustics',
    address: '123 Ranch Road',
    city: 'Kerrville',
    state: 'TX',
    zip_code: '78028',
    capacity: 200,
    amenities: ['Stage', 'Sound System', 'Bar', 'Outdoor Seating', 'Parking'],
    venue_type: 'Barn/Rustic',
    county: 'Kerr',
    preferred_genres: ['Country', 'Folk', 'Americana', 'Bluegrass'],
  },
  {
    venue_name: 'Hill Country Music Hall',
    description: 'Premier music venue featuring local and touring acts',
    address: '456 Main Street',
    city: 'Boerne',
    state: 'TX',
    zip_code: '78006',
    capacity: 350,
    amenities: ['Professional Stage', 'Full Bar', 'Dance Floor', 'VIP Area', 'Parking'],
    venue_type: 'Music Hall',
    county: 'Kendall',
    preferred_genres: ['Country', 'Rock', 'Blues', 'Honky-Tonk'],
  },
  {
    venue_name: 'Cypress Creek Winery',
    description: 'Beautiful winery with live music on weekends',
    address: '789 Vineyard Lane',
    city: 'Comfort',
    state: 'TX',
    zip_code: '78013',
    capacity: 150,
    amenities: ['Outdoor Stage', 'Wine Tasting', 'Patio Seating', 'Parking'],
    venue_type: 'Winery',
    county: 'Kendall',
    preferred_genres: ['Acoustic', 'Folk', 'Jazz', 'Classical'],
  },
  {
    venue_name: 'Fredericksburg Beer Garden',
    description: 'German-style beer garden with live music and great food',
    address: '321 Hauptstrasse',
    city: 'Fredericksburg',
    state: 'TX',
    zip_code: '78624',
    capacity: 250,
    amenities: ['Outdoor Stage', 'Full Bar', 'Restaurant', 'Beer Garden', 'Parking'],
    venue_type: 'Beer Garden',
    county: 'Gillespie',
    preferred_genres: ['Country', 'Rock', 'Pop', 'Dance'],
  },
  {
    venue_name: 'Luckenbach Dance Hall',
    description: 'Iconic Texas dance hall with rich musical history',
    address: '412 Luckenbach Town Loop',
    city: 'Fredericksburg',
    state: 'TX',
    zip_code: '78624',
    capacity: 300,
    amenities: ['Historic Stage', 'Dance Floor', 'Bar', 'General Store', 'Parking'],
    venue_type: 'Dance Hall',
    county: 'Gillespie',
    preferred_genres: ['Country', 'Honky-Tonk', 'Western Swing', 'Outlaw Country'],
  },
  {
    venue_name: 'Bandera Saloon',
    description: 'Authentic cowboy bar with live country music',
    address: '567 Main Street',
    city: 'Bandera',
    state: 'TX',
    zip_code: '78003',
    capacity: 180,
    amenities: ['Stage', 'Bar', 'Dance Floor', 'Pool Tables', 'Parking'],
    venue_type: 'Saloon',
    county: 'Bandera',
    preferred_genres: ['Country', 'Red Dirt', 'Texas Country', 'Outlaw Country'],
  },
  {
    venue_name: 'Blanco River Amphitheater',
    description: 'Outdoor amphitheater with stunning river views',
    address: '890 River Road',
    city: 'Blanco',
    state: 'TX',
    zip_code: '78606',
    capacity: 500,
    amenities: ['Outdoor Stage', 'Lawn Seating', 'Concessions', 'Restrooms', 'Parking'],
    venue_type: 'Amphitheater',
    county: 'Blanco',
    preferred_genres: ['Folk', 'Americana', 'Bluegrass', 'Country', 'Rock'],
  },
  {
    venue_name: 'New Braunfels Music Factory',
    description: 'Modern venue with state-of-the-art sound and lighting',
    address: '234 Industrial Drive',
    city: 'New Braunfels',
    state: 'TX',
    zip_code: '78130',
    capacity: 400,
    amenities: ['Professional Stage', 'Sound System', 'Lighting', 'Bar', 'VIP Area', 'Parking'],
    venue_type: 'Music Venue',
    county: 'Comal',
    preferred_genres: ['Rock', 'Blues', 'Country', 'Alternative', 'Tejano'],
  },
  {
    venue_name: 'Gruene Hall',
    description: 'Texas oldest dance hall, still hosting legendary performers',
    address: '1281 Gruene Road',
    city: 'New Braunfels',
    state: 'TX',
    zip_code: '78130',
    capacity: 350,
    amenities: ['Historic Stage', 'Dance Floor', 'Bar', 'Outdoor Beer Garden', 'Parking'],
    venue_type: 'Dance Hall',
    county: 'Comal',
    preferred_genres: ['Country', 'Blues', 'Americana', 'Texas Country'],
  },
  {
    venue_name: 'The Kerrville Folk Festival Grounds',
    description: 'Legendary outdoor venue hosting music festivals and concerts',
    address: '3876 Medina Highway',
    city: 'Kerrville',
    state: 'TX',
    zip_code: '78028',
    capacity: 600,
    amenities: ['Outdoor Stage', 'Camping', 'Concessions', 'Restrooms', 'Parking'],
    venue_type: 'Festival Grounds',
    county: 'Kerr',
    preferred_genres: ['Folk', 'Americana', 'Singer-Songwriter', 'Traditional', 'Acoustic'],
  },
  {
    venue_name: 'Wimberley Square Live',
    description: 'Charming downtown venue with intimate atmosphere and great acoustics',
    address: '14010 Ranch Road 12',
    city: 'Wimberley',
    state: 'TX',
    zip_code: '78676',
    capacity: 175,
    amenities: ['Indoor Stage', 'Bar', 'Restaurant', 'Patio', 'Parking'],
    venue_type: 'Live Music Venue',
    county: 'Hays',
    preferred_genres: ['Acoustic', 'Folk', 'Singer-Songwriter', 'Jazz', 'Blues'],
  },
  {
    venue_name: 'Cheatham Street Warehouse',
    description: 'Historic honky-tonk where George Strait got his start',
    address: '119 Cheatham Street',
    city: 'San Marcos',
    state: 'TX',
    zip_code: '78666',
    capacity: 280,
    amenities: ['Stage', 'Bar', 'Dance Floor', 'Pool Tables', 'Parking'],
    venue_type: 'Honky-Tonk',
    county: 'Hays',
    preferred_genres: ['Country', 'Red Dirt', 'Texas Country', 'Outlaw Country'],
  },
  {
    venue_name: 'The Root Cellar',
    description: 'Underground venue with unique atmosphere and diverse music programming',
    address: '215 North LBJ Drive',
    city: 'San Marcos',
    state: 'TX',
    zip_code: '78666',
    capacity: 220,
    amenities: ['Stage', 'Bar', 'Sound System', 'Lighting', 'Parking'],
    venue_type: 'Music Club',
    county: 'Hays',
    preferred_genres: ['Rock', 'Alternative', 'Indie', 'Punk', 'Electronic'],
  },
  {
    venue_name: 'Mercer Street Dance Hall',
    description: 'Classic Texas dance hall with spring-loaded floor and weekly dances',
    address: '1208 Mercer Street',
    city: 'Dripping Springs',
    state: 'TX',
    zip_code: '78620',
    capacity: 400,
    amenities: ['Historic Dance Floor', 'Stage', 'Bar', 'Covered Patio', 'Parking'],
    venue_type: 'Dance Hall',
    county: 'Hays',
    preferred_genres: ['Country', 'Western Swing', 'Two-Step', 'Honky-Tonk'],
  },
  {
    venue_name: 'Canyon Lake Marina & Grill',
    description: 'Waterfront venue with stunning lake views and outdoor stage',
    address: '15445 FM 2673',
    city: 'Canyon Lake',
    state: 'TX',
    zip_code: '78133',
    capacity: 225,
    amenities: ['Outdoor Stage', 'Restaurant', 'Bar', 'Marina', 'Lake Access', 'Parking'],
    venue_type: 'Waterfront Venue',
    county: 'Comal',
    preferred_genres: ['Country', 'Rock', 'Jimmy Buffett Style', 'Classic Rock', 'Pop'],
  },
  {
    venue_name: 'The Bulverde Event Center',
    description: 'Modern event space perfect for concerts, weddings, and private events',
    address: '29947 US Highway 281 North',
    city: 'Bulverde',
    state: 'TX',
    zip_code: '78163',
    capacity: 320,
    amenities: ['Professional Stage', 'Sound System', 'Lighting', 'Bar', 'Catering Kitchen', 'Parking'],
    venue_type: 'Event Center',
    county: 'Comal',
    preferred_genres: ['Country', 'Rock', 'Pop', 'Dance', 'Wedding Music'],
  },
  {
    venue_name: 'Lost Maples Cafe & Stage',
    description: 'Rustic cafe and music venue in beautiful Hill Country setting',
    address: '37221 FM 187',
    city: 'Vanderpool',
    state: 'TX',
    zip_code: '78885',
    capacity: 125,
    amenities: ['Small Stage', 'Cafe', 'Outdoor Seating', 'Parking'],
    venue_type: 'Cafe',
    county: 'Bandera',
    preferred_genres: ['Acoustic', 'Folk', 'Americana', 'Singer-Songwriter'],
  },
  {
    venue_name: 'The Junction Dancehall',
    description: 'Family-friendly dance hall hosting country and Tejano music',
    address: '110 College Street',
    city: 'Junction',
    state: 'TX',
    zip_code: '76849',
    capacity: 290,
    amenities: ['Dance Floor', 'Stage', 'Bar', 'Restaurant', 'Parking'],
    venue_type: 'Dance Hall',
    county: 'Kimble',
    preferred_genres: ['Country', 'Tejano', 'Two-Step', 'Western'],
  },
  {
    venue_name: 'Mountain Home Music Barn',
    description: 'Intimate barn venue with excellent sound in peaceful Hill Country location',
    address: '1254 Mountain Home Road',
    city: 'Mountain Home',
    state: 'TX',
    zip_code: '78058',
    capacity: 160,
    amenities: ['Stage', 'Sound System', 'Seating', 'Parking'],
    venue_type: 'Barn',
    county: 'Kerr',
    preferred_genres: ['Bluegrass', 'Folk', 'Acoustic', 'Gospel', 'Traditional'],
  },
  {
    venue_name: 'Hunt Store Community Hall',
    description: 'Historic community gathering place hosting dances and concerts',
    address: '303 FM 1340',
    city: 'Hunt',
    state: 'TX',
    zip_code: '78024',
    capacity: 200,
    amenities: ['Stage', 'Dance Floor', 'Kitchen', 'Parking'],
    venue_type: 'Community Hall',
    county: 'Kerr',
    preferred_genres: ['Country', 'Folk', 'Gospel', 'Traditional', 'Bluegrass'],
  },
  {
    venue_name: 'Johnson City Music Park',
    description: 'Outdoor amphitheater and festival space in LBJ country',
    address: '604 Nugent Avenue',
    city: 'Johnson City',
    state: 'TX',
    zip_code: '78636',
    capacity: 450,
    amenities: ['Outdoor Stage', 'Lawn Seating', 'Pavilion', 'Concessions', 'Parking'],
    venue_type: 'Outdoor Venue',
    county: 'Blanco',
    preferred_genres: ['Country', 'Rock', 'Folk', 'Blues', 'Americana'],
  },
  {
    venue_name: 'Luckenbach Post Office & General Store',
    description: 'Iconic Texas venue made famous by Waylon and Willie',
    address: '412 Luckenbach Town Loop',
    city: 'Fredericksburg',
    state: 'TX',
    zip_code: '78624',
    capacity: 75,
    amenities: ['Small Stage', 'General Store', 'Beer Garden', 'Historic Setting'],
    venue_type: 'Historic Venue',
    county: 'Gillespie',
    preferred_genres: ['Outlaw Country', 'Texas Country', 'Americana', 'Folk'],
  },
  {
    venue_name: 'Medina River Ranch',
    description: 'Private ranch venue with stunning views and event facilities',
    address: '1800 River Road',
    city: 'Medina',
    state: 'TX',
    zip_code: '78055',
    capacity: 275,
    amenities: ['Outdoor Stage', 'Covered Pavilion', 'Catering', 'River Access', 'Parking'],
    venue_type: 'Ranch Venue',
    county: 'Bandera',
    preferred_genres: ['Country', 'Acoustic', 'Folk', 'Rock', 'Wedding Music'],
  },
  {
    venue_name: 'Twin Sisters Brewing Company',
    description: 'Craft brewery with live music every weekend',
    address: '350 Lohmann Street',
    city: 'Boerne',
    state: 'TX',
    zip_code: '78006',
    capacity: 190,
    amenities: ['Small Stage', 'Brewery', 'Outdoor Beer Garden', 'Food Trucks', 'Parking'],
    venue_type: 'Brewery',
    county: 'Kendall',
    preferred_genres: ['Acoustic', 'Rock', 'Folk', 'Country', 'Blues'],
  },
];

export const demoMusicians = [
  {
    stage_name: 'Jordan Rivers',
    bio: 'Singer-songwriter blending country, folk, and Americana with heartfelt lyrics',
    genres: ['Country', 'Folk', 'Americana'],
    experience_years: 8,
    website: 'https://jordanrivers.music',
    social_links: {
      facebook: 'jordanriversmusic',
      instagram: '@jordanriversmusic',
      spotify: 'jordanrivers',
    },
    hourly_rate: 250,
    equipment_description: 'Full PA system, acoustic guitar, harmonica',
    city: 'Kerrville',
    state: 'TX',
    zip_code: '78028',
    county: 'Kerr',
  },
  {
    stage_name: 'Midnight Riders',
    bio: 'Classic rock cover band delivering high-energy performances of legendary hits',
    genres: ['Classic Rock', 'Rock', 'Blues Rock'],
    experience_years: 9,
    hourly_rate: 550,
    equipment_description: 'Full band setup with professional sound and lighting',
    city: 'Wimberley',
    state: 'TX',
    zip_code: '78676',
    county: 'Hays',
  },
  {
    stage_name: 'Mariachi Estrella',
    bio: 'Traditional mariachi ensemble bringing authentic Mexican music to life',
    genres: ['Mariachi', 'Latin', 'Traditional'],
    experience_years: 18,
    hourly_rate: 650,
    equipment_description: '8-piece ensemble with traditional instruments and vocals',
    city: 'San Marcos',
    state: 'TX',
    zip_code: '78666',
    county: 'Hays',
  },
  {
    stage_name: 'Emma Grace',
    bio: 'Contemporary Christian and gospel singer with inspirational messages',
    genres: ['Gospel', 'Contemporary Christian', 'Inspirational'],
    experience_years: 7,
    hourly_rate: 275,
    equipment_description: 'Vocals, piano, backing tracks available',
    city: 'Dripping Springs',
    state: 'TX',
    zip_code: '78620',
    county: 'Hays',
  },
  {
    stage_name: 'The Waylon Project',
    bio: 'Tribute to Waylon Jennings and classic outlaw country legends',
    genres: ['Outlaw Country', 'Classic Country', 'Honky-Tonk'],
    experience_years: 11,
    hourly_rate: 400,
    equipment_description: 'Full band with vintage sound and authentic style',
    city: 'Medina',
    state: 'TX',
    zip_code: '78055',
    county: 'Bandera',
  },
  {
    stage_name: 'Jazz Junction Quartet',
    bio: 'Sophisticated jazz ensemble perfect for upscale events and venues',
    genres: ['Jazz', 'Smooth Jazz', 'Swing'],
    experience_years: 16,
    hourly_rate: 500,
    equipment_description: 'Saxophone, piano, bass, drums with quality sound',
    city: 'Boerne',
    state: 'TX',
    zip_code: '78006',
    county: 'Kendall',
  },
  {
    stage_name: 'Dusty Roads',
    bio: 'Americana singer-songwriter with stories from the open road',
    genres: ['Americana', 'Folk', 'Singer-Songwriter'],
    experience_years: 13,
    hourly_rate: 325,
    equipment_description: 'Acoustic guitar, harmonica, looping pedals',
    city: 'Hunt',
    state: 'TX',
    zip_code: '78024',
    county: 'Kerr',
  },
  {
    stage_name: 'Neon Dreams',
    bio: '80s cover band bringing back the magic of the greatest decade',
    genres: ['80s', 'Pop', 'New Wave', 'Dance'],
    experience_years: 6,
    hourly_rate: 600,
    equipment_description: 'Full band with synthesizers, guitars, complete production',
    city: 'Canyon Lake',
    state: 'TX',
    zip_code: '78133',
    county: 'Comal',
  },
  {
    stage_name: 'Carolina Blue',
    bio: 'Female-fronted indie rock band with original songs and unique sound',
    genres: ['Indie Rock', 'Alternative', 'Pop Rock'],
    experience_years: 4,
    hourly_rate: 350,
    equipment_description: '4-piece band with vocals, guitar, bass, drums',
    city: 'Wimberley',
    state: 'TX',
    zip_code: '78676',
    county: 'Hays',
  },
  {
    stage_name: 'Brother Wolf',
    bio: 'Folk-rock duo with powerful harmonies and acoustic arrangements',
    genres: ['Folk Rock', 'Americana', 'Acoustic'],
    experience_years: 8,
    hourly_rate: 375,
    equipment_description: 'Two guitars, vocals, percussion, small PA',
    city: 'Johnson City',
    state: 'TX',
    zip_code: '78636',
    county: 'Blanco',
  },
  {
    stage_name: 'Fiddle & Steel',
    bio: 'Traditional country duo featuring fiddle and pedal steel guitar',
    genres: ['Traditional Country', 'Western Swing', 'Honky-Tonk'],
    experience_years: 22,
    hourly_rate: 450,
    equipment_description: 'Fiddle, pedal steel, vocals, vintage equipment',
    city: 'Luckenbach',
    state: 'TX',
    zip_code: '78624',
    county: 'Gillespie',
  },
  {
    stage_name: 'The Groove Collective',
    bio: 'Funk and soul band that gets people dancing every time',
    genres: ['Funk', 'Soul', 'R&B', 'Dance'],
    experience_years: 10,
    hourly_rate: 700,
    equipment_description: '7-piece band with horns, complete sound and lights',
    city: 'San Marcos',
    state: 'TX',
    zip_code: '78666',
    county: 'Hays',
  },
  {
    stage_name: 'River Valley Pickers',
    bio: 'Old-time string band playing traditional mountain music',
    genres: ['Old-Time', 'Bluegrass', 'Traditional', 'Folk'],
    experience_years: 14,
    hourly_rate: 400,
    equipment_description: 'Banjo, fiddle, mandolin, guitar, upright bass',
    city: 'Mountain Home',
    state: 'TX',
    zip_code: '78058',
    county: 'Kerr',
  },
  {
    stage_name: 'Luna Sol',
    bio: 'Flamenco and Spanish guitar virtuoso creating magical atmospheres',
    genres: ['Flamenco', 'Classical', 'Spanish', 'World'],
    experience_years: 19,
    hourly_rate: 450,
    equipment_description: 'Classical guitar, small sound reinforcement',
    city: 'Comfort',
    state: 'TX',
    zip_code: '78013',
    county: 'Kendall',
  },
  {
    stage_name: 'Prairie Fire',
    bio: 'Red dirt country band with original songs and Texas attitude',
    genres: ['Red Dirt', 'Texas Country', 'Country Rock'],
    experience_years: 7,
    hourly_rate: 525,
    equipment_description: 'Full 5-piece band with sound and light show',
    city: 'Bulverde',
    state: 'TX',
    zip_code: '78163',
    county: 'Comal',
  },
  {
    stage_name: 'The Hill Country Band',
    bio: 'Five-piece band playing classic country and Texas honky-tonk',
    genres: ['Country', 'Honky-Tonk', 'Western Swing'],
    experience_years: 12,
    website: 'https://hillcountryband.com',
    social_links: {
      facebook: 'hillcountryband',
      instagram: '@hillcountryband',
    },
    hourly_rate: 600,
    equipment_description: 'Full band with sound system, lights available',
    city: 'Boerne',
    state: 'TX',
    zip_code: '78006',
    county: 'Kendall',
  },
  {
    stage_name: 'Sarah "Bluebird" Johnson',
    bio: 'Blues and soul vocalist with a powerful voice and emotional delivery',
    genres: ['Blues', 'Soul', 'R&B'],
    experience_years: 15,
    hourly_rate: 300,
    equipment_description: 'Vocals, backing tracks, small PA available',
    city: 'Fredericksburg',
    state: 'TX',
    zip_code: '78624',
    county: 'Gillespie',
  },
  {
    stage_name: 'The Lonesome Pines',
    bio: 'Bluegrass trio bringing high-energy traditional and modern bluegrass',
    genres: ['Bluegrass', 'Folk', 'Traditional'],
    experience_years: 10,
    hourly_rate: 450,
    equipment_description: 'Acoustic instruments: banjo, fiddle, guitar, upright bass',
    city: 'Comfort',
    state: 'TX',
    zip_code: '78013',
    county: 'Kendall',
  },
  {
    stage_name: 'Texas Red',
    bio: 'Outlaw country artist with original songs and classic covers',
    genres: ['Outlaw Country', 'Red Dirt', 'Texas Country'],
    experience_years: 6,
    hourly_rate: 200,
    equipment_description: 'Electric guitar, vocals, can work with house sound',
    city: 'Bandera',
    state: 'TX',
    zip_code: '78003',
    county: 'Bandera',
  },
  {
    stage_name: 'Mesa Verde',
    bio: 'Tejano and conjunto band celebrating Texas-Mexican musical heritage',
    genres: ['Tejano', 'Conjunto', 'Latin'],
    experience_years: 20,
    hourly_rate: 500,
    equipment_description: 'Full band with accordion, bajo sexto, complete sound system',
    city: 'New Braunfels',
    state: 'TX',
    zip_code: '78130',
    county: 'Comal',
  },
  {
    stage_name: 'Acoustic Sunrise',
    bio: 'Duo performing acoustic covers and originals, perfect for wineries and cafes',
    genres: ['Acoustic', 'Pop', 'Folk'],
    experience_years: 5,
    hourly_rate: 300,
    equipment_description: 'Two vocals, acoustic guitars, portable PA',
    city: 'Blanco',
    state: 'TX',
    zip_code: '78606',
    county: 'Blanco',
  },
  {
    stage_name: 'The Rodeo Kings',
    bio: 'High-energy dance band playing country hits and classic rock',
    genres: ['Country', 'Classic Rock', 'Dance'],
    experience_years: 14,
    hourly_rate: 700,
    equipment_description: 'Full 6-piece band with complete production',
    city: 'Kerrville',
    state: 'TX',
    zip_code: '78028',
    county: 'Kerr',
  },
];

export const demoAdvertisements = [
  {
    advertiser_name: 'Hill Country Guitar Shop',
    ad_tier: 'premium' as const,
    title: 'Professional Instruments for Professional Musicians',
    description: 'Visit our showroom in Kerrville. Top brands, expert service, and unbeatable prices on guitars, amps, and more.',
    image_url: 'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg',
    link_url: 'https://example.com/guitar-shop',
    placement: 'all',
    is_active: true,
  },
  {
    advertiser_name: 'Texas Music Academy',
    ad_tier: 'premium' as const,
    title: 'Learn From the Best Musicians in the Hill Country',
    description: 'Private lessons in guitar, piano, vocals, and more. All ages and skill levels welcome.',
    image_url: 'https://images.pexels.com/photos/1407354/pexels-photo-1407354.jpeg',
    link_url: 'https://example.com/music-academy',
    placement: 'fan_dashboard',
    is_active: true,
  },
  {
    advertiser_name: 'Sound Pro Audio Rentals',
    ad_tier: 'standard' as const,
    title: 'Professional Audio Equipment Rentals',
    description: 'PA systems, lighting, stages, and complete production services for events of any size.',
    image_url: 'https://images.pexels.com/photos/744320/pexels-photo-744320.jpeg',
    link_url: 'https://example.com/sound-pro',
    placement: 'musician_dashboard',
    is_active: true,
  },
  {
    advertiser_name: 'Hill Country Event Planning',
    ad_tier: 'standard' as const,
    title: 'Making Your Events Unforgettable',
    description: 'Full-service event planning for weddings, corporate events, and festivals.',
    link_url: 'https://example.com/event-planning',
    placement: 'venue_dashboard',
    is_active: true,
  },
  {
    advertiser_name: 'Lone Star Insurance',
    ad_tier: 'basic' as const,
    title: 'Protect Your Music Career',
    description: 'Specialized insurance for musicians and venues.',
    link_url: 'https://example.com/insurance',
    placement: 'all',
    is_active: true,
  },
  {
    advertiser_name: 'Kerrville Coffee Roasters',
    ad_tier: 'basic' as const,
    title: 'Fuel Your Creativity with Premium Coffee',
    description: 'Locally roasted, always fresh. Visit our cafe in downtown Kerrville.',
    link_url: 'https://example.com/coffee',
    placement: 'fan_dashboard',
    is_active: true,
  },
  {
    advertiser_name: 'The Rustic Barn',
    ad_tier: 'premium' as const,
    title: 'Book Your Event at The Rustic Barn',
    description: 'Historic barn venue with authentic Texas charm, excellent acoustics, and capacity for 200 guests. Perfect for weddings, concerts, and special events in the heart of Kerrville.',
    image_url: 'https://images.pexels.com/photos/2138922/pexels-photo-2138922.jpeg',
    link_url: 'https://www.therusticbarn-kerrville.com',
    placement: 'all',
    is_active: true,
  },
  {
    advertiser_name: 'Premier Stage Lighting',
    ad_tier: 'premium' as const,
    title: 'Professional Lighting Solutions for Every Performance',
    description: 'From intimate shows to large festivals. Rental and installation services available throughout the Hill Country.',
    image_url: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
    link_url: 'https://example.com/stage-lighting',
    placement: 'venue_dashboard',
    is_active: true,
  },
  {
    advertiser_name: 'Hill Country Tour Bus',
    ad_tier: 'standard' as const,
    title: 'Safe & Reliable Transportation for Your Band',
    description: 'Professional tour bus services for musicians. Travel in comfort and style.',
    link_url: 'https://example.com/tour-bus',
    placement: 'musician_dashboard',
    is_active: true,
  },
  {
    advertiser_name: 'Texas Music Magazine',
    ad_tier: 'standard' as const,
    title: 'Get Featured in Texas Music Magazine',
    description: 'Promote your music to thousands of fans across the state.',
    image_url: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg',
    link_url: 'https://example.com/magazine',
    placement: 'all',
    is_active: true,
  },
  {
    advertiser_name: 'Backstage Catering',
    ad_tier: 'basic' as const,
    title: 'Professional Catering for Live Events',
    description: 'Keep your artists and crew fed with quality meals.',
    link_url: 'https://example.com/catering',
    placement: 'venue_dashboard',
    is_active: true,
  },
  {
    advertiser_name: 'Studio 512 Recording',
    ad_tier: 'premium' as const,
    title: 'Professional Recording Studio in the Heart of Texas',
    description: 'State-of-the-art recording facility with experienced engineers. Book your session today.',
    image_url: 'https://images.pexels.com/photos/164743/pexels-photo-164743.jpeg',
    link_url: 'https://example.com/studio',
    placement: 'musician_dashboard',
    is_active: true,
  },
  {
    advertiser_name: 'Merch Masters',
    ad_tier: 'standard' as const,
    title: 'Custom Band Merchandise & Printing',
    description: 'T-shirts, posters, CDs, and more. Fast turnaround and quality you can trust.',
    link_url: 'https://example.com/merch',
    placement: 'musician_dashboard',
    is_active: true,
  },
  {
    advertiser_name: 'Hill Country Hotel & Suites',
    ad_tier: 'basic' as const,
    title: 'Comfortable Accommodations for Touring Musicians',
    description: 'Special rates for bands and music industry professionals.',
    link_url: 'https://example.com/hotel',
    placement: 'all',
    is_active: true,
  },
];

export const demoMerchandise = [
  {
    name: 'Jordan Rivers - "Hill Country Heart" CD',
    description: 'Debut album featuring 12 original songs',
    price: 15,
    category: 'album' as const,
    images: ['https://images.pexels.com/photos/1616470/pexels-photo-1616470.jpeg'],
    inventory_count: 50,
    is_active: true,
    is_limited_edition: false,
  },
  {
    name: 'Band T-Shirt - Classic Logo',
    description: 'Comfortable cotton t-shirt with band logo',
    price: 25,
    category: 'apparel' as const,
    images: ['https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg'],
    inventory_count: 30,
    is_active: true,
    is_limited_edition: false,
    variations: {
      size: ['S', 'M', 'L', 'XL', '2XL'],
      color: ['Black', 'Navy', 'Gray'],
    },
  },
  {
    name: 'Concert Poster - Limited Edition',
    description: 'Signed limited edition concert poster',
    price: 20,
    category: 'poster' as const,
    images: ['https://images.pexels.com/photos/167605/pexels-photo-167605.jpeg'],
    inventory_count: 25,
    is_active: true,
    is_limited_edition: true,
  },
  {
    name: 'Digital Download - Live at Gruene Hall',
    description: 'High-quality digital recording of live performance',
    price: 10,
    category: 'digital' as const,
    images: ['https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg'],
    inventory_count: 999,
    is_active: true,
    is_limited_edition: false,
  },
  {
    name: 'Vintage Band Hoodie',
    description: 'Soft and warm hoodie with retro band logo design',
    price: 45,
    category: 'apparel' as const,
    images: ['https://images.pexels.com/photos/3755706/pexels-photo-3755706.jpeg'],
    inventory_count: 40,
    is_active: true,
    is_limited_edition: false,
    variations: {
      size: ['S', 'M', 'L', 'XL', '2XL'],
      color: ['Black', 'Charcoal', 'Navy'],
    },
  },
  {
    name: 'Autographed Vinyl LP - Special Edition',
    description: 'Limited edition vinyl with band signatures and exclusive artwork',
    price: 35,
    category: 'album' as const,
    images: ['https://images.pexels.com/photos/3721941/pexels-photo-3721941.jpeg'],
    inventory_count: 100,
    is_active: true,
    is_limited_edition: true,
  },
  {
    name: 'Tour Hat - Snapback',
    description: 'Embroidered snapback hat with tour dates on the back',
    price: 28,
    category: 'apparel' as const,
    images: ['https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg'],
    inventory_count: 60,
    is_active: true,
    is_limited_edition: false,
    variations: {
      color: ['Black', 'Navy', 'Gray', 'White'],
    },
  },
  {
    name: 'Guitar Pick Set - Collectible',
    description: 'Set of 6 custom guitar picks used on tour',
    price: 12,
    category: 'other' as const,
    images: ['https://images.pexels.com/photos/1407354/pexels-photo-1407354.jpeg'],
    inventory_count: 150,
    is_active: true,
    is_limited_edition: false,
  },
  {
    name: 'Band Sticker Pack',
    description: 'Set of 10 weatherproof stickers featuring band artwork',
    price: 8,
    category: 'other' as const,
    images: ['https://images.pexels.com/photos/6168061/pexels-photo-6168061.jpeg'],
    inventory_count: 200,
    is_active: true,
    is_limited_edition: false,
  },
  {
    name: 'Acoustic Sessions - USB Album',
    description: 'USB drive with acoustic versions of greatest hits plus bonus tracks',
    price: 18,
    category: 'digital' as const,
    images: ['https://images.pexels.com/photos/1090638/pexels-photo-1090638.jpeg'],
    inventory_count: 75,
    is_active: true,
    is_limited_edition: false,
  },
  {
    name: 'Tank Top - Summer Tour',
    description: 'Lightweight tank top perfect for summer shows',
    price: 22,
    category: 'apparel' as const,
    images: ['https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg'],
    inventory_count: 45,
    is_active: true,
    is_limited_edition: false,
    variations: {
      size: ['S', 'M', 'L', 'XL'],
      color: ['Black', 'White', 'Gray'],
    },
  },
];

export const demoEvents = [
  {
    event_name: 'Friday Night Live with Jordan Rivers',
    description: 'Join us for an intimate evening of country and folk music with local favorite Jordan Rivers',
    event_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    start_time: '19:00',
    end_time: '22:00',
    ticket_price: 15,
    tickets_available: 150,
    event_type: 'concert' as const,
    genres: ['Country', 'Folk', 'Americana'],
  },
  {
    event_name: 'Saturday Night Dance Party',
    description: 'Dance the night away with The Hill Country Band playing classic country and honky-tonk',
    event_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    start_time: '20:00',
    end_time: '01:00',
    ticket_price: 20,
    tickets_available: 300,
    event_type: 'concert' as const,
    genres: ['Country', 'Honky-Tonk'],
  },
  {
    event_name: 'Sunday Afternoon at the Winery',
    description: 'Acoustic Sunrise performs mellow acoustic covers perfect for a relaxing Sunday',
    event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    start_time: '14:00',
    end_time: '17:00',
    ticket_price: 10,
    tickets_available: 120,
    event_type: 'concert' as const,
    genres: ['Acoustic', 'Folk'],
  },
  {
    event_name: 'Blues Night with Sarah Johnson',
    description: 'Powerful blues and soul vocals in an intimate venue setting',
    event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    start_time: '20:00',
    end_time: '23:00',
    ticket_price: 18,
    tickets_available: 175,
    event_type: 'concert' as const,
    genres: ['Blues', 'Soul'],
  },
  {
    event_name: 'Bluegrass Festival - Day 1',
    description: 'Two amazing bluegrass acts: The Lonesome Pines and River Valley Pickers',
    event_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    start_time: '18:00',
    end_time: '23:00',
    ticket_price: 25,
    tickets_available: 450,
    event_type: 'festival' as const,
    genres: ['Bluegrass', 'Folk'],
  },
  {
    event_name: 'Tejano Night with Mesa Verde',
    description: 'Celebrate Texas-Mexican musical heritage with this legendary conjunto band',
    event_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    start_time: '19:00',
    end_time: '00:00',
    ticket_price: 22,
    tickets_available: 280,
    event_type: 'concert' as const,
    genres: ['Tejano', 'Latin'],
  },
  {
    event_name: 'Classic Rock Tribute Night',
    description: 'Midnight Riders bring back the legends with high-energy performances',
    event_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    start_time: '21:00',
    end_time: '01:00',
    ticket_price: 25,
    tickets_available: 325,
    event_type: 'concert' as const,
    genres: ['Rock', 'Classic Rock'],
  },
  {
    event_name: 'Jazz Under the Stars',
    description: 'Sophisticated evening with Jazz Junction Quartet',
    event_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    start_time: '19:30',
    end_time: '22:30',
    ticket_price: 30,
    tickets_available: 150,
    event_type: 'concert' as const,
    genres: ['Jazz', 'Smooth Jazz'],
  },
  {
    event_name: '80s Dance Party with Neon Dreams',
    description: 'The ultimate 80s experience - dress up and dance all night!',
    event_date: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
    start_time: '21:00',
    end_time: '02:00',
    ticket_price: 20,
    tickets_available: 350,
    event_type: 'concert' as const,
    genres: ['80s', 'Pop', 'Dance'],
  },
  {
    event_name: 'Outlaw Country with The Waylon Project',
    description: 'Tribute to Waylon Jennings and outlaw country legends',
    event_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    start_time: '20:00',
    end_time: '23:30',
    ticket_price: 20,
    tickets_available: 275,
    event_type: 'concert' as const,
    genres: ['Outlaw Country', 'Classic Country'],
  },
  {
    event_name: 'Funk & Soul Dance Night',
    description: 'The Groove Collective brings the funk - get ready to dance!',
    event_date: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString(),
    start_time: '21:00',
    end_time: '01:30',
    ticket_price: 25,
    tickets_available: 300,
    event_type: 'concert' as const,
    genres: ['Funk', 'Soul', 'R&B'],
  },
  {
    event_name: 'Red Dirt Country Showcase',
    description: 'Prairie Fire performs original Texas country and red dirt classics',
    event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    start_time: '19:00',
    end_time: '22:00',
    ticket_price: 18,
    tickets_available: 250,
    event_type: 'concert' as const,
    genres: ['Red Dirt', 'Texas Country'],
  },
];
