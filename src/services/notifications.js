import api from './api';

const notificationsService = {
  getAll: async () => {
    try {
      const response = await api.get('/api/notifications');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/api/notifications/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (notificationData) => {
    try {
      const response = await api.post('/api/notifications', notificationData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id, notificationData) => {
    try {
      const response = await api.put(`/api/notifications/${id}`, notificationData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  remove: async (id) => {
    try {
      const response = await api.delete(`/api/notifications/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUserNotifications: async (userId) => {
    try {
      const response = await api.get(`/api/notifications/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  markAsRead: async (id) => {
    try {
      const response = await api.patch(`/api/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default notificationsService;