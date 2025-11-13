import { useState, useEffect } from 'react';
import { Copy, CheckCircle, ExternalLink, Key, Eye, EyeOff } from 'lucide-react';

export default function EnvironmentVariablesGuide() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showValues, setShowValues] = useState(false);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load environment variables
    setEnvVars({
      'VITE_SUPABASE_URL': import.meta.env.VITE_SUPABASE_URL || '',
      'VITE_SUPABASE_ANON_KEY': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      'VITE_STRIPE_PUBLISHABLE_KEY': import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
      'VITE_GOOGLE_MAPS_API_KEY': import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'Not set - optional',
    });
  }, []);

  const copyToClipboard = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const maskValue = (value: string) => {
    if (!value || value === 'Not set - optional') return value;
    if (value.length < 20) return '•'.repeat(value.length);
    return value.substring(0, 10) + '•'.repeat(20) + value.substring(value.length - 10);
  };

  const copyAllAsText = () => {
    const text = Object.entries(envVars)
      .filter(([_, value]) => value && value !== 'Not set - optional')
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    copyToClipboard('all', text);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Environment Variables</h2>
            <p className="text-gray-600 mt-1">Copy these to your Vercel project settings</p>
          </div>
          <Key className="h-8 w-8 text-blue-600" />
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">How to Add to Vercel:</h3>
          <ol className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-start">
              <span className="font-bold mr-2">1.</span>
              <span>Go to <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">Vercel Dashboard <ExternalLink className="h-3 w-3 ml-1" /></a></span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">2.</span>
              <span>Click on your GigMate project</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">3.</span>
              <span>Go to "Settings" → "Environment Variables"</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">4.</span>
              <span>Click each "Copy" button below and paste into Vercel (one at a time)</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">5.</span>
              <span>Make sure to select "Production", "Preview", and "Development" for each variable</span>
            </li>
          </ol>
        </div>

        {/* Toggle Show/Hide */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setShowValues(!showValues)}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
          >
            {showValues ? (
              <>
                <EyeOff className="h-4 w-4" />
                <span className="text-sm font-medium">Hide Values</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span className="text-sm font-medium">Show Values</span>
              </>
            )}
          </button>

          <button
            onClick={copyAllAsText}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
          >
            {copiedKey === 'all' ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Copied All!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy All as Text</span>
              </>
            )}
          </button>
        </div>

        {/* Environment Variables List */}
        <div className="space-y-3">
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-mono text-sm font-semibold text-gray-900">{key}</span>
                    {value === 'Not set - optional' && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Optional</span>
                    )}
                  </div>
                  <div className="font-mono text-xs text-gray-600 break-all bg-white p-2 rounded border border-gray-200">
                    {showValues ? value : maskValue(value)}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(key, value)}
                  disabled={value === 'Not set - optional'}
                  className={`ml-4 flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    value === 'Not set - optional'
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : copiedKey === key
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {copiedKey === key ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Notes */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Important Notes:</h4>
          <ul className="space-y-1 text-gray-700 text-sm">
            <li>• These variables are required for your app to work in production</li>
            <li>• Google Maps API Key is optional - only needed if you use map features</li>
            <li>• After adding variables to Vercel, redeploy your project for changes to take effect</li>
            <li>• NEVER commit these values to GitHub - they're already in .env which is in .gitignore</li>
          </ul>
        </div>

        {/* Quick Link to Vercel */}
        <div className="mt-6">
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
          >
            <span className="font-medium">Open Vercel Dashboard</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Video Tutorial Suggestion */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
        <p className="text-gray-700 text-sm mb-3">
          If you're not sure how to add environment variables to Vercel, here's what to do:
        </p>
        <ol className="space-y-1 text-gray-700 text-sm mb-4">
          <li>1. Click "Copy All as Text" button above</li>
          <li>2. Go to Vercel Dashboard and select your project</li>
          <li>3. Navigate to Settings → Environment Variables</li>
          <li>4. Add each variable one by one (Name and Value)</li>
          <li>5. Select all three environments: Production, Preview, Development</li>
          <li>6. Click "Save" for each one</li>
        </ol>
        <p className="text-gray-600 text-xs">
          After adding all variables, go back to the Deployment Manager and deploy!
        </p>
      </div>
    </div>
  );
}
