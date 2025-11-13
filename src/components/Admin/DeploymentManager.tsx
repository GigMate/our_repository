import { useState } from 'react';
import { Rocket, CheckCircle, XCircle, Loader, AlertCircle, ExternalLink, Key } from 'lucide-react';
import EnvironmentVariablesGuide from './EnvironmentVariablesGuide';

export default function DeploymentManager() {
  const [status, setStatus] = useState<'idle' | 'building' | 'success' | 'error'>('idle');
  const [buildOutput, setBuildOutput] = useState<string[]>([]);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showEnvVars, setShowEnvVars] = useState(false);

  const handleBuild = async () => {
    setStatus('building');
    setBuildOutput(['Starting build process...']);

    try {
      const response = await fetch('/api/build', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Build failed');
      }

      const data = await response.json();
      setBuildOutput(data.output || ['Build completed successfully!']);
      setStatus('success');
    } catch (error) {
      setBuildOutput(['Build failed. Please check the logs.']);
      setStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Deployment Manager</h2>
            <p className="text-gray-600 mt-1">Deploy your application to production</p>
          </div>
          <Rocket className="h-8 w-8 text-blue-600" />
        </div>

        {/* Instructions Card */}
        {showInstructions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Quick Deployment Guide</h3>
                  <p className="text-blue-800 text-sm mb-3">
                    To deploy GigMate to production, follow these simple steps:
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Hide
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">Option 1: Git Push (Recommended)</h4>
                <p className="text-gray-700 mb-2">If your project is connected to GitHub/GitLab:</p>
                <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                  git add .<br />
                  git commit -m "Deploy to production"<br />
                  git push
                </div>
                <p className="text-gray-600 mt-2 text-xs">
                  Vercel will automatically detect the push and deploy your changes.
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">Option 2: Vercel CLI</h4>
                <p className="text-gray-700 mb-2">For direct deployment:</p>
                <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs">
                  vercel --prod
                </div>
                <p className="text-gray-600 mt-2 text-xs">
                  Run this command and press Enter to confirm. Vercel will handle the rest.
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">Option 3: Vercel Dashboard</h4>
                <div className="space-y-2 text-gray-700">
                  <p>1. Go to <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">vercel.com/dashboard <ExternalLink className="h-3 w-3 ml-1" /></a></p>
                  <p>2. Find your GigMate project</p>
                  <p>3. Click "Deployments" tab</p>
                  <p>4. Click "Deploy" or "Redeploy" button</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Before Deploying - Checklist:</h4>
              <div className="space-y-1 text-blue-800 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Build optimization completed (already done!)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Environment variables set in Vercel dashboard</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Database migrations applied to production Supabase</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!showInstructions && (
          <button
            onClick={() => setShowInstructions(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4 flex items-center space-x-2"
          >
            <AlertCircle className="h-4 w-4" />
            <span>Show deployment instructions</span>
          </button>
        )}

        {/* Build Status */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Build Test</h3>
            {status === 'idle' && (
              <button
                onClick={handleBuild}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Rocket className="h-4 w-4" />
                <span>Test Build</span>
              </button>
            )}
            {status === 'building' && (
              <div className="flex items-center space-x-2 text-blue-600">
                <Loader className="h-5 w-5 animate-spin" />
                <span className="font-medium">Building...</span>
              </div>
            )}
            {status === 'success' && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Build Successful</span>
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center space-x-2 text-red-600">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Build Failed</span>
              </div>
            )}
          </div>

          {buildOutput.length > 0 && (
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-64 overflow-y-auto">
              {buildOutput.map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          )}

          {status === 'idle' && (
            <p className="text-gray-600 text-sm">
              Click "Test Build" to verify your project builds successfully before deploying.
            </p>
          )}

          {status === 'success' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium mb-2">Ready to Deploy!</p>
              <p className="text-green-700 text-sm">
                Your build completed successfully. You can now deploy using any of the methods above.
              </p>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <span className="font-medium text-gray-900">Vercel Dashboard</span>
            <ExternalLink className="h-4 w-4 text-gray-600" />
          </a>

          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <span className="font-medium text-gray-900">Supabase Dashboard</span>
            <ExternalLink className="h-4 w-4 text-gray-600" />
          </a>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <span className="font-medium text-gray-900">GitHub Repository</span>
            <ExternalLink className="h-4 w-4 text-gray-600" />
          </a>
        </div>

        {/* Environment Variables Notice */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Key className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-900 mb-1">Important: Environment Variables Required</h4>
                <p className="text-yellow-800 text-sm">
                  Before deploying, you need to add your environment variables to Vercel.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowEnvVars(!showEnvVars)}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
            >
              <Key className="h-4 w-4" />
              <span>{showEnvVars ? 'Hide' : 'Show'} Variables</span>
            </button>
          </div>
        </div>
      </div>

      {/* Environment Variables Guide */}
      {showEnvVars && (
        <div className="animate-fadeIn">
          <EnvironmentVariablesGuide />
        </div>
      )}
    </div>
  );
}
