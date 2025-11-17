import { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function EmailTester() {
  const [email, setEmail] = useState('');
  const [template, setTemplate] = useState('booking_request');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const templates = [
    { value: 'booking_request', label: 'Booking Request' },
    { value: 'booking_accepted', label: 'Booking Accepted' },
    { value: 'booking_declined', label: 'Booking Declined' },
    { value: 'booking_counter_offer', label: 'Counter Offer' },
    { value: 'ticket_purchase', label: 'Ticket Purchase' },
    { value: 'subscription_activated', label: 'Subscription Activated' },
  ];

  const getTestData = (template: string) => {
    const baseData = {
      booking_request: {
        venue_name: 'Test Venue',
        title: 'Test Booking',
        date: new Date().toISOString(),
        payment: 500,
        description: 'This is a test booking request email.',
        link: 'https://gigmate.us/dashboard',
      },
      booking_accepted: {
        musician_name: 'Test Musician',
        title: 'Test Booking',
        date: new Date().toISOString(),
        payment: 500,
        link: 'https://gigmate.us/dashboard',
      },
      booking_declined: {
        musician_name: 'Test Musician',
        title: 'Test Booking',
        reason: 'Schedule conflict',
      },
      booking_counter_offer: {
        musician_name: 'Test Musician',
        title: 'Test Booking',
        original_payment: 500,
        counter_offer: 650,
        notes: 'I can do it for this amount',
        link: 'https://gigmate.us/dashboard',
      },
      ticket_purchase: {
        event_name: 'Test Event',
        venue_name: 'Test Venue',
        event_date: new Date().toISOString(),
        quantity: 2,
        total: 60,
        link: 'https://gigmate.us/tickets',
      },
      subscription_activated: {
        subscription_type: 'Premium',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        link: 'https://gigmate.us/dashboard',
      },
    };

    return baseData[template as keyof typeof baseData];
  };

  const sendTestEmail = async () => {
    if (!email) {
      setResult({ success: false, message: 'Please enter an email address' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          template,
          data: getTestData(template),
        },
      });

      if (error) throw error;

      setResult({
        success: true,
        message: `Test email sent successfully! Email ID: ${data.id}`,
      });
    } catch (error: any) {
      console.error('Email test error:', error);
      setResult({
        success: false,
        message: error.message || 'Failed to send test email',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Mail className="h-8 w-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Tester</h2>
          <p className="text-gray-600">Test transactional emails using Resend</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Template
          </label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {templates.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={sendTestEmail}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="h-5 w-5" />
          <span>{loading ? 'Sending...' : 'Send Test Email'}</span>
        </button>

        {result && (
          <div
            className={`flex items-start space-x-3 p-4 rounded-lg ${
              result.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`font-medium ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}
              >
                {result.success ? 'Success!' : 'Error'}
              </p>
              <p
                className={`text-sm ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {result.message}
              </p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions:</h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal ml-4">
            <li>
              <strong>Add RESEND_API_KEY to Supabase:</strong>
              <ul className="ml-4 mt-1 list-disc space-y-1">
                <li>Go to Supabase Dashboard → Settings → Edge Functions</li>
                <li>Add new secret: Name = <code className="bg-blue-100 px-1">RESEND_API_KEY</code></li>
                <li>Value from .env file: <code className="bg-blue-100 px-1">re_ZzVDgqKw_47HRFCEbecwwpm5qadZjmXiK</code></li>
              </ul>
            </li>
            <li>
              <strong>Verify domain in Resend:</strong>
              <ul className="ml-4 mt-1 list-disc">
                <li>Go to <a href="https://resend.com/domains" target="_blank" className="underline">resend.com/domains</a></li>
                <li>Add and verify gigmate.us domain OR use Resend test domain</li>
              </ul>
            </li>
            <li>
              <strong>Deploy edge function:</strong>
              <ul className="ml-4 mt-1 list-disc">
                <li>Use Deployment Manager tab to deploy send-email function</li>
              </ul>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
