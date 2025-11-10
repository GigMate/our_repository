import { FileDown, BookOpen, Sparkles, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';

export default function DocumentationDownload() {
  const [authenticated, setAuthenticated] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin_authenticated') === 'true';
    setAuthenticated(isAuth);
  }, []);

  if (!authenticated) {
    return <AdminLogin onAuthenticated={() => setAuthenticated(true)} />;
  }

  const documents = [
    {
      title: 'Complete Platform Documentation 2025',
      file: 'GIGMATE_COMPLETE_PLATFORM_DOCUMENTATION_2025.md',
      description: 'Comprehensive guide covering all features, revenue model, and GM8AI',
      icon: '📚',
      category: 'launch',
      size: '80 pages'
    },
    {
      title: 'Membership & Advertising Pitch Deck',
      file: 'GIGMATE_PITCH_DECK.md',
      description: '20-slide pitch deck for musicians, venues, and advertisers',
      icon: '🎯',
      category: 'launch',
      size: '40 pages'
    },
    {
      title: 'Beta Tester Guide',
      file: 'BETA_TESTER_GUIDE.md',
      description: 'Complete onboarding guide for beta testers',
      icon: '📖',
      category: 'launch',
      size: '50 pages'
    },
    {
      title: 'Investor Pitch Deck',
      file: 'INVESTOR_PITCH_DECK.md',
      description: '$2M seed round pitch at $10M valuation',
      icon: '💼',
      category: 'launch',
      size: '60 pages'
    },
    {
      title: 'Deployment Guide',
      file: 'DEPLOYMENT_GUIDE.md',
      description: 'Production deployment to Vercel & Supabase',
      icon: '🚢',
      category: 'launch',
      size: '40 pages'
    },
    {
      title: 'Social Media & Emergency System',
      file: 'SOCIAL_MEDIA_AND_EMERGENCY_SYSTEM.md',
      description: '8 platforms + auto-replacement feature',
      icon: '📱',
      category: 'launch',
      size: '45 pages'
    },
    {
      title: 'Complete Business Plan',
      file: 'COMPREHENSIVE_BUSINESS_PLAN.md',
      description: 'Full strategy, financials, and projections',
      icon: '📊',
      category: 'business',
      size: '26 pages'
    },
    {
      title: 'Data Monetization Strategy',
      file: 'DATA_MONETIZATION_STRATEGY.md',
      description: '$500K-$2M additional revenue potential',
      icon: '💰',
      category: 'business',
      size: '27 pages'
    },
    {
      title: 'Strategic Roadmap',
      file: 'GIGMATE_STRATEGIC_ROADMAP.md',
      description: '3-year growth plan to $100M+',
      icon: '🗺️',
      category: 'business',
      size: '15 pages'
    },
    {
      title: 'Implementation Guide',
      file: 'IMPLEMENTATION_GUIDE.md',
      description: 'Technical implementation details',
      icon: '🛠️',
      category: 'technical',
      size: '75 pages'
    },
    {
      title: 'AI Revenue System',
      file: 'AI_REVENUE_SYSTEM.md',
      description: 'Intelligent recommendations & monetization',
      icon: '🤖',
      category: 'technical',
      size: '10 pages'
    },
    {
      title: 'Credit Economy',
      file: 'CREDIT_ECONOMY_SUMMARY.md',
      description: 'Platform credits and pricing system',
      icon: '🪙',
      category: 'technical',
      size: '13 pages'
    },
    {
      title: 'Premium Fan Messaging',
      file: 'PREMIUM_FAN_MESSAGING_STRATEGY.md',
      description: 'Paid artist-to-fan communication',
      icon: '💬',
      category: 'technical',
      size: '4 pages'
    },
    {
      title: 'Platform Exclusivity Terms',
      file: 'PLATFORM_EXCLUSIVITY_TERMS.md',
      description: 'Anti-circumvention legal protection',
      icon: '⚖️',
      category: 'legal',
      size: '25 pages'
    },
    {
      title: 'Data Seeding Guide',
      file: 'DATA_SEEDING_GUIDE.md',
      description: 'When and how to seed test data',
      icon: '🌱',
      category: 'technical',
      size: '12 pages'
    },
    {
      title: 'Test Data Management Guide',
      file: 'TESTDATA_MANAGEMENT_GUIDE.md',
      description: 'Identify and remove test accounts before production',
      icon: '🧪',
      category: 'technical',
      size: '8 pages'
    },
    {
      title: 'Code Review Findings',
      file: 'CODE_REVIEW_FINDINGS.md',
      description: 'Detailed code review results and fixes',
      icon: '🔍',
      category: 'technical',
      size: '12 pages'
    },
    {
      title: 'Code Review Complete Report',
      file: 'CODE_REVIEW_COMPLETE.md',
      description: 'Comprehensive review report - ready for beta',
      icon: '✅',
      category: 'technical',
      size: '25 pages'
    },
    {
      title: 'Documentation Package Summary',
      file: 'DOCUMENTATION_PACKAGE_SUMMARY.md',
      description: 'Complete index of all 19 documents (600+ pages)',
      icon: '📑',
      category: 'technical',
      size: '10 pages'
    },
    {
      title: 'Legal & Compliance',
      file: 'LEGAL_COMPLIANCE_AND_MERCH_VENDOR_GUIDE.md',
      description: 'Terms, privacy, vendor policies',
      icon: '📋',
      category: 'legal',
      size: '15 pages'
    }
  ];

  const categories = {
    launch: { title: 'Launch Ready', color: 'purple', icon: '🚀' },
    business: { title: 'Business Strategy', color: 'green', icon: '📈' },
    technical: { title: 'Technical Docs', color: 'blue', icon: '⚙️' },
    legal: { title: 'Legal', color: 'yellow', icon: '📜' }
  };

  const downloadFile = async (filename: string) => {
    setDownloading(filename);
    try {
      const response = await fetch(`/${filename}`);
      if (!response.ok) throw new Error('File not found');

      const content = await response.text();
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. The file may not be available yet.');
    } finally {
      setDownloading(null);
    }
  };

  const downloadAll = async (categoryKey: string) => {
    const categoryDocs = documents.filter(d => d.category === categoryKey);
    for (const doc of categoryDocs) {
      await downloadFile(doc.file);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 p-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <BookOpen className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              GigMate Complete Documentation
            </h1>
            <p className="text-gray-600 mb-4">
              Everything you need to launch, scale, and invest in GigMate
            </p>
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Updated with Beta Testing & Investor Materials!</span>
            </div>
          </div>

          {Object.entries(categories).map(([key, category]) => {
            const categoryDocs = documents.filter(d => d.category === key);
            const colorClasses = {
              purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', hover: 'hover:bg-purple-100', button: 'bg-purple-600 hover:bg-purple-700' },
              green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', hover: 'hover:bg-green-100', button: 'bg-green-600 hover:bg-green-700' },
              blue: { bg: 'bg-orange-50', border: 'border-blue-200', text: 'text-blue-900', hover: 'hover:bg-orange-100', button: 'bg-blue-600 hover:bg-blue-700' },
              yellow: { bg: 'bg-rose-50', border: 'border-yellow-200', text: 'text-yellow-900', hover: 'hover:bg-rose-100', button: 'bg-yellow-600 hover:bg-yellow-700' }
            }[category.color] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900', hover: 'hover:bg-gray-100', button: 'bg-gray-600 hover:bg-gray-700' };

            return (
              <div key={key} className={`${colorClasses.bg} border ${colorClasses.border} rounded-lg p-6 mb-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold ${colorClasses.text} flex items-center gap-2 text-lg`}>
                    <span className="text-2xl">{category.icon}</span>
                    {category.title}
                  </h3>
                  <button
                    onClick={() => downloadAll(key)}
                    className={`${colorClasses.button} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2`}
                  >
                    <Download className="w-4 h-4" />
                    Download All
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryDocs.map((doc) => (
                    <button
                      key={doc.file}
                      onClick={() => downloadFile(doc.file)}
                      disabled={downloading === doc.file}
                      className={`block bg-white ${colorClasses.hover} border ${colorClasses.border} rounded-lg p-4 transition-colors group text-left w-full disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{doc.icon}</span>
                            <h4 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                              {doc.title}
                            </h4>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{doc.description}</p>
                          <span className="text-xs text-gray-500 font-medium">{doc.size}</span>
                        </div>
                        {downloading === doc.file ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 flex-shrink-0 ml-2"></div>
                        ) : (
                          <FileDown className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Legacy Documentation
            </h3>
            <a
              href="/documentation.html"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-4 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    📄 Complete Documentation (HTML)
                  </h4>
                  <p className="text-xs text-gray-600">
                    Original 100+ page documentation - Open and press Ctrl+P to save as PDF
                  </p>
                </div>
                <FileDown className="w-5 h-5 text-gray-600" />
              </div>
            </a>
          </div>

          <div className="bg-orange-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">
              💡 How to Use These Files:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">For Beta Testers:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Beta Tester Guide</li>
                  <li>• Deployment Guide</li>
                  <li>• Social Media System</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">For Investors:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Investor Pitch Deck</li>
                  <li>• Business Plan</li>
                  <li>• Strategic Roadmap</li>
                  <li>• Data Monetization</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">For Developers:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Implementation Guide</li>
                  <li>• Deployment Guide</li>
                  <li>• AI Revenue System</li>
                  <li>• Credit Economy</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Latest Updates (November 2025)
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-0.5">NEW</span>
                <div>
                  <strong>Code Review Complete Report:</strong> 25-page comprehensive code review covering 150+ files with security audit, performance analysis, and beta testing readiness confirmation
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-0.5">NEW</span>
                <div>
                  <strong>Test Data Management Guide:</strong> Complete guide for identifying and safely removing all test accounts (300 accounts) before production launch
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-0.5">NEW</span>
                <div>
                  <strong>Code Review Findings:</strong> Detailed technical report of all errors found and fixed, remaining non-critical issues, and optimization recommendations
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-0.5">NEW</span>
                <div>
                  <strong>Complete Platform Documentation 2025:</strong> 80-page comprehensive guide with all features, revenue model, GM8AI operations, and getting started guides
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-0.5">NEW</span>
                <div>
                  <strong>Membership & Advertising Pitch Deck:</strong> 20-slide presentation for soliciting musicians, venues, and sponsor advertisers
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <a
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>

        <div className="mt-6 text-center text-white text-sm">
          <p>📊 Total Documentation: 600+ pages covering every aspect of GigMate</p>
          <p className="mt-2">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <p className="mt-2 text-xs opacity-80">Including complete code review, test data management, platform guide, pitch decks, and all technical documentation</p>
        </div>
      </div>
    </div>
  );
}
