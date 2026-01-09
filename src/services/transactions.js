import api from './api';

export const transactionsService = {
  // Get transactions for current authenticated user
  getMyTransactions: () => api.get('/api/transactions'),
  
  // Get transactions for a specific user (admin only)
  getUserTransactions: (userId) => api.get(`/api/transactions/${userId}`),
  
  // Get all transactions (admin only, with optional filters)
  getAllTransactions: (params) => api.get('/api/transactions', { params }),
};

export default transactionsService;

