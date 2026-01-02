import api from './api';

export const adminService = {
  getAllUsers: () => api.get('/api/users'),
  getPendingFarmers: () => api.get('/api/admin/farmers/pending'),
  approveFarmer: (id) => api.patch(`/api/admin/farmers/${id}/approve`),
  rejectFarmer: (id, reason) => api.patch(`/api/admin/farmers/${id}/reject`, { reason }),
  getFarmerDocuments: (id) => api.get(`/api/admin/farmers/${id}/documents`),
  getProductionConsistency: () => api.get('/api/admin/production/consistency'),
  getComplaints: (params) => api.get('/api/admin/qa/complaints', { params }),
  updateComplaintStatus: (id, status) => api.patch(`/api/admin/qa/complaints/${id}`, { status }),
  updateComplaintRemarks: (id, remarks) => api.patch(`/api/admin/qa/complaints/${id}/remarks`, { remarks }),
  getProfitByCategory: (params) => api.get('/api/admin/analytics/profit-by-category', { params }),
  getFarmerPerformance: (params) => api.get('/api/admin/analytics/farmers/performance', { params }),
  getReviewsSummary: (params) => api.get('/api/admin/analytics/reviews/summary', { params }),
  getNewUserRegistrations: (params) => api.get('/api/admin/notifications/users/new', { params }),
  getPendingFarmerApprovals: (params) => api.get('/api/admin/notifications/farmers/pending', { params }),
  getCoinPurchases: (params) => api.get('/api/admin/coins/purchases', { params }),
  getCoinTransactions: (params) => api.get('/api/admin/coins/transactions', { params }),
  getPayments: (params) => api.get('/api/admin/payments', { params }),
  getAuditLogs: (params) => api.get('/api/admin/audit/logs', { params }),
  getNotificationsOverview: (params) => api.get('/api/admin/notifications/overview', { params }),
};
