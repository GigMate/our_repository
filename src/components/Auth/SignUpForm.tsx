import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserType } from '../../lib/supabase';
import { GenreSelector } from '../Shared/GenreSelector';
import ManualAddressForm from '../Shared/ManualAddressForm';
import { Gift } from 'lucide-react';

interface SignUpFormProps {
  onToggle: () => void;
  defaultUserType?: UserType;
}

export default function SignUpForm({ onToggle, defaultUserType = 'fan' }: SignUpFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState<UserType>(defaultUserType);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [locationData, setLocationData] = useState<any>(null);
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if ((userType === 'musician' || userType === 'venue') && selectedGenres.length === 0) {
      setError('Please select at least one genre');
      return;
    }

    if ((userType === 'musician' || userType === 'venue') && !locationData) {
      setError('Please enter your address using the autocomplete field');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, {
        full_name: fullName,
        user_type: userType,
        genres: selectedGenres.length > 0 ? selectedGenres : undefined,
        location: locationData,
        referred_by_code: referralCode || undefined
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-center mb-6">
        <img src="/gigmate-pick.svg" alt="GigMate" className="h-20 w-20" />
      </div>
      <h2 className="text-3xl font-bold text-gigmate-blue mb-6 text-center">Join GigMate</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="fan"
                checked={userType === 'fan'}
                onChange={(e) => setUserType(e.target.value as UserType)}
                className="mr-2"
              />
              <span>Fan</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="musician"
                checked={userType === 'musician'}
                onChange={(e) => setUserType(e.target.value as UserType)}
                className="mr-2"
              />
              <span>Musician</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="venue"
                checked={userType === 'venue'}
                onChange={(e) => setUserType(e.target.value as UserType)}
                className="mr-2"
              />
              <span>Venue Owner</span>
            </label>
          </div>
        </div>

        {(userType === 'musician' || userType === 'venue') && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {userType === 'venue' ? 'Venue Address' : 'Your Location'}
              </label>
              <ManualAddressForm
                onAddressSubmit={(address) => setLocationData(address)}
              />
            </div>
            <div>
              <GenreSelector
                selectedGenres={selectedGenres}
                onChange={setSelectedGenres}
                label={userType === 'musician' ? 'Your Genres (Select all that apply)' : 'Preferred Genres (Select all that apply)'}
                placeholder="Select genres..."
              />
              <p className="mt-1 text-xs text-gray-500">
                {userType === 'musician'
                  ? 'Select all genres you perform. This helps venues find you!'
                  : 'Select genres you prefer for your venue. Helps musicians find you!'}
              </p>
            </div>
          </>
        )}

        <div>
          <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 mb-1">
            Referral Code (Optional)
          </label>
          <div className="relative">
            <input
              id="referralCode"
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder="Enter referral code"
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
            />
            <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          {referralCode && (
            <p className="mt-1 text-xs text-green-600">
              Help your friend earn credits!
            </p>
          )}
        </div>

        {userType === 'fan' && (
          <div>
            <GenreSelector
              selectedGenres={selectedGenres}
              onChange={setSelectedGenres}
              label="Favorite Genres (Optional)"
              placeholder="Select genres you like..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Help us recommend events and artists you'll love!
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gigmate-red text-white py-2 px-4 rounded-md hover:bg-gigmate-red-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <button onClick={onToggle} className="text-gigmate-blue hover:text-gigmate-blue-light font-medium">
          Sign in
        </button>
      </p>
    </div>
  );
}
