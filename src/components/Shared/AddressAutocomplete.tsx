import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
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

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

export default function AddressAutocomplete({
  onAddressSelect,
  defaultValue = '',
  placeholder = 'Enter your address',
  className = '',
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(query)}&` +
          `format=json&` +
          `addressdetails=1&` +
          `countrycodes=us&` +
          `limit=5`,
          {
            headers: {
              'User-Agent': 'GigMate',
            },
          }
        );
        const data = await response.json();
        setResults(data);
        setShowResults(true);
      } catch (error) {
        console.error('Error fetching addresses:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);
  }, [query]);

  const handleSelectResult = (result: NominatimResult) => {
    const city = result.address.city || result.address.town || result.address.village || '';
    const state = result.address.state || '';
    const zip_code = result.address.postcode || '';

    onAddressSelect({
      formatted_address: result.display_name,
      city,
      state,
      zip_code,
      country: result.address.country || 'United States',
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    });

    setQuery(result.display_name);
    setShowResults(false);
  };

  if (showManualForm) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setShowManualForm(false)}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          ← Back to address search
        </button>
        <ManualAddressForm onAddressSubmit={onAddressSelect} />
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative space-y-2">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        />
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.place_id}
              onClick={() => handleSelectResult(result)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-start gap-2"
            >
              <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {result.display_name}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowManualForm(true)}
        className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1"
      >
        <Search className="h-4 w-4" />
        Enter address manually
      </button>

      <p className="text-xs text-gray-500">
        Powered by OpenStreetMap Nominatim
      </p>
    </div>
  );
}
