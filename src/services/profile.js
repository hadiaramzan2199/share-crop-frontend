import api from './api';

export const profileService = {
  // Get current user profile
  getProfile: () => api.get('/api/auth/me'),
  
  // Update profile (name, email)
  updateProfile: (data) => api.put('/api/auth/profile', data),
  
  // Change password
  changePassword: (data) => api.put('/api/auth/password', data),
};

export default profileService;

