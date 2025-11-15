import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LeafletMapProps {
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

export default function LeafletMap({
  center = { lat: 39.8283, lng: -98.5795 },
  zoom = 4,
  markers = [],
  onMapClick,
  height = '400px',
  className = '',
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current).setView([center.lat, center.lng], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    leafletMapRef.current = map;

    if (onMapClick) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        });
      });
    }

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!leafletMapRef.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    markers.forEach((markerData) => {
      const marker = L.marker([markerData.position.lat, markerData.position.lng], {
        icon: customIcon,
      }).addTo(leafletMapRef.current!);

      const popupContent = `
        <div style="padding: 8px; min-width: 150px;">
          <h3 style="margin: 0 0 4px 0; font-weight: 600; font-size: 14px;">${markerData.title}</h3>
          ${markerData.subtitle ? `<p style="margin: 0; font-size: 12px; color: #666;">${markerData.subtitle}</p>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);

      if (markerData.onClick) {
        marker.on('click', markerData.onClick);
      }

      markersRef.current.push(marker);
    });

    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map(m => [m.position.lat, m.position.lng]));
      leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers]);

  useEffect(() => {
    if (leafletMapRef.current && center) {
      leafletMapRef.current.setView([center.lat, center.lng]);
    }
  }, [center]);

  useEffect(() => {
    if (leafletMapRef.current && zoom) {
      leafletMapRef.current.setZoom(zoom);
    }
  }, [zoom]);

  return (
    <div
      ref={mapRef}
      className={`rounded-lg ${className}`}
      style={{ height, width: '100%' }}
    />
  );
}
