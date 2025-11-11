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
    physical_address_line1: '',
    physical_address_line2: '',
    physical_city: '',
    physical_state: '',
    physical_zip: '',
    physical_country: 'USA',
    mailing_address_line1: '',
    mailing_address_line2: '',
    mailing_city: '',
    mailing_state: '',
    mailing_zip: '',
    mailing_country: 'USA',
    mailing_same_as_physical: false,
    kyc_consent_given: false,
  });

  async function handleInterestSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.full_name || !formData.email || !formData.investment_range ||
        !formData.physical_address_line1 || !formData.physical_city ||
        !formData.physical_state || !formData.physical_zip ||
        !formData.mailing_address_line1 || !formData.mailing_city ||
        !formData.mailing_state || !formData.mailing_zip ||
        !formData.kyc_consent_given) {
      setError('Please fill in all required fields and provide consent for background verification');
      setLoading(false);
      return;
    }

    try {
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => 'unknown');

      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        await supabase.auth.signOut();
      }

      const { data, error: submitError } = await supabase
        .from('investor_interest_requests')
        .insert({
          full_name: formData.full_name,
          email: formData.email,
          company: formData.company || null,
          phone: formData.phone || null,
          investment_range: formData.investment_range,
          message: formData.message || null,
          physical_address_line1: formData.physical_address_line1,
          physical_address_line2: formData.physical_address_line2 || null,
          physical_city: formData.physical_city,
          physical_state: formData.physical_state,
          physical_zip: formData.physical_zip,
          physical_country: formData.physical_country,
          mailing_address_line1: formData.mailing_address_line1,
          mailing_address_line2: formData.mailing_address_line2 || null,
          mailing_city: formData.mailing_city,
          mailing_state: formData.mailing_state,
          mailing_zip: formData.mailing_zip,
          mailing_country: formData.mailing_country,
          mailing_same_as_physical: formData.mailing_same_as_physical,
          kyc_consent_given: formData.kyc_consent_given,
          kyc_consent_timestamp: new Date().toISOString(),
          kyc_consent_ip: ipAddress,
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
            <p className="text-sm text-gray-900">
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

              {/* Physical Address Section */}
              <div className="border-t pt-5 mt-5">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Physical Address *</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Required for investor verification and due diligence purposes.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.physical_address_line1}
                      onChange={(e) => setFormData({ ...formData, physical_address_line1: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.physical_address_line2}
                      onChange={(e) => setFormData({ ...formData, physical_address_line2: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Suite 100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.physical_city}
                        onChange={(e) => setFormData({ ...formData, physical_city: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Austin"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.physical_state}
                        onChange={(e) => setFormData({ ...formData, physical_state: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="TX"
                        maxLength={2}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.physical_zip}
                        onChange={(e) => setFormData({ ...formData, physical_zip: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="78701"
                        maxLength={10}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Country *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.physical_country}
                        onChange={(e) => setFormData({ ...formData, physical_country: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="USA"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mailing Address Section */}
              <div className="border-t pt-5 mt-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Mailing Address *</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.mailing_same_as_physical}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData({
                          ...formData,
                          mailing_same_as_physical: checked,
                          mailing_address_line1: checked ? formData.physical_address_line1 : '',
                          mailing_address_line2: checked ? formData.physical_address_line2 : '',
                          mailing_city: checked ? formData.physical_city : '',
                          mailing_state: checked ? formData.physical_state : '',
                          mailing_zip: checked ? formData.physical_zip : '',
                          mailing_country: checked ? formData.physical_country : 'USA',
                        });
                      }}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Same as physical address</span>
                  </label>
                </div>

                {!formData.mailing_same_as_physical && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Address Line 1 *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.mailing_address_line1}
                        onChange={(e) => setFormData({ ...formData, mailing_address_line1: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="PO Box 456"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Address Line 2 (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.mailing_address_line2}
                        onChange={(e) => setFormData({ ...formData, mailing_address_line2: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Suite 200"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.mailing_city}
                          onChange={(e) => setFormData({ ...formData, mailing_city: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Austin"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          State *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.mailing_state}
                          onChange={(e) => setFormData({ ...formData, mailing_state: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="TX"
                          maxLength={2}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          ZIP Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.mailing_zip}
                          onChange={(e) => setFormData({ ...formData, mailing_zip: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="78701"
                          maxLength={10}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Country *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.mailing_country}
                          onChange={(e) => setFormData({ ...formData, mailing_country: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="USA"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* KYC Consent */}
              <div className="border-t pt-5 mt-5">
                <div className="bg-rose-50 border border-yellow-600 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Know Your Customer (KYC) Verification</h3>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    As part of our investor verification process, GigMate is required to conduct due diligence
                    background checks to comply with securities regulations and anti-money laundering laws.
                  </p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={formData.kyc_consent_given}
                    onChange={(e) => setFormData({ ...formData, kyc_consent_given: e.target.checked })}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 mt-1"
                  />
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-2">I hereby consent and authorize GigMate to:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Conduct comprehensive background investigations regarding my identity, financial history, and investment credentials</li>
                      <li>Verify the accuracy of all information provided in this application</li>
                      <li>Contact references, financial institutions, and other entities to verify my suitability as an investor</li>
                      <li>Perform identity verification through third-party services and databases</li>
                      <li>Retain records of this verification process as required by applicable laws and regulations</li>
                      <li>Use the provided information solely for investor verification and due diligence purposes</li>
                    </ul>
                    <p className="mt-2 font-semibold">
                      I understand that providing false information or withholding material facts may result in the
                      denial of my investor application and potential legal consequences. I certify that all information
                      provided is true, accurate, and complete to the best of my knowledge.
                    </p>
                  </div>
                </label>
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
