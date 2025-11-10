import { useState } from 'react';
import { Users, Star, Ticket, FileText } from 'lucide-react';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';

interface VenueAuthPageProps {
  onBack: () => void;
}

export default function VenueAuthPage({ onBack }: VenueAuthPageProps) {
  const [showLogin, setShowLogin] = useState(false);

  if (showLogin) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg"
            alt="Live music venue"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 to-purple-400/90" />
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <LoginForm onToggle={() => setShowLogin(false)} onBack={onBack} userType="venue" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg"
          alt="Live music venue"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 to-purple-400/90" />
      </div>
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
        <div className="text-white space-y-6 p-8">
          <button
            onClick={onBack}
            className="text-white hover:text-gray-200 mb-4 flex items-center gap-2"
          >
            ← Back to Home
          </button>
          <div className="bg-white/10 rounded-full p-4 w-20 h-20 flex items-center justify-center backdrop-blur-sm">
            <Users className="h-12 w-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">Join as a Venue</h1>
          <p className="text-xl text-white/90">
            Discover talented musicians, manage bookings, and sell tickets all in one place.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <Star className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg">Find Top Talent</h3>
                <p className="text-white/80">Search musicians by genre, location, and ratings</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Ticket className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg">Built-in Ticketing</h3>
                <p className="text-white/80">Sell tickets directly through the platform</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg">Digital Contracts</h3>
                <p className="text-white/80">Secure agreements with escrow payment protection</p>
              </div>
            </div>
          </div>
        </div>

          <div className="bg-white rounded-lg shadow-2xl p-8">
            <SignUpForm onToggle={() => setShowLogin(true)} defaultUserType="venue" />
          </div>
        </div>
      </div>
    </div>
  );
}
