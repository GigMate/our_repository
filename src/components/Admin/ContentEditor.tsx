import { useState, useEffect } from 'react';
import { Edit3, Save, Plus, Trash2, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ContentPage {
  id: string;
  page_name: string;
  slug: string;
  title: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

interface ContentBlock {
  id: string;
  page_id: string;
  section_key: string;
  content: string;
  content_type: 'text' | 'html' | 'markdown';
  display_order: number;
}

export default function ContentEditor() {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [content, setContent] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    if (selectedPage) {
      loadContent(selectedPage);
    }
  }, [selectedPage]);

  const loadPages = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('site_content_pages')
        .select('*')
        .order('page_name');

      if (fetchError) throw fetchError;
      setPages(data || []);
      if (data && data.length > 0 && !selectedPage) {
        setSelectedPage(data[0].id);
      }
    } catch (err) {
      console.error('Error loading pages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const loadContent = async (pageId: string) => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('site_content')
        .select('*')
        .eq('page_id', pageId)
        .order('display_order');

      if (fetchError) throw fetchError;
      setContent(data || []);
    } catch (err) {
      console.error('Error loading content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load content');
    }
  };

  const saveContent = async (blockId: string, newContent: string) => {
    try {
      setSaving(true);
      setError(null);
      const { error: updateError } = await supabase
        .from('site_content')
        .update({ content: newContent, updated_at: new Date().toISOString() })
        .eq('id', blockId);

      if (updateError) throw updateError;

      setContent(prev =>
        prev.map(block =>
          block.id === blockId ? { ...block, content: newContent } : block
        )
      );
    } catch (err) {
      console.error('Error saving content:', err);
      setError(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const addNewBlock = async () => {
    if (!selectedPage) return;

    try {
      setSaving(true);
      setError(null);
      const maxOrder = Math.max(...content.map(b => b.display_order), 0);

      const { data, error: insertError } = await supabase
        .from('site_content')
        .insert({
          page_id: selectedPage,
          section_key: `section_${Date.now()}`,
          content: 'New content block',
          content_type: 'text',
          display_order: maxOrder + 1,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      if (data) {
        setContent(prev => [...prev, data]);
      }
    } catch (err) {
      console.error('Error adding block:', err);
      setError(err instanceof Error ? err.message : 'Failed to add block');
    } finally {
      setSaving(false);
    }
  };

  const deleteBlock = async (blockId: string) => {
    if (!confirm('Are you sure you want to delete this content block?')) return;

    try {
      setSaving(true);
      setError(null);
      const { error: deleteError } = await supabase
        .from('site_content')
        .delete()
        .eq('id', blockId);

      if (deleteError) throw deleteError;
      setContent(prev => prev.filter(block => block.id !== blockId));
    } catch (err) {
      console.error('Error deleting block:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete block');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading content editor...</div>
      </div>
    );
  }

  const currentPage = pages.find(p => p.id === selectedPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Content Editor</h2>
          <p className="text-gray-600 mt-1">Manage site content and pages</p>
        </div>
        <button
          onClick={addNewBlock}
          disabled={!selectedPage || saving}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-5 w-5" />
          <span>Add Content Block</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1 bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Pages</h3>
          <div className="space-y-2">
            {pages.map(page => (
              <button
                key={page.id}
                onClick={() => setSelectedPage(page.id)}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  selectedPage === page.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">{page.page_name}</span>
                </div>
                <div className="text-xs opacity-75 mt-1">/{page.slug}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-3 space-y-4">
          {currentPage && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900">{currentPage.title}</h3>
              {currentPage.description && (
                <p className="text-gray-600 mt-2">{currentPage.description}</p>
              )}
            </div>
          )}

          {content.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No content blocks yet</p>
              <button
                onClick={addNewBlock}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Add your first content block
              </button>
            </div>
          ) : (
            content.map(block => (
              <ContentBlockEditor
                key={block.id}
                block={block}
                onSave={saveContent}
                onDelete={deleteBlock}
                saving={saving}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ContentBlockEditor({
  block,
  onSave,
  onDelete,
  saving,
}: {
  block: ContentBlock;
  onSave: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  saving: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(block.content);

  const handleSave = async () => {
    await onSave(block.id, editedContent);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-500">
            {block.section_key}
          </span>
          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
            {block.content_type}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
              <button
                onClick={() => {
                  setEditedContent(block.content);
                  setIsEditing(false);
                }}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => onDelete(block.id)}
                disabled={saving}
                className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        />
      ) : (
        <div className="prose max-w-none">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded">
            {block.content}
          </pre>
        </div>
      )}
    </div>
  );
}
