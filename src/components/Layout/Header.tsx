import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Database, FileDown, Home } from 'lucide-react';
import VenueSpotlight from '../Shared/VenueSpotlight';

interface HeaderProps {
  onLogoClick: () => void;
}

export default function Header({ onLogoClick }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const { colors } = useTheme();

  return (
    <header className={`${colors.headerBg} shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <button
            onClick={onLogoClick}
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img
              src="/gigmate-logo.svg"
              alt="GigMate Logo"
              className="h-16 w-16"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="ml-3 text-3xl font-bold text-white">GigMate</span>
          </button>

          <div className="flex items-center space-x-4">
            <button
              onClick={onLogoClick}
              className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors font-medium text-sm"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
            <a
              href="/admin/seed"
              className={`flex items-center space-x-2 px-3 py-2 ${colors.buttonBg} text-white rounded-md ${colors.buttonHover} transition-colors font-medium text-sm opacity-90`}
            >
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Seed Data</span>
            </a>
            {profile && (
              <>
                <a
                  href="/download"
                  className={`flex items-center space-x-2 px-3 py-2 ${colors.buttonBg} text-white rounded-md ${colors.buttonHover} transition-colors font-medium text-sm opacity-90`}
                >
                  <FileDown className="h-4 w-4" />
                  <span className="hidden sm:inline">Docs</span>
                </a>
                <span className="text-sm text-white hidden md:inline">
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
      <VenueSpotlight />
    </header>
  );
}
