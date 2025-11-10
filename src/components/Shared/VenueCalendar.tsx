import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, X, Lock, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CalendarAvailability {
  id: string;
  venue_id: string;
  date: string;
  status: 'available' | 'booked' | 'blocked' | 'tentative';
  booking_id: string | null;
  event_id: string | null;
  notes: string | null;
  event?: {
    title: string;
    musician?: {
      stage_name: string;
    };
  };
}

interface VenueCalendarProps {
  venueId: string;
  venueName: string;
  isOwner?: boolean;
  onDateSelect?: (date: string) => void;
}

export default function VenueCalendar({ venueId, venueName, isOwner = false, onDateSelect }: VenueCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<CalendarAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [modalStatus, setModalStatus] = useState<'available' | 'blocked'>('available');
  const [modalNotes, setModalNotes] = useState('');

  useEffect(() => {
    loadAvailability();
  }, [venueId, currentDate]);

  async function loadAvailability() {
    setLoading(true);

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from('venue_calendar_availability')
      .select(`
        *,
        event:events(
          title,
          musician:musicians(stage_name)
        )
      `)
      .eq('venue_id', venueId)
      .gte('date', startOfMonth.toISOString().split('T')[0])
      .lte('date', endOfMonth.toISOString().split('T')[0]);

    if (error) {
      console.error('Error loading availability:', error);
    } else {
      setAvailability(data || []);
    }

    setLoading(false);
  }

  async function updateDateAvailability(date: string, status: 'available' | 'blocked', notes: string) {
    const { error } = await supabase
      .from('venue_calendar_availability')
      .upsert({
        venue_id: venueId,
        date,
        status,
        notes: notes || null
      }, {
        onConflict: 'venue_id,date'
      });

    if (error) {
      alert('Failed to update availability: ' + error.message);
    } else {
      loadAvailability();
      setShowManageModal(false);
      setModalNotes('');
    }
  }

  function getDaysInMonth(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }

  function getDateStatus(day: number) {
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).toISOString().split('T')[0];

    return availability.find(a => a.date === dateStr);
  }

  function handleDateClick(day: number) {
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).toISOString().split('T')[0];

    setSelectedDate(dateStr);

    if (isOwner) {
      const existing = availability.find(a => a.date === dateStr);
      if (existing && existing.status === 'booked') {
        return;
      }
      setModalStatus(existing?.status === 'blocked' ? 'blocked' : 'available');
      setModalNotes(existing?.notes || '');
      setShowManageModal(true);
    } else if (onDateSelect) {
      onDateSelect(dateStr);
    }
  }

  function previousMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  }

  function getStatusStyles(status: string) {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'booked':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'blocked':
        return 'bg-gray-200 text-gray-700 border-gray-400';
      case 'tentative':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-white text-gray-700 border-gray-200';
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'available':
        return <Check className="w-3 h-3" />;
      case 'booked':
        return <X className="w-3 h-3" />;
      case 'blocked':
        return <Lock className="w-3 h-3" />;
      case 'tentative':
        return <Clock className="w-3 h-3" />;
      default:
        return null;
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const isCurrentMonth =
    today.getMonth() === currentDate.getMonth() &&
    today.getFullYear() === currentDate.getFullYear();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-blue-600" />
          {venueName} Calendar
        </h3>
        <div className="flex items-center gap-4">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-900 min-w-[150px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dateStatus = getDateStatus(day);
            const isPast = new Date(currentDate.getFullYear(), currentDate.getMonth(), day) < today;
            const isToday = isCurrentMonth && day === today.getDate();

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                disabled={isPast && !isOwner}
                className={`
                  aspect-square p-2 rounded-lg border-2 transition-all
                  ${dateStatus ? getStatusStyles(dateStatus.status) : 'bg-white border-gray-200 hover:border-blue-400'}
                  ${isToday ? 'ring-2 ring-blue-500' : ''}
                  ${isPast && !dateStatus ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
                  relative
                `}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span className={`text-lg font-semibold ${isToday ? 'text-blue-600' : ''}`}>
                    {day}
                  </span>
                  {dateStatus && (
                    <div className="mt-1 flex items-center gap-1">
                      {getStatusIcon(dateStatus.status)}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-300"></div>
          <span className="text-sm text-gray-700">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-300"></div>
          <span className="text-sm text-gray-700">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-200 border-2 border-gray-400"></div>
          <span className="text-sm text-gray-700">Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-300"></div>
          <span className="text-sm text-gray-700">Tentative</span>
        </div>
      </div>

      {showManageModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">
              Manage Date: {new Date(selectedDate).toLocaleDateString()}
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setModalStatus('available')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 font-semibold transition-colors ${
                      modalStatus === 'available'
                        ? 'bg-green-100 border-green-500 text-green-800'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    Available
                  </button>
                  <button
                    onClick={() => setModalStatus('blocked')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 font-semibold transition-colors ${
                      modalStatus === 'blocked'
                        ? 'bg-gray-200 border-gray-500 text-gray-800'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    Blocked
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any notes about this date..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => updateDateAvailability(selectedDate, modalStatus, modalNotes)}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowManageModal(false);
                    setModalNotes('');
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
