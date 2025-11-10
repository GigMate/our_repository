import { useState, useEffect } from 'react';
import { Search, Music, MapPin, Calendar, ShoppingBag, TrendingUp, Map as MapIcon, List } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useGeolocation } from '../../hooks/useGeolocation';
import VenueCard from './VenueCard';
import MusicianCard from './MusicianCard';
import EventCard from './EventCard';
import TicketPurchaseModal from './TicketPurchaseModal';
import AdBanner from '../Shared/AdBanner';
import VenueDetailView from '../Shared/VenueDetailView';
import { ProductCard } from '../Consumer/ProductCard';
import GoogleMap from '../Shared/GoogleMap';

interface Venue {
  id: string;
  venue_name: string;
  description: string;
  city: string;
  state: string;
  zip_code: string;
  county: string;
  capacity: number;
  venue_type: string;
  amenities: string[];
  latitude?: number;
  longitude?: number;
}

interface Musician {
  id: string;
  stage_name: string;
  bio: string;
  genres: string[];
  experience_years: number;
  city?: string;
  state?: string;
  zip_code?: string;
  county?: string;
  upcoming_events?: number;
}

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  doors_open: string;
  show_starts: string;
  ticket_price: number;
  total_tickets: number;
  tickets_sold: number;
  venue_name?: string;
  musician_name?: string;
  venue_city?: string;
  venue_state?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  video_url?: string;
  address: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  distance_miles: number;
  stock_quantity: number;
}

export default function FanDashboard() {
  const { latitude, longitude } = useGeolocation();
  const [searchType, setSearchType] = useState<'events' | 'venues' | 'musicians' | 'products'>('events');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [radiusMiles, setRadiusMiles] = useState(10);

  useEffect(() => {
    loadData();
  }, [searchType, searchQuery, genreFilter]);

  useEffect(() => {
    if (searchType === 'musicians') {
      loadAvailableGenres();
    }
  }, [searchType]);

  async function loadAvailableGenres() {
    const { data } = await supabase
      .from('musicians')
      .select('genres');

    if (data) {
      const genreSet = new Set<string>();
      data.forEach(musician => {
        if (musician.genres) {
          musician.genres.forEach((genre: string) => genreSet.add(genre));
        }
      });
      setAvailableGenres(Array.from(genreSet).sort());
    }
  }

  async function loadData() {
    setLoading(true);

    if (searchType === 'products') {
      if (latitude && longitude) {
        const { data, error } = await supabase.rpc('find_products_within_radius', {
          user_lat: latitude,
          user_lon: longitude,
          radius_miles: radiusMiles,
        });

        if (!error && data) {
          setProducts(data);
        }
      }
    } else if (searchType === 'events') {
      let query = supabase
        .from('events')
        .select(`
          *,
          venues!inner(venue_name, city, state),
          musicians(stage_name)
        `)
        .gte('event_date', new Date().toISOString())
        .order('event_date');

      if (searchQuery.trim()) {
        query = query.or(
          `title.ilike.%${searchQuery}%,` +
          `description.ilike.%${searchQuery}%`
        );
      }

      const { data } = await query;
      if (data) {
        const formattedEvents = data.map((event: any) => ({
          ...event,
          venue_name: event.venues?.venue_name,
          venue_city: event.venues?.city,
          venue_state: event.venues?.state,
          musician_name: event.musicians?.stage_name,
        }));
        setEvents(formattedEvents);
      }
    } else if (searchType === 'venues') {
      let query = supabase
        .from('venues')
        .select('*, latitude, longitude')
        .order('venue_name');

      if (searchQuery.trim()) {
        query = query.or(
          `venue_name.ilike.%${searchQuery}%,` +
          `city.ilike.%${searchQuery}%,` +
          `zip_code.ilike.%${searchQuery}%,` +
          `county.ilike.%${searchQuery}%,` +
          `venue_type.ilike.%${searchQuery}%`
        );
      }

      const { data } = await query;
      setVenues(data || []);
    } else {
      let query = supabase
        .from('musicians')
        .select('*')
        .order('stage_name');

      if (genreFilter) {
        query = query.contains('genres', [genreFilter]);
      }

      if (searchQuery.trim()) {
        query = query.or(
          `stage_name.ilike.%${searchQuery}%,` +
          `city.ilike.%${searchQuery}%,` +
          `zip_code.ilike.%${searchQuery}%,` +
          `county.ilike.%${searchQuery}%`
        );
      }

      const { data } = await query;
      setMusicians(data || []);
    }

    setLoading(false);
  }

  if (selectedVenueId) {
    return <VenueDetailView venueId={selectedVenueId} onBack={() => setSelectedVenueId(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-700 mb-2">Discover Local Music</h1>
          <p className="text-gray-700">Find venues and musicians in your area</p>
        </div>

      <AdBanner tier="premium" placement="fan_dashboard" className="mb-8" />

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4 items-start md:items-center">
          <div className="flex gap-2 flex-wrap flex-1">
            <button
              onClick={() => {
                setSearchType('events');
                setGenreFilter('');
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                searchType === 'events'
                  ? 'bg-gigmate-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Events</span>
            </button>
            <button
              onClick={() => {
                setSearchType('venues');
                setGenreFilter('');
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                searchType === 'venues'
                  ? 'bg-gigmate-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MapPin className="h-4 w-4" />
              <span>Venues</span>
            </button>
            <button
              onClick={() => setSearchType('musicians')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                searchType === 'musicians'
                  ? 'bg-gigmate-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Music className="h-4 w-4" />
              <span>Musicians</span>
            </button>
            <button
              onClick={() => setSearchType('products')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                searchType === 'products'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Shop Local</span>
            </button>
          </div>

          <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-4 w-4" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                viewMode === 'map'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapIcon className="h-4 w-4" />
              <span>Map</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                searchType === 'events'
                  ? 'Search upcoming events...'
                  : searchType === 'venues'
                  ? 'Search by venue name, city, zip code, county, or type...'
                  : searchType === 'products'
                  ? 'Search local products, merchandise, tickets...'
                  : 'Search by artist name, city, zip code, or county...'
              }
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
            />
          </div>

          {searchType === 'musicians' && availableGenres.length > 0 && (
            <div className="md:w-64">
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
              >
                <option value="">All Genres</option>
                {availableGenres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {searchType === 'products' && (
            <div className="md:w-48">
              <select
                value={radiusMiles}
                onChange={(e) => setRadiusMiles(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value={2}>Within 2 miles</option>
                <option value={5}>Within 5 miles</option>
                <option value={10}>Within 10 miles</option>
                <option value={25}>Within 25 miles</option>
              </select>
            </div>
          )}
        </div>

        {(searchQuery || genreFilter) && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {searchType === 'events' ? events.length : searchType === 'venues' ? venues.length : searchType === 'products' ? products.length : musicians.length} results found
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setGenreFilter('');
              }}
              className="text-sm text-gigmate-blue hover:text-gigmate-blue-dark font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      <AdBanner tier="standard" placement="fan_dashboard" className="mb-8" />

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-600">Loading...</div>
        </div>
      ) : viewMode === 'map' ? (
        <>
          {latitude && longitude ? (
            <div className="mb-8">
              <GoogleMap
                center={{ lat: latitude, lng: longitude }}
                zoom={12}
                height="600px"
                markers={
                  searchType === 'events'
                    ? events.map((event) => ({
                        id: event.id,
                        position: { lat: 30.2672, lng: -98.8703 },
                        title: event.title,
                        subtitle: `${event.venue_name} - ${new Date(event.event_date).toLocaleDateString()}`,
                        onClick: () => setSelectedEvent(event.id),
                      }))
                    : searchType === 'venues'
                    ? venues.map((venue) => ({
                        id: venue.id,
                        position: { lat: venue.latitude || 30.2672, lng: venue.longitude || -98.8703 },
                        title: venue.venue_name,
                        subtitle: `${venue.city}, ${venue.state}`,
                        onClick: () => setSelectedVenueId(venue.id),
                      }))
                    : searchType === 'musicians'
                    ? musicians.map((musician) => ({
                        id: musician.id,
                        position: { lat: 30.2672, lng: -98.8703 },
                        title: musician.stage_name,
                        subtitle: musician.city ? `${musician.city}, ${musician.state}` : 'Location not set',
                      }))
                    : products.map((product) => ({
                        id: product.id,
                        position: { lat: product.latitude || latitude, lng: product.longitude || longitude },
                        title: product.name,
                        subtitle: `$${product.price} - ${product.distance_miles.toFixed(1)} mi away`,
                      }))
                }
                className="rounded-lg shadow-lg"
              />
            </div>
          ) : (
            <div className="text-center py-12 bg-rose-50 rounded-lg mb-8">
              <MapPin className="h-12 w-12 text-rose-500 mx-auto mb-4" />
              <p className="text-gray-700 font-medium">Enable location access to see map view</p>
              <p className="text-sm text-gray-600 mt-2">We need your location to show nearby items on the map</p>
            </div>
          )}
        </>
      ) : (
        <>
          {searchType === 'products' ? (
            <>
              {latitude && longitude ? (
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-green-700 mb-4">
                    <TrendingUp className="w-5 h-5" />
                    <h2 className="text-xl font-bold">Local Products & Merchandise</h2>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Shop from local musicians and businesses within {radiusMiles} miles of you
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onPurchase={(prod) => console.log('Purchase:', prod)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-rose-50 rounded-lg">
                  <MapPin className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium">Enable location access to see local products</p>
                  <p className="text-sm text-gray-600 mt-2">We need your location to show you products from nearby sellers</p>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {searchType === 'events'
                ? events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onBuyTickets={() => setSelectedEvent(event.id)}
                    />
                  ))
                : searchType === 'venues'
                ? venues.map((venue) => (
                    <VenueCard
                      key={venue.id}
                      venue={venue}
                      onClick={() => setSelectedVenueId(venue.id)}
                    />
                  ))
                : musicians.map((musician) => <MusicianCard key={musician.id} musician={musician} />)}
            </div>
          )}

          {(events.length > 0 || venues.length > 0 || musicians.length > 0) && (
            <AdBanner tier="basic" placement="fan_dashboard" className="mb-8" />
          )}
        </>
      )}

      {!loading && searchType === 'events' && events.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No upcoming events found</p>
          <p className="text-sm text-gray-500 mt-2">Check back soon for new shows!</p>
        </div>
      )}

      {!loading && searchType === 'venues' && venues.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No venues found</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your search criteria</p>
        </div>
      )}

      {!loading && searchType === 'musicians' && musicians.length === 0 && (
        <div className="text-center py-12">
          <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No musicians found</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your search criteria</p>
        </div>
      )}

      {selectedEvent && (
        <TicketPurchaseModal
          eventId={selectedEvent}
          onClose={() => {
            setSelectedEvent(null);
            loadData();
          }}
        />
      )}
      </div>
    </div>
  );
}
