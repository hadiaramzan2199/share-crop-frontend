import api from './api';

const DEFAULT_COINS = 12500;

class CoinService {
  /**
   * Get coins for a specific user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - User's coin balance
   */
  async getUserCoins(userId) {
    if (!userId) {
      return DEFAULT_COINS;
    }

    try {
      const response = await api.get(`/api/coins/${userId}`);
      // Handle 0 coins properly (0 is falsy, so || would use DEFAULT_COINS incorrectly)
      if (response.data && typeof response.data.coins === 'number') {
        return response.data.coins;
      }
      return DEFAULT_COINS;
    } catch (error) {
      console.error('Error getting user coins:', error);
      return DEFAULT_COINS;
    }
  }

  /**
   * Set coins for a specific user
   * @param {string} userId - User ID
   * @param {number} coins - New coin balance
   * @returns {Promise<number>} - Updated coin balance
   */
  async setUserCoins(userId, coins) {
    if (!userId || typeof coins !== 'number') {
      console.error('Invalid parameters for setUserCoins');
      return DEFAULT_COINS;
    }

    try {
      const response = await api.put(`/api/coins/${userId}`, {
        coins: Math.max(0, coins)
      });
      return response.data.coins;
    } catch (error) {
      console.error('Error setting user coins:', error);
      return DEFAULT_COINS;
    }
  }

  /**
   * Deduct coins from a user's balance
   * @param {string} userId - User ID
   * @param {number} amount - Amount to deduct
   * @param {{ reason?: string, refType?: string, refId?: string }} opts - Optional transaction metadata
   * @returns {Promise<{ coins: number, deducted: number, balanceBefore: number, balanceAfter: number } | null>} - Response data or null on error
   */
  async deductCoins(userId, amount, opts = {}) {
    if (!userId || typeof amount !== 'number' || amount <= 0) {
      console.error('Invalid parameters for deductCoins');
      return null;
    }

    try {
      const response = await api.post(`/api/coins/${userId}/deduct`, { 
        amount,
        reason: opts.reason,
        refType: opts.refType,
        refId: opts.refId
      });
      return response.data;
    } catch (error) {
      console.error('Error deducting coins:', error);
      // Re-throw to allow caller to handle insufficient funds specifically
      if (error.response?.status === 400 && error.response?.data?.error === 'Insufficient coins') {
        throw error;
      }
      return null;
    }
  }

  /**
   * Add coins to a user's balance
   * @param {string} userId - User ID
   * @param {number} amount - Amount to add
   * @returns {Promise<number>} - Updated coin balance
   */
  async addCoins(userId, amount) {
    if (!userId || typeof amount !== 'number' || amount <= 0) {
      console.error('Invalid parameters for addCoins');
      return DEFAULT_COINS;
    }

    try {
      const response = await api.post(`/api/coins/${userId}/add`, { amount });
      return response.data.coins;
    } catch (error) {
      console.error('Error adding coins:', error);
      return DEFAULT_COINS;
    }
  }

  /**
   * Check if user has sufficient coins for a purchase
   * @param {string} userId - User ID
   * @param {number} amount - Amount to check
   * @returns {Promise<boolean>} - True if user has sufficient coins
   */
  async hasSufficientCoins(userId, amount) {
    if (!userId || typeof amount !== 'number' || amount <= 0) {
      return false;
    }

    try {
      const currentCoins = await this.getUserCoins(userId);
      return currentCoins >= amount;
    } catch (error) {
      console.error('Error checking sufficient coins:', error);
      return false;
    }
  }

  /**
   * Initialize coins for a new user (not needed with database default)
   * @param {string} userId - User ID
   * @returns {Promise<number>} - User's coin balance
   */
  async initializeUserCoins(userId) {
    if (!userId) {
      return DEFAULT_COINS;
    }

    // With database, users get default coins automatically
    return await this.getUserCoins(userId);
  }

  /**
   * Get coin packs for purchase
   * @returns {Promise<{ packs: Array<{ id, coins, usdCents, usd }> }>}
   */
  async getCoinPacks() {
    try {
      const response = await api.get('/api/coins/packs');
      return response.data;
    } catch (error) {
      console.error('Error fetching coin packs:', error);
      return {
        packs: [
          { id: 'pack_small', coins: 100, usdCents: 999, usd: '9.99' },
          { id: 'pack_medium', coins: 500, usdCents: 4499, usd: '44.99' },
          { id: 'pack_large', coins: 1200, usdCents: 9999, usd: '99.99' },
        ],
      };
    }
  }

  /**
   * Create a purchase intent (redirects to Stripe Checkout)
   * @param {string} packId - Pack id from getCoinPacks()
   * @param {{ successUrl?: string, cancelUrl?: string, pack?: { name?: string, coins?: number, usd?: string } }} opts - Optional return URLs and pack details for Stripe line_items
   * @returns {Promise<{ url: string }>} - Redirect to url
   */
  async createPurchaseIntent(packId, opts = {}) {
    const body = { pack_id: packId };
    if (opts.successUrl) body.success_url = opts.successUrl;
    if (opts.cancelUrl) body.cancel_url = opts.cancelUrl;
    // Send pack details so backend can show product name and breakdown on Stripe Checkout page
    if (opts.pack) {
      if (opts.pack.name != null) body.pack_name = opts.pack.name;
      if (opts.pack.coins != null) body.pack_coins = opts.pack.coins;
      if (opts.pack.usd != null) body.pack_usd = opts.pack.usd;
    }
    const response = await api.post('/api/coins/purchase-intent', body);
    return response.data;
  }

  /**
   * Get all users' coin data (for debugging/admin purposes)
   * @returns {object} - Placeholder for admin functionality
   */
  getAllCoinsData() {
    return {};
  }

  /**
   * Clear all coin data (for testing/reset purposes)
   */
  clearAllCoins() {
  }
}

// Export a singleton instance
const coinService = new CoinService();
export default coinService;
