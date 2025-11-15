import { useState, useEffect, useCallback } from 'react';
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

  const loadFeaturedEvent = useCallback(async () => {
    if (!latitude || !longitude) return;

    setLoadingEvent(true);
    try {
      const radiusMiles = 50;
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
        .limit(20);

      if (error) throw error;

      if (events && events.length > 0) {
        // Calculate distance for each event and find the nearest one
        const eventsWithDistance = events.map(event => {
          const venue = Array.isArray(event.venues) ? event.venues[0] : event.venues;
          const musician = Array.isArray(event.musicians) ? event.musicians[0] : event.musicians;
          const venueLat = venue?.latitude || 0;
          const venueLng = venue?.longitude || 0;

          const distance = Math.sqrt(
            Math.pow((latitude - venueLat) * milesPerDegree, 2) +
            Math.pow((longitude - venueLng) * milesPerDegree * Math.cos((latitude * Math.PI) / 180), 2)
          );

          return {
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
          };
        });

        // Sort by distance and get the nearest one
        const nearestEvent = eventsWithDistance.sort((a, b) => a.distance_miles - b.distance_miles)[0];
        setFeaturedEvent(nearestEvent);
      }
    } catch (error) {
      console.error('Error loading featured event:', error);
    } finally {
      setLoadingEvent(false);
    }
  }, [latitude, longitude]);

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
  }, [latitude, longitude, loadFeaturedEvent]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % VENUE_IMAGES.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + VENUE_IMAGES.length) % VENUE_IMAGES.length);
  };

  return (
    <div className="min-h-screen bg-gray-50">
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

        <div className="relative z-10 h-full flex items-center justify-center pt-8">
          <div className="text-center px-4">
            <img
              src="/GigMate Pick 2.png"
              alt="GigMate Logo"
              className="h-28 w-28 mx-auto mb-6 drop-shadow-2xl"
            />
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-3 drop-shadow-lg">
              Welcome to GigMate
            </h1>
            <p className="text-2xl md:text-3xl font-semibold text-yellow-300 mb-5 drop-shadow-lg">
              Empowering live music communities, one gig at a time.
            </p>
            <p className="text-lg md:text-xl text-white mb-8 max-w-3xl mx-auto drop-shadow-md">
              Where fans discover live music, shop local, and support the artists they&nbsp;love
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          {isPremiumUser && featuredEvent ? (
            <div className="bg-gradient-to-br from-orange-600 via-red-600 to-rose-700 rounded-2xl shadow-2xl p-6 border-4 border-orange-400">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
                  PREMIUM EXCLUSIVE
                </div>
                <Star className="w-4 h-4 text-yellow-300 animate-pulse" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-1">Nearest Event to You</h2>
              <p className="text-white/90 mb-4 text-sm">Closest upcoming live music show</p>

              <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{featuredEvent.title}</h3>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Music className="w-4 h-4 text-gray-900 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-sm">{featuredEvent.musician_name}</span>
                          {featuredEvent.genres.length > 0 && (
                            <span className="text-xs text-gray-500 ml-2">
                              {featuredEvent.genres.slice(0, 2).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 text-red-700 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-sm">{featuredEvent.venue_name}</div>
                          <div className="text-xs text-gray-500">
                            {featuredEvent.venue_city}, {featuredEvent.venue_state} • {featuredEvent.distance_miles.toFixed(1)} mi away
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4 text-green-700 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-sm">
                            {new Date(featuredEvent.event_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-4 h-4 text-gray-900 flex-shrink-0" />
                        <span className="font-semibold text-sm">{featuredEvent.start_time}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <Ticket className="w-4 h-4 text-orange-700 flex-shrink-0" />
                        <span className="font-semibold text-base text-gray-900">
                          ${featuredEvent.ticket_price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between md:min-w-[140px]">
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-3 mb-3">
                      <MapPin className="w-6 h-6 text-white mx-auto mb-1" />
                      <div className="text-center">
                        <div className="text-xl font-bold text-white">{featuredEvent.distance_miles.toFixed(1)}</div>
                        <div className="text-xs text-white/90">miles</div>
                      </div>
                    </div>

                    <button
                      onClick={onFanClick || onGetStarted}
                      className="px-4 py-2 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-bold text-sm rounded-lg hover:from-gray-800 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      Get Tickets
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : !isPremiumUser && featuredEvent ? (
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 backdrop-blur-sm bg-white/30"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-2xl font-bold text-gray-900">Nearest Event to You</h2>
                  <Lock className="w-6 h-6 text-gray-400" />
                </div>

                <div className="bg-white/50 backdrop-blur-md rounded-xl p-4 mb-4 filter blur-sm pointer-events-none">
                  <div className="h-24 bg-gray-300 animate-pulse rounded-lg"></div>
                </div>

                <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl p-4 text-center">
                  <Star className="w-10 h-10 mx-auto mb-2" />
                  <h3 className="text-xl font-bold mb-2">Upgrade to Premium</h3>
                  <p className="text-white/90 mb-3 text-sm">
                    See the nearest live music event to your location! Premium members get instant access to nearby shows sorted by distance.
                  </p>
                  <button
                    onClick={onGetStarted}
                    className="px-6 py-2 bg-gray-900 text-white font-bold text-sm rounded-lg hover:bg-gray-800 transition-all shadow-lg"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            </div>
          ) : loadingEvent ? (
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
              <div className="animate-pulse">
                <MapPin className="w-10 h-10 text-gray-400 mx-auto mb-3 animate-bounce" />
                <p className="text-gray-600 text-sm">Finding nearest live music...</p>
              </div>
            </div>
          ) : latitude && longitude ? (
            <div className="bg-gradient-to-br from-gray-700 to-gray-600 rounded-2xl shadow-xl p-6 text-center">
              <Music className="w-10 h-10 text-white mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">No Upcoming Events Nearby</h3>
              <p className="text-white/90 mb-3 text-sm">
                We couldn't find any live music events within 50 miles of your location right now.
              </p>
              <button
                onClick={onFanClick || onGetStarted}
                className="px-4 py-2 bg-gigmate-blue text-white font-semibold text-sm rounded-lg hover:bg-gigmate-blue-dark transition-colors"
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
            <div className="bg-gradient-to-br from-gigmate-blue to-blue-700 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
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
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Users className="h-8 w-8 text-white" />
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
            <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
              <TrendingUp className="h-8 w-8 text-white" />
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

        <div className="bg-gradient-to-br from-slate-800 via-gray-800 to-slate-900 rounded-lg shadow-2xl p-12 mb-16 border border-gray-700">
          <h2 className="text-3xl font-bold text-center text-white mb-8">
            Why Choose GigMate?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="bg-gradient-to-br from-gigmate-blue to-blue-700 rounded-lg p-3 h-12 w-12 flex items-center justify-center flex-shrink-0 shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white mb-2">Fair Pricing</h3>
                <p className="text-gray-300">
                  Only 10% platform fee vs 20-30%+ from competitors. Musicians keep more of what they earn.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-gradient-to-br from-gigmate-red to-red-700 rounded-lg p-3 h-12 w-12 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white mb-2">Trust & Safety</h3>
                <p className="text-gray-300">
                  Escrow payment protection, verified ratings, and digital contracts keep everyone safe.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-3 h-12 w-12 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Music className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white mb-2">Music-Focused</h3>
                <p className="text-gray-300">
                  Built specifically for live music. Features designed by musicians for musicians.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-3 h-12 w-12 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white mb-2">We Handle Everything</h3>
                <p className="text-gray-300">
                  From booking to leveraged advertising, promotion, payments, receipts, and merchandise fulfillment. GigMate can do it all.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 rounded-2xl shadow-2xl p-12 mb-8">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Trust & Safety Through Mutual Ratings
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-white">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center hover:bg-white/20 transition-all">
              <div className="bg-yellow-500/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Star className="h-10 w-10 text-yellow-400" />
              </div>
              <h3 className="font-bold text-lg mb-3">Everyone Gets Rated</h3>
              <p className="text-sm text-white/90 leading-relaxed">
                Musicians, venues, and fans all participate in our rating system, ensuring accountability for all.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center hover:bg-white/20 transition-all">
              <div className="bg-blue-500/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Users className="h-10 w-10 text-blue-400" />
              </div>
              <h3 className="font-bold text-lg mb-3">Reputation Protection</h3>
              <p className="text-sm text-white/90 leading-relaxed">
                No single entity can damage the platform's reputation—our mutual rating system keeps everyone honest.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center hover:bg-white/20 transition-all">
              <div className="bg-green-500/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Star className="h-10 w-10 text-green-400" />
              </div>
              <h3 className="font-bold text-lg mb-3">Quality Community</h3>
              <p className="text-sm text-white/90 leading-relaxed">
                Bad actors get filtered out naturally. Great musicians, venues, and fans rise to the top.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 via-gray-800 to-slate-900 rounded-2xl shadow-2xl p-12 mb-8 text-center">
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

        <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-black rounded-2xl shadow-2xl p-8 text-center text-white text-sm space-y-2">
          <p>© 2025 GigMate. Making live music better for everyone.</p>
          {!profile && onLogin && (
            <p className="space-x-3">
              <button
                onClick={onLogin}
                className="hover:underline opacity-75 hover:opacity-100 transition-opacity text-white font-medium"
              >
                Admin Login
              </button>
              <span className="opacity-50">|</span>
              <a
                href="/password-reset"
                className="hover:underline opacity-75 hover:opacity-100 transition-opacity text-white font-medium"
              >
                Reset Password
              </a>
            </p>
          )}
          {profile?.user_type === 'admin' && (
            <p>
              <a href="/admin/seed" className="hover:underline opacity-75 hover:opacity-100 transition-opacity">
                Admin: Seed Database
              </a>
              {' | '}
              <a href="/admin/legal" className="hover:underline opacity-75 hover:opacity-100 transition-opacity">
                Admin: Legal Documents
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
