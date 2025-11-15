import { Home, ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  onGoHome: () => void;
}

export default function NotFoundPage({ onGoHome }: NotFoundPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-blue-600 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
          <p className="text-lg text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onGoHome}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            Go to Homepage
          </button>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        <div className="mt-12 p-6 bg-white rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Looking for something?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Musicians</h4>
              <p className="text-sm text-gray-600">Find gigs, manage bookings, and connect with venues</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Venues</h4>
              <p className="text-sm text-gray-600">Book artists, manage events, and sell tickets</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Fans</h4>
              <p className="text-sm text-gray-600">Discover shows, buy tickets, and support local music</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Investors</h4>
              <p className="text-sm text-gray-600">Learn about investment opportunities</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
