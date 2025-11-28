const mockAuthService = {
  login: async (email, password) => {
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // In a real app, this would validate credentials against a backend
        // For now, we'll just simulate a successful login for any credentials
        // and return a mock user based on the email to simulate user type.
        const mockUser = {
          id: email === 'farmer@test.com' ? 'farmer_001' : 'buyer_001',
          email: email,
          type: email === 'farmer@test.com' ? 'farmer' : 'buyer',
          name: email === 'farmer@test.com' ? 'John Farmer' : 'Jane Buyer'
        };

        if (email && password) { // Simple check for mock login
          resolve({ user: mockUser, token: 'mock-jwt-token' });
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 1000);
    });
  },

  register: async (userData) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real app, this would create a new user in the backend
        // For now, we just return a mock user
        const newUser = {
          id: `user_${Date.now()}`,
          ...userData,
          type: userData.type || 'buyer', // Default to buyer if not specified
        };
        resolve({ user: newUser, token: 'mock-jwt-token' });
      }, 1000);
    });
  },

  logout: async () => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real app, this would clear server-side sessions or invalidate tokens
        resolve(true);
      }, 300);
    });
  },

  getCurrentUser: () => {
    // With no backend and no local storage, we cannot persist a user.
    // This will always return null, simulating a logged-out state.
    return null;
  },

  isAuthenticated: () => {
    // With no backend and no local storage, a user is never authenticated.
    return false;
  },

  getAuthToken: () => {
    // With no backend and no local storage, no token can be retrieved.
    return null;
  },

  getProfile: async () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // With no backend and no local storage, no user profile can be retrieved.
        reject(new Error('User not authenticated'));
      }, 500);
    });
  }
};

export default mockAuthService;