import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { MapPin, AlertCircle } from 'lucide-react';

interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    id: string;
    position: { lat: number; lng: number };
    title: string;
    subtitle?: string;
    onClick?: () => void;
  }>;
  onMapClick?: (location: { lat: number; lng: number }) => void;
  height?: string;
  className?: string;
}

export default function GoogleMap({
  center = { lat: 39.8283, lng: -98.5795 },
  zoom = 4,
  markers = [],
  onMapClick,
  height = '400px',
  className = '',
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError('Google Maps API key not configured');
      setLoading(false);
      return;
    }

    setOptions({
      apiKey,
      version: 'weekly',
    });

    importLibrary('maps')
      .then((lib) => {
        const { Map } = lib as google.maps.MapsLibrary;

        if (!mapRef.current) return;

        const map = new Map(mapRef.current, {
          center,
          zoom,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        });

        googleMapRef.current = map;

        if (onMapClick) {
          map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              onMapClick({
                lat: e.latLng.lat(),
                lng: e.latLng.lng(),
              });
            }
          });
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading Google Maps:', err);
        setError('Failed to load Google Maps. Please check your API key.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!googleMapRef.current) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    markers.forEach((markerData) => {
      const marker = new google.maps.Marker({
        position: markerData.position,
        map: googleMapRef.current!,
        title: markerData.title,
        animation: google.maps.Animation.DROP,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 4px 0; font-weight: 600; font-size: 14px;">${markerData.title}</h3>
            ${markerData.subtitle ? `<p style="margin: 0; font-size: 12px; color: #666;">${markerData.subtitle}</p>` : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMapRef.current!, marker);
        if (markerData.onClick) {
          markerData.onClick();
        }
      });

      markersRef.current.push(marker);
    });

    if (markers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach((marker) => {
        bounds.extend(marker.position);
      });
      googleMapRef.current.fitBounds(bounds);
    }
  }, [markers]);

  useEffect(() => {
    if (googleMapRef.current && center) {
      googleMapRef.current.setCenter(center);
    }
  }, [center]);

  useEffect(() => {
    if (googleMapRef.current && zoom) {
      googleMapRef.current.setZoom(zoom);
    }
  }, [zoom]);

  if (error) {
    return (
      <div
        className={`bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center p-6">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-2">Map unavailable</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {loading && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-blue-600 animate-bounce mx-auto mb-2" />
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  );
}
