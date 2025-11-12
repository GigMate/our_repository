import { useState, useEffect } from 'react';
import { seedDatabase } from '../../lib/seedData';
import AdminLogin from './AdminLogin';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function DatabaseSeeder() {
  const { profile } = useAuth();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.user_type === 'admin') {
      setAuthenticated(true);
      return;
    }

    const isAuth = sessionStorage.getItem('admin_authenticated') === 'true';
    setAuthenticated(isAuth);
  }, [profile]);

  if (!authenticated) {
    return <AdminLogin onAuthenticated={() => setAuthenticated(true)} />;
  }

  const addStatus = (message: string) => {
    setStatus(prev => [...prev, message]);
  };

  const handleSeedDatabase = async () => {
    setLoading(true);
    setStatus([]);
    setError(null);

    try {
      addStatus('Starting server-side database seeding with REALISTIC ratios...');
      addStatus('Creating 100 musicians, 50 venues (30 REAL!), 200 fans, 20 sponsors...');
      addStatus('Please wait, this will take 1-2 minutes for 370 total accounts...');
      addStatus('');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/seed-database`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          musicians: 100,
          venues: 50,
          fans: 200,
          sponsors: 20
        }),
      });

      const data = await response.json();

      if (data.success) {
        addStatus('');
        data.messages.forEach((msg: string) => addStatus(msg));
        addStatus('');
        addStatus('Login to any account:');
        addStatus('- Musicians: musician1@test.gigmate.us through musician100@test.gigmate.us');
        addStatus('- Fans: fan1@test.gigmate.us through fan200@test.gigmate.us');
        addStatus('- Real Venues: gruenehall@venue.gigmate.us, theroundup@venue.gigmate.us, etc.');
        addStatus('- Synthetic Venues: venue31@test.gigmate.us through venue50@test.gigmate.us');
        addStatus('- Sponsors: sponsor1@test.gigmate.us through sponsor20@test.gigmate.us');
        addStatus('');
        addStatus('Password for all test accounts: testpass123');
      } else {
        throw new Error(data.error || 'Seeding failed');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      addStatus(`✗ Fatal error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gigmate-blue mb-4">Database Seeder (Server-Side)</h2>
        <p className="text-gray-600 mb-6">
          Populate the database with 370 realistic accounts using server-side processing. Includes 30 REAL Texas Hill Country venues!
        </p>

        <div className="mb-6 p-4 bg-green-50 border-2 border-green-400 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            <span className="text-xl">🚀</span>
            NEW: Auto-Generation System Active!
          </h3>
          <p className="text-sm text-green-800 mb-3">
            After seeding, events will auto-generate weekly within 20-mile radius. Platform will always look busy!
          </p>
        </div>

        <div className="mb-6 p-4 bg-gray-800 border border-cyan-400 rounded-lg">
          <h3 className="font-semibold text-white mb-2">What will be created (REALISTIC RATIOS):</h3>
          <ul className="text-sm text-gray-100 space-y-1">
            <li>• <strong>50 Venues</strong> including 30 REAL Texas Hill Country venues:</li>
            <li className="ml-6">- Gruene Hall, Luckenbach Texas, Arkey Blue's Silver Dollar</li>
            <li className="ml-6">- Whitewater Amphitheatre, The Roundup, Sam's Burger Joint</li>
            <li className="ml-6">- Plus 20 additional synthetic venues</li>
            <li>• <strong>100 Musicians</strong> across Texas Hill Country cities</li>
            <li>• <strong>200 Fans</strong> ready to discover shows</li>
            <li>• <strong>20 Sponsors</strong> (Shiner Beer, Real Ale Brewing, etc.)</li>
            <li>• Login: musician1@test.gigmate.us, fan1@test.gigmate.us, etc.</li>
            <li>• Real venues: gruenehall@venue.gigmate.us, theroundup@venue.gigmate.us, etc.</li>
            <li>• Password for ALL accounts: testpass123</li>
            <li>• <strong>Server-side = NO session timeouts!</strong></li>
          </ul>
        </div>

        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="font-semibold text-purple-900 mb-2">After Seeding - Next Steps:</h3>
          <ol className="text-sm text-purple-800 space-y-2">
            <li>1. Run this SQL in Supabase to generate initial events:</li>
            <li className="ml-6 font-mono bg-white p-2 rounded border border-purple-200">
              SELECT weekly_platform_refresh();
            </li>
            <li>2. This will create 100-300 events matched within 20-mile radius</li>
            <li>3. Events auto-regenerate every Monday at 3 AM UTC (no manual work!)</li>
            <li>4. Featured venues/musicians rotate weekly for fair visibility</li>
          </ol>
        </div>

        <button
          onClick={handleSeedDatabase}
          disabled={loading}
          className="bg-gigmate-blue text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2 mx-auto"
        >
          {loading && (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {loading ? 'Seeding Database...' : 'Seed Database with 370 Accounts (Realistic Ratios)'}
        </button>

        {loading && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800 font-medium">
              ⚡ Running on server... This will take 1-2 minutes for 370 accounts.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        {status.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-gigmate-blue mb-2">Status:</h3>
            <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
              {status.map((msg, idx) => (
                <div
                  key={idx}
                  className={`text-sm font-mono ${
                    msg.startsWith('✓')
                      ? 'text-green-600'
                      : msg.startsWith('✗')
                      ? 'text-red-600'
                      : msg.includes('Credentials') || msg.includes('@')
                      ? 'text-gigmate-blue font-bold'
                      : 'text-gray-700'
                  }`}
                >
                  {msg}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
