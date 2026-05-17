import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiShield, FiEye, FiEdit2, FiInfo } from 'react-icons/fi';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const toolbarOptions = [
  [{ header: [1, 2, 3, 4, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  ['blockquote', 'code-block'],
  ['link'],
  [{ align: [] }],
  [{ color: [] }, { background: [] }],
  ['clean'],
];

const ManagePrivacyPolicy = () => {
  const [content, setContent] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('editor');
  const quillRef = useRef(null);

  useEffect(() => {
    fetchPrivacyPolicy();
  }, []);

  const fetchPrivacyPolicy = async () => {
    try {
      const response = await api.get('/settings/privacyPolicy');
      const data = response.data.value;
      if (data && typeof data === 'object') {
        setContent(data.content || '');
        setLastUpdated(data.updatedAt || null);
      }
    } catch (error) {
      console.error('Error fetching privacy policy:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/privacyPolicy', {
        value: {
          content,
          updatedAt: new Date().toISOString(),
        },
      });
      setLastUpdated(new Date().toISOString());
      toast.success('Privacy Policy saved successfully!');
    } catch (error) {
      console.error('Save privacy policy error:', error);
      toast.error('Failed to save Privacy Policy');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-surface">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <FiShield className="w-8 h-8 text-neon-blue" />
              <div>
                <h1 className="text-4xl font-bold gradient-text">Privacy Policy</h1>
                {lastUpdated && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    Last saved: {new Date(lastUpdated).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FiSave className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Policy'}
            </button>
          </div>

          {/* Info banner */}
          <div className="mb-6 flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-700 dark:text-blue-300 text-sm">
            <FiInfo className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              Write your Privacy Policy below. Click <strong>Save Policy</strong> to publish — changes are immediately visible to users at the <strong>/privacy</strong> page.
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTab('editor')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                tab === 'editor'
                  ? 'bg-neon-blue text-white'
                  : 'bg-white dark:bg-dark-elevated text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-border hover:border-neon-blue'
              }`}
            >
              <FiEdit2 className="w-4 h-4" />
              Editor
            </button>
            <button
              onClick={() => setTab('preview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                tab === 'preview'
                  ? 'bg-neon-blue text-white'
                  : 'bg-white dark:bg-dark-elevated text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-border hover:border-neon-blue'
              }`}
            >
              <FiEye className="w-4 h-4" />
              Preview
            </button>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-dark-elevated rounded-xl border border-gray-200 dark:border-dark-border shadow-lg overflow-hidden">

            {/* Editor — always mounted, hidden via CSS when on preview tab */}
            <div style={{ display: tab === 'editor' ? 'block' : 'none' }} className="privacy-quill-editor">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={setContent}
                modules={{ toolbar: toolbarOptions }}
                placeholder="Write your Privacy Policy here..."
              />
            </div>

            {/* Preview — always mounted, hidden via CSS when on editor tab */}
            <div style={{ display: tab === 'preview' ? 'block' : 'none' }}>
              {content ? (
                <div className="ql-snow">
                  <div
                    className="ql-editor privacy-preview-content"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                  <FiEye className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>Nothing to preview yet. Switch to Editor and write your policy.</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom save */}
          <div className="mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FiSave className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Privacy Policy'}
            </button>
          </div>
        </motion.div>
      </div>

      <style>{`
        /* ── EDITOR – Light ── */
        .privacy-quill-editor .ql-toolbar {
          border: none;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
          padding: 12px 16px;
        }
        .privacy-quill-editor .ql-container {
          border: none;
          font-size: 15px;
          min-height: 460px;
          background: #ffffff;
        }
        .privacy-quill-editor .ql-editor {
          min-height: 460px;
          padding: 24px 28px;
          line-height: 1.75;
          color: #1f2937;
        }
        .privacy-quill-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }

        /* ── EDITOR – Dark ── */
        .dark .privacy-quill-editor .ql-toolbar {
          background: #1a1a1a;
          border-color: #333333;
        }
        .dark .privacy-quill-editor .ql-toolbar .ql-stroke { stroke: #9ca3af; }
        .dark .privacy-quill-editor .ql-toolbar .ql-fill   { fill:   #9ca3af; }
        .dark .privacy-quill-editor .ql-toolbar .ql-picker-label,
        .dark .privacy-quill-editor .ql-toolbar .ql-picker-item { color: #9ca3af; }
        .dark .privacy-quill-editor .ql-toolbar button:hover .ql-stroke,
        .dark .privacy-quill-editor .ql-toolbar button.ql-active .ql-stroke { stroke: #667eea; }
        .dark .privacy-quill-editor .ql-toolbar button:hover .ql-fill,
        .dark .privacy-quill-editor .ql-toolbar button.ql-active .ql-fill   { fill:   #667eea; }
        .dark .privacy-quill-editor .ql-container { background: #2a2a2a; }
        .dark .privacy-quill-editor .ql-editor    { color: #e5e7eb; }
        .dark .privacy-quill-editor .ql-editor.ql-blank::before { color: #6b7280; }

        /* ── PREVIEW – Light ── */
        .privacy-preview-content {
          pointer-events: none;
          padding: 36px 40px !important;
          line-height: 1.8 !important;
          color: #1f2937 !important;
          min-height: unset !important;
          border: none !important;
          font-size: 15px;
          background: #ffffff;
        }
        .privacy-preview-content h1,
        .privacy-preview-content h2,
        .privacy-preview-content h3,
        .privacy-preview-content h4 {
          color: #111827 !important;
          font-weight: 700;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        .privacy-preview-content p  { margin-bottom: 1em; color: #374151; }
        .privacy-preview-content a  { color: #667eea; }
        .privacy-preview-content ul,
        .privacy-preview-content ol { padding-left: 1.5em; margin-bottom: 1em; }
        .privacy-preview-content li { margin-bottom: 0.25em; color: #374151; }
        .privacy-preview-content blockquote {
          border-left: 4px solid #667eea !important;
          padding-left: 1em;
          color: #6b7280;
          margin: 1em 0;
        }

        /* ── PREVIEW – Dark ── */
        .dark .privacy-preview-content             { color: #e5e7eb !important; background: #2a2a2a; }
        .dark .privacy-preview-content h1,
        .dark .privacy-preview-content h2,
        .dark .privacy-preview-content h3,
        .dark .privacy-preview-content h4          { color: #f9fafb !important; }
        .dark .privacy-preview-content p           { color: #d1d5db; }
        .dark .privacy-preview-content li          { color: #d1d5db; }
        .dark .privacy-preview-content blockquote  { color: #9ca3af; }

        @media (max-width: 640px) {
          .privacy-preview-content { padding: 20px 16px !important; }
        }
      `}</style>
    </div>
  );
};

export default ManagePrivacyPolicy;
