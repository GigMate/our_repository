import { useState } from 'react';
import { Lock } from 'lucide-react';

interface AdminLoginProps {
  onAuthenticated: () => void;
}

const ADMIN_PASSWORD = 'gigmate2025admin';

export default function AdminLogin({ onAuthenticated }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_authenticated', 'true');
      onAuthenticated();
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gigmate-blue to-gigmate-blue-light flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-gigmate-blue rounded-full p-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-gigmate-blue mb-2">
          Admin Access
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Enter the admin password to continue
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
              placeholder="Enter admin password"
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gigmate-blue text-white py-3 rounded-lg font-semibold hover:bg-gigmate-blue-dark transition-colors"
          >
            Access Admin Panel
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-gray-600 hover:text-gigmate-blue transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
