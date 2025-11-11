import { useState, useEffect, useRef } from 'react';
import { FileText, CheckCircle, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { usePayment } from '../../hooks/usePayment';

interface Agreement {
  id: string;
  title: string;
  terms: string;
  payment_amount: number;
  payment_schedule: string;
  deposit_amount?: number;
  final_payment_amount?: number;
  deposit_paid: boolean;
  final_payment_paid: boolean;
  status: string;
  cancellation_policy: string;
  refund_policy: string;
  equipment_requirements?: string;
  sound_check_time?: string;
  performance_duration_minutes: number;
  created_at: string;
  venue: {
    full_name: string;
    venue_name?: string;
  };
  musician: {
    full_name: string;
    stage_name?: string;
  };
  signatures: Array<{
    signer_id: string;
    signed_at: string;
  }>;
}

interface AgreementViewerProps {
  agreementId: string;
  onClose?: () => void;
}

export function AgreementViewer({ agreementId, onClose }: AgreementViewerProps) {
  const { user, profile } = useAuth();
  const { createPaymentIntent, loading: paymentLoading } = usePayment();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    loadAgreement();
  }, [agreementId]);

  async function loadAgreement() {
    const { data, error } = await supabase
      .from('agreements')
      .select(`
        *,
        venue:profiles!venue_id(full_name, venue_name),
        musician:profiles!musician_id(full_name, stage_name),
        signatures:agreement_signatures(signer_id, signed_at)
      `)
      .eq('id', agreementId)
      .single();

    if (error) {
      console.error('Error loading agreement:', error);
      alert('Failed to load agreement');
      return;
    }

    setAgreement(data);
    setLoading(false);
  }

  function hasSigned() {
    if (!user || !agreement) return false;
    return agreement.signatures.some(s => s.signer_id === user.id);
  }

  function bothPartiesSigned() {
    if (!agreement) return false;
    return agreement.signatures.length === 2;
  }

  async function handleSign() {
    if (!user || !agreement || !signature.trim()) {
      alert('Please provide your signature');
      return;
    }

    setSigning(true);

    try {
      const canvas = canvasRef.current;
      const signatureData = canvas ? canvas.toDataURL() : signature;

      const { error } = await supabase.from('agreement_signatures').insert({
        agreement_id: agreementId,
        signer_id: user.id,
        signature_data: signatureData,
        ip_address: 'client',
      });

      if (error) throw error;

      alert('Agreement signed successfully!');
      await loadAgreement();
    } catch (err: any) {
      console.error('Signing error:', err);
      alert('Failed to sign agreement: ' + err.message);
    } finally {
      setSigning(false);
    }
  }

  async function handlePayment(type: 'deposit' | 'final') {
    if (!agreement) return;

    try {
      const amount = type === 'deposit' ? agreement.deposit_amount : agreement.final_payment_amount;
      if (!amount) return;

      await createPaymentIntent(amount, 'booking', agreementId, {
        agreement_id: agreementId,
        payment_type: type,
      });

      alert('Redirecting to payment...');
    } catch (err: any) {
      console.error('Payment error:', err);
      alert('Failed to process payment: ' + err.message);
    }
  }

  function startDrawing(e: React.MouseEvent<HTMLCanvasElement>) {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature('');
  }

  if (loading) {
    return <div className="text-center py-8">Loading agreement...</div>;
  }

  if (!agreement) {
    return <div className="text-center py-8">Agreement not found</div>;
  }

  const userIsSigned = hasSigned();
  const allSigned = bothPartiesSigned();
  const isActive = agreement.status === 'active';

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-gigmate-blue" />
          {agreement.title}
        </h2>
        <span
          className={`px-4 py-1 rounded-full text-sm font-medium ${
            isActive
              ? 'bg-green-100 text-green-800'
              : agreement.status === 'pending_signatures'
              ? 'bg-rose-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {agreement.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-600">Venue</p>
          <p className="font-medium">{agreement.venue.venue_name || agreement.venue.full_name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Musician</p>
          <p className="font-medium">{agreement.musician.stage_name || agreement.musician.full_name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            Total Payment
          </p>
          <p className="font-medium">${agreement.payment_amount.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Payment Schedule</p>
          <p className="font-medium capitalize">{agreement.payment_schedule.replace('_', ' ')}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-bold text-gray-900 mb-3">Agreement Terms</h3>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{agreement.terms}</pre>
        </div>
      </div>

      {agreement.cancellation_policy && (
        <div className="mb-6">
          <h3 className="font-bold text-gray-900 mb-3">Cancellation Policy</h3>
          <div className="p-4 bg-rose-50 rounded-lg border border-yellow-600">
            <p className="text-sm text-gray-700">{agreement.cancellation_policy}</p>
          </div>
        </div>
      )}

      {agreement.refund_policy && (
        <div className="mb-6">
          <h3 className="font-bold text-gray-900 mb-3">Refund Policy</h3>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-900">{agreement.refund_policy}</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-bold text-gray-900 mb-3">Signatures</h3>
        <div className="space-y-3">
          {agreement.signatures.map((sig) => (
            <div key={sig.signer_id} className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">
                  {sig.signer_id === agreement.venue.full_name ? 'Venue' : 'Musician'} Signed
                </p>
                <p className="text-xs text-green-700">
                  {new Date(sig.signed_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {!userIsSigned && agreement.status === 'pending_signatures' && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-yellow-600 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
              <p className="font-medium text-yellow-900">Awaiting your signature</p>
            </div>
          )}
        </div>
      </div>

      {!userIsSigned && agreement.status === 'pending_signatures' && (
        <div className="mb-6 p-6 bg-white border-2 border-gigmate-blue rounded-lg">
          <h3 className="font-bold text-gray-900 mb-4">Sign Agreement</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Draw Your Signature
            </label>
            <canvas
              ref={canvasRef}
              width={600}
              height={150}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="border-2 border-gray-300 rounded-lg cursor-crosshair w-full"
            />
            <button
              type="button"
              onClick={clearSignature}
              className="mt-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Signature
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Type Your Full Name
            </label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Full Legal Name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gigmate-blue"
            />
          </div>

          <div className="flex items-start gap-2 mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-900">
              By signing this agreement, you acknowledge that you have read and agree to all terms and conditions outlined above. This is a legally binding electronic signature.
            </p>
          </div>

          <button
            onClick={handleSign}
            disabled={signing || (!signature.trim() && !canvasRef.current)}
            className="w-full bg-gigmate-blue text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {signing ? 'Signing...' : 'Sign Agreement'}
          </button>
        </div>
      )}

      {isActive && profile?.user_type === 'venue' && (
        <div className="space-y-4">
          {agreement.deposit_amount && !agreement.deposit_paid && (
            <div className="p-4 bg-rose-50 border border-yellow-600 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-yellow-900">Deposit Payment Required</p>
                  <p className="text-sm text-yellow-700">${agreement.deposit_amount.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => handlePayment('deposit')}
                  disabled={paymentLoading}
                  className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  Pay Deposit
                </button>
              </div>
            </div>
          )}

          {agreement.final_payment_amount && agreement.deposit_paid && !agreement.final_payment_paid && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-900">Final Payment Due</p>
                  <p className="text-sm text-green-700">${agreement.final_payment_amount.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => handlePayment('final')}
                  disabled={paymentLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Pay Final Amount
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {onClose && (
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Close
        </button>
      )}
    </div>
  );
}
