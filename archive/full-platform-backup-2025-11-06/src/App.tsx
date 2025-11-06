import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Layout/Header';
import LoginForm from './components/Auth/LoginForm';
import SignUpForm from './components/Auth/SignUpForm';
import PasswordResetForm from './components/Auth/PasswordResetForm';
import MusicianAuthPage from './components/Auth/MusicianAuthPage';
import VenueAuthPage from './components/Auth/VenueAuthPage';
import FanAuthPage from './components/Auth/FanAuthPage';
import InvestorAuthPage from './components/Auth/InvestorAuthPage';
import MusicianDashboard from './components/Musician/MusicianDashboard';
import VenueDashboard from './components/Venue/VenueDashboard';
import FanDashboard from './components/Fan/FanDashboard';
import InvestorDashboard from './components/Investor/InvestorDashboard';
import DatabaseSeeder from './components/Admin/DatabaseSeeder';
import DocumentationDownload from './components/Admin/DocumentationDownload';
import HomePage from './components/Home/HomePage';
import LegalConsentGate from './components/Auth/LegalConsentGate';
import ErrorBoundary from './components/Shared/ErrorBoundary';

type AuthPage = 'musician' | 'venue' | 'fan' | 'investor' | null;

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSeeder, setShowSeeder] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showHome, setShowHome] = useState(true);
  const [authPage, setAuthPage] = useState<AuthPage>(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/admin/seed') {
      setShowSeeder(true);
    } else if (path === '/reset-password') {
      setShowPasswordReset(true);
    } else if (path === '/docs' || path === '/documentation' || path === '/download') {
      setShowDocs(true);
    }
  }, []);

  if (showPasswordReset) {
    return <PasswordResetForm />;
  }

  if (showDocs) {
    return <DocumentationDownload />;
  }

  if (showSeeder) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DatabaseSeeder />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    if (authPage === 'musician') {
      return <MusicianAuthPage onBack={() => { setAuthPage(null); setShowHome(true); }} />;
    }
    if (authPage === 'venue') {
      return <VenueAuthPage onBack={() => { setAuthPage(null); setShowHome(true); }} />;
    }
    if (authPage === 'fan') {
      return <FanAuthPage onBack={() => { setAuthPage(null); setShowHome(true); }} />;
    }
    if (authPage === 'investor') {
      return <InvestorAuthPage onBack={() => { setAuthPage(null); setShowHome(true); }} />;
    }
    if (showLogin) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gigmate-blue to-gigmate-blue-light flex items-center justify-center p-4">
          <LoginForm onToggle={() => setShowLogin(false)} onBack={() => { setShowLogin(false); setShowHome(true); }} />
        </div>
      );
    }
    if (showHome) {
      return (
        <HomePage
          onGetStarted={() => { setShowHome(false); setShowLogin(true); }}
          onMusicianClick={() => { setAuthPage('musician'); setShowHome(false); }}
          onVenueClick={() => { setAuthPage('venue'); setShowHome(false); }}
          onFanClick={() => { setAuthPage('fan'); setShowHome(false); }}
          onInvestorClick={() => { setAuthPage('investor'); setShowHome(false); }}
        />
      );
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-gigmate-blue to-gigmate-blue-light flex items-center justify-center p-4">
        <SignUpForm onToggle={() => setShowLogin(true)} />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <LegalConsentGate>
        <div className="min-h-screen bg-gray-50">
          <Header onLogoClick={() => setShowHome(true)} />
          <main>
            {showHome ? (
              <HomePage onGetStarted={() => setShowHome(false)} />
            ) : (
              <>
                {profile.user_type === 'musician' && <MusicianDashboard />}
                {profile.user_type === 'venue' && <VenueDashboard />}
                {profile.user_type === 'fan' && <FanDashboard />}
                {profile.user_type === 'investor' && <InvestorDashboard />}
              </>
            )}
          </main>
        </div>
      </LegalConsentGate>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
