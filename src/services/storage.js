class StorageService {
  constructor() {
    this.STORAGE_KEYS = {
      USER_ORDERS: 'sharecrop_user_orders',
      USER_RENTED_FIELDS: 'sharecrop_user_rented_fields',
      USER_COINS: 'sharecrop_user_coins',
      CURRENT_USER: 'sharecrop_current_user',
      FARM_ORDERS: 'sharecrop_farm_orders',
      USER_NOTIFICATIONS: 'sharecrop_user_notifications'
    };
  }
}

export const storageService = new StorageService();
Object.assign(storageService, {
  // Generic storage methods
  setItem: (key, value) => {
    console.warn('localStorage is deprecated. setItem called for key:', key);
  },

  getItem: (key, defaultValue = null) => {
    console.warn('localStorage is deprecated. getItem called for key:', key);
    return defaultValue;
  },

  removeItem: (key) => {
    console.warn('localStorage is deprecated. removeItem called for key:', key);
  },

  // Farm-specific storage
  saveFarms: (farms) => {
    console.warn('localStorage is deprecated. saveFarms called.');
  },

  getFarms: () => {
    console.warn('localStorage is deprecated. getFarms called.');
    return [];
  },

  getFields: () => {
    console.warn('localStorage is deprecated. getFields called.');
    return [];
  },

  addFarm: (farm) => {
    console.warn('localStorage is deprecated. addFarm called.');
    return { ...farm, id: Date.now(), created_at: new Date().toISOString(), owner_id: storageService.getCurrentUserId() };
  },

  // Order-specific storage
  saveOrders: (orders) => {
    console.warn('localStorage is deprecated. saveOrders called.');
  },

  getOrders: () => {
    console.warn('localStorage is deprecated. getOrders called.');
    return [];
  },

  addOrder: (order) => {
    console.warn('localStorage is deprecated. addOrder called.');
    return { ...order, id: Date.now(), created_at: new Date().toISOString(), buyer_id: storageService.getCurrentUserId(), status: 'active' };
  },

  // Rented fields storage
  saveRentedFields: (rentedFields) => {
    console.warn('localStorage is deprecated. saveRentedFields called.');
  },

  getRentedFields: () => {
    console.warn('localStorage is deprecated. getRentedFields called.');
    return [];
  },

  addRentedField: (rentedField) => {
    console.warn('localStorage is deprecated. addRentedField called.');
    return { ...rentedField, id: Date.now(), rented_at: new Date().toISOString(), renter_id: storageService.getCurrentUserId() };
  },

  // User-specific data filtering
  getUserFarms: (userId = null) => {
    console.warn('localStorage is deprecated. getUserFarms called.');
    return [];
  },

  getUserOrders: (userId = null) => {
    console.warn('localStorage is deprecated. getUserOrders called.');
    return [];
  },

  getUserRentedFields: (userId = null) => {
    console.warn('localStorage is deprecated. getUserRentedFields called.');
    return [];
  },

  getFarmerCreatedFields: (userId = null) => {
    console.warn('localStorage is deprecated. getFarmerCreatedFields called.');
    return [];
  },

  // User authentication methods
  setCurrentUser: (user) => {
    console.warn('localStorage is deprecated. setCurrentUser called.');
  },

  getCurrentUser: () => {
    console.warn('localStorage is deprecated. getCurrentUser called.');
    return null;
  },

  // Test users for development
  getTestUsers: () => {
    console.warn('localStorage is deprecated. getTestUsers called.');
    return {
      farmer: {
        id: 'farmer_001',
        email: 'farmer@test.com',
        password: 'farmer123',
        type: 'farmer',
        name: 'John Farmer'
      },
      buyer: {
        id: 'buyer_001', 
        email: 'buyer@test.com',
        password: 'buyer123',
        type: 'buyer',
        name: 'Jane Buyer'
      }
    };
  },

  // Farm orders methods (orders placed by buyers to farmers)
  addFarmOrder: (order) => {
    console.warn('localStorage is deprecated. addFarmOrder called.');
    return { ...order, id: `farm_order_${Date.now()}`, createdAt: new Date().toISOString(), status: 'pending' };
  },

  getFarmOrders: (farmerId = null) => {
    console.warn('localStorage is deprecated. getFarmOrders called.');
    return [];
  },

  // Notification methods
  addNotification: (userId, notification) => {
    console.warn('localStorage is deprecated. addNotification called.');
  },

  getUserNotifications: (userId) => {
    console.warn('localStorage is deprecated. getUserNotifications called.');
    return [];
  },

  markNotificationAsRead: (userId, notificationId) => {
    console.warn('localStorage is deprecated. markNotificationAsRead called.');
  },

  // Clear all stored data
  clearAll: () => {
    console.warn('localStorage is deprecated. clearAll called.');
  },

  setupNotificationListener: (callback) => {
    console.warn('localStorage is deprecated. setupNotificationListener called.');
    return () => {};
  },

  // Get current user ID
  getCurrentUserId: () => {
    console.warn('localStorage is deprecated. getCurrentUserId called.');
    return null;
  }
});

export default storageService;
