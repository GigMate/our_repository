import { useState, useEffect } from 'react';
import { Upload, FileCheck, CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface BackgroundCheckPortalProps {
  investorRequestId: string;
  investorEmail: string;
  riskScore?: number;
  osintRecommendation?: string;
}

export default function BackgroundCheckPortal({
  investorRequestId,
  investorEmail,
  riskScore = 0,
  osintRecommendation = 'more_info_needed'
}: BackgroundCheckPortalProps) {
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [backgroundCheckStatus, setBackgroundCheckStatus] = useState<string>('pending');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [checkDate, setCheckDate] = useState<string>('');

  useEffect(() => {
    loadBackgroundCheckStatus();
  }, [investorRequestId]);

  async function loadBackgroundCheckStatus() {
    try {
      const { data, error } = await supabase
        .from('investor_interest_requests')
        .select('background_check_status, background_check_upload_date, mayday_check_paid, mayday_check_request_sent')
        .eq('id', investorRequestId)
        .single();

      if (error) throw error;
      if (data) {
        setBackgroundCheckStatus(data.background_check_status || 'pending');
      }
    } catch (error) {
      console.error('Error loading status:', error);
    }
  }

  async function handleFileUpload() {
    if (!uploadedFile || !checkDate) {
      setUploadStatus('Please select a file and enter the check date');
      return;
    }

    const checkDateObj = new Date(checkDate);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    if (checkDateObj < twoWeeksAgo) {
      setUploadStatus('Background check must be dated within the last 2 weeks');
      return;
    }

    setLoading(true);
    setUploadStatus('');

    try {
      const fileExt = uploadedFile.name.split('.').pop();
      const fileName = `${investorRequestId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('background-checks')
        .upload(fileName, uploadedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('background-checks')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('investor_interest_requests')
        .update({
          background_check_status: 'uploaded',
          background_check_upload_url: publicUrl,
          background_check_upload_date: new Date().toISOString(),
          background_check_expiry_date: checkDateObj.toISOString(),
        })
        .eq('id', investorRequestId);

      if (updateError) throw updateError;

      setUploadStatus('Background check uploaded successfully! Admin will review shortly.');
      setBackgroundCheckStatus('uploaded');
    } catch (error: any) {
      setUploadStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleMaydayPayment() {
    setLoading(true);
    setUploadStatus('');

    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          amount: 5000,
          description: 'Background Check - Mayday Investigations',
          metadata: {
            type: 'background_check',
            investor_request_id: investorRequestId,
            investor_email: investorEmail,
          },
        },
      });

      if (error) throw error;

      const result = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error: any) {
      setUploadStatus(`Error: ${error.message}`);
      setLoading(false);
    }
  }

  const showOptions = ['pending', 'mayday_requested'].includes(backgroundCheckStatus) &&
                      (riskScore >= 25 || osintRecommendation !== 'approve');

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <FileCheck className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Background Check Required</h2>
          <p className="text-sm text-gray-600">Improve your investor verification status</p>
        </div>
      </div>

      {/* Status Display */}
      {backgroundCheckStatus === 'uploaded' && (
        <div className="bg-orange-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Under Review</h3>
            <p className="text-sm text-blue-700">
              Your background check has been uploaded and is being reviewed by our team.
              You'll receive an email once the review is complete.
            </p>
          </div>
        </div>
      )}

      {backgroundCheckStatus === 'mayday_paid' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900">Payment Received</h3>
            <p className="text-sm text-green-700">
              Your background check has been ordered from our investigation partner.
              They will complete the investigation within 5-7 business days.
              Results will be sent directly to our admin team.
            </p>
          </div>
        </div>
      )}

      {backgroundCheckStatus === 'completed' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900">Background Check Approved</h3>
            <p className="text-sm text-green-700">
              Your background check has been approved. Your investor application is now
              eligible for final review.
            </p>
          </div>
        </div>
      )}

      {backgroundCheckStatus === 'expired' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Background Check Expired</h3>
            <p className="text-sm text-red-700">
              Your uploaded background check is older than 2 weeks. Please upload a new one
              or order a fresh check from our investigation partner.
            </p>
          </div>
        </div>
      )}

      {/* Risk Score Display */}
      {riskScore > 0 && showOptions && (
        <div className="bg-rose-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900">Additional Verification Needed</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Our automated screening identified some areas that require additional verification.
                Providing a background check will help expedite your approval.
              </p>
              <div className="mt-3">
                <div className="text-xs text-yellow-600 mb-1">Risk Assessment Score</div>
                <div className="w-full bg-yellow-200 rounded-full h-2">
                  <div
                    className="bg-yellow-600 h-2 rounded-full"
                    style={{ width: `${Math.min(riskScore, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-yellow-600 mt-1">{riskScore}/100</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Options */}
      {showOptions && (
        <div className="space-y-6">
          {/* Option 1: Upload Existing Check */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <Upload className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Option 1: Upload Existing Check</h3>
                <p className="text-sm text-gray-600 mt-1">
                  If you have a background check from another source dated within the last 2 weeks,
                  you can upload it here.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Check Date *
                </label>
                <input
                  type="date"
                  value={checkDate}
                  onChange={(e) => setCheckDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Must be within the last 14 days</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Document (PDF, JPG, PNG) *
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <button
                onClick={handleFileUpload}
                disabled={loading || !uploadedFile || !checkDate}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Uploading...' : 'Upload Background Check'}
              </button>
            </div>
          </div>

          {/* Option 2: Pay for Mayday Check */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <CreditCard className="w-6 h-6 text-green-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Option 2: Order Professional Check</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Pay $50 for a comprehensive background check performed by our authorized investigation partner.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">What's Included:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Identity Verification</li>
                <li>• Address Verification</li>
                <li>• Criminal History Check (where applicable)</li>
                <li>• Financial Background Check</li>
                <li>• Professional/Business Verification</li>
                <li>• Results delivered within 5-7 business days</li>
              </ul>
            </div>

            <div className="bg-orange-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-800">
                <strong>Privacy Notice:</strong> Your KYC information will be securely transmitted
                to our authorized third-party investigation service for verification purposes only.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-green-600">$50.00</span>
            </div>

            <button
              onClick={handleMaydayPayment}
              disabled={loading}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Pay $50 - Order Background Check'}
            </button>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {uploadStatus && (
        <div className={`mt-4 p-4 rounded-lg ${
          uploadStatus.includes('Error')
            ? 'bg-red-50 text-red-800 border border-red-200'
            : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {uploadStatus}
        </div>
      )}
    </div>
  );
}
