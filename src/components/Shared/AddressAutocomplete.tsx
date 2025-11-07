import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapPin, Loader2 } from 'lucide-react';

interface AddressAutocompleteProps {
  onAddressSelect: (address: {
    formatted_address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    latitude: number;
    longitude: number;
  }) => void;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}

export default function AddressAutocomplete({
  onAddressSelect,
  defaultValue = '',
  placeholder = 'Enter your address',
  className = '',
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError('Google Maps API key not configured');
      setLoading(false);
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
    });

    loader
      .load()
      .then(() => {
        if (!inputRef.current) return;

        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'us' },
          fields: ['address_components', 'formatted_address', 'geometry'],
          types: ['address'],
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();

          if (!place.geometry || !place.geometry.location) {
            setError('Please select a valid address from the dropdown');
            return;
          }

          let city = '';
          let state = '';
          let zip_code = '';
          let country = '';

          place.address_components?.forEach((component) => {
            const types = component.types;

            if (types.includes('locality')) {
              city = component.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
              state = component.short_name;
            }
            if (types.includes('postal_code')) {
              zip_code = component.long_name;
            }
            if (types.includes('country')) {
              country = component.short_name;
            }
          });

          onAddressSelect({
            formatted_address: place.formatted_address || '',
            city,
            state,
            zip_code,
            country,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
          });

          setError(null);
        });

        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading Google Maps Places:', err);
        setError('Failed to load address autocomplete');
        setLoading(false);
      });
  }, [onAddressSelect]);

  if (error) {
    return (
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="text"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={`w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${className}`}
        />
        <p className="text-sm text-red-600 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={loading}
        className={`w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 ${className}`}
      />
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        {loading ? (
          <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
        ) : (
          <MapPin className="h-5 w-5 text-gray-400" />
        )}
      </div>
    </div>
  );
}
