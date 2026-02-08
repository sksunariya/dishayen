import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiYoutube, FiPlay, FiBell, FiPlus, FiTrash2, FiEdit2, FiX, FiLink } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const SiteSettings = () => {
  const [demoVideoUrl, setDemoVideoUrl] = useState('');
  const [movingNotifications, setMovingNotifications] = useState([]);
  const [notificationSpeed, setNotificationSpeed] = useState(5); // Default speed: 5 (medium)
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingLink, setEditingLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingNotification, setSavingNotification] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [videoResponse, notificationResponse, speedResponse] = await Promise.allSettled([
        api.get('/settings/demoVideoUrl'),
        api.get('/settings/movingNotification'),
        api.get('/settings/movingNotificationSpeed')
      ]);
      
      if (videoResponse.status === 'fulfilled') {
        setDemoVideoUrl(videoResponse.value.data.value || '');
      } else {
        console.log('Demo video setting not found');
      }
      
      if (notificationResponse.status === 'fulfilled') {
        const value = notificationResponse.value.data.value || '';
        // Handle both string (legacy), object, and array formats
        if (Array.isArray(value)) {
          // Normalize to object format
          const normalized = value.map(n => {
            if (typeof n === 'string') {
              return { text: n, link: null };
            }
            return {
              text: n.text || n,
              link: n.link || null
            };
          }).filter(n => n.text && n.text.trim() !== '');
          setMovingNotifications(normalized);
        } else if (typeof value === 'string' && value.trim() !== '') {
          // Convert legacy string to array
          setMovingNotifications([{ text: value, link: null }]);
        } else {
          setMovingNotifications([]);
        }
      } else {
        // Setting doesn't exist yet, that's fine
        if (notificationResponse.reason?.response?.status !== 404) {
          console.error('Error fetching notification:', notificationResponse.reason);
        }
        setMovingNotifications([]);
      }

      if (speedResponse.status === 'fulfilled') {
        const speed = speedResponse.value.data.value;
        // Speed should be between 1-10, default to 5
        if (speed && speed >= 1 && speed <= 10) {
          setNotificationSpeed(speed);
        }
      }
    } catch (error) {
      console.error('Fetch settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/demoVideoUrl', { value: demoVideoUrl });
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotification = async () => {
    setSavingNotification(true);
    try {
      // Filter out empty notifications and normalize format
      const validNotifications = movingNotifications
        .filter(n => {
          if (typeof n === 'string') {
            return n && n.trim() !== '';
          }
          return n && n.text && n.text.trim() !== '';
        })
        .map(n => {
          if (typeof n === 'string') {
            return { text: n, link: null };
          }
          return {
            text: n.text || n,
            link: n.link || null
          };
        });
      
      await Promise.all([
        api.put('/settings/movingNotification', { value: validNotifications }),
        api.put('/settings/movingNotificationSpeed', { value: notificationSpeed })
      ]);
      toast.success('Notifications and speed saved successfully!');
      // Clear session storage so notification appears immediately
      sessionStorage.removeItem('notificationDismissed');
    } catch (error) {
      console.error('Save notification error:', error);
      toast.error('Failed to save notifications');
    } finally {
      setSavingNotification(false);
    }
  };

  const handleAddNotification = () => {
    setMovingNotifications([...movingNotifications, { text: '', link: '' }]);
    setEditingIndex(movingNotifications.length);
    setEditingText('');
    setEditingLink('');
  };

  const handleEditNotification = (index) => {
    setEditingIndex(index);
    const notif = movingNotifications[index];
    if (typeof notif === 'string') {
      setEditingText(notif);
      setEditingLink('');
    } else {
      setEditingText(notif.text || '');
      setEditingLink(notif.link || '');
    }
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      const updated = [...movingNotifications];
      updated[editingIndex] = {
        text: editingText.trim(),
        link: editingLink.trim() || null
      };
      setMovingNotifications(updated);
      setEditingIndex(null);
      setEditingText('');
      setEditingLink('');
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingText('');
    setEditingLink('');
  };

  const handleDeleteNotification = (index) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      const updated = movingNotifications.filter((_, i) => i !== index);
      setMovingNotifications(updated);
      if (editingIndex === index) {
        setEditingIndex(null);
        setEditingText('');
      }
    }
  };

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYouTubeVideoId(demoVideoUrl);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-surface">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold gradient-text mb-8">Site Settings</h1>

          {/* Demo Video Section */}
          <div className="bg-white dark:bg-dark-elevated p-8 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg mb-6">
            <div className="flex items-center gap-3 mb-6">
              <FiYoutube className="w-8 h-8 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Demo Video</h2>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                YouTube Video URL
              </label>
              <input
                type="url"
                value={demoVideoUrl}
                onChange={(e) => setDemoVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                This video will be displayed on the homepage hero section
              </p>
            </div>

            {/* Video Preview */}
            {videoId && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FiPlay className="w-5 h-5" />
                  Preview
                </h3>
                <div className="relative rounded-xl overflow-hidden shadow-lg">
                  <div className="relative pt-[56.25%]">
                    <iframe
                      className="absolute top-0 left-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title="Demo Video Preview"
                      frameBorder="0"
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FiSave className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>

          {/* Moving Notification Section */}
          <div className="bg-white dark:bg-dark-elevated p-8 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FiBell className="w-8 h-8 text-neon-blue" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Moving Notifications</h2>
              </div>
              <button
                onClick={handleAddNotification}
                className="px-4 py-2 bg-neon-blue text-white rounded-lg hover:bg-neon-purple transition-colors flex items-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                Add Notification
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Add multiple notification messages that will scroll across the top of all pages. They will be displayed in sequence.
            </p>

            {/* Notification List */}
            {movingNotifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FiBell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No notifications added yet. Click "Add Notification" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {movingNotifications.map((notification, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border"
                  >
                    {editingIndex === index ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Notification Text
                          </label>
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            placeholder="Enter notification text..."
                            rows={2}
                            className="w-full px-4 py-2 bg-white dark:bg-dark-elevated border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white resize-none"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                            <FiLink className="w-3 h-3" />
                            Link URL (Optional)
                          </label>
                          <input
                            type="url"
                            value={editingLink}
                            onChange={(e) => setEditingLink(e.target.value)}
                            placeholder="https://example.com (leave empty for no link)"
                            className="w-full px-4 py-2 bg-white dark:bg-dark-elevated border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            If provided, the notification text will be clickable and open in a new tab
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                          >
                            <FiSave className="w-4 h-4" />
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                          >
                            <FiX className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-dark-border px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                            {typeof notification === 'object' && notification.link && (
                              <span className="text-xs text-neon-blue flex items-center gap-1">
                                <FiLink className="w-3 h-3" />
                                Has Link
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900 dark:text-white">
                            {typeof notification === 'string' ? notification : (notification.text || '(Empty)')}
                          </p>
                          {typeof notification === 'object' && notification.link && (
                            <a 
                              href={notification.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-neon-blue hover:underline mt-1 block"
                            >
                              {notification.link}
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditNotification(index)}
                            className="p-2 text-neon-blue hover:bg-blue-100 dark:hover:bg-dark-border rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNotification(index)}
                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-dark-border rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Speed Control */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Notification Speed
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-16">Slow</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={notificationSpeed}
                    onChange={(e) => setNotificationSpeed(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 dark:bg-dark-border rounded-lg appearance-none cursor-pointer accent-neon-blue"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-16 text-right">Fast</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Current Speed: <span className="font-semibold text-gray-900 dark:text-white">{notificationSpeed}/10</span>
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {notificationSpeed <= 3 ? 'Slow' : notificationSpeed <= 7 ? 'Medium' : 'Fast'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Adjust the speed of the scrolling notification. Lower values = slower, higher values = faster.
              </p>
            </div>

            {/* Preview */}
            {movingNotifications.length > 0 && movingNotifications.some(n => {
              const text = typeof n === 'string' ? n : (n.text || '');
              return text && text.trim() !== '';
            }) && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Preview:</h3>
                <div className="bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink text-white py-2 px-4 rounded overflow-hidden">
                  <div className="flex animate-scroll whitespace-nowrap">
                    {movingNotifications
                      .filter(n => {
                        const text = typeof n === 'string' ? n : (n.text || '');
                        return text && text.trim() !== '';
                      })
                      .map((notification, index) => {
                        const text = typeof notification === 'string' ? notification : notification.text;
                        const link = typeof notification === 'object' ? notification.link : null;
                        return (
                          <React.Fragment key={index}>
                            {link ? (
                              <a 
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block px-4 font-medium text-sm underline hover:text-white/80"
                              >
                                {text}
                              </a>
                            ) : (
                              <span className="inline-block px-4 font-medium text-sm">
                                {text}
                              </span>
                            )}
                            <span className="inline-block px-4 font-medium text-sm text-white/50">
                              •
                            </span>
                          </React.Fragment>
                        );
                      })}
                    {/* Duplicate for seamless loop */}
                    {movingNotifications
                      .filter(n => {
                        const text = typeof n === 'string' ? n : (n.text || '');
                        return text && text.trim() !== '';
                      })
                      .map((notification, index) => {
                        const text = typeof notification === 'string' ? notification : notification.text;
                        const link = typeof notification === 'object' ? notification.link : null;
                        return (
                          <React.Fragment key={`dup-${index}`}>
                            {link ? (
                              <a 
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block px-4 font-medium text-sm underline hover:text-white/80"
                              >
                                {text}
                              </a>
                            ) : (
                              <span className="inline-block px-4 font-medium text-sm">
                                {text}
                              </span>
                            )}
                            <span className="inline-block px-4 font-medium text-sm text-white/50">
                              •
                            </span>
                          </React.Fragment>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-6">
              <button
                onClick={handleSaveNotification}
                disabled={savingNotification || movingNotifications.length === 0}
                className="w-full px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FiSave className="w-5 h-5" />
                {savingNotification ? 'Saving...' : 'Save All Notifications'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SiteSettings;

