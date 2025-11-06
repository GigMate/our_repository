import { useState, useEffect } from 'react';
import { Music, Users, Calendar, DollarSign, Star, ArrowRight, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';

interface HomePageProps {
  onGetStarted: () => void;
  onMusicianClick?: () => void;
  onVenueClick?: () => void;
  onFanClick?: () => void;
  onInvestorClick?: () => void;
}

const VENUE_IMAGES = [
  'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
  'https://images.pexels.com/photos/2147029/pexels-photo-2147029.jpeg',
  'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg',
  'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg',
  'https://images.pexels.com/photos/2102568/pexels-photo-2102568.jpeg',
  'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg',
];

export default function HomePage({ onGetStarted, onMusicianClick, onVenueClick, onFanClick, onInvestorClick }: HomePageProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % VENUE_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % VENUE_IMAGES.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + VENUE_IMAGES.length) % VENUE_IMAGES.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gigmate-blue to-gigmate-blue-light">
      <div className="relative w-full h-96 mb-8 overflow-hidden">
        <div className="absolute inset-0">
          {VENUE_IMAGES.map((image, index) => (
            <div
              key={image}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={image}
                alt="Live music venue"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-gigmate-blue/80" />
            </div>
          ))}
        </div>

        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center px-4">
            <img
              src="/GigMate Pick 2.png"
              alt="GigMate Logo"
              className="h-24 w-24 mx-auto mb-4 drop-shadow-2xl"
            />
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              Welcome to GigMate
            </h1>
            <p className="text-xl md:text-2xl text-white mb-6 max-w-3xl mx-auto drop-shadow-md">
              The modern marketplace connecting musicians, venues, and fans
            </p>
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gigmate-red text-white text-lg font-semibold rounded-lg hover:bg-gigmate-red-dark transition-all transform hover:scale-105 shadow-2xl"
            >
              Get Started
              <ArrowRight className="h-6 w-6" />
            </button>
          </div>
        </div>

        <button
          onClick={prevImage}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-3 rounded-full transition-all"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={nextImage}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-3 rounded-full transition-all"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {VENUE_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentImageIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-4 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center transform hover:scale-105 transition-transform">
            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Music className="h-8 w-8 text-gigmate-blue" />
            </div>
            <h3 className="text-2xl font-bold text-gigmate-blue mb-3">For Musicians</h3>
            <p className="text-gray-600 mb-4">
              Find gigs, build your reputation, and get paid securely. Keep 90% of your earnings.
            </p>
            <ul className="text-left text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>Build professional profile with videos</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>Direct booking with venues</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>Secure escrow payments</span>
              </li>
            </ul>
            <button
              onClick={onMusicianClick || onGetStarted}
              className="w-full px-6 py-3 bg-gigmate-blue text-white font-semibold rounded-lg hover:bg-gigmate-blue-dark transition-colors mt-6"
            >
              Get Started
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8 text-center transform hover:scale-105 transition-transform">
            <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-purple-600 mb-3">For Venues</h3>
            <p className="text-gray-600 mb-4">
              Discover talented musicians, manage bookings, and sell tickets all in one place.
            </p>
            <ul className="text-left text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>Search musicians by genre & location</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>Built-in event ticketing</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>Digital contracts & agreements</span>
              </li>
            </ul>
            <button
              onClick={onVenueClick || onGetStarted}
              className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors mt-6"
            >
              Get Started
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8 text-center transform hover:scale-105 transition-transform">
            <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-600 mb-3">For Fans</h3>
            <p className="text-gray-600 mb-4">
              Discover live music near you, buy tickets easily, and support local artists.
            </p>
            <ul className="text-left text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>Find events by genre & location</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>No hidden fees or markups</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>Rate & review performances</span>
              </li>
            </ul>
            <button
              onClick={onFanClick || onGetStarted}
              className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors mt-6"
            >
              Get Started
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8 text-center transform hover:scale-105 transition-transform">
            <div className="bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-orange-600 mb-3">For Investors</h3>
            <p className="text-gray-600 mb-4">
              Access platform analytics, revenue metrics, and growth insights from the GigMate ecosystem.
            </p>
            <ul className="text-left text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>Real-time platform analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>Revenue & growth metrics</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>Market insights & KPIs</span>
              </li>
            </ul>
            <button
              onClick={onInvestorClick || onGetStarted}
              className="w-full px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors mt-6"
            >
              Get Started
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-12 mb-16">
          <h2 className="text-3xl font-bold text-center text-gigmate-blue mb-8">
            Why Choose GigMate?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="bg-blue-100 rounded-lg p-3 h-12 w-12 flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-6 w-6 text-gigmate-blue" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Fair Pricing</h3>
                <p className="text-gray-600">
                  Only 10% platform fee vs 20-30%+ from competitors. Musicians keep more of what they earn.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-blue-100 rounded-lg p-3 h-12 w-12 flex items-center justify-center flex-shrink-0">
                <Star className="h-6 w-6 text-gigmate-blue" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Trust & Safety</h3>
                <p className="text-gray-600">
                  Escrow payment protection, verified ratings, and digital contracts keep everyone safe.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-blue-100 rounded-lg p-3 h-12 w-12 flex items-center justify-center flex-shrink-0">
                <Music className="h-6 w-6 text-gigmate-blue" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Music-Focused</h3>
                <p className="text-gray-600">
                  Built specifically for live music. Features designed by musicians for musicians.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-blue-100 rounded-lg p-3 h-12 w-12 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-6 w-6 text-gigmate-blue" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">We Handle Everything</h3>
                <p className="text-gray-600">
                  From booking to leveraged advertising, promotion, payments, receipts, and merchandise fulfillment. GigMate can do it all.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-12 mb-8">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Trust & Safety Through Mutual Ratings
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-white">
            <div className="text-center">
              <Star className="h-12 w-12 mx-auto mb-3 text-yellow-400" />
              <h3 className="font-bold mb-2">Everyone Gets Rated</h3>
              <p className="text-sm text-white/90">
                Musicians, venues, and fans all participate in our rating system, ensuring accountability for all.
              </p>
            </div>
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-3 text-yellow-400" />
              <h3 className="font-bold mb-2">Reputation Protection</h3>
              <p className="text-sm text-white/90">
                No single entity can damage the platform's reputation—our mutual rating system keeps everyone honest.
              </p>
            </div>
            <div className="text-center">
              <Star className="h-12 w-12 mx-auto mb-3 text-yellow-400" />
              <h3 className="font-bold mb-2">Quality Community</h3>
              <p className="text-sm text-white/90">
                Bad actors get filtered out naturally. Great musicians, venues, and fans rise to the top.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Join the GigMate Community?
          </h2>
          <p className="text-xl text-white mb-8">
            Whether you're a musician looking for gigs, a venue seeking talent, or a fan discovering live music
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gigmate-blue text-lg font-semibold rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
          >
            Create Your Free Account
            <ArrowRight className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-16 text-center text-white text-sm space-y-2">
          <p>© 2025 GigMate. Making live music better for everyone.</p>
          <p>
            <a href="/admin/seed" className="hover:underline opacity-75 hover:opacity-100 transition-opacity">
              Admin: Seed Database
            </a>
            {' | '}
            <a href="/admin/legal" className="hover:underline opacity-75 hover:opacity-100 transition-opacity">
              Admin: Legal Documents
            </a>
            {' | '}
            <a href="/docs" className="hover:underline opacity-75 hover:opacity-100 transition-opacity">
              Documentation
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
