import { useState } from 'react';
import { Database, FileDown, Users, TrendingUp, Settings, LogOut, Shield, Rocket, Edit3, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DatabaseSeeder from './DatabaseSeeder';
import DocumentationDownload from './DocumentationDownload';
import LegalDocumentManager from './LegalDocumentManager';
import InvestorApprovalPanel from './InvestorApprovalPanel';
import BetaInvitationManager from './BetaInvitationManager';
import RevenueAnalytics from './RevenueAnalytics';
import EmailQueueViewer from './EmailQueueViewer';
import EmailTester from './EmailTester';
import TokenManager from './TokenManager';
import DeploymentManager from './DeploymentManager';
import ContentEditor from './ContentEditor';

type AdminView = 'seeder' | 'docs' | 'legal' | 'investors' | 'beta' | 'revenue' | 'email' | 'emailtest' | 'tokens' | 'deploy' | 'content';

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<AdminView>('seeder');

  const menuItems = [
    { id: 'content' as AdminView, label: 'Edit Content', icon: Edit3 },
    { id: 'deploy' as AdminView, label: 'Deploy to Production', icon: Rocket },
    { id: 'seeder' as AdminView, label: 'Database Seeder', icon: Database },
    { id: 'docs' as AdminView, label: 'Documentation', icon: FileDown },
    { id: 'legal' as AdminView, label: 'Legal Documents', icon: Settings },
    { id: 'investors' as AdminView, label: 'Investor Approval', icon: Users },
    { id: 'beta' as AdminView, label: 'Beta Invitations', icon: Shield },
    { id: 'revenue' as AdminView, label: 'Revenue Analytics', icon: TrendingUp },
    { id: 'emailtest' as AdminView, label: 'Test Emails', icon: Mail },
    { id: 'email' as AdminView, label: 'Email Queue', icon: Settings },
    { id: 'tokens' as AdminView, label: 'Token Manager', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-xs text-gray-400">{profile?.full_name}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    currentView === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {currentView === 'content' && <ContentEditor />}
          {currentView === 'deploy' && <DeploymentManager />}
          {currentView === 'seeder' && <DatabaseSeeder />}
          {currentView === 'docs' && <DocumentationDownload />}
          {currentView === 'legal' && <LegalDocumentManager />}
          {currentView === 'investors' && <InvestorApprovalPanel />}
          {currentView === 'beta' && <BetaInvitationManager />}
          {currentView === 'revenue' && <RevenueAnalytics />}
          {currentView === 'emailtest' && <EmailTester />}
          {currentView === 'email' && <EmailQueueViewer />}
          {currentView === 'tokens' && <TokenManager />}
        </div>
      </div>
    </div>
  );
}
