import { useState, useEffect } from 'react';
import { Ticket, QrCode, Download, Share2, MapPin, Calendar, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface TicketData {
  ticket_id: string;
  verification_code: string;
  qr_code: string;
  status: string;
  quantity: number;
  total_amount: number;
  purchased_at: string;
  event_title: string;
  event_description: string;
  event_date: string;
  doors_open: string;
  show_starts: string;
  venue_name: string;
  venue_address: string;
  venue_city: string;
  venue_state: string;
  musician_name: string;
  musician_genre: string;
  check_in_time: string | null;
  is_used: boolean;
}

export function MyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);

  useEffect(() => {
    if (user) {
      loadTickets();
    }
  }, [user]);

  async function loadTickets() {
    setLoading(true);

    const { data, error } = await supabase
      .from('fan_ticket_view')
      .select('*')
      .order('event_date', { ascending: true });

    if (!error && data) {
      setTickets(data);
    }

    setLoading(false);
  }

  function generateQRCodeDataURL(code: string): string {
    const canvas = document.createElement('canvas');
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';

    const lines = code.match(/.{1,12}/g) || [];
    lines.forEach((line, i) => {
      ctx.fillText(line, size / 2, 200 + i * 30);
    });

    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('SCAN AT VENUE', size / 2, 350);
    ctx.fillText('GigMate', size / 2, 370);

    return canvas.toDataURL();
  }

  function downloadTicket(ticket: TicketData) {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 800, 1000);

    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EVENT TICKET', 400, 60);

    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(ticket.event_title, 400, 120);

    ctx.font = '24px sans-serif';
    ctx.fillText(ticket.musician_name, 400, 160);

    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#6B7280';
    ctx.fillText(new Date(ticket.event_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }), 400, 200);

    ctx.fillText(`Doors: ${ticket.doors_open} | Show: ${ticket.show_starts}`, 400, 230);

    ctx.fillText(`${ticket.venue_name}`, 400, 270);
    ctx.fillText(`${ticket.venue_address}`, 400, 300);
    ctx.fillText(`${ticket.venue_city}, ${ticket.venue_state}`, 400, 330);

    const qrImage = new Image();
    qrImage.src = generateQRCodeDataURL(ticket.qr_code);
    qrImage.onload = () => {
      ctx.drawImage(qrImage, 200, 370, 400, 400);

      ctx.fillStyle = '#1F2937';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      const codeLines = ticket.verification_code.match(/.{1,20}/g) || [];
      codeLines.forEach((line, i) => {
        ctx.fillText(line, 400, 820 + i * 25);
      });

      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#6B7280';
      ctx.fillText(`Quantity: ${ticket.quantity} ticket(s)`, 400, 890);
      ctx.fillText(`Order #: ${ticket.ticket_id.substring(0, 8)}`, 400, 915);
      ctx.fillText('Powered by GigMate', 400, 960);

      const link = document.createElement('a');
      link.download = `gigmate-ticket-${ticket.event_title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
  }

  async function shareTicket(ticket: TicketData) {
    const text = `🎵 ${ticket.event_title}\n🎤 ${ticket.musician_name}\n📅 ${new Date(ticket.event_date).toLocaleDateString()}\n📍 ${ticket.venue_name}\n\nGet your tickets on GigMate!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: ticket.event_title,
          text: text,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Event details copied to clipboard!');
    }
  }

  const upcomingTickets = tickets.filter(t =>
    new Date(t.event_date) >= new Date() && t.status !== 'refunded'
  );
  const pastTickets = tickets.filter(t =>
    new Date(t.event_date) < new Date() || t.status === 'refunded'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {upcomingTickets.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingTickets.map(ticket => (
              <div
                key={ticket.ticket_id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                  <h3 className="text-xl font-bold mb-1">{ticket.event_title}</h3>
                  <p className="text-sm opacity-90">{ticket.musician_name}</p>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-2 text-gray-700">
                    <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">
                        {new Date(ticket.event_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        Doors: {ticket.doors_open} • Show: {ticket.show_starts}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-gray-700">
                    <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{ticket.venue_name}</p>
                      <p className="text-sm text-gray-600">
                        {ticket.venue_city}, {ticket.venue_state}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Ticket className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {ticket.quantity} ticket{ticket.quantity > 1 ? 's' : ''}
                    </span>
                    {ticket.is_used && (
                      <div className="ml-auto flex items-center gap-1 text-green-600 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Checked In
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTicket(ticket);
                    }}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <QrCode className="w-4 h-4 inline mr-2" />
                    View QR Code
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pastTickets.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Past Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastTickets.map(ticket => (
              <div
                key={ticket.ticket_id}
                className="bg-white rounded-lg shadow-md overflow-hidden opacity-60"
              >
                <div className="bg-gray-600 p-4 text-white">
                  <h3 className="text-xl font-bold mb-1">{ticket.event_title}</h3>
                  <p className="text-sm opacity-90">{ticket.musician_name}</p>
                </div>

                <div className="p-4 space-y-2">
                  <p className="text-sm text-gray-600">
                    {new Date(ticket.event_date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">{ticket.venue_name}</p>
                  {ticket.status === 'refunded' && (
                    <p className="text-sm font-medium text-red-600">Refunded</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tickets.length === 0 && (
        <div className="text-center py-12">
          <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Tickets Yet</h3>
          <p className="text-gray-600 mb-6">
            Start exploring events and get your tickets!
          </p>
        </div>
      )}

      {selectedTicket && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">{selectedTicket.event_title}</h2>
              <p className="opacity-90">{selectedTicket.musician_name}</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-white border-4 border-gray-200 rounded-lg p-4">
                <img
                  src={generateQRCodeDataURL(selectedTicket.qr_code)}
                  alt="QR Code"
                  className="w-full"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-center font-mono text-sm font-bold break-all">
                  {selectedTicket.verification_code}
                </p>
                <p className="text-center text-xs text-gray-600">
                  Show this QR code at the venue entrance
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-900">
                      {new Date(selectedTicket.event_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      Doors: {selectedTicket.doors_open} • Show: {selectedTicket.show_starts}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-900">{selectedTicket.venue_name}</p>
                    <p className="text-sm text-gray-600">{selectedTicket.venue_address}</p>
                    <p className="text-sm text-gray-600">
                      {selectedTicket.venue_city}, {selectedTicket.venue_state}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Ticket className="w-5 h-5 text-blue-600" />
                  <p className="font-bold text-gray-900">
                    {selectedTicket.quantity} ticket{selectedTicket.quantity > 1 ? 's' : ''}
                  </p>
                </div>

                {selectedTicket.is_used && selectedTicket.check_in_time && (
                  <div className="flex items-center gap-3 bg-green-50 p-3 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-bold text-green-900">Checked In</p>
                      <p className="text-sm text-green-700">
                        {new Date(selectedTicket.check_in_time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => downloadTicket(selectedTicket)}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Download
                </button>
                <button
                  onClick={() => shareTicket(selectedTicket)}
                  className="flex-1 py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  <Share2 className="w-4 h-4 inline mr-2" />
                  Share
                </button>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
