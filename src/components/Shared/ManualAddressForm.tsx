import { useState } from 'react';
import { MapPin } from 'lucide-react';

interface ManualAddressFormProps {
  onAddressSubmit: (address: {
    formatted_address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  }) => void;
  defaultValues?: {
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  };
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function ManualAddressForm({ onAddressSubmit, defaultValues }: ManualAddressFormProps) {
  const [address, setAddress] = useState(defaultValues?.address || '');
  const [city, setCity] = useState(defaultValues?.city || '');
  const [state, setState] = useState(defaultValues?.state || '');
  const [zipCode, setZipCode] = useState(defaultValues?.zip_code || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formatted = `${address}, ${city}, ${state} ${zipCode}`;
    onAddressSubmit({
      formatted_address: formatted,
      city,
      state,
      zip_code: zipCode,
      country: 'US'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Street Address
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          placeholder="123 Main St"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            placeholder="Nashville"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State
          </label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select...</option>
            {US_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ZIP Code
        </label>
        <input
          type="text"
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value)}
          required
          pattern="[0-9]{5}"
          placeholder="37201"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
      >
        <MapPin className="h-4 w-4" />
        Save Address
      </button>
    </form>
  );
}
