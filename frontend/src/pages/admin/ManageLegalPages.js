import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiShield, FiEye, FiEdit2, FiInfo, FiFileText, FiLock } from 'react-icons/fi';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const POLICIES = [
  { key: 'privacyPolicy',   label: 'Privacy Policy',   icon: FiShield,   route: '/privacy' },
  { key: 'termsOfService',  label: 'Terms of Service',  icon: FiFileText, route: '/terms'   },
  { key: 'cookiePolicy',    label: 'Cookie Policy',     icon: FiLock,     route: '/cookies' },
];

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

const emptyPolicy = () => ({ content: '', enabled: false, lastUpdated: null, saving: false });

const ManageLegalPages = () => {
  const [loading, setLoading]           = useState(true);
  const [activePolicy, setActivePolicy] = useState('privacyPolicy');
  const [activeTab, setActiveTab]       = useState('editor');
  const [policies, setPolicies]         = useState({
    privacyPolicy:  emptyPolicy(),
    termsOfService: emptyPolicy(),
    cookiePolicy:   emptyPolicy(),
  });

  const quillRefs = {
    privacyPolicy:  useRef(null),
    termsOfService: useRef(null),
    cookiePolicy:   useRef(null),
  };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const results = await Promise.allSettled(
      POLICIES.map(p => api.get(`/settings/${p.key}`))
    );
    const next = { ...policies };
    results.forEach((r, i) => {
      const key = POLICIES[i].key;
      if (r.status === 'fulfilled') {
        const val = r.value.data.value;
        if (val && typeof val === 'object') {
          next[key] = {
            content:     val.content     || '',
            enabled:     val.enabled     ?? false,
            lastUpdated: val.updatedAt   || null,
            saving:      false,
          };
        }
      }
    });
    setPolicies(next);
    setLoading(false);
  };

  const updateContent = (key, value) =>
    setPolicies(prev => ({ ...prev, [key]: { ...prev[key], content: value } }));

  const toggleEnabled = (key) =>
    setPolicies(prev => ({ ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled } }));

  const handleSave = async (key) => {
    setPolicies(prev => ({ ...prev, [key]: { ...prev[key], saving: true } }));
    try {
      await api.put(`/settings/${key}`, {
        value: {
          content:   policies[key].content,
          enabled:   policies[key].enabled,
          updatedAt: new Date().toISOString(),
        },
      });
      const now = new Date().toISOString();
      setPolicies(prev => ({ ...prev, [key]: { ...prev[key], saving: false, lastUpdated: now } }));
      const label = POLICIES.find(p => p.key === key)?.label;
      toast.success(`${label} saved successfully!`);
    } catch (error) {
      console.error('Save error:', error);
      const label = POLICIES.find(p => p.key === key)?.label;
      setPolicies(prev => ({ ...prev, [key]: { ...prev[key], saving: false } }));
      toast.error(`Failed to save ${label}`);
    }
  };

  const switchPolicy = (key) => {
    setActivePolicy(key);
    setActiveTab('editor');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  const current = policies[activePolicy];
  const currentMeta = POLICIES.find(p => p.key === activePolicy);

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-surface">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Page header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold gradient-text">Legal Pages</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Manage Privacy Policy, Terms of Service, and Cookie Policy
              </p>
            </div>
            <button
              onClick={() => handleSave(activePolicy)}
              disabled={current.saving}
              className="px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FiSave className="w-5 h-5" />
              {current.saving ? 'Saving...' : `Save ${currentMeta?.label}`}
            </button>
          </div>

          {/* Policy selector tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {POLICIES.map(p => {
              const Icon = p.icon;
              const isActive = activePolicy === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => switchPolicy(p.key)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors border ${
                    isActive
                      ? 'bg-gradient-primary text-white border-transparent shadow-md'
                      : 'bg-white dark:bg-dark-elevated text-gray-600 dark:text-gray-400 border-gray-200 dark:border-dark-border hover:border-neon-blue'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {p.label}
                  {policies[p.key].enabled && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 ml-1" title="Enabled" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Info banner */}
          <div className="mb-5 flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-700 dark:text-blue-300 text-sm">
            <FiInfo className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              Enable a page to show its link in the footer. Users can only access it if it's enabled.
              The public URL is <strong>{currentMeta?.route}</strong>.
            </p>
          </div>

          {/* Enable / Disable toggle — shown per active policy */}
          <div className="mb-4 flex items-center justify-between bg-white dark:bg-dark-elevated rounded-xl border border-gray-200 dark:border-dark-border px-5 py-4 shadow-sm">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                Show in footer
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                {current.enabled
                  ? `${currentMeta?.label} link is visible in the footer`
                  : `${currentMeta?.label} link is hidden from the footer`}
              </p>
            </div>
            <button
              onClick={() => toggleEnabled(activePolicy)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                current.enabled ? 'bg-neon-blue' : 'bg-gray-300 dark:bg-dark-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  current.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Editor / Preview tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === 'editor'
                  ? 'bg-neon-blue text-white'
                  : 'bg-white dark:bg-dark-elevated text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-border hover:border-neon-blue'
              }`}
            >
              <FiEdit2 className="w-4 h-4" />
              Editor
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === 'preview'
                  ? 'bg-neon-blue text-white'
                  : 'bg-white dark:bg-dark-elevated text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-border hover:border-neon-blue'
              }`}
            >
              <FiEye className="w-4 h-4" />
              Preview
            </button>
            {current.lastUpdated && (
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 self-center">
                Last saved: {new Date(current.lastUpdated).toLocaleString()}
              </span>
            )}
          </div>

          {/* Editor card — all 3 editors always mounted to prevent blank-on-switch bug */}
          <div className="bg-white dark:bg-dark-elevated rounded-xl border border-gray-200 dark:border-dark-border shadow-lg overflow-hidden">
            {POLICIES.map(p => (
              <React.Fragment key={p.key}>
                {/* Editor panel */}
                <div
                  style={{ display: activePolicy === p.key && activeTab === 'editor' ? 'block' : 'none' }}
                  className="privacy-quill-editor"
                >
                  <ReactQuill
                    ref={quillRefs[p.key]}
                    theme="snow"
                    value={policies[p.key].content}
                    onChange={(val) => updateContent(p.key, val)}
                    modules={{ toolbar: toolbarOptions }}
                    placeholder={`Write your ${p.label} here...`}
                  />
                </div>

                {/* Preview panel */}
                <div style={{ display: activePolicy === p.key && activeTab === 'preview' ? 'block' : 'none' }}>
                  {policies[p.key].content ? (
                    <div className="ql-snow">
                      <div
                        className="ql-editor privacy-preview-content"
                        dangerouslySetInnerHTML={{ __html: policies[p.key].content }}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                      <FiEye className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p>Nothing to preview yet. Switch to Editor and write your {p.label}.</p>
                    </div>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Bottom save */}
          <div className="mt-6">
            <button
              onClick={() => handleSave(activePolicy)}
              disabled={current.saving}
              className="w-full px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FiSave className="w-5 h-5" />
              {current.saving ? 'Saving...' : `Save ${currentMeta?.label}`}
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

export default ManageLegalPages;
