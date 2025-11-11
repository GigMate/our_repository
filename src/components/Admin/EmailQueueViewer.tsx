import { useState, useEffect } from 'react';
import { Mail, RefreshCw, CheckCircle, XCircle, Clock, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface QueuedEmail {
  id: string;
  recipient_email: string;
  template: string;
  status: string;
  attempts: number;
  error_message?: string;
  created_at: string;
  last_attempt_at?: string;
}

export function EmailQueueViewer() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<QueuedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>('all');

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  async function loadQueue() {
    let query = supabase
      .from('email_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    setEmails(data || []);
    setLoading(false);
  }

  async function processQueue() {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-email-queue');

      if (error) throw error;

      alert(`Processed ${data.processed} emails. Success: ${data.success}, Failed: ${data.failed}`);
      await loadQueue();
    } catch (err: any) {
      console.error('Process queue error:', err);
      alert('Failed to process queue: ' + err.message);
    } finally {
      setProcessing(false);
    }
  }

  async function sendTestEmail() {
    if (!user?.email) {
      alert('No user email found');
      return;
    }

    try {
      const { error } = await supabase.from('email_queue').insert({
        recipient_email: user.email,
        template: 'booking_request',
        data: {
          title: 'Test Event',
          venue_name: 'Test Venue',
          date: new Date().toISOString(),
          payment: 250,
          description: 'This is a test booking request email',
          link: 'https://gigmate.us',
        },
      });

      if (error) throw error;

      alert('Test email queued! Click "Process Queue" to send it.');
      await loadQueue();
    } catch (err: any) {
      console.error('Test email error:', err);
      alert('Failed to queue test email: ' + err.message);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading email queue...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="w-6 h-6 text-gigmate-blue" />
            Email Queue
          </h2>
          <div className="flex gap-2">
            <button
              onClick={sendTestEmail}
              className="flex items-center gap-2 px-4 py-2 bg-gray-8000 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Send className="w-4 h-4" />
              Send Test Email
            </button>
            <button
              onClick={processQueue}
              disabled={processing}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`} />
              Process Queue
            </button>
            <button
              onClick={loadQueue}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-gigmate-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({emails.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-gigmate-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('sent')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'sent'
                ? 'bg-gigmate-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sent
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'failed'
                ? 'bg-gigmate-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Failed
          </button>
        </div>

        {emails.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No emails in queue</p>
          </div>
        ) : (
          <div className="space-y-3">
            {emails.map((email) => (
              <div
                key={email.id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {email.status === 'sent' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {email.status === 'pending' && (
                        <Clock className="w-5 h-5 text-rose-500" />
                      )}
                      {email.status === 'failed' && (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="font-medium text-gray-900">
                        {email.template.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      To: {email.recipient_email}
                    </p>
                    <p className="text-xs text-gray-500">
                      Created: {new Date(email.created_at).toLocaleString()}
                    </p>
                    {email.last_attempt_at && (
                      <p className="text-xs text-gray-500">
                        Last attempt: {new Date(email.last_attempt_at).toLocaleString()}
                      </p>
                    )}
                    {email.error_message && (
                      <p className="text-xs text-red-600 mt-2">
                        Error: {email.error_message}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        email.status === 'sent'
                          ? 'bg-green-100 text-green-800'
                          : email.status === 'pending'
                          ? 'bg-rose-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {email.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Attempts: {email.attempts}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-800 border border-cyan-400 rounded-lg p-6">
        <h3 className="font-bold text-white mb-2">About Email Queue</h3>
        <ul className="text-sm text-gray-100 space-y-1">
          <li>• Emails are automatically queued when events occur (bookings, purchases, etc.)</li>
          <li>• The queue processor can be run manually or scheduled via cron job</li>
          <li>• Failed emails will be retried up to 3 times</li>
          <li>• Set up a cron job to run process-email-queue every 5 minutes for production</li>
        </ul>
      </div>
    </div>
  );
}

export default EmailQueueViewer;
