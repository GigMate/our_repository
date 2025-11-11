import LeafletMap from './LeafletMap';

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

export default function GoogleMap(props: GoogleMapProps) {
  return <LeafletMap {...props} />;
}
