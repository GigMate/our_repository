import { useState, useEffect } from 'react';
import { FileText, Plus, Edit2, Trash2, Check, X, Upload, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import AdminLogin from './AdminLogin';

interface LegalDocument {
  id: string;
  document_type: string;
  title: string;
  content: string;
  version: string;
  is_active: boolean;
  requires_consent: boolean;
  created_at: string;
}

interface UserConsent {
  id: string;
  user_id: string;
  document_version: string;
  consent_given_at: string;
  signature_data: string | null;
  profiles: {
    full_name: string;
    email: string;
  };
}

export default function LegalDocumentManager() {
  const { user } = useAuth();
  const [authenticated, setAuthenticated] = useState(false);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<LegalDocument | null>(null);
  const [viewingConsents, setViewingConsents] = useState<string | null>(null);
  const [consents, setConsents] = useState<UserConsent[]>([]);
  const [formData, setFormData] = useState({
    document_type: 'nda',
    title: '',
    content: '',
    version: '1.0',
    requires_consent: true,
  });

  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin_authenticated') === 'true';
    setAuthenticated(isAuth);
    if (isAuth) {
      loadDocuments();
    }
  }, []);

  async function loadDocuments() {
    setLoading(true);
    const { data, error } = await supabase
      .from('legal_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading documents:', error);
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  }

  async function loadConsents(documentId: string) {
    const { data, error } = await supabase
      .from('user_legal_consents')
      .select(`
        *,
        profiles:user_id(full_name, email)
      `)
      .eq('document_id', documentId)
      .order('consent_given_at', { ascending: false });

    if (error) {
      console.error('Error loading consents:', error);
    } else {
      setConsents((data as any) || []);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const docData = {
      ...formData,
      is_active: true,
    };

    if (editingDoc) {
      const { error } = await supabase
        .from('legal_documents')
        .update(docData)
        .eq('id', editingDoc.id);

      if (error) {
        alert('Error updating document: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from('legal_documents')
        .insert(docData);

      if (error) {
        alert('Error creating document: ' + error.message);
        return;
      }
    }

    setShowAddForm(false);
    setEditingDoc(null);
    setFormData({
      document_type: 'nda',
      title: '',
      content: '',
      version: '1.0',
      requires_consent: true,
    });
    loadDocuments();
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('legal_documents')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      alert('Error updating status: ' + error.message);
    } else {
      loadDocuments();
    }
  }

  async function deleteDocument(id: string) {
    if (!confirm('Are you sure you want to delete this document? All associated consents will also be deleted.')) {
      return;
    }

    const { error } = await supabase
      .from('legal_documents')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error deleting document: ' + error.message);
    } else {
      loadDocuments();
    }
  }

  function handleEdit(doc: LegalDocument) {
    setEditingDoc(doc);
    setFormData({
      document_type: doc.document_type,
      title: doc.title,
      content: doc.content,
      version: doc.version,
      requires_consent: doc.requires_consent,
    });
    setShowAddForm(true);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFormData({ ...formData, content });
    };
    reader.readAsText(file);
  }

  if (!authenticated) {
    return <AdminLogin onAuthenticated={() => setAuthenticated(true)} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Legal Documents Manager</h1>
          <p className="text-gray-600 mt-1">Manage NDAs, beta agreements, and terms of service</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingDoc(null);
            setFormData({
              document_type: 'nda',
              title: '',
              content: '',
              version: '1.0',
              requires_consent: true,
            });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Document
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingDoc ? 'Edit Document' : 'Add New Document'}
              </h2>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type
                </label>
                <select
                  value={formData.document_type}
                  onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="nda">Non-Disclosure Agreement (NDA)</option>
                  <option value="beta_agreement">Beta Testing Agreement</option>
                  <option value="terms_of_service">Terms of Service</option>
                  <option value="privacy_policy">Privacy Policy</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1.0, 2.1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Content
                </label>
                <div className="mb-2">
                  <label className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer inline-flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Text File
                    <input
                      type="file"
                      accept=".txt,.md"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  rows={15}
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requires_consent"
                  checked={formData.requires_consent}
                  onChange={(e) => setFormData({ ...formData, requires_consent: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="requires_consent" className="text-sm text-gray-700">
                  Require digital signature
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingDoc ? 'Update Document' : 'Create Document'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingConsents && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">User Consents</h2>
              <button onClick={() => setViewingConsents(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {consents.length === 0 ? (
              <p className="text-gray-600">No consents recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {consents.map((consent) => (
                  <div key={consent.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{consent.profiles.full_name}</p>
                        <p className="text-sm text-gray-600">{consent.profiles.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Version: {consent.document_version} |
                          Signed: {new Date(consent.consent_given_at).toLocaleString()}
                        </p>
                      </div>
                      {consent.signature_data && (
                        <button
                          onClick={() => {
                            const img = new Image();
                            img.src = consent.signature_data!;
                            const w = window.open('');
                            w?.document.write(img.outerHTML);
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View Signature
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <FileText className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">{doc.title}</h3>
                    <span className="px-2 py-0.5 bg-gray-700 text-blue-800 text-xs rounded-full">
                      v{doc.version}
                    </span>
                    {doc.is_active ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 capitalize">{doc.document_type.replace('_', ' ')}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Created: {new Date(doc.created_at).toLocaleDateString()}
                    {doc.requires_consent && ' • Requires Signature'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setViewingConsents(doc.id);
                    loadConsents(doc.id);
                  }}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:bg-gray-800 rounded-lg flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  View Consents
                </button>
                <button
                  onClick={() => handleEdit(doc)}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(doc.id, doc.is_active)}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  {doc.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => deleteDocument(doc.id)}
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
              <p className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                {doc.content.substring(0, 300)}...
              </p>
            </div>
          </div>
        ))}

        {documents.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No legal documents yet. Add your first document to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
