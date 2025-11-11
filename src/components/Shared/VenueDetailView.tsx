import { useState, useEffect } from 'react';
import { MapPin, Users, Music, Star, ArrowLeft, Calendar, Mail, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ImageGallery from './ImageGallery';
import RatingDisplay from './RatingDisplay';
import VenueCalendar from './VenueCalendar';

interface Venue {
  id: string;
  venue_name: string;
  description: string;
  city: string;
  state: string;
  zip_code: string;
  county: string;
  capacity: number;
  venue_type: string;
  amenities: string[];
  preferred_genres?: string[];
  contact_email?: string;
  contact_phone?: string;
}

interface VenueDetailViewProps {
  venueId: string;
  onBack: () => void;
}

export default function VenueDetailView({ venueId, onBack }: VenueDetailViewProps) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVenue();
  }, [venueId]);

  async function loadVenue() {
    setLoading(true);
    const { data } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .maybeSingle();

    if (data) {
      setVenue(data);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-gray-600">Loading venue details...</div>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gigmate-blue hover:text-gigmate-blue-dark mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="text-center py-12">
          <p className="text-gray-600">Venue not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gigmate-blue hover:text-gigmate-blue-dark mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Venues
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gigmate-blue mb-2">{venue.venue_name}</h1>
            <p className="text-lg text-gray-600">{venue.venue_type}</p>
          </div>

          <div className="mb-6">
            <ImageGallery entityType="venue" entityId={venue.id} />
          </div>

          <div className="mb-6">
            <RatingDisplay entityType="venue" entityId={venue.id} />
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Location</h2>
              <div className="flex items-start gap-2 text-gray-700">
                <MapPin className="h-5 w-5 text-gigmate-red mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">{venue.city}, {venue.state} {venue.zip_code}</div>
                  {venue.county && <div className="text-sm text-gray-500">{venue.county} County</div>}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Capacity</h2>
              <div className="flex items-center gap-2 text-gray-700">
                <Users className="h-5 w-5 text-gigmate-blue" />
                <span className="font-medium">{venue.capacity} guests</span>
              </div>
            </div>
          </div>

          {venue.contact_email && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="h-5 w-5 text-gigmate-blue" />
                  <a href={`mailto:${venue.contact_email}`} className="hover:text-gigmate-blue">
                    {venue.contact_email}
                  </a>
                </div>
                {venue.contact_phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-5 w-5 text-gigmate-blue" />
                    <a href={`tel:${venue.contact_phone}`} className="hover:text-gigmate-blue">
                      {venue.contact_phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
            <p className="text-gray-700 leading-relaxed">{venue.description}</p>
          </div>

          {venue.preferred_genres && venue.preferred_genres.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Music className="h-5 w-5" />
                Preferred Genres
              </h2>
              <div className="flex flex-wrap gap-2">
                {venue.preferred_genres.map((genre, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gigmate-red text-white rounded-full font-medium"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {venue.amenities && venue.amenities.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {venue.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <VenueCalendar
          venueId={venue.id}
          venueName={venue.venue_name}
          isOwner={false}
        />
      </div>
    </div>
  );
}
