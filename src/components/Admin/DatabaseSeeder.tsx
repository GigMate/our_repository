import { useState } from 'react';
import { seedDatabase } from '../../lib/seedData';

export default function DatabaseSeeder() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

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

      const result = await seedDatabase();

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

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">What will be created:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 100 Musicians with availability slots (25% bronze, 25% silver, 50% gold)</li>
            <li>• 100 Venues - First 29 are REAL Texas Hill Country venues including:</li>
            <li className="ml-6">- The Roundup, Gruene Hall, Luckenbach Texas</li>
            <li className="ml-6">- Whitewater Amphitheatre, 11th Street Cowboy Bar</li>
            <li className="ml-6">- From Kendall, Gillespie, Blanco, Comal, Bandera, and Kerr counties</li>
            <li>• 100 Fans with subscription tiers (25% bronze, 25% silver, 50% gold)</li>
            <li>• 50 Events connecting venues and musicians</li>
            <li>• 30 Bookings with various statuses</li>
            <li>• All accounts with realistic geographic coordinates</li>
            <li>• Login format: lastname.type#@gigmate.us (e.g., smith.musician1@gigmate.us)</li>
            <li>• Password for all: password123</li>
          </ul>
        </div>

        <button
          onClick={handleSeedDatabase}
          disabled={loading}
          className="bg-gigmate-blue text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Seeding Database... (This may take several minutes)' : 'Seed Database with 300 Accounts'}
        </button>

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
