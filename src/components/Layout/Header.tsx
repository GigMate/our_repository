import { useAuth } from '../../contexts/AuthContext';
import { Database, FileDown } from 'lucide-react';

interface HeaderProps {
  onLogoClick: () => void;
}

export default function Header({ onLogoClick }: HeaderProps) {
  const { profile, signOut } = useAuth();

  return (
    <header className="bg-gigmate-blue border-b border-gigmate-blue-light shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <button
            onClick={onLogoClick}
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img
              src="/GigMate Pick 2.png"
              alt="GigMate Logo"
              className="h-16 w-16"
            />
            <span className="ml-3 text-3xl font-bold text-white">GigMate</span>
          </button>

          <div className="flex items-center space-x-4">
            <a
              href="/admin/seed"
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium text-sm"
            >
              <Database className="h-4 w-4" />
              <span>Seed Data</span>
            </a>
            {profile && (
              <>
                <a
                  href="/download"
                  className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium text-sm"
                >
                  <FileDown className="h-4 w-4" />
                  <span>Download Docs</span>
                </a>
                <span className="text-sm text-white">
                  {profile.full_name} <span className="text-gray-300">({profile.user_type})</span>
                </span>
                <button
                  onClick={signOut}
                  className="px-4 py-2 bg-gigmate-red text-white rounded-md hover:bg-gigmate-red-dark transition-colors font-medium"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
