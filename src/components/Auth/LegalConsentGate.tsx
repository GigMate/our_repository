import { useState, useEffect, useRef } from 'react';
import { FileText, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface LegalDocument {
  id: string;
  document_type: string;
  title: string;
  content: string;
  version: string;
  requires_consent: boolean;
}

interface LegalConsentGateProps {
  children: React.ReactNode;
}

export default function LegalConsentGate({ children }: LegalConsentGateProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasCompliance, setHasCompliance] = useState(false);
  const [pendingDocuments, setPendingDocuments] = useState<LegalDocument[]>([]);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [signature, setSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (user) {
      checkCompliance();
    }
  }, [user]);

  async function checkCompliance() {
    if (!user) return;

    const { data: complianceCheck, error: complianceError } = await supabase
      .rpc('check_user_legal_compliance', { p_user_id: user.id });

    if (complianceError) {
      console.error('Error checking compliance:', complianceError);
      setLoading(false);
      return;
    }

    if (complianceCheck) {
      setHasCompliance(true);
      setLoading(false);
      return;
    }

    const { data: pending, error: pendingError } = await supabase
      .rpc('get_pending_legal_documents', { p_user_id: user.id });

    if (pendingError) {
      console.error('Error loading pending documents:', pendingError);
    } else {
      setPendingDocuments(pending || []);
    }

    setLoading(false);
  }

  function startDrawing(e: React.MouseEvent<HTMLCanvasElement>) {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }

  function stopDrawing() {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignature(canvas.toDataURL());
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature('');
  }

  async function handleAccept() {
    if (!user || !pendingDocuments[currentDocIndex]) return;

    const doc = pendingDocuments[currentDocIndex];

    if (doc.requires_consent && !signature) {
      alert('Please provide your signature');
      return;
    }

    if (!accepted) {
      alert('You must check the acceptance box');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('user_legal_consents')
        .insert({
          user_id: user.id,
          document_id: doc.id,
          document_version: doc.version,
          ip_address: 'unknown',
          user_agent: navigator.userAgent,
          signature_data: signature || null,
        });

      if (error) throw error;

      if (currentDocIndex < pendingDocuments.length - 1) {
        setCurrentDocIndex(currentDocIndex + 1);
        setAccepted(false);
        setSignature('');
        clearSignature();
      } else {
        setHasCompliance(true);
      }
    } catch (error: any) {
      console.error('Error saving consent:', error);
      alert('Failed to save consent: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasCompliance && pendingDocuments.length > 0) {
    const currentDoc = pendingDocuments[currentDocIndex];

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-white rounded-lg shadow-xl">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-lg">
            <div className="flex items-center gap-3 mb-2">
              <Lock className="w-8 h-8" />
              <h1 className="text-2xl font-bold">Legal Agreement Required</h1>
            </div>
            <p className="text-orange-500">
              Please review and accept the following document to continue
              ({currentDocIndex + 1} of {pendingDocuments.length})
            </p>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">{currentDoc.title}</h2>
              <span className="px-2 py-1 bg-gray-700 text-blue-800 text-xs rounded-full">
                v{currentDoc.version}
              </span>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 max-h-96 overflow-y-auto">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {currentDoc.content}
              </div>
            </div>

            {currentDoc.requires_consent && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digital Signature Required
                </label>
                <div className="border-2 border-gray-300 rounded-lg p-2 bg-white">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={150}
                    className="border border-gray-200 rounded cursor-crosshair w-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                  <button
                    onClick={clearSignature}
                    className="mt-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    Clear Signature
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 mb-6 p-4 bg-gray-800 border border-blue-600 rounded-lg">
              <input
                type="checkbox"
                id="accept"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600"
              />
              <label htmlFor="accept" className="text-sm text-gray-700 flex-1">
                I have read and agree to the terms outlined in this document. I understand that this agreement is legally binding and my acceptance will be recorded with my IP address and timestamp.
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertCircle className="w-4 h-4" />
                <span>Your consent will be securely recorded</span>
              </div>
              <button
                onClick={handleAccept}
                disabled={submitting || !accepted || (currentDoc.requires_consent && !signature)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Accept & Continue
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasCompliance && pendingDocuments.length === 0) {
    setHasCompliance(true);
  }

  return <>{children}</>;
}
