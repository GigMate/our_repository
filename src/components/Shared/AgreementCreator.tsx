import { useState } from 'react';
import { FileText, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AgreementCreatorProps {
  bookingId: string;
  venueId: string;
  musicianId: string;
  bookingDetails: {
    title: string;
    start_time: string;
    end_time: string;
    offered_payment: number;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function AgreementCreator({
  bookingId,
  venueId,
  musicianId,
  bookingDetails,
  onSuccess,
  onCancel
}: AgreementCreatorProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: `Performance Agreement - ${bookingDetails.title}`,
    terms: `This agreement is for a live music performance at the venue on ${new Date(bookingDetails.start_time).toLocaleDateString()}.

PERFORMANCE DETAILS:
- Event: ${bookingDetails.title}
- Date: ${new Date(bookingDetails.start_time).toLocaleString()}
- Duration: Approximately ${Math.round((new Date(bookingDetails.end_time).getTime() - new Date(bookingDetails.start_time).getTime()) / 60000)} minutes

PAYMENT TERMS:
- Total compensation: $${bookingDetails.offered_payment.toFixed(2)}
- Payment schedule as selected below

PERFORMER OBLIGATIONS:
- Arrive at least 30 minutes before performance time for sound check
- Provide professional-quality performance for the agreed duration
- Bring all necessary equipment unless otherwise specified
- Conduct themselves professionally throughout the engagement

VENUE OBLIGATIONS:
- Provide agreed-upon performance space
- Ensure payment according to selected schedule
- Provide basic sound equipment (if applicable)
- Ensure safe working environment

CANCELLATION:
- Cancellations must be made at least 48 hours in advance
- Deposits may be non-refundable based on cancellation policy selected`,
    payment_amount: bookingDetails.offered_payment,
    payment_schedule: 'split' as 'upfront' | 'on_completion' | 'split' | 'milestone',
    deposit_amount: bookingDetails.offered_payment * 0.5,
    cancellation_policy: `Either party may cancel this agreement with at least 48 hours notice. Cancellations made less than 48 hours before the event may result in forfeiture of deposit or payment penalties.`,
    refund_policy: `Full refund if venue cancels with 48+ hours notice. 50% refund if cancelled 24-48 hours before event. No refund if cancelled less than 24 hours before event.`,
    equipment_requirements: '',
    sound_check_time: '',
    performance_duration_minutes: Math.round((new Date(bookingDetails.end_time).getTime() - new Date(bookingDetails.start_time).getTime()) / 60000),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const finalPaymentAmount = formData.payment_schedule === 'split'
        ? formData.payment_amount - formData.deposit_amount
        : formData.payment_schedule === 'upfront'
        ? 0
        : formData.payment_amount;

      const { data: agreement, error } = await supabase
        .from('agreements')
        .insert({
          booking_id: bookingId,
          venue_id: venueId,
          musician_id: musicianId,
          title: formData.title,
          terms: formData.terms,
          payment_amount: formData.payment_amount,
          payment_schedule: formData.payment_schedule,
          deposit_amount: formData.payment_schedule === 'split' || formData.payment_schedule === 'upfront' ? formData.deposit_amount : null,
          final_payment_amount: finalPaymentAmount,
          cancellation_policy: formData.cancellation_policy,
          refund_policy: formData.refund_policy,
          equipment_requirements: formData.equipment_requirements || null,
          sound_check_time: formData.sound_check_time || null,
          performance_duration_minutes: formData.performance_duration_minutes,
          status: 'pending_signatures',
          created_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;

      alert('Agreement created! Both parties must sign to activate it.');
      onSuccess();
    } catch (err: any) {
      console.error('Agreement creation error:', err);
      alert('Failed to create agreement: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <FileText className="w-6 h-6 text-gigmate-blue" />
        Create Digital Agreement
      </h2>

      <div className="mb-6 p-4 bg-orange-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">About Digital Agreements</p>
            <p>This legally binding agreement will require signatures from both parties. Payment will be processed according to the schedule you select.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agreement Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agreement Terms
          </label>
          <textarea
            value={formData.terms}
            onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            required
            rows={12}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gigmate-blue focus:border-transparent font-mono text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Payment Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.payment_amount}
              onChange={(e) => setFormData({ ...formData, payment_amount: parseFloat(e.target.value) })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Schedule
            </label>
            <select
              value={formData.payment_schedule}
              onChange={(e) => setFormData({ ...formData, payment_schedule: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
            >
              <option value="upfront">100% Upfront</option>
              <option value="split">50% Deposit + 50% After</option>
              <option value="on_completion">100% After Completion</option>
              <option value="milestone">Custom Milestones</option>
            </select>
          </div>
        </div>

        {(formData.payment_schedule === 'split' || formData.payment_schedule === 'upfront') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deposit Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={formData.payment_amount}
              value={formData.deposit_amount}
              onChange={(e) => setFormData({ ...formData, deposit_amount: parseFloat(e.target.value) })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cancellation Policy
          </label>
          <textarea
            value={formData.cancellation_policy}
            onChange={(e) => setFormData({ ...formData, cancellation_policy: e.target.value })}
            required
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Refund Policy
          </label>
          <textarea
            value={formData.refund_policy}
            onChange={(e) => setFormData({ ...formData, refund_policy: e.target.value })}
            required
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Equipment Requirements (Optional)
          </label>
          <textarea
            value={formData.equipment_requirements}
            onChange={(e) => setFormData({ ...formData, equipment_requirements: e.target.value })}
            rows={2}
            placeholder="e.g., Sound system, microphones, stage lighting"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Sound Check Time (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.sound_check_time}
              onChange={(e) => setFormData({ ...formData, sound_check_time: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Performance Duration (minutes)
            </label>
            <input
              type="number"
              min="0"
              value={formData.performance_duration_minutes}
              onChange={(e) => setFormData({ ...formData, performance_duration_minutes: parseInt(e.target.value) })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gigmate-blue text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating Agreement...' : 'Create Agreement'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
