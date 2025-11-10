import { Calendar, MapPin, Music, Ticket, Clock } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  doors_open: string;
  show_starts: string;
  ticket_price: number;
  total_tickets: number;
  tickets_sold: number;
  venue_name?: string;
  musician_name?: string;
  venue_city?: string;
  venue_state?: string;
}

interface EventCardProps {
  event: Event;
  onBuyTickets?: (eventId: string) => void;
}

export default function EventCard({ event, onBuyTickets }: EventCardProps) {
  const ticketsRemaining = event.total_tickets - event.tickets_sold;
  const isSoldOut = ticketsRemaining <= 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gigmate-blue mb-1">{event.title}</h3>
          {event.musician_name && (
            <div className="flex items-center text-gray-600 text-sm mb-2">
              <Music className="h-4 w-4 mr-1" />
              <span>{event.musician_name}</span>
            </div>
          )}
        </div>
        {isSoldOut ? (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
            SOLD OUT
          </span>
        ) : ticketsRemaining < 20 ? (
          <span className="px-3 py-1 bg-gray-700 text-orange-700 rounded-full text-sm font-semibold">
            {ticketsRemaining} LEFT
          </span>
        ) : null}
      </div>

      {event.description && (
        <p className="text-gray-700 text-sm mb-4 line-clamp-2">{event.description}</p>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{new Date(event.event_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
        </div>

        {(event.doors_open || event.show_starts) && (
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>
              {event.doors_open && `Doors: ${event.doors_open}`}
              {event.doors_open && event.show_starts && ' | '}
              {event.show_starts && `Show: ${event.show_starts}`}
            </span>
          </div>
        )}

        {event.venue_name && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>
              {event.venue_name}
              {event.venue_city && ` - ${event.venue_city}, ${event.venue_state}`}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <Ticket className="h-5 w-5 text-gigmate-red" />
          <span className="text-2xl font-bold text-gray-900">
            ${event.ticket_price.toFixed(2)}
          </span>
        </div>

        {onBuyTickets && (
          <button
            onClick={() => onBuyTickets(event.id)}
            disabled={isSoldOut}
            className={`px-6 py-2 rounded-md font-semibold transition-colors ${
              isSoldOut
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gigmate-red text-white hover:bg-gigmate-red-dark'
            }`}
          >
            {isSoldOut ? 'Sold Out' : 'Buy Tickets'}
          </button>
        )}
      </div>
    </div>
  );
}
