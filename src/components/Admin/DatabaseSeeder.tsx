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
      addStatus('Starting comprehensive database seeding...');
      addStatus('This will create 100 fans, 100 musicians, and 100 venues with proper tier distribution.');
      addStatus('Please wait, this may take a few minutes...');
      addStatus('');

      // Refresh session before starting long operation
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        throw new Error('Session refresh failed. Please log in again.');
      }

      const result = await seedDatabase((message: string) => {
        addStatus(message);
      });

      if (result.success) {
        addStatus('');
        addStatus('✓ Database seeding completed successfully!');
        addStatus('');
        addStatus('Created:');
        addStatus('- 100 Musicians (25% bronze, 25% silver, 50% gold)');
        addStatus('- 100 Venues (25% local, 25% regional, 25% state, 25% national)');
        addStatus('- 100 Fans (25% bronze, 25% silver, 50% gold)');
        addStatus('- 50 Events');
        addStatus('- 30 Bookings');
        addStatus('- Availability slots for all musicians');
        addStatus('');
        addStatus('Login Format Examples:');
        addStatus('smith.musician1@gigmate.us');
        addStatus('johnson.venue1@gigmate.us');
        addStatus('williams.fan1@gigmate.us');
        addStatus('');
        addStatus('Password for all accounts: password123');
      } else {
        throw new Error('Seeding failed');
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
        <h2 className="text-2xl font-bold text-gigmate-blue mb-4">Database Seeder</h2>
        <p className="text-gray-600 mb-6">
          Populate the database with 300 total accounts (100 fans, 100 musicians, 100 venues) with proper tier distribution and full feature integration.
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
          <h3 className="font-semibold text-white mb-2">What will be created:</h3>
          <ul className="text-sm text-gray-100 space-y-1">
            <li>• 100 Musicians with availability slots (25% bronze, 25% silver, 50% gold)</li>
            <li>• 100 Venues - First 29 are REAL Texas Hill Country venues including:</li>
            <li className="ml-6">- The Roundup, Gruene Hall, Luckenbach Texas</li>
            <li className="ml-6">- Whitewater Amphitheatre, 11th Street Cowboy Bar</li>
            <li className="ml-6">- Arkey Blue's Silver Dollar (legendary!)</li>
            <li className="ml-6">- From Kendall, Gillespie, Blanco, Comal, Bandera, and Kerr counties</li>
            <li>• 100 Fans with subscription tiers (25% bronze, 25% silver, 50% gold)</li>
            <li>• 50 Events connecting venues and musicians</li>
            <li>• 30 Bookings with various statuses</li>
            <li>• All accounts with realistic geographic coordinates</li>
            <li>• Login format: lastname.type#@gigmate.us (e.g., smith.musician1@gigmate.us)</li>
            <li>• Password for all: password123</li>
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
          {loading ? 'Seeding Database... Please keep this page open!' : 'Seed Database with 300 Accounts'}
        </button>

        {loading && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ IMPORTANT: Do not close this page or navigate away. The seeding process takes 5-10 minutes.
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Your session will be automatically refreshed to prevent timeouts.
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
