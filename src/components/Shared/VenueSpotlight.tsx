import { useState, useEffect } from 'react';
import { Star, MapPin, ExternalLink, Music } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SpotlightVenue {
  venue_id: string;
  venue_name: string;
  city: string;
  state: string;
  venue_type: string;
  average_rating: number;
  total_ratings: number;
  bio: string;
  website: string;
  phone: string;
  email: string;
}

export default function VenueSpotlight() {
  const [venue, setVenue] = useState<SpotlightVenue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpotlightVenue();
  }, []);

  async function loadSpotlightVenue() {
    try {
      const { data, error } = await supabase.rpc('get_current_spotlight_venue');

      if (error) throw error;

      if (data && data.length > 0) {
        setVenue(data[0]);
      }
    } catch (err: any) {
      console.error('Error loading spotlight venue:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !venue) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 border-b-2 border-orange-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 flex-shrink-0">
              <Music className="w-5 h-5 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
                  Featured Venue This Week
                </span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-lg font-bold text-white truncate">
                  {venue.venue_name}
                </h3>

                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    {venue.city}, {venue.state}
                  </span>
                </div>

                {venue.average_rating && (
                  <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                    <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                    <span className="text-sm font-semibold text-white">
                      {venue.average_rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-white/80">
                      ({venue.total_ratings})
                    </span>
                  </div>
                )}

                <span className="text-sm text-white/80 bg-white/10 px-3 py-1 rounded-full">
                  {venue.venue_type}
                </span>
              </div>
            </div>
          </div>

          {venue.website && (
            <a
              href={venue.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-colors shadow-md text-sm"
            >
              <span className="hidden sm:inline">Visit Website</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {venue.bio && (
          <p className="text-white/90 text-sm mt-2 line-clamp-1">
            {venue.bio}
          </p>
        )}
      </div>
    </div>
  );
}
