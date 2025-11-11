import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Scan, Search, Users, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface TicketVerification {
  valid: boolean;
  status: string;
  message: string;
  allow_entry: boolean;
  fan_name?: string;
  fan_email?: string;
  quantity?: number;
  purchased_at?: string;
  event_title?: string;
  check_in_time?: string;
  times_scanned?: number;
}

interface Event {
  id: string;
  title: string;
  event_date: string;
  total_tickets: number;
  tickets_sold: number;
}

export function TicketScanner() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [scanMode, setScanMode] = useState<'qr' | 'manual'>('qr');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<TicketVerification | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkInStats, setCheckInStats] = useState({ total: 0, checked_in: 0 });
  const [recentCheckIns, setRecentCheckIns] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadVenueEvents();
    }
  }, [user]);

  useEffect(() => {
    if (selectedEvent) {
      loadCheckInStats();
      loadRecentCheckIns();
    }
  }, [selectedEvent]);

  async function loadVenueEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('venue_id', user!.id)
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true });

    if (!error && data) {
      setEvents(data);
      if (data.length > 0) {
        setSelectedEvent(data[0].id);
      }
    }
  }

  async function loadCheckInStats() {
    const { data, error } = await supabase
      .from('ticket_purchases')
      .select('status, quantity')
      .eq('event_id', selectedEvent);

    if (!error && data) {
      const total = data.reduce((sum, t) => sum + t.quantity, 0);
      const checked_in = data
        .filter(t => t.status === 'used')
        .reduce((sum, t) => sum + t.quantity, 0);

      setCheckInStats({ total, checked_in });
    }
  }

  async function loadRecentCheckIns() {
    const { data, error } = await supabase
      .from('ticket_check_ins')
      .select(`
        *,
        ticket_purchases!inner(
          fan_id,
          quantity
        ),
        profiles!ticket_check_ins_checked_in_by_fkey(
          full_name,
          email
        )
      `)
      .eq('event_id', selectedEvent)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setRecentCheckIns(data);
    }
  }

  async function verifyTicket() {
    if (!verificationCode.trim() || !selectedEvent) {
      return;
    }

    setLoading(true);
    setVerificationResult(null);

    try {
      const { data, error } = await supabase.rpc('verify_ticket', {
        p_verification_code: verificationCode.trim().toUpperCase(),
        p_event_id: selectedEvent,
        p_venue_id: user!.id
      });

      if (error) throw error;

      setVerificationResult(data);

      if (data.valid && data.allow_entry) {
        setTimeout(() => {
          checkInTicket();
        }, 1000);
      }
    } catch (error) {
      console.error('Error verifying ticket:', error);
      setVerificationResult({
        valid: false,
        status: 'error',
        message: 'Error verifying ticket. Please try again.',
        allow_entry: false
      });
    } finally {
      setLoading(false);
    }
  }

  async function checkInTicket() {
    if (!verificationCode.trim() || !selectedEvent) return;

    try {
      const { data, error } = await supabase.rpc('check_in_ticket', {
        p_verification_code: verificationCode.trim().toUpperCase(),
        p_event_id: selectedEvent,
        p_venue_id: user!.id,
        p_checked_in_by: user!.id,
        p_scan_method: scanMode === 'qr' ? 'qr_scan' : 'manual_entry'
      });

      if (error) throw error;

      if (data.success) {
        loadCheckInStats();
        loadRecentCheckIns();

        setTimeout(() => {
          setVerificationCode('');
          setVerificationResult(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error checking in ticket:', error);
    }
  }

  function handleScan(code: string) {
    setVerificationCode(code);
    verifyTicket();
  }

  function getResultColor(result: TicketVerification) {
    if (result.allow_entry) return 'bg-green-50 border-green-500';
    if (result.status === 'already_used') return 'bg-yellow-50 border-yellow-500';
    return 'bg-red-50 border-red-500';
  }

  function getResultIcon(result: TicketVerification) {
    if (result.allow_entry) return <CheckCircle className="w-16 h-16 text-green-500" />;
    if (result.status === 'already_used') return <AlertTriangle className="w-16 h-16 text-yellow-500" />;
    return <XCircle className="w-16 h-16 text-red-500" />;
  }

  const selectedEventData = events.find(e => e.id === selectedEvent);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ticket Scanner</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Event
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an event...</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.title} - {new Date(event.event_date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && selectedEventData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600">Event Date</p>
                    <p className="text-xl font-bold text-blue-900">
                      {new Date(selectedEventData.event_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-green-600">Tickets Sold</p>
                    <p className="text-xl font-bold text-green-900">
                      {selectedEventData.tickets_sold} / {selectedEventData.total_tickets}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-purple-600">Checked In</p>
                    <p className="text-xl font-bold text-purple-900">
                      {checkInStats.checked_in} / {checkInStats.total}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedEvent && (
        <>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setScanMode('qr')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                  scanMode === 'qr'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Scan className="w-5 h-5 inline mr-2" />
                QR Code Scan
              </button>
              <button
                onClick={() => setScanMode('manual')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                  scanMode === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Search className="w-5 h-5 inline mr-2" />
                Manual Entry
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {scanMode === 'qr' ? 'Scan QR Code' : 'Enter Verification Code'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && verifyTicket()}
                    placeholder="GM-XXXXXXXX-XXXXXXXX-XXXXXXXX"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-lg font-mono focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={verifyTicket}
                    disabled={loading || !verificationCode.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Scan the QR code on the ticket or manually enter the verification code
                </p>
              </div>

              {verificationResult && (
                <div className={`p-6 rounded-lg border-4 ${getResultColor(verificationResult)} animate-pulse-once`}>
                  <div className="flex flex-col items-center text-center space-y-4">
                    {getResultIcon(verificationResult)}

                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {verificationResult.status.toUpperCase().replace('_', ' ')}
                      </h3>
                      <p className="text-lg text-gray-700">
                        {verificationResult.message}
                      </p>
                    </div>

                    {verificationResult.allow_entry && (
                      <div className="w-full bg-white rounded-lg p-4 space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-left">
                          <div>
                            <p className="text-sm text-gray-600">Guest Name</p>
                            <p className="font-bold text-gray-900">{verificationResult.fan_name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Quantity</p>
                            <p className="font-bold text-gray-900">{verificationResult.quantity} ticket(s)</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Purchased</p>
                            <p className="font-bold text-gray-900">
                              {verificationResult.purchased_at &&
                                new Date(verificationResult.purchased_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-bold text-gray-900 text-sm">{verificationResult.fan_email}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!verificationResult.allow_entry && verificationResult.check_in_time && (
                      <div className="w-full bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600">Already scanned at:</p>
                        <p className="font-bold text-gray-900">
                          {new Date(verificationResult.check_in_time).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          Total scans: {verificationResult.times_scanned}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Check-Ins</h3>

            {recentCheckIns.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No check-ins yet</p>
            ) : (
              <div className="space-y-2">
                {recentCheckIns.map((checkIn) => (
                  <div
                    key={checkIn.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          Guest checked in
                        </p>
                        <p className="text-sm text-gray-600">
                          {checkIn.ticket_purchases?.quantity || 1} ticket(s) • {checkIn.scan_method || 'qr_scan'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {new Date(checkIn.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse-once {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .animate-pulse-once {
          animation: pulse-once 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
