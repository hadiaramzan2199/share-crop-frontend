import api from './api';

const farmsService = {
  getAll: (ownerId = null) => {
    const url = ownerId ? `/api/farms?owner_id=${ownerId}` : '/api/farms';
    return api.get(url);
  },
  getById: (id) => api.get(`/api/farms/${id}`),
  create: (data) => api.post('/api/farms', data),
  update: (id, data) => api.put(`/api/farms/${id}`, data),
  remove: (id) => api.delete(`/api/farms/${id}`),
};

export default farmsService;