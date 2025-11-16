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
        <div className="flex justify-between items-center h-20 gap-2">
          <button
            onClick={onLogoClick}
            className="flex items-center hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <img
              src="/gigmate-pick.png"
              alt="GigMate Logo"
              className="h-12 w-12 sm:h-16 sm:w-16"
            />
            <div className="ml-2 sm:ml-3">
              <div className="text-xl sm:text-3xl font-bold text-white">GigMate</div>
              <div className="text-[10px] sm:text-xs text-yellow-300 font-medium -mt-1 hidden sm:block">Empowering live music communities</div>
            </div>
          </button>

          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
            <button
              onClick={onLogoClick}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors font-medium text-xs sm:text-sm"
            >
              <Home className="h-4 w-4" />
              <span className="hidden md:inline">Home</span>
            </button>
            {profile?.user_type === 'admin' && (
              <a
                href="/admin/seed"
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 ${colors.buttonBg} text-white rounded-md ${colors.buttonHover} transition-colors font-medium text-xs sm:text-sm opacity-90`}
              >
                <Database className="h-4 w-4" />
                <span className="hidden md:inline">Seed Data</span>
              </a>
            )}
            {profile && (
              <>
                <a
                  href="/download"
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 ${colors.buttonBg} text-white rounded-md ${colors.buttonHover} transition-colors font-medium text-xs sm:text-sm opacity-90`}
                >
                  <FileDown className="h-4 w-4" />
                  <span className="hidden md:inline">Docs</span>
                </a>
                <span className="text-xs sm:text-sm text-white hidden lg:inline truncate max-w-[150px]">
                  {profile.full_name} <span className="text-gray-300">({profile.user_type})</span>
                </span>
                <button
                  onClick={signOut}
                  className="px-2 sm:px-4 py-2 bg-gigmate-red text-white rounded-md hover:bg-gigmate-red-dark transition-colors font-medium text-xs sm:text-sm whitespace-nowrap"
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
