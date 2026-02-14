import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const MovingNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [animationDuration, setAnimationDuration] = useState(6); // Default: 6 seconds (speed 5)

  const fetchNotification = useCallback(async () => {
    try {
      console.log('Fetching moving notification...');
      const [notificationResponse, speedResponse] = await Promise.allSettled([
        api.get('/settings/movingNotification'),
        api.get('/settings/movingNotificationSpeed')
      ]);

      // Handle notification data
      if (notificationResponse.status === 'fulfilled') {
        const value = notificationResponse.value.data.value || '';

        // Handle both array (new format) and string (legacy format)
        let notificationArray = [];
        if (Array.isArray(value)) {
          // Filter and normalize notifications
          notificationArray = value
            .filter(n => {
              if (typeof n === 'string') {
                return n && n.trim() !== '';
              }
              if (typeof n === 'object' && n !== null) {
                return n.text && n.text.trim() !== '';
              }
              return false;
            })
            .map(n => {
              // Normalize to object format for consistency
              if (typeof n === 'string') {
                return { text: n, link: null };
              }
              return {
                text: n.text || '',
                link: n.link || null
              };
            });
          console.log('Found array of notifications:', notificationArray);
        } else if (typeof value === 'string' && value.trim() !== '') {
          // Legacy: single string
          notificationArray = [{ text: value, link: null }];
          console.log('Found single string notification:', notificationArray);
        } else {
          console.log('No valid notification data found');
        }

        setNotifications(notificationArray);

        // Always show if notifications exist (permanent notification)
        const shouldShow = notificationArray.length > 0;
        setIsVisible(shouldShow);

        console.log('Notification visibility:', {
          hasNotifications: notificationArray.length > 0,
          shouldShow
        });

        if (shouldShow) {
          console.log('✅ Moving notifications will be displayed:', notificationArray);
        } else {
          console.log('❌ Moving notifications will NOT be displayed. Reason: No notifications set');
        }
      } else {
        if (notificationResponse.reason?.response?.status !== 404) {
          console.error('Error fetching notification:', notificationResponse.reason);
        }
        setNotifications([]);
        setIsVisible(false);
      }

      // Handle speed setting
      if (speedResponse.status === 'fulfilled') {
        const speed = speedResponse.value.data.value || 5; // Default to 5 if not set
        // Speed is 1-10, convert to duration in seconds
        // Using formula: duration = 30 / speed
        // This gives: Speed 1 = 30s, Speed 5 = 6s, Speed 10 = 3s
        // For very fast: duration = 25 / speed (Speed 10 = 2.5s)
        const duration = Math.max(2, Math.min(30, 30 / speed));
        setAnimationDuration(duration);
        console.log('Notification speed:', speed, '→ Duration:', duration, 'seconds');
      } else {
        // Default speed if not set
        setAnimationDuration(6); // Default: 6 seconds for speed 5
        console.log('Using default speed (5) → Duration: 6 seconds');
      }
    } catch (error) {
      console.error('❌ Error fetching notification:', error);
      setIsVisible(false);
      setNotifications([]);
      setAnimationDuration(6); // Default duration
    } finally {
      setLoading(false);
      console.log('Notification fetch completed. Loading:', false);
    }
  }, []);

  useEffect(() => {
    // Fetch notification on mount
    fetchNotification();

    // Refresh notification when window regains focus (useful after admin updates)
    const handleFocus = () => {
      fetchNotification();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchNotification]);

  // Add/remove body padding and update CSS variable when notification is visible
  useEffect(() => {
    if (isVisible && notifications.length > 0) {
      // Set CSS custom property for notification height
      document.documentElement.style.setProperty('--notification-height', '40px');
      document.body.style.paddingTop = '40px';
      console.log('✅ Notification visible - added body padding');
    } else {
      document.documentElement.style.setProperty('--notification-height', '0px');
      document.body.style.paddingTop = '0';
      console.log('❌ Notification hidden - removed body padding');
    }

    // Cleanup on unmount
    return () => {
      document.documentElement.style.setProperty('--notification-height', '0px');
      document.body.style.paddingTop = '0';
    };
  }, [isVisible, notifications.length]);



  // Debug logging
  useEffect(() => {
    console.log('MovingNotification render state:', {
      loading,
      isVisible,
      notificationsCount: notifications.length,
      notifications
    });
  }, [loading, isVisible, notifications]);

  // Don't render anything while loading or if not visible
  if (loading) {
    console.log('⏳ Notification component: Still loading...');
    return null;
  }

  if (!isVisible) {
    console.log('👁️ Notification component: Not visible (isVisible=false)');
    return null;
  }

  if (notifications.length === 0) {
    console.log('📭 Notification component: No notifications to display');
    return null;
  }

  console.log('✅ Rendering notification component with', notifications.length, 'notifications');

  // Ensure URLs have a protocol so they don't resolve as relative paths
  const normalizeUrl = (url) => {
    if (!url) return url;
    if (!/^https?:\/\//i.test(url)) {
      return 'https://' + url;
    }
    return url;
  };

  // Normalize notification format (handle both string and object formats)
  const normalizeNotifications = (notifs) => {
    return notifs.map(notif => {
      if (typeof notif === 'string') {
        return { text: notif, link: null };
      }
      return {
        text: notif.text || notif,
        link: notif.link || null
      };
    });
  };

  // Create content array for seamless loop
  const renderNotificationContent = () => {
    const normalized = normalizeNotifications(notifications);
    const content = [];
    normalized.forEach((notification, index) => {
      const textElement = notification.link ? (
        <a
          href={normalizeUrl(notification.link)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 font-medium text-sm md:text-base underline hover:text-white/80 transition-colors"
          style={{
            willChange: 'transform',
            transform: 'translateZ(0)'
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {notification.text}
        </a>
      ) : (
        <span
          className="inline-block px-4 font-medium text-sm md:text-base"
          style={{
            willChange: 'transform',
            transform: 'translateZ(0)'
          }}
        >
          {notification.text}
        </span>
      );

      content.push(
        <React.Fragment key={`text-${index}`}>
          {textElement}
        </React.Fragment>
      );

      if (index < normalized.length - 1) {
        content.push(
          <span
            key={`sep-${index}`}
            className="inline-block px-4 font-medium text-sm md:text-base text-white/50"
            style={{
              willChange: 'transform',
              transform: 'translateZ(0)'
            }}
          >
            •
          </span>
        );
      }
    });
    return content;
  };

  // Convert animationDuration (seconds) to marquee scrollamount (pixels per frame)
  // Lower duration = faster scroll. scrollamount ~= 180 / duration gives a good range.
  const scrollAmount = Math.max(2, Math.round(180 / animationDuration));

  return (
    <div
      className="fixed top-0 left-0 right-0 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink text-white py-2 overflow-hidden border-b border-white/20 z-[60] shadow-md"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        width: '100%'
      }}
    >
      <marquee
        direction="left"
        scrollamount={scrollAmount}
        behavior="scroll"
        onMouseOver={(e) => e.currentTarget.stop()}
        onMouseOut={(e) => e.currentTarget.start()}
        style={{ width: '100%' }}
      >
        {renderNotificationContent()}
      </marquee>
    </div>
  );
};

export default MovingNotification;

