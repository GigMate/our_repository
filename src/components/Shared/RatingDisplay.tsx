import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Rating {
  id: string;
  rater_id: string;
  rating: number;
  comment: string;
  transaction_type: string;
  created_at: string;
  rater_name?: string;
}

interface RatingDisplayProps {
  userId: string;
  userName: string;
}

export default function RatingDisplay({ userId, userName }: RatingDisplayProps) {
  const { user, profile } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [canViewRatings, setCanViewRatings] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [user, profile, userId]);

  async function checkAccess() {
    if (!user || !profile) {
      setCanViewRatings(false);
      setLoading(false);
      return;
    }

    const isOwnProfile = user.id === userId;
    const isTopTier = profile.tier_level === 'platinum' || profile.tier_level === 'gold';

    if (isOwnProfile || isTopTier) {
      setCanViewRatings(true);
      await loadRatings();
    } else {
      setCanViewRatings(false);
      setLoading(false);
    }
  }

  async function loadRatings() {
    setLoading(true);

    const { data } = await supabase
      .from('ratings')
      .select(`
        *,
        rater:profiles!ratings_rater_id_fkey(full_name)
      `)
      .eq('rated_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      const ratingsWithNames = data.map(rating => ({
        ...rating,
        rater_name: rating.rater?.full_name || 'Anonymous'
      }));
      setRatings(ratingsWithNames);
    }

    setLoading(false);
  }

  if (!canViewRatings) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-2">
          <Star className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Ratings</h3>
        </div>
        <p className="text-sm text-gray-600">
          Only Platinum and Gold tier members can view detailed ratings.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">Loading ratings...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Star className="h-5 w-5 text-rose-500 fill-yellow-500" />
          <h3 className="font-semibold text-gray-900">Ratings for {userName}</h3>
        </div>
        {profile?.tier_level && (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            profile.tier_level === 'platinum'
              ? 'bg-purple-100 text-purple-700'
              : profile.tier_level === 'gold'
              ? 'bg-rose-100 text-yellow-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {profile.tier_level.toUpperCase()} TIER
          </span>
        )}
      </div>

      {ratings.length === 0 ? (
        <p className="text-gray-600">No ratings yet.</p>
      ) : (
        <div className="space-y-4">
          {ratings.map((rating) => (
            <div key={rating.id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= rating.rating
                            ? 'text-rose-500 fill-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {rating.rater_name}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(rating.created_at).toLocaleDateString()}
                </span>
              </div>
              {rating.comment && (
                <p className="text-sm text-gray-700 mt-2">{rating.comment}</p>
              )}
              {rating.transaction_type && (
                <span className="inline-block mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded">
                  {rating.transaction_type}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
