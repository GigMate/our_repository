import { useState, useEffect } from 'react';
import { Music, Users, Calendar, DollarSign, Star, ArrowRight, ChevronLeft, ChevronRight, TrendingUp, MapPin, Clock, Ticket, Lock, LogIn } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useAuth } from '../../contexts/AuthContext';

interface HomePageProps {
  onGetStarted: () => void;
  onMusicianClick?: () => void;
  onVenueClick?: () => void;
  onFanClick?: () => void;
  onInvestorClick?: () => void;
  onLogin?: () => void;
}

interface FeaturedEvent {
  id: string;
  title: string;
  event_date: string;
  start_time: string;
  ticket_price: number;
  venue_name: string;
  venue_city: string;
  venue_state: string;
  musician_name: string;
  genres: string[];
  distance_miles: number;
}

const VENUE_IMAGES = [
  'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
  'https://images.pexels.com/photos/2147029/pexels-photo-2147029.jpeg',
  'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg',
  'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg',
  'https://images.pexels.com/photos/2102568/pexels-photo-2102568.jpeg',
  'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg',
];

export default function HomePage({ onGetStarted, onMusicianClick, onVenueClick, onFanClick, onInvestorClick, onLogin }: HomePageProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [featuredEvent, setFeaturedEvent] = useState<FeaturedEvent | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const { latitude, longitude } = useGeolocation();
  const { profile } = useAuth();

  const isPremiumUser = profile?.subscription_tier === 'premium';

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % VENUE_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (latitude && longitude) {
      loadFeaturedEvent();
    }
  }, [latitude, longitude]);

  async function loadFeaturedEvent() {
    if (!latitude || !longitude) return;

    setLoadingEvent(true);
    try {
      const radiusMiles = 2;
      const milesPerDegree = 69;
      const latRange = radiusMiles / milesPerDegree;
      const lngRange = radiusMiles / (milesPerDegree * Math.cos((latitude * Math.PI) / 180));

      const { data: events, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          event_date,
          show_starts,
          ticket_price,
          venues!inner(venue_name, city, state, latitude, longitude),
          musicians!inner(stage_name, genres)
        `)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .gte('venues.latitude', latitude - latRange)
        .lte('venues.latitude', latitude + latRange)
        .gte('venues.longitude', longitude - lngRange)
        .lte('venues.longitude', longitude + lngRange)
        .order('event_date', { ascending: true })
        .limit(1);

      if (error) throw error;

      if (events && events.length > 0) {
        const event = events[0];
        const venue = Array.isArray(event.venues) ? event.venues[0] : event.venues;
        const musician = Array.isArray(event.musicians) ? event.musicians[0] : event.musicians;
        const venueLat = venue?.latitude || 0;
        const venueLng = venue?.longitude || 0;

        const distance = Math.sqrt(
          Math.pow((latitude - venueLat) * milesPerDegree, 2) +
          Math.pow((longitude - venueLng) * milesPerDegree * Math.cos((latitude * Math.PI) / 180), 2)
        );

        setFeaturedEvent({
          id: event.id,
          title: event.title,
          event_date: event.event_date,
          start_time: event.show_starts,
          ticket_price: event.ticket_price,
          venue_name: venue?.venue_name || '',
          venue_city: venue?.city || '',
          venue_state: venue?.state || '',
          musician_name: musician?.stage_name || '',
          genres: musician?.genres || [],
          distance_miles: distance,
        });
      }
    } catch (error) {
      console.error('Error loading featured event:', error);
    } finally {
      setLoadingEvent(false);
    }
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % VENUE_IMAGES.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + VENUE_IMAGES.length) % VENUE_IMAGES.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
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
            <p className="text-xl md:text-2xl text-white mb-6 max-w-3xl mx-auto drop-shadow-md whitespace-nowrap">
              Where fans discover live music, shop local, and support the artists they&nbsp;love
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gigmate-red text-white text-lg font-semibold rounded-lg hover:bg-gigmate-red-dark transition-all transform hover:scale-105 shadow-2xl"
              >
                Get Started
                <ArrowRight className="h-6 w-6" />
              </button>
              {onLogin && (
                <button
                  onClick={onLogin}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gigmate-blue text-lg font-semibold rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl"
                >
                  <LogIn className="h-6 w-6" />
                  Login
                </button>
              )}
            </div>
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

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
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

      {(featuredEvent || loadingEvent || (latitude && longitude && !featuredEvent && !loadingEvent)) && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          {isPremiumUser && featuredEvent ? (
            <div className="bg-gradient-to-br from-orange-600 via-red-600 to-rose-700 rounded-2xl shadow-2xl p-8 border-4 border-orange-400">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                  PREMIUM MEMBER EXCLUSIVE
                </div>
                <Star className="w-5 h-5 text-yellow-300 animate-pulse" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-2">Live Music Near You</h2>
              <p className="text-white/90 mb-6">Happening within 2 miles of your location</p>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{featuredEvent.title}</h3>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-gray-700">
                        <Music className="w-5 h-5 text-gray-900 flex-shrink-0" />
                        <div>
                          <span className="font-semibold">{featuredEvent.musician_name}</span>
                          {featuredEvent.genres.length > 0 && (
                            <span className="text-sm text-gray-500 ml-2">
                              {featuredEvent.genres.slice(0, 2).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-gray-700">
                        <MapPin className="w-5 h-5 text-red-700 flex-shrink-0" />
                        <div>
                          <div className="font-semibold">{featuredEvent.venue_name}</div>
                          <div className="text-sm text-gray-500">
                            {featuredEvent.venue_city}, {featuredEvent.venue_state} • {featuredEvent.distance_miles.toFixed(1)} mi away
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-gray-700">
                        <Calendar className="w-5 h-5 text-green-700 flex-shrink-0" />
                        <div>
                          <span className="font-semibold">
                            {new Date(featuredEvent.event_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-gray-700">
                        <Clock className="w-5 h-5 text-gray-900 flex-shrink-0" />
                        <span className="font-semibold">{featuredEvent.start_time}</span>
                      </div>

                      <div className="flex items-center gap-3 text-gray-700">
                        <Ticket className="w-5 h-5 text-orange-700 flex-shrink-0" />
                        <span className="font-semibold text-lg text-gray-900">
                          ${featuredEvent.ticket_price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between">
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-4 mb-4">
                      <MapPin className="w-8 h-8 text-white mx-auto mb-2" />
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{featuredEvent.distance_miles.toFixed(1)}</div>
                        <div className="text-sm text-white/90">miles away</div>
                      </div>
                    </div>

                    <button
                      onClick={onFanClick || onGetStarted}
                      className="px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-bold rounded-lg hover:from-gray-800 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      Get Tickets
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : !isPremiumUser && featuredEvent ? (
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 backdrop-blur-sm bg-white/30"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-3xl font-bold text-gray-900">Live Music Near You</h2>
                  <Lock className="w-8 h-8 text-gray-400" />
                </div>

                <div className="bg-white/50 backdrop-blur-md rounded-xl p-6 mb-6 filter blur-sm pointer-events-none">
                  <div className="h-32 bg-gray-300 animate-pulse rounded-lg"></div>
                </div>

                <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl p-6 text-center">
                  <Star className="w-12 h-12 mx-auto mb-3" />
                  <h3 className="text-2xl font-bold mb-2">Upgrade to Premium</h3>
                  <p className="text-white/90 mb-4">
                    Discover live music events happening within 2 miles of your location. Premium members get priority access to nearby shows!
                  </p>
                  <button
                    onClick={onGetStarted}
                    className="px-8 py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-all shadow-lg"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            </div>
          ) : loadingEvent ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="animate-pulse">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-bounce" />
                <p className="text-gray-600">Finding live music near you...</p>
              </div>
            </div>
          ) : latitude && longitude ? (
            <div className="bg-gradient-to-br from-gray-700 to-gray-600 rounded-2xl shadow-xl p-8 text-center">
              <Music className="w-12 h-12 text-white mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Upcoming Events Nearby</h3>
              <p className="text-white/90 mb-4">
                We couldn't find any live music events within 2 miles of your location right now.
              </p>
              <button
                onClick={onFanClick || onGetStarted}
                className="px-6 py-3 bg-gigmate-blue text-white font-semibold rounded-lg hover:bg-gigmate-blue-dark transition-colors"
              >
                Browse All Events
              </button>
            </div>
          ) : null}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-2xl p-8 text-center transform hover:scale-105 transition-transform border-4 border-green-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-yellow-500 text-gray-900 px-4 py-1 text-xs font-bold rounded-bl-lg">
              THE HEART OF GIGMATE
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Star className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-green-700 mb-3">For Fans</h3>
            <p className="text-gray-700 mb-4 font-medium">
              You're the reason live music exists! Discover shows, buy tickets, shop merchandise, and support local artists in your area.
            </p>
            <ul className="text-left text-sm text-gray-800 space-y-2">
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <span className="font-medium">Events & tickets within YOUR area</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <span className="font-medium">Shop local musician merchandise</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <span className="font-medium">No hidden fees or markups</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <span className="font-medium">Personalized recommendations</span>
              </li>
            </ul>
            <button
              onClick={onFanClick || onGetStarted}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl mt-6"
            >
              Join as a Fan
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8 text-center transform hover:scale-105 transition-transform">
            <div className="bg-gray-700 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Music className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gigmate-blue mb-3">For Musicians</h3>
            <p className="text-gray-600 mb-4">
              Find gigs, build your reputation, and get paid securely. Keep 90% of your earnings.
            </p>
            <ul className="text-left text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>Build professional profile with videos</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>Direct booking with venues</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
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
                <Star className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>Search musicians by genre & location</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>Built-in event ticketing</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
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
            <div className="bg-gray-700 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-orange-600 mb-3">For Investors</h3>
            <p className="text-gray-600 mb-4">
              By invitation only. Access platform analytics, revenue metrics, and growth insights.
            </p>
            <ul className="text-left text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>Real-time platform analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>Revenue & growth metrics</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>Market insights & KPIs</span>
              </li>
            </ul>
            <button
              onClick={onInvestorClick || onGetStarted}
              className="w-full px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors mt-6"
            >
              Request Access
            </button>
          </div>

        </div>

        <div className="bg-white rounded-lg shadow-xl p-12 mb-16">
          <h2 className="text-3xl font-bold text-center text-gigmate-blue mb-8">
            Why Choose GigMate?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="bg-gray-700 rounded-lg p-3 h-12 w-12 flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Fair Pricing</h3>
                <p className="text-gray-600">
                  Only 10% platform fee vs 20-30%+ from competitors. Musicians keep more of what they earn.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-gray-700 rounded-lg p-3 h-12 w-12 flex items-center justify-center flex-shrink-0">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Trust & Safety</h3>
                <p className="text-gray-600">
                  Escrow payment protection, verified ratings, and digital contracts keep everyone safe.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-gray-700 rounded-lg p-3 h-12 w-12 flex items-center justify-center flex-shrink-0">
                <Music className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Music-Focused</h3>
                <p className="text-gray-600">
                  Built specifically for live music. Features designed by musicians for musicians.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-gray-700 rounded-lg p-3 h-12 w-12 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-6 w-6 text-white" />
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
              <Star className="h-12 w-12 mx-auto mb-3 text-yellow-600" />
              <h3 className="font-bold mb-2">Everyone Gets Rated</h3>
              <p className="text-sm text-white/90">
                Musicians, venues, and fans all participate in our rating system, ensuring accountability for all.
              </p>
            </div>
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-3 text-yellow-600" />
              <h3 className="font-bold mb-2">Reputation Protection</h3>
              <p className="text-sm text-white/90">
                No single entity can damage the platform's reputation—our mutual rating system keeps everyone honest.
              </p>
            </div>
            <div className="text-center">
              <Star className="h-12 w-12 mx-auto mb-3 text-yellow-600" />
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
