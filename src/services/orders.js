import api from './api';

export const orderService = {
  // Create a new order
  createOrder: (orderData) => api.post('/api/orders', orderData),
  
  getAllOrders: (params) => api.get('/api/orders', { params }),

  // Get orders for buyer
  getBuyerOrders: () => api.get('/api/orders/my-orders'),
  
  // Get orders for buyer with field details
  getBuyerOrdersWithFields: (buyerId) => api.get(`/api/orders/buyer/${buyerId}`),
  
  // Get orders for farmer
  getFarmerOrders: (farmerId) => api.get(`/api/orders/farmer-orders?farmerId=${farmerId}`),
  
  // Update order status
  updateOrderStatus: (id, status) => api.put(`/api/orders/${id}/status`, { status }),
  
  // Get specific order details
  getOrder: (id) => api.get(`/api/orders/${id}`),
  
  // Cancel order
  cancelOrder: (id) => api.delete(`/api/orders/${id}`),
};
