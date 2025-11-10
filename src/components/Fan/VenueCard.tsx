import { MapPin, Users, Music, Image } from 'lucide-react';
import { useState } from 'react';
import ImageGallery from '../Shared/ImageGallery';

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
}

interface VenueCardProps {
  venue: Venue;
  onClick?: () => void;
}

export default function VenueCard({ venue, onClick }: VenueCardProps) {
  const [showGallery, setShowGallery] = useState(false);

  return (
    <div
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-xl font-bold text-gigmate-blue">{venue.venue_name}</h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowGallery(!showGallery);
          }}
          className="text-gray-500 hover:text-gigmate-blue transition-colors"
          title="View images"
        >
          <Image className="h-5 w-5" />
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-3">{venue.venue_type}</p>

      {showGallery && (
        <div className="mb-4">
          <ImageGallery entityType="venue" entityId={venue.id} />
        </div>
      )}

      <p className="text-gray-700 mb-4 line-clamp-2">{venue.description}</p>

      <div className="flex items-start space-x-2 text-sm text-gray-600 mb-3">
        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div>
          <div>{venue.city}, {venue.state} {venue.zip_code}</div>
          {venue.county && <div className="text-xs text-gray-500">{venue.county} County</div>}
        </div>
      </div>

      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
        <Users className="h-4 w-4" />
        <span>Capacity: {venue.capacity}</span>
      </div>

      {venue.preferred_genres && venue.preferred_genres.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            <Music className="h-4 w-4" />
            <span className="font-medium">Preferred Genres:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {venue.preferred_genres.slice(0, 3).map((genre, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gigmate-red text-white rounded-full text-xs font-medium"
              >
                {genre}
              </span>
            ))}
            {venue.preferred_genres.length > 3 && (
              <span className="px-2 py-1 text-gray-500 text-xs">
                +{venue.preferred_genres.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {venue.amenities && venue.amenities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {venue.amenities.slice(0, 3).map((amenity, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-800 text-white rounded-full text-xs"
            >
              {amenity}
            </span>
          ))}
          {venue.amenities.length > 3 && (
            <span className="px-2 py-1 text-gray-500 text-xs">
              +{venue.amenities.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
