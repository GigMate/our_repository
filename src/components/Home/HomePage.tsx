import { useState, useEffect, useCallback } from 'react';
import { Music, Users, Calendar, DollarSign, Star, ArrowRight, ChevronLeft, ChevronRight, TrendingUp, MapPin, Clock, Ticket, LogIn } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useAuth } from '../../contexts/AuthContext';
import LeafletMap from '../Shared/LeafletMap';

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
  venue_address: string;
  venue_city: string;
  venue_state: string;
  venue_zip: string;
  venue_latitude: number;
  venue_longitude: number;
  musician_name: string;
  genres: string[];
  distance_miles: number;
}

interface VenueWithBooking {
  venue_id: string;
  venue_name: string;
  venue_address: string;
  venue_city: string;
  venue_state: string;
  venue_zip: string;
  venue_latitude: number;
  venue_longitude: number;
  booking_count: number;
  next_show_date: string;
  next_show_title: string;
  musician_name: string;
  agreed_rate: number;
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
  const [venuesWithBookings, setVenuesWithBookings] = useState<VenueWithBooking[]>([]);
  const [currentVenueIndex, setCurrentVenueIndex] = useState(0);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const { latitude: userLat, longitude: userLng } = useGeolocation();
  const { profile } = useAuth();

  const latitude = userLat || 29.4241;
  const longitude = userLng || -98.4936;

  const loadVenuesWithBookings = useCallback(async () => {
    setLoadingVenues(true);
    try {
      const radiusMiles = 100;
      const milesPerDegree = 69;

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          agreed_rate,
          status,
          venue_id,
          musician_id,
          event_id,
          venues!inner(id, venue_name, address, city, state, zip_code, latitude, longitude),
          events!inner(id, title, event_date, show_starts)
        `)
        .in('status', ['accepted', 'escrowed'])
        .limit(50);

      if (error) {
        console.error('Error fetching bookings:', error);
        throw error;
      }

      if (bookings && bookings.length > 0) {
        const venueMap = new Map<string, VenueWithBooking>();

        for (const booking of bookings) {
          const venue = Array.isArray(booking.venues) ? booking.venues[0] : booking.venues;
          const event = Array.isArray(booking.events) ? booking.events[0] : booking.events;

          if (!venue || !event || !venue.latitude || !venue.longitude) continue;

          const eventDate = new Date(event.event_date);
          if (eventDate < new Date()) continue;

          const venueLat = parseFloat(venue.latitude) || 0;
          const venueLng = parseFloat(venue.longitude) || 0;

          const distance = Math.sqrt(
            Math.pow((latitude - venueLat) * milesPerDegree, 2) +
            Math.pow((longitude - venueLng) * milesPerDegree * Math.cos((latitude * Math.PI) / 180), 2)
          );

          if (distance > radiusMiles) continue;

          const { data: musicianProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', booking.musician_id)
            .maybeSingle();

          if (!venueMap.has(venue.id)) {
            venueMap.set(venue.id, {
              venue_id: venue.id,
              venue_name: venue.venue_name,
              venue_address: venue.address,
              venue_city: venue.city,
              venue_state: venue.state,
              venue_zip: venue.zip_code,
              venue_latitude: venueLat,
              venue_longitude: venueLng,
              booking_count: 1,
              next_show_date: event.event_date,
              next_show_title: event.title,
              musician_name: musicianProfile?.full_name || 'Unknown Artist',
              agreed_rate: booking.agreed_rate,
              distance_miles: distance,
            });
          } else {
            const existing = venueMap.get(venue.id)!;
            existing.booking_count += 1;
          }
        }

        const venuesList = Array.from(venueMap.values())
          .sort((a, b) => a.distance_miles - b.distance_miles);

        setVenuesWithBookings(venuesList);
      }
    } catch (error) {
      console.error('Error loading venues with bookings:', error);
    } finally {
      setLoadingVenues(false);
    }
  }, [latitude, longitude]);

  const loadFeaturedEvent = useCallback(async () => {
    setLoadingEvent(true);
    try {
      const radiusMiles = 100;
      const milesPerDegree = 69;

      const { data: events, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          event_date,
          show_starts,
          ticket_price,
          venues!inner(venue_name, address, city, state, zip_code, latitude, longitude),
          musicians!inner(stage_name, genres)
        `)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .not('venues.latitude', 'is', null)
        .not('venues.longitude', 'is', null)
        .order('event_date', { ascending: true })
        .limit(100);

      if (error) throw error;

      if (events && events.length > 0) {
        const eventsWithDistance = events.map(event => {
          const venue = Array.isArray(event.venues) ? event.venues[0] : event.venues;
          const musician = Array.isArray(event.musicians) ? event.musicians[0] : event.musicians;
          const venueLat = parseFloat(venue?.latitude) || 0;
          const venueLng = parseFloat(venue?.longitude) || 0;

          const distance = Math.sqrt(
            Math.pow((latitude - venueLat) * milesPerDegree, 2) +
            Math.pow((longitude - venueLng) * milesPerDegree * Math.cos((latitude * Math.PI) / 180), 2)
          );

          return {
            id: event.id,
            title: event.title,
            event_date: event.event_date,
            start_time: event.show_starts,
            ticket_price: Math.ceil(event.ticket_price),
            venue_name: venue?.venue_name || '',
            venue_address: venue?.address || '',
            venue_city: venue?.city || '',
            venue_state: venue?.state || '',
            venue_zip: venue?.zip_code || '',
            venue_latitude: venueLat,
            venue_longitude: venueLng,
            musician_name: musician?.stage_name || '',
            genres: musician?.genres || [],
            distance_miles: distance,
          };
        }).filter(event => event.distance_miles <= radiusMiles);

        if (eventsWithDistance.length > 0) {
          const nearestEvent = eventsWithDistance.sort((a, b) => a.distance_miles - b.distance_miles)[0];
          setFeaturedEvent(nearestEvent);
        }
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
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadVenuesWithBookings();
    loadFeaturedEvent();
  }, [loadVenuesWithBookings, loadFeaturedEvent]);

  useEffect(() => {
    if (venuesWithBookings.length > 1) {
      const interval = setInterval(() => {
        setCurrentVenueIndex((prev) => (prev + 1) % venuesWithBookings.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [venuesWithBookings.length]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % VENUE_IMAGES.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + VENUE_IMAGES.length) % VENUE_IMAGES.length);
  };

  const nextVenue = () => {
    setCurrentVenueIndex((prev) => (prev + 1) % venuesWithBookings.length);
  };

  const prevVenue = () => {
    setCurrentVenueIndex((prev) => (prev - 1 + venuesWithBookings.length) % venuesWithBookings.length);
  };

  const currentVenue = venuesWithBookings[currentVenueIndex];

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

        <div className="relative z-10 h-full flex items-center justify-center py-12">
          <div className="text-center px-4">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              Welcome to GigMate
            </h1>
            <p className="text-2xl md:text-3xl font-semibold text-yellow-300 mb-6 drop-shadow-lg">
              Empowering live music communities, one gig at a time.
            </p>
            <p className="text-lg md:text-xl text-white mb-10 max-w-3xl mx-auto drop-shadow-md">
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

      {venuesWithBookings.length > 0 && currentVenue && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="bg-gradient-to-br from-gigmate-blue via-blue-700 to-blue-900 rounded-2xl shadow-2xl p-6 border-4 border-blue-400 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Venues with Booked Shows</h2>
                <p className="text-white/90 text-sm">Live music happening now at local venues</p>
              </div>
              {venuesWithBookings.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevVenue}
                    className="bg-white/20 hover:bg-white/40 backdrop-blur-sm p-2 rounded-full transition-all"
                    aria-label="Previous venue"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <span className="text-white font-semibold text-sm px-3">
                    {currentVenueIndex + 1} / {venuesWithBookings.length}
                  </span>
                  <button
                    onClick={nextVenue}
                    className="bg-white/20 hover:bg-white/40 backdrop-blur-sm p-2 rounded-full transition-all"
                    aria-label="Next venue"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative h-80">
                  <img
                    src={VENUE_IMAGES[currentVenueIndex % VENUE_IMAGES.length]}
                    alt={currentVenue.venue_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="text-white text-lg font-bold">
                      {currentVenue.venue_name}
                    </div>
                    <div className="text-white/90 text-sm">
                      {currentVenue.booking_count} {currentVenue.booking_count === 1 ? 'booking' : 'bookings'} confirmed
                    </div>
                  </div>
                </div>

                <div className="relative h-80">
                  <LeafletMap
                    center={{ lat: currentVenue.venue_latitude, lng: currentVenue.venue_longitude }}
                    zoom={14}
                    markers={[
                      {
                        id: currentVenue.venue_id,
                        position: { lat: currentVenue.venue_latitude, lng: currentVenue.venue_longitude },
                        title: currentVenue.venue_name,
                        subtitle: `${currentVenue.venue_city}, ${currentVenue.venue_state}`,
                      }
                    ]}
                    height="100%"
                  />
                </div>
              </div>

              <div className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Next Show: {currentVenue.next_show_title}</h3>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Music className="w-4 h-4 text-gray-900 flex-shrink-0" />
                        <span className="font-semibold text-sm">{currentVenue.musician_name}</span>
                      </div>

                      <div className="flex items-start gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 text-gigmate-blue flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-sm">{currentVenue.venue_name}</div>
                          <div className="text-xs text-gray-600">
                            {currentVenue.venue_address}
                          </div>
                          <div className="text-xs text-gray-500">
                            {currentVenue.venue_city}, {currentVenue.venue_state} {currentVenue.venue_zip} • {currentVenue.distance_miles.toFixed(1)} mi away
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4 text-green-700 flex-shrink-0" />
                        <span className="font-semibold text-sm">
                          {new Date(currentVenue.next_show_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <DollarSign className="w-4 h-4 text-green-700 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-sm">Booking Rate: ${currentVenue.agreed_rate.toFixed(0)}</span>
                          <span className="text-xs text-gray-500 ml-2">This venue books quality talent</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between md:min-w-[140px]">
                    <div className="bg-gradient-to-br from-gigmate-blue to-blue-700 rounded-lg p-3 mb-3">
                      <MapPin className="w-6 h-6 text-white mx-auto mb-1" />
                      <div className="text-center">
                        <div className="text-xl font-bold text-white">{currentVenue.distance_miles.toFixed(1)}</div>
                        <div className="text-xs text-white/90">miles</div>
                      </div>
                    </div>

                    <button
                      onClick={onVenueClick || onGetStarted}
                      className="px-4 py-2 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-bold text-sm rounded-lg hover:from-gray-800 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      Explore Venue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {loadingVenues && !venuesWithBookings.length && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
            <div className="animate-pulse">
              <Users className="w-10 h-10 text-gray-400 mx-auto mb-3 animate-bounce" />
              <p className="text-gray-600 text-sm">Finding venues with bookings...</p>
            </div>
          </div>
        </div>
      )}

      {(featuredEvent || loadingEvent || (latitude && longitude && !featuredEvent && !loadingEvent)) && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          {featuredEvent ? (
            <div className="bg-gradient-to-br from-red-600 via-red-700 to-rose-700 rounded-2xl shadow-2xl p-6 border-4 border-red-400">
              <h2 className="text-2xl font-bold text-white mb-1">Nearest Event to You</h2>
              <p className="text-white/90 mb-4 text-sm">Closest upcoming live music show</p>

              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="relative h-80">
                    <img
                      src={VENUE_IMAGES[Math.floor(Math.random() * VENUE_IMAGES.length)]}
                      alt={featuredEvent.venue_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="text-white text-xs font-semibold uppercase tracking-wide">
                        {featuredEvent.venue_name}
                      </div>
                    </div>
                  </div>

                  <div className="relative h-80">
                    <LeafletMap
                      center={{ lat: featuredEvent.venue_latitude, lng: featuredEvent.venue_longitude }}
                      zoom={14}
                      markers={[
                        {
                          id: featuredEvent.id,
                          position: { lat: featuredEvent.venue_latitude, lng: featuredEvent.venue_longitude },
                          title: featuredEvent.venue_name,
                          subtitle: `${featuredEvent.venue_city}, ${featuredEvent.venue_state}`,
                        }
                      ]}
                      height="100%"
                    />
                  </div>
                </div>

                <div className="p-4">
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

                        <div className="flex items-start gap-2 text-gray-700">
                          <MapPin className="w-4 h-4 text-red-700 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-sm">{featuredEvent.venue_name}</div>
                            <div className="text-xs text-gray-600">
                              {featuredEvent.venue_address}
                            </div>
                            <div className="text-xs text-gray-500">
                              {featuredEvent.venue_city}, {featuredEvent.venue_state} {featuredEvent.venue_zip} • {featuredEvent.distance_miles.toFixed(1)} mi away
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
                          <Ticket className="w-4 h-4 text-red-700 flex-shrink-0" />
                          <span className="font-semibold text-base text-gray-900">
                            ${featuredEvent.ticket_price.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between md:min-w-[140px]">
                      <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-lg p-3 mb-3">
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
            </div>
          ) : loadingEvent ? (
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
              <div className="animate-pulse">
                <MapPin className="w-10 h-10 text-gray-400 mx-auto mb-3 animate-bounce" />
                <p className="text-gray-600 text-sm">Finding nearest live music...</p>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-700 to-gray-600 rounded-2xl shadow-xl p-6 text-center">
              <Music className="w-10 h-10 text-white mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">No Upcoming Events Nearby</h3>
              <p className="text-white/90 mb-3 text-sm">
                We couldn't find any live music events within 100 miles {userLat ? 'of your location' : 'of San Antonio, TX'} right now.
              </p>
              <button
                onClick={onFanClick || onGetStarted}
                className="px-4 py-2 bg-gigmate-blue text-white font-semibold text-sm rounded-lg hover:bg-gigmate-blue-dark transition-colors"
              >
                Browse All Events
              </button>
            </div>
          )}
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
            <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-red-600 mb-3">For Investors</h3>
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
              className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors mt-6"
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
          <p>© 2025 GigMate. Empowering live music communities, one gig at a time.</p>
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
