import { Music, MapPin, Calendar, Image, Video } from 'lucide-react';
import { useState } from 'react';
import ImageGallery from '../Shared/ImageGallery';
import VideoGallery from '../Shared/VideoGallery';

interface Musician {
  id: string;
  stage_name: string;
  bio: string;
  genres: string[];
  experience_years: number;
  city?: string;
  state?: string;
  zip_code?: string;
  county?: string;
  upcoming_events?: number;
}

interface MusicianCardProps {
  musician: Musician;
}

export default function MusicianCard({ musician }: MusicianCardProps) {
  const [showGallery, setShowGallery] = useState(false);
  const [showVideos, setShowVideos] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-xl font-bold text-gigmate-blue">{musician.stage_name}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowVideos(!showVideos)}
            className="text-gray-500 hover:text-red-600 transition-colors"
            title="View videos"
          >
            <Video className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowGallery(!showGallery)}
            className="text-gray-500 hover:text-gigmate-blue transition-colors"
            title="View images"
          >
            <Image className="h-5 w-5" />
          </button>
        </div>
      </div>

      {showVideos && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Videos</h4>
          <VideoGallery entityType="musician" entityId={musician.id} />
        </div>
      )}

      {showGallery && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Photos</h4>
          <ImageGallery entityType="musician" entityId={musician.id} />
        </div>
      )}

      <p className="text-gray-700 mb-4 line-clamp-2">{musician.bio}</p>

      {musician.genres && musician.genres.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {musician.genres.map((genre, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-gigmate-red text-white rounded-full text-sm font-medium"
            >
              {genre}
            </span>
          ))}
        </div>
      )}

      {(musician.city || musician.county) && (
        <div className="flex items-start space-x-2 text-sm text-gray-600 mb-3">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            {musician.city && <div>{musician.city}, {musician.state}</div>}
            {musician.county && <div className="text-xs text-gray-500">{musician.county} County</div>}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2 text-gray-600">
          <Music className="h-4 w-4" />
          <span>{musician.experience_years} years experience</span>
        </div>
        {musician.upcoming_events !== undefined && musician.upcoming_events > 0 && (
          <div className="flex items-center space-x-1 text-gigmate-blue font-semibold">
            <Calendar className="h-4 w-4" />
            <span>{musician.upcoming_events} upcoming {musician.upcoming_events === 1 ? 'show' : 'shows'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
