import { useState, useEffect } from 'react';
import { FileText, Download, Clock, CheckCircle, AlertCircle, DollarSign, Calendar, MessageSquare, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Booking {
  id: string;
  venue_id: string;
  musician_id: string;
  event_id: string | null;
  agreed_rate: number;
  gigmate_fee: number;
  total_amount: number;
  status: string;
  venue_confirmed: boolean;
  musician_confirmed: boolean;
  escrow_released_at: string | null;
  created_at: string;
  updated_at: string;
  venue?: {
    venue_name: string;
  };
  musician?: {
    stage_name: string;
  };
  event?: {
    title: string;
    event_date: string;
  };
}

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  status: string;
  created_at: string;
  stripe_payment_intent_id: string | null;
}

interface BookingStatusDashboardProps {
  userType: 'musician' | 'venue';
}

export default function BookingStatusDashboard({ userType }: BookingStatusDashboardProps) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  async function loadBookings() {
    setLoading(true);

    const query = supabase
      .from('bookings')
      .select(`
        *,
        venue:venues(venue_name),
        musician:musicians(stage_name),
        event:events(title, event_date)
      `)
      .order('created_at', { ascending: false });

    if (userType === 'venue') {
      query.eq('venue_id', user!.id);
    } else {
      query.eq('musician_id', user!.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading bookings:', error);
    } else {
      setBookings(data || []);
    }

    setLoading(false);
  }

  async function loadTransactions(bookingId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading transactions:', error);
    } else {
      setTransactions(data || []);
    }
  }

  function getStatusBadge(status: string) {
    const configs = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      accepted: { label: 'Accepted', color: 'bg-blue-100 text-blue-800', icon: Clock },
      escrowed: { label: 'In Escrow', color: 'bg-purple-100 text-purple-800', icon: DollarSign },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      disputed: { label: 'Disputed', color: 'bg-red-100 text-red-800', icon: AlertCircle },
      cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    };

    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  }

  async function generateReceipt(booking: Booking) {
    const receiptData = {
      booking_id: booking.id,
      venue: booking.venue?.venue_name || 'Unknown',
      musician: booking.musician?.stage_name || 'Unknown',
      event: booking.event?.title || 'Booking Agreement',
      agreed_rate: booking.agreed_rate,
      gigmate_fee: booking.gigmate_fee,
      total_amount: booking.total_amount,
      status: booking.status,
      created_at: new Date(booking.created_at).toLocaleDateString(),
      escrow_released: booking.escrow_released_at ? new Date(booking.escrow_released_at).toLocaleDateString() : 'Pending'
    };

    const blob = new Blob([JSON.stringify(receiptData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${booking.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleViewDetails(booking: Booking) {
    setSelectedBooking(booking);
    loadTransactions(booking.id);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{bookings.length} Total Bookings</span>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
          <p className="text-gray-600">
            {userType === 'venue'
              ? 'Start by creating a booking with a musician'
              : 'Bookings from venues will appear here'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {booking.event?.title || 'Booking Agreement'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {userType === 'venue'
                      ? `with ${booking.musician?.stage_name || 'Unknown Musician'}`
                      : `at ${booking.venue?.venue_name || 'Unknown Venue'}`
                    }
                  </p>
                  {booking.event?.event_date && (
                    <p className="text-sm text-gray-500 mt-1">
                      Event Date: {new Date(booking.event.event_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {getStatusBadge(booking.status)}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Agreed Rate</p>
                  <p className="text-lg font-bold text-gray-900">${booking.agreed_rate.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">GigMate Fee</p>
                  <p className="text-lg font-bold text-gray-900">${booking.gigmate_fee.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                  <p className="text-lg font-bold text-blue-600">${booking.total_amount.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4 text-sm">
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                  booking.venue_confirmed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {booking.venue_confirmed ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  Venue {booking.venue_confirmed ? 'Confirmed' : 'Pending'}
                </div>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                  booking.musician_confirmed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {booking.musician_confirmed ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  Musician {booking.musician_confirmed ? 'Confirmed' : 'Pending'}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleViewDetails(booking)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  View Details
                </button>
                {(booking.status === 'completed' || booking.status === 'escrowed') && (
                  <button
                    onClick={() => generateReceipt(booking)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Receipt
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Booking Details</h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Booking Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Booking ID</p>
                    <p className="font-mono text-gray-900">{selectedBooking.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="text-gray-900">{new Date(selectedBooking.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                  </div>
                  <div>
                    <p className="text-gray-500">Escrow Release</p>
                    <p className="text-gray-900">
                      {selectedBooking.escrow_released_at
                        ? new Date(selectedBooking.escrow_released_at).toLocaleString()
                        : 'Pending'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {transactions.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Payment History</h4>
                  <div className="space-y-2">
                    {transactions.map((txn) => (
                      <div key={txn.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{txn.transaction_type}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(txn.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">${txn.amount.toFixed(2)}</p>
                          <p className={`text-xs ${
                            txn.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {txn.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
