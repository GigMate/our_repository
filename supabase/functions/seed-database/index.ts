import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SeedRequest {
  count?: number;
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

    const { count = 10 } = await req.json() as SeedRequest;

    const messages: string[] = [];
    const log = (msg: string) => {
      console.log(msg);
      messages.push(msg);
    };

    log(`Starting database seeding with ${count} users per type...`);

    const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const musicGenres = ['Rock', 'Jazz', 'Blues', 'Country', 'Pop', 'Hip Hop', 'R&B', 'Electronic', 'Folk', 'Classical'];

    const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    // Create musicians
    log(`Creating ${count} musicians...`);
    for (let i = 0; i < count; i++) {
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
          city: 'Austin',
          state: 'TX',
          latitude: 30.2672,
          longitude: -97.7431,
        });
      }

      if ((i + 1) % 10 === 0) {
        log(`Created ${i + 1}/${count} musicians`);
      }
    }

    // Create venues
    log(`Creating ${count} venues...`);
    for (let i = 0; i < count; i++) {
      const email = `venue${i + 1}@test.gigmate.us`;
      const password = 'testpass123';

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
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
          full_name: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
          user_type: 'venue',
          venue_name: `The ${randomItem(['Blue', 'Red', 'Golden'])} ${randomItem(['Note', 'Stage', 'Hall'])}`,
          capacity: 100 + Math.floor(Math.random() * 400),
          city: 'Austin',
          state: 'TX',
          latitude: 30.2672,
          longitude: -97.7431,
        });
      }

      if ((i + 1) % 10 === 0) {
        log(`Created ${i + 1}/${count} venues`);
      }
    }

    // Create fans
    log(`Creating ${count} fans...`);
    for (let i = 0; i < count; i++) {
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

      if ((i + 1) % 10 === 0) {
        log(`Created ${i + 1}/${count} fans`);
      }
    }

    log('✓ Database seeding completed successfully!');
    log(`Total: ${count * 3} accounts created`);
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