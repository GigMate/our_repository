import { useState, useEffect } from 'react';
import { TrendingUp, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoginForm from './LoginForm';
import InvestorInterestForm from './InvestorInterestForm';

interface InvestorAuthPageProps {
  onBack: () => void;
}

export default function InvestorAuthPage({ onBack }: InvestorAuthPageProps) {
  const [view, setView] = useState<'check' | 'login' | 'interest'>('check');
  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  async function checkInvestorStatus(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setChecking(true);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_investor_approved, user_type')
        .eq('email', email)
        .maybeSingle();

      if (profile?.user_type === 'investor' && profile?.is_investor_approved) {
        setView('login');
      } else {
        const { data: interest } = await supabase
          .from('investor_interest_requests')
          .select('status')
          .eq('email', email)
          .maybeSingle();

        if (interest?.status === 'pending') {
          setError('Your investor request is pending review. Our team will contact you soon.');
        } else if (interest?.status === 'rejected') {
          setError('Your investor request was not approved at this time.');
        } else {
          setView('interest');
        }
      }
    } catch (err: any) {
      console.error('Error checking investor status:', err);
      setView('interest');
    } finally {
      setChecking(false);
    }
  }

  if (view === 'interest') {
    return <InvestorInterestForm onBack={onBack} />;
  }

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-600 to-orange-400 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <button
            onClick={onBack}
            className="mb-6 text-white hover:underline"
          >
            ← Back to Home
          </button>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="bg-orange-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <TrendingUp className="w-10 h-10 text-orange-600" />
            </div>

            <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
              Investor Portal Login
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Access your investor dashboard with real-time analytics
            </p>

            <LoginForm
              onToggle={() => {}}
              onBack={() => setView('check')}
              defaultUserType="investor"
            />

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                Use the credentials sent to your email after approval
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-600 to-orange-400 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <button
          onClick={onBack}
          className="mb-6 text-white hover:underline"
        >
          ← Back to Home
        </button>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="bg-orange-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Lock className="w-10 h-10 text-orange-600" />
          </div>

          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Investor Access
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Investor portal access is by invitation only. Enter your email to check your status or request access.
          </p>

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={checkInvestorStatus} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="investor@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={checking}
              className="w-full px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {checking ? 'Checking...' : 'Continue'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              By continuing, you acknowledge that investor access requires approval and signing of legal agreements including NDA, IP, and non-compete clauses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
