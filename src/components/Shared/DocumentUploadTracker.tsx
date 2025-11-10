import { useState, useEffect } from 'react';
import { FileText, Upload, CheckCircle, Clock, AlertCircle, Download, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Document {
  id: string;
  booking_id: string;
  document_type: string;
  file_url: string;
  file_name: string;
  uploaded_by: string;
  status: string;
  created_at: string;
  booking?: {
    venue?: {
      venue_name: string;
    };
    musician?: {
      stage_name: string;
    };
    event?: {
      title: string;
    };
  };
}

interface DocumentUploadTrackerProps {
  bookingId?: string;
  userType: 'musician' | 'venue';
}

export default function DocumentUploadTracker({ bookingId, userType }: DocumentUploadTrackerProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('contract');

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user, bookingId]);

  async function loadDocuments() {
    setLoading(true);

    let query = supabase
      .from('booking_documents')
      .select(`
        *,
        booking:bookings(
          venue:venues(venue_name),
          musician:musicians(stage_name),
          event:events(title)
        )
      `)
      .order('created_at', { ascending: false });

    if (bookingId) {
      query = query.eq('booking_id', bookingId);
    } else {
      query = query.eq('uploaded_by', user!.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading documents:', error);
    } else {
      setDocuments(data || []);
    }

    setLoading(false);
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  }

  async function handleUpload() {
    if (!selectedFile || !bookingId) {
      alert('Please select a file and ensure a booking is selected');
      return;
    }

    setUploading(true);

    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${user!.id}/${bookingId}/${Date.now()}.${fileExt}`;
    const filePath = `booking-documents/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, selectedFile);

    if (uploadError) {
      alert('Failed to upload file: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    const { error: insertError } = await supabase
      .from('booking_documents')
      .insert({
        booking_id: bookingId,
        document_type: documentType,
        file_url: urlData.publicUrl,
        file_name: selectedFile.name,
        uploaded_by: user!.id,
        status: 'pending_review'
      });

    if (insertError) {
      alert('Failed to save document record: ' + insertError.message);
    } else {
      setSelectedFile(null);
      loadDocuments();
    }

    setUploading(false);
  }

  async function updateDocumentStatus(documentId: string, status: string) {
    const { error } = await supabase
      .from('booking_documents')
      .update({ status })
      .eq('id', documentId);

    if (error) {
      alert('Failed to update status: ' + error.message);
    } else {
      loadDocuments();
    }
  }

  function getStatusBadge(status: string) {
    const configs = {
      pending_review: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: AlertCircle },
      expired: { label: 'Expired', color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    };

    const config = configs[status as keyof typeof configs] || configs.pending_review;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  }

  const documentTypes = [
    { value: 'contract', label: 'Performance Contract' },
    { value: 'insurance', label: 'Insurance Certificate' },
    { value: 'rider', label: 'Technical Rider' },
    { value: 'setlist', label: 'Setlist' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'receipt', label: 'Receipt' },
    { value: 'other', label: 'Other' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Document Management</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FileText className="w-4 h-4" />
          <span>{documents.length} Documents</span>
        </div>
      </div>

      {bookingId && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Upload Document</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File (Max 10MB)
              </label>
              <input
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              <Upload className="w-5 h-5" />
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {documents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Documents Yet</h4>
            <p className="text-gray-600">
              {bookingId
                ? 'Upload contracts, riders, and other documents for this booking'
                : 'Documents from your bookings will appear here'
              }
            </p>
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="bg-blue-100 rounded-lg p-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{doc.file_name}</h4>
                    <p className="text-sm text-gray-600 capitalize mb-2">
                      {doc.document_type.replace('_', ' ')}
                    </p>
                    {doc.booking && (
                      <p className="text-sm text-gray-500">
                        {doc.booking.event?.title || 'Booking'} - {' '}
                        {userType === 'venue'
                          ? doc.booking.musician?.stage_name
                          : doc.booking.venue?.venue_name
                        }
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Uploaded {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {getStatusBadge(doc.status)}
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View
                </a>
                <a
                  href={doc.file_url}
                  download={doc.file_name}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
                {doc.status === 'pending_review' && doc.uploaded_by !== user!.id && (
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => updateDocumentStatus(doc.id, 'approved')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateDocumentStatus(doc.id, 'rejected')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
