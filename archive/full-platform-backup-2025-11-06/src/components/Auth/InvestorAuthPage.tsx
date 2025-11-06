import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';

interface InvestorAuthPageProps {
  onBack: () => void;
}

export default function InvestorAuthPage({ onBack }: InvestorAuthPageProps) {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-600 to-orange-400">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <button
          onClick={onBack}
          className="mb-6 text-white hover:underline"
        >
          ← Back to Home
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="text-white">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-4 w-20 h-20 mb-6 flex items-center justify-center">
              <TrendingUp className="h-10 w-10" />
            </div>
            <h1 className="text-5xl font-bold mb-6">Investor Portal</h1>
            <p className="text-xl mb-8 text-white/90">
              Join the GigMate community as an investor. Access platform analytics, revenue metrics, and growth insights.
            </p>

            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <h3 className="font-bold text-xl mb-2">Platform Analytics</h3>
                <p className="text-white/90">
                  Real-time dashboards showing user growth, transaction volume, and revenue streams
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <h3 className="font-bold text-xl mb-2">Revenue Metrics</h3>
                <p className="text-white/90">
                  Detailed breakdowns of platform fees, subscription revenue, and market trends
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <h3 className="font-bold text-xl mb-2">Growth Insights</h3>
                <p className="text-white/90">
                  Market analysis, user engagement metrics, and expansion opportunities
                </p>
              </div>
            </div>
          </div>

          <div>
            {showLogin ? (
              <LoginForm
                onToggle={() => setShowLogin(false)}
                onBack={onBack}
                defaultUserType="investor"
              />
            ) : (
              <SignUpForm
                onToggle={() => setShowLogin(true)}
                defaultUserType="investor"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
