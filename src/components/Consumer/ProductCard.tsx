import { ShoppingCart, MapPin, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  video_url?: string;
  address: string;
  city: string;
  state: string;
  distance_miles: number;
  stock_quantity: number;
}

interface ProductCardProps {
  product: Product;
  onPurchase: (product: Product) => void;
}

export function ProductCard({ product, onPurchase }: ProductCardProps) {
  const hasMedia = product.image_url || product.video_url;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {hasMedia && (
        <div className="relative h-64 overflow-hidden bg-gray-100">
          {product.video_url ? (
            <video
              src={product.video_url}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              controls
              playsInline
            />
          ) : product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : null}

          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-800 shadow-lg">
            ${product.price.toFixed(2)}
          </div>

          <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
            {product.category}
          </div>
        </div>
      )}

      <div className="p-5">
        {!hasMedia && (
          <div className="flex items-center justify-between mb-3">
            <span className="bg-gray-700 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
              {product.category}
            </span>
            <span className="text-2xl font-bold text-gray-800">
              ${product.price.toFixed(2)}
            </span>
          </div>
        )}

        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {product.description}
          </p>
        )}

        <div className="flex items-start gap-2 text-sm text-gray-500 mb-4">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
          <div className="flex-1">
            <p className="line-clamp-1">{product.address}</p>
            <p>{product.city}, {product.state}</p>
            <p className="font-medium text-blue-600 mt-1">
              {product.distance_miles.toFixed(1)} miles away
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Package className="w-4 h-4 text-gray-400" />
            <span>{product.stock_quantity} available</span>
          </div>

          <button
            onClick={() => onPurchase(product)}
            disabled={product.stock_quantity === 0}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm
              transition-all duration-200 shadow-sm hover:shadow-md
              ${product.stock_quantity > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <ShoppingCart className="w-4 h-4" />
            {product.stock_quantity > 0 ? 'Buy Now' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}
