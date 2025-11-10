import { useState, useEffect } from 'react';
import { X, Gift } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import StripeCheckout from '../Shared/StripeCheckout';

interface TicketPurchaseModalProps {
  eventId: string;
  onClose: () => void;
}

export default function TicketPurchaseModal({
  eventId,
  onClose
}: TicketPurchaseModalProps) {
  const { user, profile } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creditsToUse, setCreditsToUse] = useState(0);
  const [availableCredits, setAvailableCredits] = useState(0);

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  useEffect(() => {
    if (profile?.referral_credits) {
      setAvailableCredits(profile.referral_credits);
    }
  }, [profile]);

  async function loadEventData() {
    const { data, error } = await supabase
      .from('events')
      .select('*, venues(venue_name), musicians(stage_name)')
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('Error loading event:', error);
    } else {
      setEventData(data);
    }
    setLoading(false);
  }

  if (loading || !eventData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <p className="text-center text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  const gigmateFeePercentage = 10;
  const ccProcessingPercentage = 2.9;
  const ccProcessingFixed = 0.30;

  const subtotal = eventData.ticket_price * quantity;
  const maxCreditsCanUse = Math.min(availableCredits, subtotal);
  const afterCredits = Math.max(0, subtotal - creditsToUse);
  const finalGigmateFee = afterCredits * (gigmateFeePercentage / 100);
  const finalCCFee = afterCredits > 0 ? (afterCredits * (ccProcessingPercentage / 100)) + ccProcessingFixed : 0;
  const total = afterCredits + finalGigmateFee + finalCCFee;
  const availableTickets = eventData.total_tickets - eventData.tickets_sold;

  async function handlePurchase() {
    if (!user) return;
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Buy Tickets</h2>
            <p className="text-gray-600">{eventData.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Tickets
            </label>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                -
              </button>
              <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(availableTickets, quantity + 1))}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>

          {availableCredits > 0 && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Use Your Credits</h3>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  Available: <span className="text-green-600 font-bold">{availableCredits.toFixed(2)} credits</span>
                </span>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credits to Use (Max: {maxCreditsCanUse.toFixed(2)})
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max={maxCreditsCanUse}
                  step="0.01"
                  value={creditsToUse}
                  onChange={(e) => setCreditsToUse(Math.min(parseFloat(e.target.value) || 0, maxCreditsCanUse))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
                <button
                  onClick={() => setCreditsToUse(maxCreditsCanUse)}
                  className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  Use Max
                </button>
              </div>
              {creditsToUse > 0 && (
                <p className="mt-2 text-sm text-green-600 font-medium">
                  Saving ${creditsToUse.toFixed(2)} with your credits!
                </p>
              )}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tickets ({quantity}x ${eventData.ticket_price.toFixed(2)})</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            {creditsToUse > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600 font-medium">GigMate Credits Applied</span>
                <span className="font-medium text-green-600">-${creditsToUse.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Service Fee ({gigmateFeePercentage}%)</span>
              <span className="font-medium">${finalGigmateFee.toFixed(2)}</span>
            </div>
            {afterCredits > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">CC Processing ({ccProcessingPercentage}% + ${ccProcessingFixed.toFixed(2)})</span>
                <span className="font-medium">${finalCCFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
              <span>Total to Pay</span>
              <span className={creditsToUse > 0 ? 'text-green-600' : ''}>
                {total === 0 ? 'FREE' : `$${total.toFixed(2)}`}
              </span>
            </div>
          </div>

          <StripeCheckout
            params={{
              type: 'ticket',
              metadata: {
                type: 'ticket',
                fan_id: user?.id,
                event_id: eventId,
                eventName: eventData.title,
                price: eventData.ticket_price,
                quantity,
                description: `${quantity} ticket(s) for ${eventData.title}`,
              },
            }}
            buttonText={`Purchase for $${total.toFixed(2)}`}
            onSuccess={handlePurchase}
            onError={(error) => {
              alert('Purchase failed: ' + error.message);
            }}
          />

          <p className="text-xs text-gray-500 text-center">
            Your tickets will be available in your account and can be used with the GigMate app at the venue.
          </p>
        </div>
      </div>
    </div>
  );
}
