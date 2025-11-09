import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventData();
  }, [eventId]);

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
  const gigmateFee = subtotal * (gigmateFeePercentage / 100);
  const ccProcessingFee = (subtotal * (ccProcessingPercentage / 100)) + ccProcessingFixed;
  const total = subtotal + gigmateFee + ccProcessingFee;
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

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tickets ({quantity}x ${eventData.ticket_price.toFixed(2)})</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Service Fee ({gigmateFeePercentage}%)</span>
              <span className="font-medium">${gigmateFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">CC Processing ({ccProcessingPercentage}% + ${ccProcessingFixed.toFixed(2)})</span>
              <span className="font-medium">${ccProcessingFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
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
