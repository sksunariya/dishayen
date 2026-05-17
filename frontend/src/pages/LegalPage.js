import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../utils/api';

const LegalPage = ({ settingKey, title, icon: Icon }) => {
  const [content, setContent]         = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [enabled, setEnabled]         = useState(false);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res  = await api.get(`/settings/${settingKey}`);
        const data = res.data.value;
        if (data && typeof data === 'object') {
          setContent(data.content   || '');
          setEnabled(data.enabled   ?? false);
          setLastUpdated(data.updatedAt || null);
        }
      } catch (error) {
        console.error(`Error fetching ${settingKey}:`, error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [settingKey]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  const unavailable = !enabled || !content;

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-surface">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-500/10 rounded-full">
                <Icon className="w-10 h-10 text-neon-blue" />
              </div>
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-3">{title}</h1>
            {lastUpdated && !unavailable && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Last updated:{' '}
                {new Date(lastUpdated).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            )}
          </div>

          {/* Content card */}
          <div className="bg-white dark:bg-dark-elevated rounded-2xl border border-gray-200 dark:border-dark-border shadow-lg overflow-hidden">
            {unavailable ? (
              <div className="text-center py-20 px-8">
                <Icon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  {title} has not been published yet.
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  Please check back later.
                </p>
              </div>
            ) : (
              <div className="legal-readonly-quill">
                <ReactQuill
                  value={content}
                  readOnly
                  theme="snow"
                  modules={{ toolbar: false }}
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <style>{`
        .legal-readonly-quill .ql-toolbar { display: none; }

        /* Light */
        .legal-readonly-quill .ql-container {
          border: none; font-size: 15px; font-family: inherit; background: #ffffff;
        }
        .legal-readonly-quill .ql-editor {
          padding: 40px 48px; line-height: 1.8; color: #1f2937;
          min-height: unset; cursor: default;
        }
        .legal-readonly-quill .ql-editor h1,
        .legal-readonly-quill .ql-editor h2,
        .legal-readonly-quill .ql-editor h3,
        .legal-readonly-quill .ql-editor h4 {
          color: #111827; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em;
        }
        .legal-readonly-quill .ql-editor p  { margin-bottom: 1em; color: #374151; }
        .legal-readonly-quill .ql-editor a  { color: #667eea; }
        .legal-readonly-quill .ql-editor ul,
        .legal-readonly-quill .ql-editor ol { padding-left: 1.5em; margin-bottom: 1em; }
        .legal-readonly-quill .ql-editor li { margin-bottom: 0.25em; color: #374151; }
        .legal-readonly-quill .ql-editor blockquote {
          border-left: 4px solid #667eea; padding-left: 1em; color: #6b7280; margin: 1em 0;
        }

        /* Dark */
        .dark .legal-readonly-quill .ql-container { background: #2a2a2a; }
        .dark .legal-readonly-quill .ql-editor    { color: #e5e7eb; }
        .dark .legal-readonly-quill .ql-editor h1,
        .dark .legal-readonly-quill .ql-editor h2,
        .dark .legal-readonly-quill .ql-editor h3,
        .dark .legal-readonly-quill .ql-editor h4 { color: #f9fafb; }
        .dark .legal-readonly-quill .ql-editor p  { color: #d1d5db; }
        .dark .legal-readonly-quill .ql-editor li { color: #d1d5db; }
        .dark .legal-readonly-quill .ql-editor blockquote { color: #9ca3af; }

        @media (max-width: 640px) {
          .legal-readonly-quill .ql-editor { padding: 24px 20px; }
        }
      `}</style>
    </div>
  );
};

export default LegalPage;
