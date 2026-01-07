import api from './api';

export const complaintService = {
  // Create a new complaint
  createComplaint: (complaintData) => api.post('/api/complaints', complaintData),
  
  // Get all complaints for the current user
  getMyComplaints: (params) => api.get('/api/complaints', { params }),
  
  // Get a single complaint by ID
  getComplaint: (id) => api.get(`/api/complaints/${id}`),
  
  // Get complaints with optional filters
  getComplaints: (params) => {
    const queryParams = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.user_id) queryParams.user_id = params.user_id;
    if (params?.complained_against_user_id) queryParams.complained_against_user_id = params.complained_against_user_id;
    return api.get('/api/complaints', { params: queryParams });
  },
  
  // Get complaints against a specific user (for admin)
  getComplaintsAgainstUser: (userId) => api.get(`/api/complaints/against/${userId}`),
};

