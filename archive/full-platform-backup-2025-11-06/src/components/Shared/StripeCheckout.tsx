import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { createCheckoutSession, CheckoutParams } from '../../lib/stripe';

interface StripeCheckoutProps {
  params: CheckoutParams;
  buttonText?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export default function StripeCheckout({
  params,
  buttonText = 'Proceed to Payment',
  onSuccess,
  onError
}: StripeCheckoutProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const checkoutUrl = await createCheckoutSession(params);

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        onSuccess?.();
      }
    } catch (error) {
      console.error('Checkout error:', error);
      onError?.(error as Error);
      alert(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="w-5 h-5" />
          {buttonText}
        </>
      )}
    </button>
  );
}
