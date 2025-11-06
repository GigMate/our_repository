import React, { useEffect, useState } from 'react';
import { MapPin, Navigation, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface MapSearchProps {
  searchType: 'venues' | 'musicians';
  onLocationSelect?: (location: any) => void;
}

type MusicianTier = 'bronze' | 'silver' | 'gold' | 'platinum';
type VenueTier = 'local' | 'regional' | 'state' | 'national';

const MUSICIAN_TIER_RADIUS_MILES: Record<MusicianTier, number> = {
  bronze: 50,
  silver: 100,
  gold: 300,
  platinum: 3000,
};

const VENUE_TIER_RADIUS_MILES: Record<VenueTier, number> = {
  local: 50,
  regional: 100,
  state: 300,
  national: 3000,
};

const MUSICIAN_TIER_LABELS: Record<MusicianTier, string> = {
  bronze: 'Bronze - County (50 miles)',
  silver: 'Silver - Regional (100 miles)',
  gold: 'Gold - State (300 miles)',
  platinum: 'Platinum - National (3000 miles)',
};

const VENUE_TIER_LABELS: Record<VenueTier, string> = {
  local: 'Local - County (50 miles)',
  regional: 'Regional - Multi-County (100 miles)',
  state: 'State - Statewide (300 miles)',
  national: 'National - Nationwide (3000 miles)',
};

export function MapSearch({ searchType, onLocationSelect }: MapSearchProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const { user } = useAuth();
  const [tierLabel, setTierLabel] = useState<string>('Bronze - County (50 miles)');
  const [userType, setUserType] = useState<'musician' | 'venue' | 'fan'>('musician');

  useEffect(() => {
    const fetchUserTier = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('tier_level, venue_subscription_tier, user_type')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setUserType(data.user_type);

        if (data.user_type === 'musician' && data.tier_level) {
          const tier = data.tier_level as MusicianTier;
          setSearchRadius(MUSICIAN_TIER_RADIUS_MILES[tier] || 50);
          setTierLabel(MUSICIAN_TIER_LABELS[tier] || 'Bronze - County (50 miles)');
        } else if (data.user_type === 'venue' && data.venue_subscription_tier) {
          const tier = data.venue_subscription_tier as VenueTier;
          setSearchRadius(VENUE_TIER_RADIUS_MILES[tier] || 50);
          setTierLabel(VENUE_TIER_LABELS[tier] || 'Local - County (50 miles)');
        } else {
          setSearchRadius(50);
          setTierLabel('County (50 miles)');
        }
      }
    };

    fetchUserTier();
  }, [user]);

  const getUserLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        searchNearby(location);
        setLoading(false);
      },
      (err) => {
        setError('Unable to retrieve your location');
        setLoading(false);
        console.error('Geolocation error:', err);
      }
    );
  };

  const searchNearby = async (center: { lat: number; lng: number }) => {
    setLoading(true);
    setError(null);

    try {
      const tableName = searchType === 'venues' ? 'venues' : 'musicians';
      const query = supabase
        .from(tableName)
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const nearbyResults = (data || []).filter((item: any) => {
        const distance = calculateDistance(
          center.lat,
          center.lng,
          parseFloat(item.latitude),
          parseFloat(item.longitude)
        );
        return distance <= searchRadius;
      });

      setResults(nearbyResults.sort((a, b) => {
        const distA = calculateDistance(center.lat, center.lng, parseFloat(a.latitude), parseFloat(a.longitude));
        const distB = calculateDistance(center.lat, center.lng, parseFloat(b.latitude), parseFloat(b.longitude));
        return distA - distB;
      }));
    } catch (err) {
      setError(`Failed to search ${searchType}`);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (value: number): number => {
    return (value * Math.PI) / 180;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Find {searchType === 'venues' ? 'Venues' : 'Musicians'} Near You
            </h3>
            <p className="text-sm text-gray-600">
              Your tier: {tierLabel}
            </p>
          </div>
          <button
            onClick={getUserLocation}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            <Navigation className="h-4 w-4" />
            {loading ? 'Searching...' : 'Search Near Me'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Search className="h-4 w-4" />
          <span>
            Searching within {searchRadius} miles
            {results.length > 0 && ` - Found ${results.length} ${searchType}`}
          </span>
        </div>
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-3">
            Results ({results.length})
          </h4>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map((result) => {
              const distance = userLocation
                ? calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    parseFloat(result.latitude),
                    parseFloat(result.longitude)
                  )
                : null;

              return (
                <div
                  key={result.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    if (onLocationSelect) {
                      onLocationSelect(result);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {searchType === 'venues' ? result.venue_name : result.stage_name}
                      </p>
                      {distance && (
                        <p className="text-sm text-blue-600 font-medium">
                          {distance.toFixed(1)} miles away
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        {searchType === 'venues'
                          ? `${result.city}, ${result.state}`
                          : result.city && result.state
                          ? `${result.city}, ${result.state}`
                          : 'Location not specified'}
                      </p>
                      {searchType === 'venues' && result.venue_type && (
                        <p className="text-xs text-gray-500 mt-1">
                          Type: {result.venue_type}
                        </p>
                      )}
                      {searchType === 'musicians' && result.genres && result.genres.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {result.genres.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && userLocation && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            No {searchType} found within {searchRadius} miles of your location.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Try upgrading your tier for a larger search radius.
          </p>
        </div>
      )}
    </div>
  );
}
