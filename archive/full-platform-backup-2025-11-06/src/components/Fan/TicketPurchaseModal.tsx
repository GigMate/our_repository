import { useState, useEffect } from 'react';
import { X, CreditCard, Plus, Ticket } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import StripeCheckout from '../Shared/StripeCheckout';

interface PaymentMethod {
  id: string;
  card_brand: string;
  last_four: string;
  expiry_month: number;
  expiry_year: number;
  is_default: boolean;
}

interface TicketPurchaseModalProps {
  eventId: string;
  eventTitle: string;
  ticketPrice: number;
  availableTickets: number;
  onClose: () => void;
  onPurchaseComplete: () => void;
}

export default function TicketPurchaseModal({
  eventId,
  eventTitle,
  ticketPrice,
  availableTickets,
  onClose,
  onPurchaseComplete
}: TicketPurchaseModalProps) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);

  const gigmateFeePercentage = 10;
  const ccProcessingPercentage = 2.9;
  const ccProcessingFixed = 0.30;

  const subtotal = ticketPrice * quantity;
  const gigmateFee = subtotal * (gigmateFeePercentage / 100);
  const ccProcessingFee = (subtotal * (ccProcessingPercentage / 100)) + ccProcessingFixed;
  const total = subtotal + gigmateFee + ccProcessingFee;

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  async function loadPaymentMethods() {
    if (!user) return;

    const { data } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });

    if (data) {
      setPaymentMethods(data);
      const defaultMethod = data.find(pm => pm.is_default);
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod.id);
      }
    }
  }

  async function handlePurchase() {
    if (!user) return;
    onPurchaseComplete();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Buy Tickets</h2>
            <p className="text-gray-600">{eventTitle}</p>
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
              <span className="text-gray-600">Tickets ({quantity}x ${ticketPrice.toFixed(2)})</span>
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
                eventName: eventTitle,
                price: ticketPrice,
                quantity,
                description: `${quantity} ticket(s) for ${eventTitle}`,
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
