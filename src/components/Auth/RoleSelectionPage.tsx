import { Music, Users, Star, TrendingUp } from 'lucide-react';

interface RoleSelectionPageProps {
  onRoleSelect: (role: 'musician' | 'venue' | 'fan' | 'investor') => void;
  onBack: () => void;
}

export default function RoleSelectionPage({ onRoleSelect, onBack }: RoleSelectionPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gigmate-blue to-gigmate-blue-light py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 text-white hover:underline"
        >
          ← Back to Home
        </button>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Join GigMate</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Choose how you want to experience the platform. You can always add more roles later.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={() => onRoleSelect('fan')}
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-2xl p-8 text-center transform hover:scale-105 transition-all border-4 border-green-500 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 px-3 py-1 text-xs font-bold rounded-bl-lg">
              MOST POPULAR
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Star className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-green-700 mb-3">I'm a Fan</h3>
            <p className="text-gray-700 text-sm mb-4">
              Discover shows, buy tickets, and shop local merchandise
            </p>
            <div className="bg-green-100 rounded-lg px-4 py-2 text-xs font-semibold text-green-800">
              Free Forever
            </div>
          </button>

          <button
            onClick={() => onRoleSelect('musician')}
            className="bg-white rounded-xl shadow-xl p-8 text-center transform hover:scale-105 transition-all group"
          >
            <div className="bg-blue-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Music className="h-10 w-10 text-gigmate-blue" />
            </div>
            <h3 className="text-2xl font-bold text-gigmate-blue mb-3">I'm a Musician</h3>
            <p className="text-gray-600 text-sm mb-4">
              Find gigs, build your profile, and get paid securely
            </p>
            <div className="bg-blue-100 rounded-lg px-4 py-2 text-xs font-semibold text-blue-800">
              Keep 90% of Earnings
            </div>
          </button>

          <button
            onClick={() => onRoleSelect('venue')}
            className="bg-white rounded-xl shadow-xl p-8 text-center transform hover:scale-105 transition-all group"
          >
            <div className="bg-purple-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Users className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-purple-600 mb-3">I'm a Venue</h3>
            <p className="text-gray-600 text-sm mb-4">
              Book musicians, manage events, and sell tickets
            </p>
            <div className="bg-purple-100 rounded-lg px-4 py-2 text-xs font-semibold text-purple-800">
              Premium Tools
            </div>
          </button>

          <button
            onClick={() => onRoleSelect('investor')}
            className="bg-white rounded-xl shadow-xl p-8 text-center transform hover:scale-105 transition-all group"
          >
            <div className="bg-orange-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <TrendingUp className="h-10 w-10 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-orange-600 mb-3">I'm an Investor</h3>
            <p className="text-gray-600 text-sm mb-4">
              Access analytics, metrics, and growth insights
            </p>
            <div className="bg-orange-100 rounded-lg px-4 py-2 text-xs font-semibold text-orange-800">
              By Invitation
            </div>
          </button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-white/80 text-sm">
            Already have an account?{' '}
            <button
              onClick={onBack}
              className="text-white font-semibold underline hover:text-white/90"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
