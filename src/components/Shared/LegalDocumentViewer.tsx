import { useState, useEffect } from 'react';
import { FileText, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LegalDocument {
  id: string;
  document_type: string;
  title: string;
  content: string;
  version: number;
}

interface Signature {
  document_type: string;
  signed_at: string;
}

interface LegalDocumentViewerProps {
  investorRequestId: string;
  investorEmail: string;
  investorName: string;
  onAllSigned: () => void;
}

export default function LegalDocumentViewer({
  investorRequestId,
  investorEmail,
  investorName,
  onAllSigned,
}: LegalDocumentViewerProps) {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDocumentsAndSignatures();
  }, []);

  async function loadDocumentsAndSignatures() {
    try {
      const { data: docs, error: docsError } = await supabase
        .from('investor_legal_documents')
        .select('*')
        .eq('is_active', true)
        .order('document_type');

      if (docsError) throw docsError;

      const { data: sigs, error: sigsError } = await supabase
        .from('investor_document_signatures')
        .select('document_type, signed_at')
        .eq('investor_request_id', investorRequestId);

      if (sigsError) throw sigsError;

      setDocuments(docs || []);
      setSignatures(sigs || []);

      const firstUnsigned = (docs || []).findIndex(
        (doc) => !(sigs || []).some((sig) => sig.document_type === doc.document_type)
      );
      if (firstUnsigned !== -1) {
        setCurrentDocIndex(firstUnsigned);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSign() {
    const currentDoc = documents[currentDocIndex];
    if (!currentDoc) return;

    setSigning(true);
    setError('');

    try {
      const { error: signError } = await supabase
        .from('investor_document_signatures')
        .insert({
          investor_request_id: investorRequestId,
          document_id: currentDoc.id,
          document_type: currentDoc.document_type,
          full_name: investorName,
          email: investorEmail,
          signature_ip: 'browser',
        });

      if (signError) throw signError;

      const newSignatures = [
        ...signatures,
        {
          document_type: currentDoc.document_type,
          signed_at: new Date().toISOString(),
        },
      ];
      setSignatures(newSignatures);

      if (newSignatures.length === documents.length) {
        onAllSigned();
      } else {
        const nextUnsigned = documents.findIndex(
          (doc, idx) =>
            idx > currentDocIndex &&
            !newSignatures.some((sig) => sig.document_type === doc.document_type)
        );
        if (nextUnsigned !== -1) {
          setCurrentDocIndex(nextUnsigned);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSigning(false);
    }
  }

  function isDocumentSigned(docType: string): boolean {
    return signatures.some((sig) => sig.document_type === docType);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-600">Loading legal documents...</div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center p-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">No legal documents available.</p>
      </div>
    );
  }

  const currentDoc = documents[currentDocIndex];
  const allSigned = signatures.length === documents.length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">Legal Document Review</h2>
                <p className="text-orange-500 text-sm">
                  {signatures.length} of {documents.length} documents signed
                </p>
              </div>
            </div>
            <div className="text-right text-white">
              <div className="text-3xl font-bold">{signatures.length}/{documents.length}</div>
            </div>
          </div>
        </div>

        <div className="flex border-b border-gray-200">
          {documents.map((doc, idx) => (
            <button
              key={doc.id}
              onClick={() => setCurrentDocIndex(idx)}
              className={`flex-1 px-4 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                currentDocIndex === idx
                  ? 'bg-gray-800 text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {isDocumentSigned(doc.document_type) ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{doc.title.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mx-6 mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentDoc.title}</h3>
            {isDocumentSigned(currentDoc.document_type) && (
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Signed on{' '}
                {new Date(
                  signatures.find((s) => s.document_type === currentDoc.document_type)?.signed_at ||
                    ''
                ).toLocaleDateString()}
              </div>
            )}
          </div>

          <div
            className="prose max-w-none bg-gray-50 rounded-lg p-6 border border-gray-200 max-h-96 overflow-y-auto"
            style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
            onContextMenu={(e) => e.preventDefault()}
            dangerouslySetInnerHTML={{ __html: currentDoc.content }}
          />

          <div className="mt-6 p-4 bg-rose-50 border border-yellow-600 rounded-lg">
            <p className="text-sm text-yellow-900">
              <strong>Notice:</strong> This document is view-only and cannot be downloaded. By
              clicking "I Agree and Sign" below, you are providing your legally binding electronic
              signature to this document.
            </p>
          </div>

          {!isDocumentSigned(currentDoc.document_type) && (
            <div className="mt-6 flex gap-4">
              <button
                onClick={handleSign}
                disabled={signing}
                className="flex-1 px-6 py-4 bg-orange-600 text-white font-bold text-lg rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
              >
                {signing ? (
                  'Signing...'
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    I Agree and Sign
                  </>
                )}
              </button>
            </div>
          )}

          {allSigned && (
            <div className="mt-6 text-center p-6 bg-green-50 border-2 border-green-200 rounded-lg">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                All Documents Signed!
              </h4>
              <p className="text-gray-600">
                Thank you for completing the legal requirements. Your request is now being processed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
