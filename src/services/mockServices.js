// Mock services to simulate API responses with farm location data
import { mockFarms, getPurchasedFarms, getAvailableFarms, toggleFarmPurchase } from '../data/mockFarms';
import { USER_ROLES } from '../utils/roles';

// Mock delay to simulate network requests
const mockDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock response wrapper
const mockResponse = (data) => ({ data });

// Mock Product Service (now representing farms)
export const mockProductService = {
  getProducts: async () => {
    await mockDelay();
    return mockResponse({ products: mockFarms });
  },
  
  getProduct: async (id) => {
    await mockDelay();
    const product = mockFarms.find(f => f.id === parseInt(id));
    return mockResponse({ product });
  },
  
  createProduct: async (productData) => {
    await mockDelay();
    const newProduct = {
      id: mockFarms.length + 1,
      ...productData,
      isPurchased: false
    };
    mockFarms.push(newProduct);
    return mockResponse({ product: newProduct });
  },
  
  updateProduct: async (id, productData) => {
    await mockDelay();
    const index = mockFarms.findIndex(f => f.id === parseInt(id));
    if (index !== -1) {
      mockFarms[index] = { ...mockFarms[index], ...productData };
      return mockResponse({ product: mockFarms[index] });
    }
    throw new Error('Product not found');
  },
  
  deleteProduct: async (id) => {
    await mockDelay();
    const index = mockFarms.findIndex(f => f.id === parseInt(id));
    if (index !== -1) {
      mockFarms.splice(index, 1);
      return mockResponse({ success: true });
    }
    throw new Error('Product not found');
  },
  
  getAvailableProducts: async (params) => {
    await mockDelay();
    return mockResponse({ products: getAvailableFarms() });
  },
  
  getProductsByField: async (fieldId) => {
    await mockDelay();
    // For now, return all products since we don't have field association
    return mockResponse({ products: mockFarms });
  },
  
  getProductsByLocation: async (lat, lng, radius = 50) => {
    await mockDelay();
    // Simple distance calculation (not accurate but good for demo)
    const nearbyProducts = mockFarms.filter(farm => {
      const [farmLng, farmLat] = farm.coordinates;
      const distance = Math.sqrt(
        Math.pow(farmLat - lat, 2) + Math.pow(farmLng - lng, 2)
      );
      return distance <= radius;
    });
    return mockResponse({ products: nearbyProducts });
  },
  
  purchaseProduct: async (id) => {
    await mockDelay();
    const farm = toggleFarmPurchase(id);
    return mockResponse({ product: farm });
  }
};

// Mock Field Service
export const mockFieldService = {
  getFields: async () => {
    await mockDelay();
    // Mock fields data
    const fields = [
      {
        id: 1,
        name: "North Field",
        area_m2: 10000,
        description: "Main production field",
        coordinates: [151.2093, -33.8688]
      },
      {
        id: 2,
        name: "South Field",
        area_m2: 8000,
        description: "Secondary field for rotation",
        coordinates: [144.9631, -37.8136]
      }
    ];
    return mockResponse({ fields });
  },
  
  getField: async (id) => {
    await mockDelay();
    const field = { id, name: `Field ${id}`, area_m2: 5000 };
    return mockResponse({ field });
  },
  
  createField: async (fieldData) => {
    await mockDelay();
    const newField = { id: Date.now(), ...fieldData };
    return mockResponse({ field: newField });
  },
  
  updateField: async (id, fieldData) => {
    await mockDelay();
    const updatedField = { id, ...fieldData };
    return mockResponse({ field: updatedField });
  },
  
  deleteField: async (id) => {
    await mockDelay();
    return mockResponse({ success: true });
  },
  
  getAllFields: async () => {
    await mockDelay();
    return mockResponse({ fields: [] });
  }
};

// Mock Order Service
// Mock orders data
const mockOrders = [
  {
    id: 1,
    product_name: 'Green Valley Organic Farm - Wheat',
    name: 'Green Valley Organic Farm - Wheat',
    farmer_name: 'Ahmad Ali',
    location: 'Punjab, Pakistan',
    area_rented: 250,
    area: 250,
    crop_type: 'Wheat',
    total_cost: 12500,
    cost: 12500,
    price_per_unit: 50,
    monthly_rent: 2500,
    status: 'active',
    start_date: '2024-01-15',
    end_date: '2024-07-15',
    progress: 65,
    created_at: '2024-01-15T10:00:00Z',
    date: '2024-01-15T10:00:00Z',
    image: '/api/placeholder/300/200',
    last_update: '2024-01-10',
    notes: 'Premium organic wheat cultivation with sustainable farming practices.'
  },
  {
    id: 2,
    product_name: 'Sunrise Rice Fields - Basmati',
    name: 'Sunrise Rice Fields - Basmati',
    farmer_name: 'Fatima Khan',
    location: 'Sindh, Pakistan',
    area_rented: 180,
    area: 180,
    crop_type: 'Rice',
    total_cost: 10800,
    cost: 10800,
    price_per_unit: 60,
    monthly_rent: 1800,
    status: 'confirmed',
    start_date: '2024-02-01',
    end_date: '2024-08-01',
    progress: 40,
    created_at: '2024-02-01T09:30:00Z',
    date: '2024-02-01T09:30:00Z',
    image: '/api/placeholder/300/200',
    last_update: '2024-01-08',
    notes: 'High-quality Basmati rice with traditional farming methods.'
  },
  {
    id: 3,
    product_name: 'Golden Harvest Corn Fields',
    name: 'Golden Harvest Corn Fields',
    farmer_name: 'Hassan Sheikh',
    location: 'KPK, Pakistan',
    area_rented: 320,
    area: 320,
    crop_type: 'Corn',
    total_cost: 9600,
    cost: 9600,
    price_per_unit: 30,
    monthly_rent: 1600,
    status: 'completed',
    start_date: '2023-10-01',
    end_date: '2024-03-01',
    progress: 100,
    created_at: '2023-10-01T08:00:00Z',
    date: '2023-10-01T08:00:00Z',
    image: '/api/placeholder/300/200',
    last_update: '2024-03-01',
    notes: 'Sweet corn variety with excellent yield and quality.'
  },
  {
    id: 4,
    product_name: 'Mountain View Vegetable Farm',
    name: 'Mountain View Vegetable Farm',
    farmer_name: 'Ali Raza',
    location: 'Balochistan, Pakistan',
    area_rented: 150,
    area: 150,
    crop_type: 'Mixed Vegetables',
    total_cost: 9000,
    cost: 9000,
    price_per_unit: 60,
    monthly_rent: 1500,
    status: 'pending',
    start_date: '2024-03-01',
    end_date: '2024-09-01',
    progress: 0,
    created_at: '2024-02-25T14:20:00Z',
    date: '2024-02-25T14:20:00Z',
    image: '/api/placeholder/300/200',
    last_update: '2024-02-25',
    notes: 'Diverse vegetable cultivation including tomatoes, onions, and peppers.'
  },
  {
    id: 5,
    product_name: 'Desert Bloom Cotton Farm',
    name: 'Desert Bloom Cotton Farm',
    farmer_name: 'Zara Ahmed',
    location: 'Punjab, Pakistan',
    area_rented: 400,
    area: 400,
    crop_type: 'Cotton',
    total_cost: 16000,
    cost: 16000,
    price_per_unit: 40,
    monthly_rent: 2667,
    status: 'cancelled',
    start_date: '2024-01-01',
    end_date: '2024-07-01',
    progress: 0,
    created_at: '2023-12-20T11:45:00Z',
    date: '2023-12-20T11:45:00Z',
    image: '/api/placeholder/300/200',
    last_update: '2024-01-05',
    notes: 'High-grade cotton cultivation - cancelled due to weather concerns.'
  }
];

export const mockOrderService = {
  createOrder: async (orderData) => {
    await mockDelay();
    const newOrder = {
      id: Date.now(),
      ...orderData,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    mockOrders.push(newOrder);
    return mockResponse({ order: newOrder });
  },
  
  getBuyerOrders: async () => {
    await mockDelay();
    return mockResponse({ orders: mockOrders });
  },
  
  getFarmerOrders: async () => {
    await mockDelay();
    const orders = getPurchasedFarms().map(farm => ({
      id: farm.id,
      farm_name: farm.name,
      buyer_name: "Mock Buyer",
      area_m2: farm.area_m2,
      total_price: farm.area_m2 * farm.price_per_m2,
      status: 'completed',
      created_at: new Date().toISOString()
    }));
    return mockResponse({ orders });
  },
  
  updateOrderStatus: async (id, status) => {
    await mockDelay();
    return mockResponse({ order: { id, status } });
  },
  
  getOrder: async (id) => {
    await mockDelay();
    const order = { id, status: 'completed' };
    return mockResponse({ order });
  },
  
  cancelOrder: async (id) => {
    await mockDelay();
    return mockResponse({ success: true });
  }
};

// Mock User Service
export const mockUserService = {
  getProfile: async () => {
    await mockDelay();
    const user = {
      id: 1,
      name: "John Farmer",
      email: "john@farm.com",
      user_type: USER_ROLES.FARMER,
      farm_coins: 1250
    };
    return mockResponse({ user });
  },
  
  updateProfile: async (userData) => {
    await mockDelay();
    return mockResponse({ user: userData });
  },
  
  changePassword: async (passwordData) => {
    await mockDelay();
    return mockResponse({ success: true });
  },
  
  getBalance: async () => {
    await mockDelay();
    return mockResponse({ balance: 1250 });
  },
  
  getTransactions: async (params) => {
    await mockDelay();
    const transactions = [
      {
        id: 1,
        type: 'purchase',
        amount: -500,
        description: 'Farm purchase',
        created_at: new Date().toISOString()
      }
    ];
    return mockResponse({ transactions });
  },
  
  deposit: async (amount) => {
    await mockDelay();
    return mockResponse({ balance: 1250 + amount });
  }
};

// Mock Auth Service
export const mockAuthService = {
  login: async (email, password) => {
    // In a real application, this would authenticate with a backend.
    // For now, we'll simulate a successful login.
    if (email === 'farmer@example.com' && password === 'password') {
      const user = {
        id: '1',
        name: 'Farmer John',
        email: 'farmer@example.com',
        user_type: USER_ROLES.FARMER,
        avatar: 'https://i.pravatar.cc/150?img=3',
      };
      // localStorage.setItem('user', JSON.stringify(user)); // Deprecated
      // localStorage.setItem('token', 'mock-jwt-token-farmer'); // Deprecated
      return { user, token: 'mock-jwt-token-farmer' };
    } else if (email === 'buyer@example.com' && password === 'password') {
      const user = {
        id: '2',
        name: 'Buyer Jane',
        email: 'buyer@example.com',
        user_type: USER_ROLES.BUYER,
        avatar: 'https://i.pravatar.cc/150?img=4',
      };
      // localStorage.setItem('user', JSON.stringify(user)); // Deprecated
      // localStorage.setItem('token', 'mock-jwt-token-buyer'); // Deprecated
      return { user, token: 'mock-jwt-token-buyer' };
    } else if (email === 'admin@example.com' && password === 'password') {
      const user = {
        id: '3',
        name: 'Admin User',
        email: 'admin@example.com',
        user_type: USER_ROLES.ADMIN,
        avatar: 'https://i.pravatar.cc/150?img=5',
      };
      // localStorage.setItem('user', JSON.stringify(user)); // Deprecated
      // localStorage.setItem('token', 'mock-jwt-token-admin'); // Deprecated
      return { user, token: 'mock-jwt-token-admin' };
    }
    throw new Error('Invalid credentials');
  },
  
  register: async (userData) => {
    await mockDelay();
    const user = {
      id: Date.now(),
      ...userData
    };
    const token = "mock-jwt-token";
    return mockResponse({ user, token });
  },
  
  getProfile: async () => {
    await mockDelay();
    // In a real application, this would fetch the user profile from a backend.
    // For now, we'll return a mock user.
    // localStorage.getItem('user') is deprecated. User data will be managed by a future backend or in-memory.
    return {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      user_type: USER_ROLES.FARMER,
      avatar: 'https://i.pravatar.cc/150?img=1',
    };
  },
  
  updateProfile: async (userData) => {
    await mockDelay();
    return mockResponse({ user: userData });
  },
  
  changePassword: async (passwordData) => {
    await mockDelay();
    return mockResponse({ success: true });
  }
};