import { useState, useEffect } from 'react';
import { Play, Trash2, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Video {
  id: string;
  storage_path: string;
  file_name: string;
  duration: number;
  is_featured: boolean;
  created_at: string;
  user_id: string;
}

interface VideoGalleryProps {
  entityType: 'venue' | 'musician' | 'event' | 'product';
  entityId: string;
  editable?: boolean;
}

export default function VideoGallery({
  entityType,
  entityId,
  editable = false
}: VideoGalleryProps) {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    loadVideos();
  }, [entityType, entityId]);

  async function loadVideos() {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('processing_status', 'ready')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading videos:', error);
    } else {
      setVideos(data || []);
    }
    setLoading(false);
  }

  async function deleteVideo(videoId: string, storagePath: string) {
    if (!confirm('Delete this video? This cannot be undone.')) return;

    const { error: storageError } = await supabase.storage
      .from('videos')
      .remove([storagePath]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      return;
    }

    const { error: dbError } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId);

    if (dbError) {
      console.error('Error deleting from database:', dbError);
      return;
    }

    setVideos(videos.filter(v => v.id !== videoId));
    if (selectedVideo?.id === videoId) {
      setSelectedVideo(null);
    }
  }

  async function toggleFeatured(videoId: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('videos')
      .update({ is_featured: !currentStatus })
      .eq('id', videoId);

    if (error) {
      console.error('Error updating featured status:', error);
      return;
    }

    loadVideos();
  }

  function getVideoUrl(storagePath: string): string {
    const { data } = supabase.storage.from('videos').getPublicUrl(storagePath);
    return data.publicUrl;
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading videos...</div>;
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No videos uploaded yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300"
            >
              <span className="text-2xl">×</span>
            </button>
            <video
              src={getVideoUrl(selectedVideo.storage_path)}
              controls
              autoPlay
              className="w-full rounded-lg"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <div
            key={video.id}
            className="relative group bg-gray-900 rounded-lg overflow-hidden aspect-video cursor-pointer"
            onClick={() => setSelectedVideo(video)}
          >
            <video
              src={getVideoUrl(video.storage_path)}
              className="w-full h-full object-cover"
              preload="metadata"
            />

            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center group-hover:bg-opacity-60 transition-all">
              <div className="bg-white rounded-full p-4 group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
              <p className="text-white text-sm font-medium truncate">{video.file_name}</p>
              <p className="text-gray-300 text-xs">{formatDuration(video.duration)}</p>
            </div>

            {video.is_featured && (
              <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <Star className="w-3 h-3" />
                Featured
              </div>
            )}

            {editable && user?.id === video.user_id && (
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFeatured(video.id, video.is_featured);
                  }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full"
                  title="Toggle Featured"
                >
                  <Star className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteVideo(video.id, video.storage_path);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"
                  title="Delete Video"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
