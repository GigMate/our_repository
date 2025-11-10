import { useState } from 'react';
import { DollarSign, AlertCircle, CheckCircle, Clock, Shield, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Booking {
  id: string;
  venue_id: string;
  musician_id: string;
  agreed_rate: number;
  gigmate_fee: number;
  total_amount: number;
  status: string;
  venue_confirmed: boolean;
  musician_confirmed: boolean;
  venue_rating?: number;
  musician_rating?: number;
  venue_rating_comment?: string;
  musician_rating_comment?: string;
  can_release_funds: boolean;
  mediation_required: boolean;
  mediation_fee: number;
  musician_name?: string;
  event_title?: string;
  created_at: string;
}

interface BookingEscrowProps {
  booking: Booking;
  isVenue: boolean;
  onUpdate: () => void;
}

export default function BookingEscrow({ booking, isVenue, onUpdate }: BookingEscrowProps) {
  const [loading, setLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-rose-50', label: 'Pending Acceptance' },
    accepted: { icon: Clock, color: 'text-blue-600', bg: 'bg-orange-50', label: 'Payment Pending' },
    escrowed: { icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50', label: 'In Escrow' },
    completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Completed' },
    disputed: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Disputed' },
    mediation: { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50', label: 'In Mediation' },
    cancelled: { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Cancelled' }
  };

  const config = statusConfig[booking.status as keyof typeof statusConfig];
  const Icon = config.icon;

  async function handleSubmitRating() {
    if (rating < 1 || rating > 5) {
      alert('Please select a rating between 1 and 5 stars');
      return;
    }

    setLoading(true);

    const updateData = isVenue
      ? { venue_rating: rating, venue_rating_comment: ratingComment }
      : { musician_rating: rating, musician_rating_comment: ratingComment };

    const { error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', booking.id);

    if (error) {
      alert('Failed to submit rating: ' + error.message);
    } else {
      setShowRatingModal(false);
      onUpdate();
    }

    setLoading(false);
  }

  const hasRated = isVenue ? booking.venue_rating !== null && booking.venue_rating !== undefined : booking.musician_rating !== null && booking.musician_rating !== undefined;
  const otherPartyRated = isVenue ? booking.musician_rating !== null && booking.musician_rating !== undefined : booking.venue_rating !== null && booking.venue_rating !== undefined;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {booking.event_title || 'Booking Agreement'}
          </h3>
          {booking.musician_name && (
            <p className="text-sm text-gray-600">with {booking.musician_name}</p>
          )}
        </div>
        <span className={`flex items-center space-x-2 px-3 py-1 rounded-full ${config.bg} ${config.color} font-semibold`}>
          <Icon className="h-4 w-4" />
          <span className="text-sm">{config.label}</span>
        </span>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-gray-600">Agreed Rate</span>
          <span className="font-semibold">${booking.agreed_rate.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-gray-600">GigMate Fee (10%)</span>
          <span className="font-semibold">${booking.gigmate_fee.toFixed(2)}</span>
        </div>
        {booking.mediation_required && (
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-red-600">Mediation Fee (10%)</span>
            <span className="font-semibold text-red-600">${booking.mediation_fee.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center py-2 text-lg">
          <span className="font-bold">Total Amount</span>
          <span className="font-bold text-gigmate-blue">${booking.total_amount.toFixed(2)}</span>
        </div>
      </div>

      {booking.status === 'escrowed' && (
        <div className="space-y-4">
          <div className="bg-orange-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-900 font-medium mb-1">
                  Funds Held in Escrow
                </p>
                <p className="text-xs text-blue-700">
                  Both parties must rate each other 4 stars or higher to release funds. Ratings below 4 stars trigger automatic mediation with a 10% fee.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg ${
              booking.venue_rating ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className="flex items-center space-x-2 mb-1">
                {booking.venue_rating && <Star className="h-4 w-4 text-rose-500 fill-yellow-500" />}
                <span className="text-xs font-semibold text-gray-700">Venue Rating</span>
              </div>
              <p className="text-xs text-gray-600">
                {booking.venue_rating ? `${booking.venue_rating} stars` : 'Not rated'}
              </p>
            </div>

            <div className={`p-3 rounded-lg ${
              booking.musician_rating ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className="flex items-center space-x-2 mb-1">
                {booking.musician_rating && <Star className="h-4 w-4 text-rose-500 fill-yellow-500" />}
                <span className="text-xs font-semibold text-gray-700">Musician Rating</span>
              </div>
              <p className="text-xs text-gray-600">
                {booking.musician_rating ? `${booking.musician_rating} stars` : 'Not rated'}
              </p>
            </div>
          </div>

          {!hasRated && (
            <button
              onClick={() => setShowRatingModal(true)}
              className="w-full flex items-center justify-center space-x-2 bg-gigmate-blue text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
            >
              <Star className="h-5 w-5" />
              <span>Rate {isVenue ? 'Musician' : 'Venue'}</span>
            </button>
          )}

          {hasRated && !otherPartyRated && (
            <div className="bg-rose-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-sm text-yellow-800">
                You've rated {isVenue ? 'the musician' : 'the venue'}. Waiting for their rating...
              </p>
            </div>
          )}

          {showRatingModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Rate {isVenue ? 'Musician' : 'Venue'}
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating (4+ stars required to release funds)
                  </label>
                  <div className="flex justify-center space-x-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-10 w-10 ${
                            star <= rating
                              ? 'text-rose-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-lg font-semibold text-gray-900">
                    {rating} {rating === 1 ? 'Star' : 'Stars'}
                  </p>
                  {rating < 4 && (
                    <p className="text-center text-sm text-red-600 mt-2">
                      Warning: Ratings below 4 stars trigger mediation (10% fee)
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments (optional)
                  </label>
                  <textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Share your experience..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowRatingModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitRating}
                    disabled={loading}
                    className="flex-1 bg-gigmate-blue text-white py-2 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting...' : 'Submit Rating'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {booking.status === 'completed' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Payment Released</p>
              <p className="text-sm text-green-700">Both parties confirmed completion</p>
            </div>
          </div>
        </div>
      )}

      {booking.status === 'disputed' || booking.status === 'mediation' && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-orange-600 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-900">Dispute Filed</p>
              <p className="text-sm text-orange-700 mb-2">
                GigMate is reviewing this booking. A 10% mediation fee will be applied.
              </p>
              {booking.mediation_fee > 0 && (
                <p className="text-xs text-orange-600 font-medium">
                  Additional Fee: ${booking.mediation_fee.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
