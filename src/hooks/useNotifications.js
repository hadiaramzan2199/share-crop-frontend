import { useState, useCallback, useEffect } from 'react';
import notificationsService from '../services/notifications';
import { useAuth } from '../contexts/AuthContext';

const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [backendNotifications, setBackendNotifications] = useState([]);
  const { user } = useAuth();

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

    // Auto-remove notification after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, [removeNotification]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Fetch backend notifications
  const fetchBackendNotifications = useCallback(async () => {
    if (user && user.id) {
      try {
        const userNotifications = await notificationsService.getUserNotifications(user.id);
        setBackendNotifications(userNotifications);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    }
  }, [user]);

  // Mark backend notification as read
  const markNotificationAsRead = useCallback(async (notificationId) => {
    try {
      await notificationsService.markAsRead(notificationId);
      setBackendNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Fetch notifications when user changes
  useEffect(() => {
    fetchBackendNotifications();
  }, [fetchBackendNotifications]);

  // Poll for new notifications every 5 seconds for real-time updates
  useEffect(() => {
    if (user && user.id) {
      const interval = setInterval(fetchBackendNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [user, fetchBackendNotifications]);

  // Auto-dismiss backend notifications after 4 seconds
  useEffect(() => {
    const timers = [];
    
    backendNotifications.forEach(notification => {
      if (!notification.read) {
        const timer = setTimeout(() => {
          markNotificationAsRead(notification.id);
        }, 4000);
        timers.push(timer);
      }
    });

    // Cleanup timers on unmount or when notifications change
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [backendNotifications, markNotificationAsRead]);

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