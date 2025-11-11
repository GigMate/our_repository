import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import ManualAddressForm from './ManualAddressForm';

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

    setOptions({
      apiKey,
      version: 'weekly',
    });

    importLibrary('places')
      .then((lib) => {
        const { Autocomplete } = lib as google.maps.PlacesLibrary;

        if (!inputRef.current) return;

        const autocomplete = new Autocomplete(inputRef.current, {
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
      <div className="space-y-3">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 mb-1">Google Maps Unavailable</p>
              <p className="text-yellow-700">Please enter your address manually below.</p>
            </div>
          </div>
        </div>
        <ManualAddressForm onAddressSubmit={onAddressSelect} />
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
