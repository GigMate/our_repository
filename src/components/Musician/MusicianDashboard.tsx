import { useState, useEffect } from 'react';
import { Search, MapPin, Map, Settings, Gift } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import VenueCard from '../Fan/VenueCard';
import AdBanner from '../Shared/AdBanner';
import { MapSearch } from '../Shared/MapSearch';
import ImageUpload from '../Shared/ImageUpload';
import VideoUpload from '../Shared/VideoUpload';
import VideoGallery from '../Shared/VideoGallery';
import VenueDetailView from '../Shared/VenueDetailView';
import ReferralProgram from '../Shared/ReferralProgram';
import { useAuth } from '../../contexts/AuthContext';

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
  preferred_genres: string[];
}

export default function MusicianDashboard() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showSettings, setShowSettings] = useState(false);
  const [showReferrals, setShowReferrals] = useState(false);
  const [musicianId, setMusicianId] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [searchQuery, genreFilter]);

  useEffect(() => {
    loadAvailableGenres();
    loadMusicianId();
  }, []);

  async function loadMusicianId() {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('musicians')
      .select('id')
      .eq('id', profile.id)
      .maybeSingle();

    if (data) {
      setMusicianId(data.id);
    }
  }

  async function loadAvailableGenres() {
    const { data } = await supabase
      .from('venues')
      .select('preferred_genres');

    if (data) {
      const genreSet = new Set<string>();
      data.forEach(venue => {
        if (venue.preferred_genres) {
          venue.preferred_genres.forEach((genre: string) => genreSet.add(genre));
        }
      });
      setAvailableGenres(Array.from(genreSet).sort());
    }
  }

  async function loadData() {
    setLoading(true);

    let query = supabase
      .from('venues')
      .select('*')
      .order('venue_name');

    if (genreFilter) {
      query = query.contains('preferred_genres', [genreFilter]);
    }

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
    setLoading(false);
  }

  if (selectedVenueId) {
    return <VenueDetailView venueId={selectedVenueId} onBack={() => setSelectedVenueId(null)} />;
  }

  if (showReferrals) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => setShowReferrals(false)}
          className="mb-4 text-gigmate-blue hover:text-gigmate-blue-dark font-medium flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>
        <ReferralProgram />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.lightGradient}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gigmate-blue mb-2">Find Venues to Play</h1>
            <p className="text-gray-700">Discover venues looking for talented musicians</p>
          </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowReferrals(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl font-semibold"
          >
            <Gift className="h-5 w-5" />
            Earn Credits - Refer Friends!
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Settings className="h-5 w-5" />
            {showSettings ? 'Hide' : 'Manage'} Profile Media
          </button>
        </div>
      </div>

      {showSettings && musicianId && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Musician Profile Media</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload Videos</h3>
              <VideoUpload entityType="musician" entityId={musicianId} maxVideos={5} />
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Your Videos</h4>
                <VideoGallery entityType="musician" entityId={musicianId} editable={true} />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload Photos</h3>
              <ImageUpload entityType="musician" entityId={musicianId} />
            </div>
          </div>
        </div>
      )}

      <AdBanner tier="premium" placement="musician_dashboard" className="mb-8" />

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Search className="h-4 w-4" />
            List View
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'map'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Map className="h-4 w-4" />
            Map View
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by venue name, city, zip code, county, or type..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
            />
          </div>

          {availableGenres.length > 0 && (
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
              {venues.length} venues found
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

      <AdBanner tier="standard" placement="musician_dashboard" className="mb-8" />

      {viewMode === 'map' ? (
        <MapSearch searchType="venues" />
      ) : (
        <>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading...</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {venues.map((venue) => (
                  <VenueCard
                    key={venue.id}
                    venue={venue}
                    onClick={() => setSelectedVenueId(venue.id)}
                  />
                ))}
              </div>

              {venues.length > 0 && (
                <AdBanner tier="basic" placement="musician_dashboard" className="mb-8" />
              )}
            </>
          )}

          {!loading && venues.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No venues found</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your search criteria</p>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
