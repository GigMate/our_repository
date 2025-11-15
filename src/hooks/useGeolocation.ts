import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

const CACHE_KEY = 'gigmate_geolocation';
const CACHE_DURATION = 30 * 60 * 1000;

interface CachedLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export function useGeolocation() {
  const [location, setLocation] = useState<GeolocationState>(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed: CachedLocation = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          return {
            latitude: parsed.latitude,
            longitude: parsed.longitude,
            error: null,
            loading: false,
          };
        }
      } catch {}
    }
    return {
      latitude: null,
      longitude: null,
      error: null,
      loading: true,
    };
  });

  useEffect(() => {
    if (location.latitude !== null && !location.loading) {
      return;
    }

    if (!navigator.geolocation) {
      setLocation({
        latitude: null,
        longitude: null,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        };
        setLocation(newLocation);

        const cached: CachedLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }

        setLocation({
          latitude: null,
          longitude: null,
          error: errorMessage,
          loading: false,
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: CACHE_DURATION,
      }
    );
  }, [location.latitude, location.loading]);

  return location;
}
