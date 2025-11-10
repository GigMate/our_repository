import { useState, useEffect } from 'react';
import { Star, Lock, CheckCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface RatingSystemProps {
  ratedUserId: string;
  ratedUserType: 'musician' | 'venue' | 'fan';
  eventId?: string;
  bookingId?: string;
  onRatingSubmitted?: () => void;
}

type FanTier = 'free' | 'premium' | 'vip';
type MusicianTier = 'bronze' | 'silver' | 'gold' | 'platinum';
type VenueTier = 'local' | 'regional' | 'state' | 'national';

interface RatingCategory {
  key: string;
  label: string;
  value: number;
}

export function RatingSystem({
  ratedUserId,
  ratedUserType,
  eventId,
  bookingId,
  onRatingSubmitted
}: RatingSystemProps) {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [canViewDetailed, setCanViewDetailed] = useState(false);
  const [canRate, setCanRate] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);

  const categories: RatingCategory[] = [
    { key: 'overall', label: 'Overall Experience', value: 0 },
    { key: 'performance_quality', label: ratedUserType === 'musician' ? 'Performance Quality' : 'Venue Quality', value: 0 },
    { key: 'professionalism', label: 'Professionalism', value: 0 },
    { key: 'value_for_money', label: 'Value for Money', value: 0 },
  ];

  if (ratedUserType === 'venue') {
    categories.push(
      { key: 'venue_atmosphere', label: 'Atmosphere', value: 0 },
      { key: 'sound_quality', label: 'Sound Quality', value: 0 },
      { key: 'cleanliness', label: 'Cleanliness', value: 0 },
      { key: 'staff_friendliness', label: 'Staff Friendliness', value: 0 }
    );
  }

  const [selectedRatings, setSelectedRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadRatings();
      checkIfUserHasRated();
    }
  }, [user, ratedUserId]);

  const loadUserProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('user_type, tier_level, venue_subscription_tier, fan_subscription_tier')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setUserProfile(data);
      determinePermissions(data);
    }
  };

  const determinePermissions = (profile: any) => {
    let canView = false;
    let canCreate = true;

    if (profile.user_type === 'fan') {
      const fanTier = profile.fan_subscription_tier as FanTier;
      canView = fanTier === 'premium' || fanTier === 'vip';

      if (fanTier === 'free') {
        checkRatingQuota();
      }
    } else if (profile.user_type === 'musician') {
      const musicianTier = profile.tier_level as MusicianTier;
      canView = musicianTier === 'gold' || musicianTier === 'platinum';
    } else if (profile.user_type === 'venue') {
      const venueTier = profile.venue_subscription_tier as VenueTier;
      canView = venueTier === 'regional' || venueTier === 'state' || venueTier === 'national';
    }

    setCanViewDetailed(canView);
    setCanRate(canCreate);
  };

  const checkRatingQuota = async () => {
    if (!user) return;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data } = await supabase
      .from('fan_rating_quotas')
      .select('ratings_count')
      .eq('fan_id', user.id)
      .eq('month_year', currentMonth)
      .maybeSingle();

    const used = data?.ratings_count || 0;
    const remaining = Math.max(0, 3 - used);
    setQuotaRemaining(remaining);
    setCanRate(remaining > 0);
  };

  const checkIfUserHasRated = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('ratings')
      .select('id')
      .eq('rater_id', user.id)
      .eq('rated_user_id', ratedUserId)
      .maybeSingle();

    setHasRated(!!data);
  };

  const loadRatings = async () => {
    const { data } = await supabase
      .from('ratings')
      .select(`
        *,
        rater:profiles!ratings_rater_id_fkey(full_name, user_type)
      `)
      .eq('rated_user_id', ratedUserId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    setRatings(data || []);
  };

  const handleRatingChange = (category: string, value: number) => {
    setSelectedRatings(prev => ({ ...prev, [category]: value }));
  };

  const handleSubmitRating = async () => {
    if (!user || !canRate) {
      setShowUpgradePrompt(true);
      return;
    }

    if (Object.keys(selectedRatings).length === 0) {
      alert('Please select at least one rating');
      return;
    }

    setSubmitting(true);

    try {
      const ratingsToInsert = Object.entries(selectedRatings).map(([category, value]) => ({
        rater_id: user.id,
        rated_user_id: ratedUserId,
        rating: value,
        comment: category === 'overall' ? comment : null,
        category,
        event_id: eventId,
        booking_id: bookingId,
        verified_purchase: !!(eventId || bookingId),
        is_public: true,
      }));

      const { error } = await supabase.from('ratings').insert(ratingsToInsert);

      if (error) throw error;

      alert('Rating submitted successfully!');
      setSelectedRatings({});
      setComment('');
      setHasRated(true);
      loadRatings();
      if (onRatingSubmitted) onRatingSubmitted();
    } catch (error: any) {
      alert('Error submitting rating: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateAverageByCategory = (category: string) => {
    const categoryRatings = ratings.filter(r => r.category === category);
    if (categoryRatings.length === 0) return 0;
    const sum = categoryRatings.reduce((acc, r) => acc + r.rating, 0);
    return sum / categoryRatings.length;
  };

  const renderStars = (rating: number, onChange?: (value: number) => void, readonly = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange && onChange(star)}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
          >
            <Star
              className={`h-5 w-5 ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-600'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const renderUpgradePrompt = () => (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 rounded-lg p-6 mb-6">
      <div className="flex items-start gap-4">
        <Lock className="h-8 w-8 text-gray-900 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Unlock Full Rating Access
          </h3>
          {userProfile?.user_type === 'fan' && userProfile?.fan_subscription_tier === 'free' && (
            <div className="space-y-3">
              <p className="text-gray-700">
                You've used {quotaRemaining !== null ? 3 - quotaRemaining : 0} of 3 free ratings this month.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white rounded-lg p-4 border-2 border-gray-900">
                  <h4 className="font-bold text-blue-900 mb-2">Premium - $4.99/mo</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>✓ Unlimited ratings</li>
                    <li>✓ View all detailed reviews</li>
                    <li>✓ See rating breakdowns</li>
                    <li>✓ Access analytics</li>
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-4 border-2 border-purple-400">
                  <h4 className="font-bold text-white mb-2">VIP - $9.99/mo</h4>
                  <ul className="space-y-2 text-sm text-white">
                    <li>✓ All Premium features</li>
                    <li>✓ Early event access</li>
                    <li>✓ Priority support</li>
                    <li>✓ Verified badges</li>
                    <li>✓ Export data</li>
                  </ul>
                </div>
              </div>
              <button className="w-full mt-4 bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
                Upgrade Now
              </button>
            </div>
          )}
          {userProfile?.user_type === 'musician' && (
            <p className="text-gray-700">
              Upgrade to Gold or Platinum tier to view detailed ratings. Earn tier upgrades through excellent performance and ratings!
            </p>
          )}
          {userProfile?.user_type === 'venue' && (
            <p className="text-gray-700">
              Upgrade to Regional, State, or National subscription to view detailed ratings and expand your musician database access!
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {(!canViewDetailed || !canRate || quotaRemaining === 0) && renderUpgradePrompt()}

      {!hasRated && canRate && quotaRemaining !== 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Rate this {ratedUserType}
          </h3>

          {quotaRemaining !== null && userProfile?.fan_subscription_tier === 'free' && (
            <div className="bg-gray-800 border border-blue-600 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                {quotaRemaining} free rating{quotaRemaining !== 1 ? 's' : ''} remaining this month
              </p>
            </div>
          )}

          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.key} className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  {category.label}
                </label>
                {renderStars(
                  selectedRatings[category.key] || 0,
                  (value) => handleRatingChange(category.key, value)
                )}
              </div>
            ))}

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Comments (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Share your experience..."
              />
            </div>

            <button
              onClick={handleSubmitRating}
              disabled={submitting || Object.keys(selectedRatings).length === 0}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Ratings & Reviews
        </h3>

        {categories.map((category) => {
          const avg = calculateAverageByCategory(category.key);
          const count = ratings.filter(r => r.category === category.key).length;

          if (count === 0) return null;

          return (
            <div key={category.key} className="flex items-center justify-between py-3 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">{category.label}</span>
              <div className="flex items-center gap-3">
                {renderStars(Math.round(avg), undefined, true)}
                <span className="text-sm text-gray-600">
                  {avg.toFixed(1)} ({count})
                </span>
              </div>
            </div>
          );
        })}

        {canViewDetailed ? (
          <div className="mt-6 space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Detailed Reviews
            </h4>
            {ratings.filter(r => r.comment).map((rating) => (
              <div key={rating.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{rating.rater?.full_name}</span>
                    {rating.verified_purchase && (
                      <CheckCircle className="h-4 w-4 text-green-600" title="Verified" />
                    )}
                  </div>
                  {renderStars(rating.rating, undefined, true)}
                </div>
                <p className="text-gray-700 text-sm">{rating.comment}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(rating.created_at).toLocaleDateString()}
                </p>
                {rating.response && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-3 border-l-4 border-orange-5000">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Response from {ratedUserType}:</p>
                    <p className="text-sm text-gray-700">{rating.response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 text-center py-8 bg-gray-50 rounded-lg">
            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Detailed reviews are locked</p>
            <p className="text-sm text-gray-500 mt-1">Upgrade to view full reviews and comments</p>
          </div>
        )}
      </div>
    </div>
  );
}
