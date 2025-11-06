import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, X, Star } from 'lucide-react';

interface ImageUploadProps {
  entityType: 'venue' | 'musician' | 'event';
  entityId: string;
  onUploadComplete?: () => void;
}

interface ImageData {
  id: string;
  storage_path: string;
  file_name: string;
  is_primary: boolean;
  display_order: number;
}

export default function ImageUpload({ entityType, entityId, onUploadComplete }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadImages = async () => {
    try {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    loadImages();
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not an image file`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} is too large. Maximum size is 5MB`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${entityType}/${entityId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from('images')
          .insert({
            user_id: user.id,
            entity_type: entityType,
            entity_id: entityId,
            storage_path: fileName,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            is_primary: images.length === 0,
            display_order: images.length
          });

        if (dbError) throw dbError;
      }

      await loadImages();
      onUploadComplete?.();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const setPrimaryImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('images')
        .update({ is_primary: true })
        .eq('id', imageId);

      if (error) throw error;
      await loadImages();
    } catch (error) {
      console.error('Error setting primary image:', error);
    }
  };

  const deleteImage = async (imageId: string, storagePath: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('images')
        .remove([storagePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      await loadImages();
      onUploadComplete?.();
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error deleting image. Please try again.');
    }
  };

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage.from('images').getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading) {
    return <div className="text-center py-4">Loading images...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Images
        </label>
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-500" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 5MB)</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>
        {uploading && (
          <p className="text-sm text-blue-600 mt-2">Uploading images...</p>
        )}
      </div>

      {images.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={getImageUrl(image.storage_path)}
                  alt={image.file_name}
                  className="w-full h-32 object-cover rounded-lg"
                />
                {image.is_primary && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white p-1 rounded-full">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {!image.is_primary && (
                    <button
                      onClick={() => setPrimaryImage(image.id)}
                      className="bg-yellow-500 text-white p-2 rounded-full hover:bg-yellow-600"
                      title="Set as primary"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteImage(image.id, image.storage_path)}
                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    title="Delete image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
