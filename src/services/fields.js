import api from './api';

const fieldsService = {
  /** List current user's fields only (for My Fields page). */
  getAll: () => api.get('/api/fields'),
  /** List all fields for map (discovery, browse, buy). */
  getAllForMap: () => api.get('/api/fields/all'),
  /** List fields available for farmer to rent (other owners' fields). Farmer-only. */
  getAvailableToRent: () => api.get('/api/fields/available-to-rent'),
  getById: (id) => api.get(`/api/fields/${id}`),
  create: (data) => api.post('/api/fields', data),
  update: (id, data) => api.put(`/api/fields/${id}`, data),
  remove: (id) => api.delete(`/api/fields/${id}`),
};

export default fieldsService;