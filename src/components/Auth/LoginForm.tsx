import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface LoginFormProps {
  onToggle: () => void;
  onBack?: () => void;
  userType?: 'musician' | 'venue' | 'fan';
  defaultUserType?: 'musician' | 'venue' | 'fan' | 'investor';
}

export default function LoginForm({ onToggle, onBack, userType }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setResetEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center mb-6">
          <img src="/gigmate-pick.svg" alt="GigMate" className="h-20 w-20" />
        </div>
        <h2 className="text-3xl font-bold text-gigmate-blue mb-6 text-center">Reset Password</h2>

        {resetEmailSent ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-700">
              <p className="font-medium mb-2">Check your email!</p>
              <p className="text-sm">
                We've sent a password reset link to <strong>{email}</strong>. Click the link in the email to reset your password.
              </p>
            </div>
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmailSent(false);
                setEmail('');
              }}
              className="w-full bg-gigmate-blue text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            <p className="text-gray-600 text-sm mb-6 text-center">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gigmate-red text-white py-2 px-4 rounded-md hover:bg-gigmate-red-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <button
              onClick={() => setShowForgotPassword(false)}
              className="mt-4 w-full text-center text-sm text-gray-600 hover:text-gigmate-blue font-medium"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
      {onBack && (
        <button
          onClick={onBack}
          className="text-gigmate-blue hover:text-blue-700 mb-4 flex items-center gap-2"
        >
          ← Back to Home
        </button>
      )}
      <div className="flex items-center justify-center mb-6">
        <img src="/gigmate-pick.svg" alt="GigMate" className="h-20 w-20" />
      </div>
      <h2 className="text-3xl font-bold text-gigmate-blue mb-6 text-center">
        {userType ? `${userType.charAt(0).toUpperCase() + userType.slice(1)} Login` : 'Welcome Back'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-gigmate-blue hover:text-blue-700 font-medium"
            >
              Forgot password?
            </button>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gigmate-red text-white py-2 px-4 rounded-md hover:bg-gigmate-red-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <button onClick={onToggle} className="text-gigmate-blue hover:text-gigmate-blue-light font-medium">
          Sign up
        </button>
      </p>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <a
          href="/admin/seed"
          className="block text-center text-sm text-gigmate-red hover:text-gigmate-red-dark font-medium"
        >
          Seed Demo Database
        </a>
      </div>
    </div>
  );
}
