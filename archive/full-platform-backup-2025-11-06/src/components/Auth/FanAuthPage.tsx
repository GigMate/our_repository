import { useState } from 'react';
import { Calendar, Star, MapPin, Heart } from 'lucide-react';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';

interface FanAuthPageProps {
  onBack: () => void;
}

export default function FanAuthPage({ onBack }: FanAuthPageProps) {
  const [showLogin, setShowLogin] = useState(false);

  if (showLogin) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg"
            alt="Concert crowd"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/90 to-green-400/90" />
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <LoginForm onToggle={() => setShowLogin(false)} onBack={onBack} userType="fan" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg"
          alt="Concert crowd"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/90 to-green-400/90" />
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
            <Calendar className="h-12 w-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">Join as a Fan</h1>
          <p className="text-xl text-white/90">
            Discover live music near you, buy tickets easily, and support local artists.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg">Find Events Near You</h3>
                <p className="text-white/80">Search by genre, location, and date</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Star className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg">No Hidden Fees</h3>
                <p className="text-white/80">Fair pricing with transparent ticketing</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Heart className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg">Support Artists</h3>
                <p className="text-white/80">Rate and review shows to help musicians grow</p>
              </div>
            </div>
          </div>
        </div>

          <div className="bg-white rounded-lg shadow-2xl p-8">
            <SignUpForm onToggle={() => setShowLogin(true)} defaultUserType="fan" />
          </div>
        </div>
      </div>
    </div>
  );
}
