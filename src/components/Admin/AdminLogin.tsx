import { useState } from 'react';
import { Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AdminLoginProps {
  onAuthenticated: () => void;
}

const ADMIN_EMAIL = 'admin@gigmate.us';
const ADMIN_PASSWORD = '@dM!n111525';

export default function AdminLogin({ onAuthenticated }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (password === ADMIN_PASSWORD) {
        // Try to sign in as admin user
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        });

        if (signInError) {
          // If admin user doesn't exist, create it
          console.log('Admin user not found, creating...');
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            options: {
              data: {
                full_name: 'System Administrator',
                user_type: 'admin'
              }
            }
          });

          if (signUpError) throw signUpError;

          // Create admin profile
          if (signUpData.user) {
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: signUpData.user.id,
                email: ADMIN_EMAIL,
                full_name: 'System Administrator',
                user_type: 'admin',
              });

            if (profileError) {
              console.error('Profile creation error:', profileError);
            }
          }

          // Sign in after creating
          const { error: retrySignInError } = await supabase.auth.signInWithPassword({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
          });

          if (retrySignInError) throw retrySignInError;
        }

        sessionStorage.setItem('admin_authenticated', 'true');
        onAuthenticated();
      } else {
        setError('Incorrect password');
        setPassword('');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to authenticate');
    } finally {
      setLoading(false);
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
            disabled={loading}
            className="w-full bg-gigmate-blue text-white py-3 rounded-lg font-semibold hover:bg-gigmate-blue-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Authenticating...' : 'Access Admin Panel'}
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
