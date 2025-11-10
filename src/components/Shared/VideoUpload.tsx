import { useState, useRef } from 'react';
import { Upload, X, Video, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface VideoUploadProps {
  entityType: 'venue' | 'musician' | 'event' | 'product';
  entityId: string;
  onUploadComplete?: () => void;
  maxVideos?: number;
}

export default function VideoUpload({
  entityType,
  entityId,
  onUploadComplete,
  maxVideos = 5
}: VideoUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 500 * 1024 * 1024;
  const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setError('');
    setSuccess('');

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload MP4, WebM, MOV, or AVI files only');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Video must be smaller than 500MB');
      return;
    }

    const { data: existingVideos } = await supabase
      .from('videos')
      .select('id')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId);

    if (existingVideos && existingVideos.length >= maxVideos) {
      setError(`Maximum ${maxVideos} videos allowed`);
      return;
    }

    await uploadVideo(file);
  }

  async function uploadVideo(file: File) {
    setUploading(true);
    setProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setProgress(Math.round(percent));
          },
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';

      await new Promise<void>((resolve, reject) => {
        videoElement.onloadedmetadata = () => resolve();
        videoElement.onerror = () => reject(new Error('Failed to load video metadata'));
        videoElement.src = URL.createObjectURL(file);
      });

      const duration = Math.round(videoElement.duration);

      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: user!.id,
          entity_type: entityType,
          entity_id: entityId,
          storage_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          duration: duration,
          processing_status: 'ready',
        });

      if (dbError) throw dbError;

      setSuccess('Video uploaded successfully!');
      setProgress(0);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onUploadComplete) {
        onUploadComplete();
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-semibold text-gray-900 mb-1">Media Ownership Notice</p>
            <p>By uploading videos to GigMate, you transfer full ownership rights to GigMate. We can use your content for marketing, promotion, and any commercial purpose. This transfer is permanent and irrevocable.</p>
          </div>
        </div>

        <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-white">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            <div className="bg-orange-100 rounded-full p-4">
              <Video className="w-8 h-8 text-blue-600" />
            </div>

            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {uploading ? 'Uploading...' : 'Choose Video'}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                MP4, WebM, MOV, AVI up to 500MB
              </p>
            </div>
          </div>
        </div>

        {uploading && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <p className="text-sm">{success}</p>
          </div>
        )}
      </div>
    </div>
  );
}
