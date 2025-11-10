import { Download, FileText, CheckCircle, FileType } from 'lucide-react';
import { useState } from 'react';
import { fetchAndConvertToPDF, generateCombinedPDF } from '../../lib/pdfGenerator';

interface DocCategory {
  name: string;
  description: string;
  files: { name: string; path: string; description: string; title: string }[];
}

export default function DocumentationDownload() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());

  const docCategories: DocCategory[] = [
    {
      name: 'Getting Started',
      description: 'Essential documents to get started',
      files: [
        { name: 'README.md', path: '/README.md', description: 'Platform overview and quick start', title: 'GigMate Platform Overview' },
        { name: 'SYSTEM_AUDIT_COMPLETE.md', path: '/SYSTEM_AUDIT_COMPLETE.md', description: 'Complete system audit and status', title: 'System Audit Report' },
        { name: 'CUSTOM_DOMAIN_SETUP_GUIDE.md', path: '/CUSTOM_DOMAIN_SETUP_GUIDE.md', description: 'Connect gigmate.us domain', title: 'Custom Domain Setup Guide' },
        { name: 'DEPLOYMENT_GUIDE.md', path: '/DEPLOYMENT_GUIDE.md', description: 'Step-by-step deployment', title: 'Deployment Guide' },
        { name: 'DEPLOYMENT_CHECKLIST_GIGMATE_US.md', path: '/DEPLOYMENT_CHECKLIST_GIGMATE_US.md', description: 'Pre-launch checklist', title: 'Deployment Checklist' },
      ]
    },
    {
      name: 'Business & Strategy',
      description: 'Business plans and growth strategy',
      files: [
        { name: 'GIGMATE_COMPLETE_BUSINESS_PLAN_V3.md', path: '/GIGMATE_COMPLETE_BUSINESS_PLAN_V3.md', description: 'Complete business plan', title: 'GigMate Business Plan v3' },
        { name: 'INVESTOR_PITCH_DECK.md', path: '/INVESTOR_PITCH_DECK.md', description: 'Investor presentation', title: 'Investor Pitch Deck' },
        { name: 'GROWTH_STRATEGY.md', path: '/GROWTH_STRATEGY.md', description: 'Market expansion strategy', title: 'Growth Strategy' },
        { name: 'DATA_MONETIZATION_STRATEGY.md', path: '/DATA_MONETIZATION_STRATEGY.md', description: 'Revenue streams', title: 'Data Monetization Strategy' },
        { name: 'COMPREHENSIVE_BUSINESS_PLAN.md', path: '/COMPREHENSIVE_BUSINESS_PLAN.md', description: 'Extended business analysis', title: 'Comprehensive Business Plan' },
      ]
    },
    {
      name: 'Technical Documentation',
      description: 'Developer guides and API docs',
      files: [
        { name: 'GIGMATE_COMPLETE_PLATFORM_DOCUMENTATION_2025.md', path: '/GIGMATE_COMPLETE_PLATFORM_DOCUMENTATION_2025.md', description: 'Full platform docs', title: 'Complete Platform Documentation 2025' },
        { name: 'IMPLEMENTATION_GUIDE.md', path: '/IMPLEMENTATION_GUIDE.md', description: 'Technical implementation', title: 'Implementation Guide' },
        { name: 'DATA_SEEDING_GUIDE.md', path: '/DATA_SEEDING_GUIDE.md', description: 'Database seeding', title: 'Data Seeding Guide' },
        { name: 'GENRE_SYSTEM_DOCUMENTATION.md', path: '/GENRE_SYSTEM_DOCUMENTATION.md', description: 'Genre and tagging system', title: 'Genre System Documentation' },
        { name: 'CODE_REVIEW_COMPLETE.md', path: '/CODE_REVIEW_COMPLETE.md', description: 'Code review findings', title: 'Code Review Report' },
      ]
    },
    {
      name: 'Features & Operations',
      description: 'Platform features and operations guides',
      files: [
        { name: 'AI_OPERATIONS_GUIDE.md', path: '/AI_OPERATIONS_GUIDE.md', description: 'AI features and operations', title: 'AI Operations Guide' },
        { name: 'CREDIT_ECONOMY_SUMMARY.md', path: '/CREDIT_ECONOMY_SUMMARY.md', description: 'Platform credit system', title: 'Credit Economy Summary' },
        { name: 'MERCHANDISE_MANAGEMENT_GUIDE.md', path: '/MERCHANDISE_MANAGEMENT_GUIDE.md', description: 'Merchandise integration', title: 'Merchandise Management Guide' },
        { name: 'SOCIAL_MEDIA_AND_EMERGENCY_SYSTEM.md', path: '/SOCIAL_MEDIA_AND_EMERGENCY_SYSTEM.md', description: 'Social and emergency features', title: 'Social Media & Emergency System' },
        { name: 'AUTO_GENERATION_OPERATIONS_GUIDE.md', path: '/AUTO_GENERATION_OPERATIONS_GUIDE.md', description: 'Automated content generation', title: 'Auto-Generation Operations Guide' },
      ]
    },
    {
      name: 'Legal & Compliance',
      description: 'Legal compliance and agreements',
      files: [
        { name: 'LEGAL_COMPLIANCE_AND_MERCH_VENDOR_GUIDE.md', path: '/LEGAL_COMPLIANCE_AND_MERCH_VENDOR_GUIDE.md', description: 'Legal compliance guide', title: 'Legal Compliance Guide' },
        { name: 'PLATFORM_EXCLUSIVITY_TERMS.md', path: '/PLATFORM_EXCLUSIVITY_TERMS.md', description: 'Exclusivity agreements', title: 'Platform Exclusivity Terms' },
        { name: 'NDA_BETA_SETUP_GUIDE.md', path: '/NDA_BETA_SETUP_GUIDE.md', description: 'Beta tester NDA setup', title: 'Beta NDA Setup Guide' },
        { name: 'BETA_TESTER_GUIDE.md', path: '/BETA_TESTER_GUIDE.md', description: 'Guide for beta testers', title: 'Beta Tester Guide' },
      ]
    },
    {
      name: 'Master Documentation',
      description: 'Complete documentation package',
      files: [
        { name: 'FINAL_DOCUMENTATION_PACKAGE_2025.md', path: '/FINAL_DOCUMENTATION_PACKAGE_2025.md', description: 'Complete inventory of all docs (55+ files)', title: 'Final Documentation Package 2025' },
      ]
    }
  ];

  async function downloadFile(fileName: string, filePath: string, format: 'md' | 'pdf' = 'md') {
    setDownloading(fileName);

    try {
      if (format === 'pdf') {
        const title = docCategories
          .flatMap(cat => cat.files)
          .find(f => f.name === fileName)?.title || fileName.replace('.md', '');

        const pdfFileName = fileName.replace('.md', '.pdf');
        await fetchAndConvertToPDF(filePath, pdfFileName, title);
      } else {
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
      }

      setDownloaded(prev => new Set([...prev, fileName + format]));
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Failed to download ${format.toUpperCase()} file. Please try again.`);
    } finally {
      setDownloading(null);
    }
  }

  async function downloadAllInCategory(category: DocCategory, format: 'md' | 'pdf' = 'md') {
    for (const file of category.files) {
      await downloadFile(file.name, file.path, format);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }

  async function downloadAll(format: 'md' | 'pdf' = 'md') {
    for (const category of docCategories) {
      await downloadAllInCategory(category, format);
    }
  }

  async function downloadCombinedPDF() {
    setDownloading('combined-pdf');
    try {
      const allFiles = docCategories.flatMap(cat =>
        cat.files.map(f => ({
          path: f.path,
          name: f.name,
          title: f.title
        }))
      );

      await generateCombinedPDF(allFiles, 'GigMate_Complete_Documentation.pdf');
      setDownloaded(prev => new Set([...prev, 'combined-pdf']));
    } catch (error) {
      console.error('Combined PDF generation failed:', error);
      alert('Failed to generate combined PDF. Please try again.');
    } finally {
      setDownloading(null);
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
              Download all platform documentation - 55+ documents, 500+ pages - as Markdown or PDF
            </p>
          </div>

          <div className="p-8">
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg mb-8">
              <div className="flex items-start gap-4">
                <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Complete Documentation Package</h3>
                  <p className="text-gray-700 mb-4">
                    This package includes everything you need: business plans, technical documentation,
                    deployment guides, legal compliance, and operational procedures.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => downloadAll('md')}
                      disabled={downloading !== null}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg
                               hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 font-medium
                               flex items-center gap-2 transition-all"
                    >
                      <Download className="w-5 h-5" />
                      {downloading ? 'Downloading...' : 'Download All (Markdown)'}
                    </button>
                    <button
                      onClick={() => downloadAll('pdf')}
                      disabled={downloading !== null}
                      className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg
                               hover:from-red-700 hover:to-pink-700 disabled:opacity-50 font-medium
                               flex items-center gap-2 transition-all"
                    >
                      <FileType className="w-5 h-5" />
                      {downloading ? 'Downloading...' : 'Download All (PDF)'}
                    </button>
                    <button
                      onClick={downloadCombinedPDF}
                      disabled={downloading !== null}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg
                               hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 font-medium
                               flex items-center gap-2 transition-all"
                    >
                      <FileType className="w-5 h-5" />
                      {downloading === 'combined-pdf' ? 'Generating...' : 'Combined PDF (All Docs in One File)'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {docCategories.map((category, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                        <p className="text-gray-600 text-sm mt-1">{category.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadAllInCategory(category, 'md')}
                          disabled={downloading !== null}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                                   disabled:opacity-50 font-medium flex items-center gap-2 text-sm"
                        >
                          <Download className="w-4 h-4" />
                          MD
                        </button>
                        <button
                          onClick={() => downloadAllInCategory(category, 'pdf')}
                          disabled={downloading !== null}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700
                                   disabled:opacity-50 font-medium flex items-center gap-2 text-sm"
                        >
                          <FileType className="w-4 h-4" />
                          PDF
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {category.files.map((file, fileIdx) => (
                      <div
                        key={fileIdx}
                        className="px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                              <h3 className="font-semibold text-gray-900 truncate">{file.name}</h3>
                              {(downloaded.has(file.name + 'md') || downloaded.has(file.name + 'pdf')) && (
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mt-1 ml-7">{file.description}</p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => downloadFile(file.name, file.path, 'md')}
                              disabled={downloading === file.name}
                              className="px-3 py-2 bg-white border-2 border-blue-600 text-blue-600
                                       rounded-lg hover:bg-blue-50 disabled:opacity-50 font-medium
                                       flex items-center gap-2 text-xs transition-all"
                              title="Download as Markdown"
                            >
                              {downloading === file.name ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              ) : (
                                <>
                                  <Download className="w-4 h-4" />
                                  MD
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => downloadFile(file.name, file.path, 'pdf')}
                              disabled={downloading === file.name}
                              className="px-3 py-2 bg-white border-2 border-red-600 text-red-600
                                       rounded-lg hover:bg-red-50 disabled:opacity-50 font-medium
                                       flex items-center gap-2 text-xs transition-all"
                              title="Download as PDF"
                            >
                              {downloading === file.name ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <>
                                  <FileType className="w-4 h-4" />
                                  PDF
                                </>
                              )}
                            </button>
                          </div>
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
                  <div className="text-3xl font-bold text-green-600">2</div>
                  <div className="text-sm text-gray-600">Formats (MD/PDF)</div>
                </div>
              </div>
              <p className="text-gray-700 mt-4 text-sm">
                Last Updated: November 10, 2025 • All documentation reflects current platform status
              </p>
            </div>

            <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-600 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Download Tips</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">MD:</span>
                  <span>Markdown files - Open with any text editor, great for developers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold mt-0.5">PDF:</span>
                  <span>Professional PDF format - Perfect for sharing with stakeholders and investors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">Combined:</span>
                  <span>Single PDF with all documents - Best for comprehensive review or archival</span>
                </li>
              </ul>
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
