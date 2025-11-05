import { useState, useEffect } from 'react';
import { Search, Music, MapPin, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import VenueCard from './VenueCard';
import MusicianCard from './MusicianCard';
import EventCard from './EventCard';
import TicketPurchaseModal from './TicketPurchaseModal';
import AdBanner from '../Shared/AdBanner';
import VenueDetailView from '../Shared/VenueDetailView';

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

export default function FanDashboard() {
  const [searchType, setSearchType] = useState<'events' | 'venues' | 'musicians'>('events');
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

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

    if (searchType === 'events') {
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
        .select('*')
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gigmate-blue mb-2">Discover Local Music</h1>
        <p className="text-gray-600">Find venues and musicians in your area</p>
      </div>

      <AdBanner tier="premium" placement="fan_dashboard" className="mb-8" />

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex gap-2 flex-wrap">
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
        </div>

        {(searchQuery || genreFilter) && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {searchType === 'events' ? events.length : searchType === 'venues' ? venues.length : musicians.length} results found
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
      ) : (
        <>
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
  );
}
