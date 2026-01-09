import api from './api';

export const userService = {
  // Get user profile
  getProfile: () => api.get('/api/users/profile'),
  
  // Update user profile
  updateProfile: (userData) => api.put('/api/users/profile', userData),
  
  // Change password
  changePassword: (passwordData) => api.put('/api/users/password', passwordData),
  
  // Get farm coins balance
  getBalance: () => api.get('/api/users/balance'),
  
  // Get transaction history
  getTransactions: (params) => api.get('/api/users/transactions', { params }),
  
  // Add farm coins (deposit)
  deposit: (amount) => api.post('/api/users/deposit', { amount }),
  
  // Get user names only (for security - no sensitive data)
  // This endpoint should only return: id, name, user_type
  getUserNames: (searchQuery = '') => {
    const params = searchQuery ? { search: searchQuery } : {};
    return api.get('/api/users/names', { params });
  },
};