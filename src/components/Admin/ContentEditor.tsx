import { useState, useEffect } from 'react';
import { FileText, Save, RotateCcw, Eye, History, Search, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ContentItem {
  id: string;
  page_key: string;
  section_key: string;
  content_type: string;
  content: string;
  metadata: any;
  updated_at: string;
}

interface ContentHistory {
  id: string;
  old_content: string;
  new_content: string;
  updated_at: string;
  updated_by: string;
}

export default function ContentEditor() {
  const [pages, setPages] = useState<string[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>('homepage');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [history, setHistory] = useState<ContentHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadPages();
    loadContent(selectedPage);
  }, [selectedPage]);

  const loadPages = async () => {
    const { data, error } = await supabase
      .from('site_content')
      .select('page_key')
      .order('page_key');

    if (!error && data) {
      const uniquePages = [...new Set(data.map(item => item.page_key))];
      setPages(uniquePages);
    }
  };

  const loadContent = async (pageKey: string) => {
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .eq('page_key', pageKey)
      .order('section_key');

    if (!error && data) {
      setContent(data);
      // Initialize edited content
      const initial: Record<string, string> = {};
      data.forEach(item => {
        initial[item.id] = item.content;
      });
      setEditedContent(initial);
    }
  };

  const handleContentChange = (id: string, value: string) => {
    setEditedContent(prev => ({ ...prev, [id]: value }));
  };

  const saveContent = async (id: string) => {
    setSaving(id);

    const { error } = await supabase
      .from('site_content')
      .update({ content: editedContent[id] })
      .eq('id', id);

    if (!error) {
      setSuccessMessage('Content saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadContent(selectedPage);
    }

    setSaving(null);
  };

  const resetContent = (id: string) => {
    const original = content.find(item => item.id === id);
    if (original) {
      setEditedContent(prev => ({ ...prev, [id]: original.content }));
    }
  };

  const loadHistory = async (contentId: string) => {
    const { data, error } = await supabase
      .from('content_history')
      .select('*')
      .eq('content_id', contentId)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setHistory(data);
      setShowHistory(contentId);
    }
  };

  const restoreFromHistory = async (contentId: string, oldContent: string) => {
    const { error } = await supabase
      .from('site_content')
      .update({ content: oldContent })
      .eq('id', contentId);

    if (!error) {
      setSuccessMessage('Content restored from history!');
      setTimeout(() => setSuccessMessage(null), 3000);
      setShowHistory(null);
      await loadContent(selectedPage);
    }
  };

  const filteredContent = content.filter(item =>
    item.section_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasChanges = (id: string) => {
    const original = content.find(item => item.id === id);
    return original && original.content !== editedContent[id];
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50 animate-fadeIn">
          <CheckCircle className="h-5 w-5" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Content Editor</h2>
            <p className="text-gray-600 mt-1">Edit all site content directly - no code required</p>
          </div>
          <FileText className="h-8 w-8 text-blue-600" />
        </div>

        {/* Page Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Page</label>
          <div className="flex flex-wrap gap-2">
            {pages.map(page => (
              <button
                key={page}
                onClick={() => setSelectedPage(page)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {page.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search content..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content Items */}
        <div className="space-y-4">
          {filteredContent.map(item => (
            <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {item.section_key.replace(/_/g, ' ').toUpperCase()}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Type: {item.content_type} |
                    Last updated: {new Date(item.updated_at).toLocaleDateString()}
                    {item.metadata?.max_length && ` | Max length: ${item.metadata.max_length} chars`}
                  </p>
                </div>
                <button
                  onClick={() => loadHistory(item.id)}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  <History className="h-4 w-4" />
                  <span>History</span>
                </button>
              </div>

              {item.content_type === 'html' ? (
                <textarea
                  value={editedContent[item.id] || ''}
                  onChange={(e) => handleContentChange(item.id, e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              ) : (
                <textarea
                  value={editedContent[item.id] || ''}
                  onChange={(e) => handleContentChange(item.id, e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}

              {item.metadata?.max_length && (
                <p className={`text-xs mt-1 ${
                  (editedContent[item.id]?.length || 0) > item.metadata.max_length
                    ? 'text-red-600 font-semibold'
                    : 'text-gray-500'
                }`}>
                  {editedContent[item.id]?.length || 0} / {item.metadata.max_length} characters
                </p>
              )}

              <div className="flex items-center space-x-2 mt-3">
                <button
                  onClick={() => saveContent(item.id)}
                  disabled={!hasChanges(item.id) || saving === item.id}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    hasChanges(item.id)
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Save className="h-4 w-4" />
                  <span>{saving === item.id ? 'Saving...' : 'Save Changes'}</span>
                </button>

                {hasChanges(item.id) && (
                  <button
                    onClick={() => resetContent(item.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Reset</span>
                  </button>
                )}

                {item.content_type === 'html' && (
                  <button
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                    onClick={() => {
                      const preview = window.open('', '_blank');
                      if (preview) {
                        preview.document.write(editedContent[item.id] || '');
                        preview.document.close();
                      }
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    <span>Preview</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredContent.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No content found matching your search.</p>
          </div>
        )}
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Content History</h3>
                <button
                  onClick={() => setShowHistory(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {history.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No history available yet.</p>
              ) : (
                <div className="space-y-4">
                  {history.map(item => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(item.updated_at).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => restoreFromHistory(showHistory, item.old_content)}
                          className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        >
                          Restore
                        </button>
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-600 font-medium mb-1">Previous:</p>
                        <p className="bg-white p-2 rounded border border-gray-300 mb-2">{item.old_content}</p>
                        <p className="text-gray-600 font-medium mb-1">Changed to:</p>
                        <p className="bg-white p-2 rounded border border-gray-300">{item.new_content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
