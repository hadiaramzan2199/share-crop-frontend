import api from './api';

const fieldsService = {
  getAll: () => api.get('/api/fields'),
  getById: (id) => api.get(`/api/fields/${id}`),
  create: (data) => api.post('/api/fields', data),
  update: (id, data) => api.put(`/api/fields/${id}`, data),
  remove: (id) => api.delete(`/api/fields/${id}`),
};

export default fieldsService;