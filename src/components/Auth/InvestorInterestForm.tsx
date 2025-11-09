import { useState } from 'react';
import { TrendingUp, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LegalDocumentViewer from '../Shared/LegalDocumentViewer';

interface InvestorInterestFormProps {
  onBack: () => void;
}

export default function InvestorInterestForm({ onBack }: InvestorInterestFormProps) {
  const [step, setStep] = useState<'interest' | 'legal' | 'submitted'>('interest');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestId, setRequestId] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    company: '',
    phone: '',
    investment_range: '',
    message: '',
  });

  async function handleInterestSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.full_name || !formData.email || !formData.investment_range) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const { data, error: submitError } = await supabase
        .from('investor_interest_requests')
        .insert({
          full_name: formData.full_name,
          email: formData.email,
          company: formData.company || null,
          phone: formData.phone || null,
          investment_range: formData.investment_range,
          message: formData.message || null,
          status: 'pending',
        })
        .select()
        .single();

      if (submitError) throw submitError;

      setRequestId(data.id);
      setStep('legal');
    } catch (err: any) {
      if (err.code === '23505') {
        setError('An investor request with this email already exists.');
      } else {
        setError(err.message || 'Failed to submit request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleAllSigned() {
    setStep('submitted');
  }

  if (step === 'submitted') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-600 to-orange-400 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Request Submitted Successfully!</h2>
          <p className="text-gray-600 mb-6 text-lg">
            Thank you for your interest in investing in GigMate. Our team will review your submission and reach out to you shortly.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              <strong>Next Steps:</strong> We will verify your information and legal agreements.
              If approved, you'll receive an invitation email with login credentials to access the investor portal.
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (step === 'legal') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-600 to-orange-400 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={onBack}
            className="mb-6 text-white hover:underline"
          >
            ← Back to Home
          </button>

          <LegalDocumentViewer
            investorRequestId={requestId}
            investorEmail={formData.email}
            investorName={formData.full_name}
            onAllSigned={handleAllSigned}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-600 to-orange-400 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 text-white hover:underline"
        >
          ← Back to Home
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="text-white">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-4 w-20 h-20 mb-6 flex items-center justify-center">
              <TrendingUp className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Investor Access Request</h1>
            <p className="text-lg mb-6 text-white/90">
              GigMate investor access is by invitation only. Submit your interest and our team will review your request.
            </p>

            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2">What You'll Get</h3>
                <ul className="space-y-2 text-white/90">
                  <li>• Real-time platform analytics</li>
                  <li>• Revenue and growth metrics</li>
                  <li>• Market insights and KPIs</li>
                  <li>• Quarterly performance reports</li>
                </ul>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2">Access Process</h3>
                <ol className="space-y-2 text-white/90 text-sm">
                  <li>1. Submit your interest form</li>
                  <li>2. Sign required legal agreements</li>
                  <li>3. Team reviews your request</li>
                  <li>4. Receive invitation if approved</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Investor Interest Form</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleInterestSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company (Optional)
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="ABC Capital Partners"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Investment Interest Range *
                </label>
                <select
                  required
                  value={formData.investment_range}
                  onChange={(e) => setFormData({ ...formData, investment_range: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select a range</option>
                  <option value="$25k-$50k">$25,000 - $50,000</option>
                  <option value="$50k-$100k">$50,000 - $100,000</option>
                  <option value="$100k-$250k">$100,000 - $250,000</option>
                  <option value="$250k-$500k">$250,000 - $500,000</option>
                  <option value="$500k+">$500,000+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Tell us about your investment background and interest in GigMate..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-orange-600 text-white font-bold text-lg rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Continue to Legal Agreements
              </button>
            </form>

            <p className="text-xs text-gray-500 mt-4 text-center">
              * Required fields
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
