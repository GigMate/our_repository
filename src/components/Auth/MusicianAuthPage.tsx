import { useState } from 'react';
import { Music, Star, DollarSign, Calendar } from 'lucide-react';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';

interface MusicianAuthPageProps {
  onBack: () => void;
}

export default function MusicianAuthPage({ onBack }: MusicianAuthPageProps) {
  const [showLogin, setShowLogin] = useState(false);

  if (showLogin) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg"
            alt="Musician performing"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gigmate-blue/90 to-gigmate-blue-light/90" />
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <LoginForm onToggle={() => setShowLogin(false)} onBack={onBack} userType="musician" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg"
          alt="Musician performing"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gigmate-blue/90 to-gigmate-blue-light/90" />
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
            <Music className="h-12 w-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">Join as a Musician</h1>
          <p className="text-xl text-white/90">
            Find gigs, build your reputation, and get paid securely. Keep 90% of your earnings.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <Star className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg">Build Your Profile</h3>
                <p className="text-white/80">Showcase your talent with videos, photos, and ratings</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg">Get Booked Directly</h3>
                <p className="text-white/80">Venues can find and book you with verified contracts</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg">Secure Payments</h3>
                <p className="text-white/80">Escrow protection and only 10% platform fee</p>
              </div>
            </div>
          </div>
        </div>

          <div className="bg-white rounded-lg shadow-2xl p-8">
            <SignUpForm onToggle={() => setShowLogin(true)} defaultUserType="musician" />
          </div>
        </div>
      </div>
    </div>
  );
}
