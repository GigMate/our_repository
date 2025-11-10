import { useState, useEffect } from 'react';
import { Star, MessageSquare, Award, ThumbsUp, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Rating {
  id: string;
  rating_value: number;
  review_text: string | null;
  category: string;
  response_text: string | null;
  created_at: string;
  rater?: {
    full_name: string;
    user_type: string;
  };
  rated?: {
    full_name: string;
    user_type: string;
  };
}

interface MutualRatingSystemProps {
  bookingId: string;
  otherPartyId: string;
  otherPartyName: string;
  userType: 'musician' | 'venue';
  onRatingSubmitted?: () => void;
}

export default function MutualRatingSystem({
  bookingId,
  otherPartyId,
  otherPartyName,
  userType,
  onRatingSubmitted
}: MutualRatingSystemProps) {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    overall: 0,
    professionalism: 0,
    performance_quality: 0,
    communication: 0,
    venue_atmosphere: 0,
    sound_quality: 0,
    review_text: ''
  });

  const [response, setResponse] = useState('');
  const [respondingToRating, setRespondingToRating] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadRatings();
    }
  }, [user, bookingId]);

  async function loadRatings() {
    const { data, error } = await supabase
      .from('ratings')
      .select(`
        *,
        rater:profiles!ratings_rater_id_fkey(full_name, user_type),
        rated:profiles!ratings_rated_user_id_fkey(full_name, user_type)
      `)
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading ratings:', error);
    } else {
      setRatings(data || []);
    }
  }

  async function handleSubmitRating() {
    if (formData.overall === 0) {
      alert('Please provide an overall rating');
      return;
    }

    setLoading(true);

    const categories = [
      { category: 'overall', value: formData.overall },
      { category: 'professionalism', value: formData.professionalism },
      { category: 'performance_quality', value: formData.performance_quality }
    ];

    if (userType === 'venue') {
      categories.push({ category: 'communication', value: formData.communication });
    } else {
      categories.push(
        { category: 'venue_atmosphere', value: formData.venue_atmosphere },
        { category: 'sound_quality', value: formData.sound_quality }
      );
    }

    const ratingPromises = categories
      .filter(c => c.value > 0)
      .map(({ category, value }) =>
        supabase.from('ratings').insert({
          rater_id: user!.id,
          rated_user_id: otherPartyId,
          booking_id: bookingId,
          rating_value: value,
          category,
          review_text: formData.review_text || null
        })
      );

    const results = await Promise.all(ratingPromises);
    const hasError = results.some(r => r.error);

    if (hasError) {
      alert('Failed to submit some ratings. Please try again.');
    } else {
      setShowRatingForm(false);
      setFormData({
        overall: 0,
        professionalism: 0,
        performance_quality: 0,
        communication: 0,
        venue_atmosphere: 0,
        sound_quality: 0,
        review_text: ''
      });
      loadRatings();
      onRatingSubmitted?.();
    }

    setLoading(false);
  }

  async function handleSubmitResponse(ratingId: string) {
    if (!response.trim()) {
      alert('Please enter a response');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('ratings')
      .update({ response_text: response })
      .eq('id', ratingId);

    if (error) {
      alert('Failed to submit response: ' + error.message);
    } else {
      setResponse('');
      setRespondingToRating(null);
      loadRatings();
    }

    setLoading(false);
  }

  function renderStars(value: number, onChange?: (value: number) => void) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            disabled={!onChange}
            className={`${onChange ? 'cursor-pointer hover:scale-110' : ''} transition-transform`}
          >
            <Star
              className={`w-6 h-6 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  }

  const myRatings = ratings.filter(r => r.rater?.full_name === user?.user_metadata?.full_name);
  const receivedRatings = ratings.filter(r => r.rated?.full_name === user?.user_metadata?.full_name);
  const hasRated = myRatings.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Rating & Reviews</h3>
        {!hasRated && (
          <button
            onClick={() => setShowRatingForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Award className="w-4 h-4" />
            Rate {otherPartyName}
          </button>
        )}
      </div>

      {showRatingForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-500">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Rate Your Experience with {otherPartyName}
          </h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Rating *
              </label>
              {renderStars(formData.overall, (value) =>
                setFormData({ ...formData, overall: value })
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professionalism
              </label>
              {renderStars(formData.professionalism, (value) =>
                setFormData({ ...formData, professionalism: value })
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {userType === 'venue' ? 'Performance Quality' : 'Venue Atmosphere'}
              </label>
              {userType === 'venue'
                ? renderStars(formData.performance_quality, (value) =>
                    setFormData({ ...formData, performance_quality: value })
                  )
                : renderStars(formData.venue_atmosphere, (value) =>
                    setFormData({ ...formData, venue_atmosphere: value })
                  )
              }
            </div>

            {userType === 'venue' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Communication
                </label>
                {renderStars(formData.communication, (value) =>
                  setFormData({ ...formData, communication: value })
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sound Quality
                </label>
                {renderStars(formData.sound_quality, (value) =>
                  setFormData({ ...formData, sound_quality: value })
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review (Optional)
              </label>
              <textarea
                value={formData.review_text}
                onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Share your experience..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmitRating}
                disabled={loading || formData.overall === 0}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {loading ? 'Submitting...' : 'Submit Rating'}
              </button>
              <button
                onClick={() => setShowRatingForm(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {receivedRatings.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-blue-600" />
            Ratings Received
          </h4>
          <div className="space-y-4">
            {receivedRatings.map((rating) => (
              <div key={rating.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {renderStars(rating.rating_value)}
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {rating.category.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(rating.created_at).toLocaleDateString()}
                  </span>
                </div>
                {rating.review_text && (
                  <p className="text-sm text-gray-600 mb-2">{rating.review_text}</p>
                )}
                {rating.response_text ? (
                  <div className="bg-gray-50 rounded-lg p-3 mt-2">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Your Response:</p>
                    <p className="text-sm text-gray-600">{rating.response_text}</p>
                  </div>
                ) : (
                  respondingToRating === rating.id ? (
                    <div className="mt-2">
                      <textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Write your response..."
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleSubmitResponse(rating.id)}
                          disabled={loading}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          <Send className="w-3 h-3" />
                          Send
                        </button>
                        <button
                          onClick={() => {
                            setRespondingToRating(null);
                            setResponse('');
                          }}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRespondingToRating(rating.id)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Respond
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {myRatings.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Ratings</h4>
          <div className="space-y-3">
            {myRatings.map((rating) => (
              <div key={rating.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {renderStars(rating.rating_value)}
                  <span className="text-sm text-gray-600 capitalize">
                    {rating.category.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(rating.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
