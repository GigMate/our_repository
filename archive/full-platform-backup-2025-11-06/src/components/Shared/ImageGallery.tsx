import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImageGalleryProps {
  entityType: 'venue' | 'musician' | 'event';
  entityId: string;
  showUpload?: boolean;
}

interface ImageData {
  id: string;
  storage_path: string;
  file_name: string;
  is_primary: boolean;
}

export default function ImageGallery({ entityType, entityId }: ImageGalleryProps) {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  useEffect(() => {
    loadImages();
  }, [entityType, entityId]);

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

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage.from('images').getPublicUrl(path);
    return data.publicUrl;
  };

  const nextImage = () => {
    if (selectedImage !== null && selectedImage < images.length - 1) {
      setSelectedImage(selectedImage + 1);
    }
  };

  const prevImage = () => {
    if (selectedImage !== null && selectedImage > 0) {
      setSelectedImage(selectedImage - 1);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading images...</div>;
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No images available yet
      </div>
    );
  }

  const primaryImage = images.find(img => img.is_primary) || images[0];

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer" onClick={() => setSelectedImage(0)}>
        <img
          src={getImageUrl(primaryImage.storage_path)}
          alt={primaryImage.file_name}
          className="w-full h-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.slice(0, 4).map((image, index) => (
            <div
              key={image.id}
              className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-75 transition-opacity"
              onClick={() => setSelectedImage(index)}
            >
              <img
                src={getImageUrl(image.storage_path)}
                alt={image.file_name}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {selectedImage !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X className="w-8 h-8" />
          </button>

          {selectedImage > 0 && (
            <button
              onClick={prevImage}
              className="absolute left-4 text-white hover:text-gray-300"
            >
              <ChevronLeft className="w-12 h-12" />
            </button>
          )}

          <img
            src={getImageUrl(images[selectedImage].storage_path)}
            alt={images[selectedImage].file_name}
            className="max-w-full max-h-full object-contain"
          />

          {selectedImage < images.length - 1 && (
            <button
              onClick={nextImage}
              className="absolute right-4 text-white hover:text-gray-300"
            >
              <ChevronRight className="w-12 h-12" />
            </button>
          )}

          <div className="absolute bottom-4 text-white text-sm">
            {selectedImage + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
