import api from './api';

const rentedFieldsService = {
  getAll: () => api.get('/api/rented-fields'),
  /** Current user's rentals (for farmer: fields I have rented). */
  getMyRentals: () => api.get('/api/rented-fields/my-rentals'),
  getById: (id) => api.get(`/api/rented-fields/${id}`),
  create: (data) => api.post('/api/rented-fields', data),
  update: (id, data) => api.put(`/api/rented-fields/${id}`, data),
  remove: (id) => api.delete(`/api/rented-fields/${id}`),
};

export default rentedFieldsService;