import { Download, FileText, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface DocCategory {
  name: string;
  description: string;
  files: { name: string; path: string; description: string }[];
}

export default function DocumentationDownload() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());

  const docCategories: DocCategory[] = [
    {
      name: 'Getting Started',
      description: 'Essential documents to get started',
      files: [
        { name: 'README.md', path: '/README.md', description: 'Platform overview and quick start' },
        { name: 'SYSTEM_AUDIT_COMPLETE.md', path: '/SYSTEM_AUDIT_COMPLETE.md', description: 'Complete system audit and status' },
        { name: 'CUSTOM_DOMAIN_SETUP_GUIDE.md', path: '/CUSTOM_DOMAIN_SETUP_GUIDE.md', description: 'Connect gigmate.us domain' },
        { name: 'DEPLOYMENT_GUIDE.md', path: '/DEPLOYMENT_GUIDE.md', description: 'Step-by-step deployment' },
        { name: 'DEPLOYMENT_CHECKLIST_GIGMATE_US.md', path: '/DEPLOYMENT_CHECKLIST_GIGMATE_US.md', description: 'Pre-launch checklist' },
      ]
    },
    {
      name: 'Business & Strategy',
      description: 'Business plans and growth strategy',
      files: [
        { name: 'GIGMATE_COMPLETE_BUSINESS_PLAN_V3.md', path: '/GIGMATE_COMPLETE_BUSINESS_PLAN_V3.md', description: 'Complete business plan' },
        { name: 'INVESTOR_PITCH_DECK.md', path: '/INVESTOR_PITCH_DECK.md', description: 'Investor presentation' },
        { name: 'GROWTH_STRATEGY.md', path: '/GROWTH_STRATEGY.md', description: 'Market expansion strategy' },
        { name: 'DATA_MONETIZATION_STRATEGY.md', path: '/DATA_MONETIZATION_STRATEGY.md', description: 'Revenue streams' },
        { name: 'COMPREHENSIVE_BUSINESS_PLAN.md', path: '/COMPREHENSIVE_BUSINESS_PLAN.md', description: 'Extended business analysis' },
      ]
    },
    {
      name: 'Technical Documentation',
      description: 'Developer guides and API docs',
      files: [
        { name: 'GIGMATE_COMPLETE_PLATFORM_DOCUMENTATION_2025.md', path: '/GIGMATE_COMPLETE_PLATFORM_DOCUMENTATION_2025.md', description: 'Full platform docs' },
        { name: 'IMPLEMENTATION_GUIDE.md', path: '/IMPLEMENTATION_GUIDE.md', description: 'Technical implementation' },
        { name: 'DATA_SEEDING_GUIDE.md', path: '/DATA_SEEDING_GUIDE.md', description: 'Database seeding' },
        { name: 'GENRE_SYSTEM_DOCUMENTATION.md', path: '/GENRE_SYSTEM_DOCUMENTATION.md', description: 'Genre and tagging system' },
        { name: 'CODE_REVIEW_COMPLETE.md', path: '/CODE_REVIEW_COMPLETE.md', description: 'Code review findings' },
      ]
    },
    {
      name: 'Features & Operations',
      description: 'Platform features and operations guides',
      files: [
        { name: 'AI_OPERATIONS_GUIDE.md', path: '/AI_OPERATIONS_GUIDE.md', description: 'AI features and operations' },
        { name: 'CREDIT_ECONOMY_SUMMARY.md', path: '/CREDIT_ECONOMY_SUMMARY.md', description: 'Platform credit system' },
        { name: 'MERCHANDISE_MANAGEMENT_GUIDE.md', path: '/MERCHANDISE_MANAGEMENT_GUIDE.md', description: 'Merchandise integration' },
        { name: 'SOCIAL_MEDIA_AND_EMERGENCY_SYSTEM.md', path: '/SOCIAL_MEDIA_AND_EMERGENCY_SYSTEM.md', description: 'Social and emergency features' },
        { name: 'AUTO_GENERATION_OPERATIONS_GUIDE.md', path: '/AUTO_GENERATION_OPERATIONS_GUIDE.md', description: 'Automated content generation' },
      ]
    },
    {
      name: 'Legal & Compliance',
      description: 'Legal compliance and agreements',
      files: [
        { name: 'LEGAL_COMPLIANCE_AND_MERCH_VENDOR_GUIDE.md', path: '/LEGAL_COMPLIANCE_AND_MERCH_VENDOR_GUIDE.md', description: 'Legal compliance guide' },
        { name: 'PLATFORM_EXCLUSIVITY_TERMS.md', path: '/PLATFORM_EXCLUSIVITY_TERMS.md', description: 'Exclusivity agreements' },
        { name: 'NDA_BETA_SETUP_GUIDE.md', path: '/NDA_BETA_SETUP_GUIDE.md', description: 'Beta tester NDA setup' },
        { name: 'BETA_TESTER_GUIDE.md', path: '/BETA_TESTER_GUIDE.md', description: 'Guide for beta testers' },
      ]
    },
    {
      name: 'Master Documentation',
      description: 'Complete documentation package',
      files: [
        { name: 'FINAL_DOCUMENTATION_PACKAGE_2025.md', path: '/FINAL_DOCUMENTATION_PACKAGE_2025.md', description: 'Complete inventory of all docs (55+ files)' },
      ]
    }
  ];

  async function downloadFile(fileName: string, filePath: string) {
    setDownloading(fileName);

    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error('File not found');
      }

      const content = await response.text();
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloaded(prev => new Set([...prev, fileName]));
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file. Please try again.');
    } finally {
      setDownloading(null);
    }
  }

  async function downloadAllInCategory(category: DocCategory) {
    for (const file of category.files) {
      await downloadFile(file.name, file.path);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  async function downloadAll() {
    for (const category of docCategories) {
      await downloadAllInCategory(category);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FileText className="w-8 h-8" />
              GigMate Documentation Download Center
            </h1>
            <p className="text-blue-100 mt-2">
              Download all platform documentation - 55+ documents, 500+ pages
            </p>
          </div>

          <div className="p-8">
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg mb-8">
              <div className="flex items-start gap-4">
                <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Complete Documentation Package</h3>
                  <p className="text-gray-700 mb-4">
                    This package includes everything you need: business plans, technical documentation,
                    deployment guides, legal compliance, and operational procedures.
                  </p>
                  <button
                    onClick={downloadAll}
                    disabled={downloading !== null}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg
                             hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 font-medium
                             flex items-center gap-2 transition-all"
                  >
                    <Download className="w-5 h-5" />
                    {downloading ? 'Downloading...' : 'Download All Documentation'}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {docCategories.map((category, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                        <p className="text-gray-600 text-sm mt-1">{category.description}</p>
                      </div>
                      <button
                        onClick={() => downloadAllInCategory(category)}
                        disabled={downloading !== null}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                                 disabled:opacity-50 font-medium flex items-center gap-2 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download Category
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {category.files.map((file, fileIdx) => (
                      <div
                        key={fileIdx}
                        className="px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-gray-400" />
                              <h3 className="font-semibold text-gray-900">{file.name}</h3>
                              {downloaded.has(file.name) && (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mt-1 ml-7">{file.description}</p>
                          </div>
                          <button
                            onClick={() => downloadFile(file.name, file.path)}
                            disabled={downloading === file.name}
                            className="ml-4 px-4 py-2 bg-white border-2 border-blue-600 text-blue-600
                                     rounded-lg hover:bg-blue-50 disabled:opacity-50 font-medium
                                     flex items-center gap-2 text-sm transition-all"
                          >
                            {downloading === file.name ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                Download
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-600 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Documentation Status
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">55+</div>
                  <div className="text-sm text-gray-600">Documents</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">500+</div>
                  <div className="text-sm text-gray-600">Pages</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">100%</div>
                  <div className="text-sm text-gray-600">Coverage</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">✓</div>
                  <div className="text-sm text-gray-600">Up to Date</div>
                </div>
              </div>
              <p className="text-gray-700 mt-4 text-sm">
                Last Updated: November 10, 2025 • All documentation reflects current platform status
              </p>
            </div>
          </div>

          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
            <div className="text-center text-sm text-gray-600">
              <p className="font-medium text-gray-900 mb-2">Need Help?</p>
              <p>Contact: <a href="mailto:docs@gigmate.us" className="text-blue-600 hover:underline">docs@gigmate.us</a></p>
              <p className="mt-4 text-xs text-gray-500">
                © 2025 GigMate, Inc. All documentation is proprietary and confidential.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
