import { useState, useCallback, useEffect, useRef } from 'react';
import notificationsService from '../services/notifications';
import { useAuth } from '../contexts/AuthContext';

const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [backendNotifications, setBackendNotifications] = useState([]);
  const { user } = useAuth();
  // Track which notifications we've already dismissed locally
  const dismissedNotificationIds = useRef(new Set());

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const addNotification = useCallback((message, type = 'success', duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      duration,
    };

    setNotifications(prev => [...prev, notification]);

    // Note: Auto-remove is now handled by NotificationSystem component
    // This keeps the timeout logic centralized and prevents conflicts

    return id;
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Fetch backend notifications
  const fetchBackendNotifications = useCallback(async () => {
    if (user && user.id) {
      try {
        const userNotifications = await notificationsService.getUserNotifications(user.id);
        // Filter out notifications that have been dismissed locally
        const filteredNotifications = Array.isArray(userNotifications)
          ? userNotifications.filter(notif => !dismissedNotificationIds.current.has(notif.id))
          : [];
        setBackendNotifications(filteredNotifications);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user.id to prevent infinite loops

  // Mark backend notification as read
  // Note: We only update local state since the backend endpoint may not exist
  const markNotificationAsRead = useCallback(async (notificationId) => {
    // Mark as dismissed locally so it won't reappear on next fetch
    dismissedNotificationIds.current.add(notificationId);

    // Update local state to mark as read
    setBackendNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );

    // Optionally try to call API, but don't fail if it doesn't exist
    try {
      await notificationsService.markAsRead(notificationId);
    } catch (error) {
      // Silently ignore - we've already updated local state
      // The notification is already marked as read in UI and won't reappear
    }
  }, []);

  // Fetch notifications when user changes
  useEffect(() => {
    fetchBackendNotifications();
  }, [fetchBackendNotifications]);

  // Poll for new notifications every 30 seconds for real-time updates (reduced from 5s to avoid spam)
  useEffect(() => {
    if (user && user.id) {
      const interval = setInterval(() => {
        fetchBackendNotifications();
      }, 30000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, fetchBackendNotifications]); // fetchBackendNotifications is now stable

  // Auto-dismiss backend notifications after 4 seconds
  // Note: We mark them as read locally, but don't call the API since the endpoint may not exist
  useEffect(() => {
    const timers = [];

    backendNotifications.forEach(notification => {
      if (!notification.read && !dismissedNotificationIds.current.has(notification.id)) {
        const timer = setTimeout(() => {
          // Mark as dismissed so it won't reappear
          dismissedNotificationIds.current.add(notification.id);
          // Just mark as read locally without API call to avoid 404 errors
          setBackendNotifications(prev =>
            prev.map(notif =>
              notif.id === notification.id ? { ...notif, read: true } : notif
            )
          );
        }, 4000);
        timers.push(timer);
      }
    });

    // Cleanup timers on unmount or when notifications change
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [backendNotifications]);

  return {
    notifications,
    backendNotifications,
    addNotification,
    removeNotification,
    clearNotifications,
    fetchBackendNotifications,
    markNotificationAsRead
  };
};

export default useNotifications;