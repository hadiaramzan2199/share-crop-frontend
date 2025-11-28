/**
 * Coin Service - Manages user-specific farmer coins using database
 * Provides coin management for users with real-time updates
 */

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:5000`}/api`;
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
      const response = await fetch(`${API_BASE_URL}/coins/${userId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return DEFAULT_COINS;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.coins || DEFAULT_COINS;
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
      const response = await fetch(`${API_BASE_URL}/coins/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coins: Math.max(0, coins) }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.coins;
    } catch (error) {
      console.error('Error setting user coins:', error);
      return DEFAULT_COINS;
    }
  }

  /**
   * Deduct coins from a user's balance
   * @param {string} userId - User ID
   * @param {number} amount - Amount to deduct
   * @returns {Promise<boolean>} - True if deduction was successful, false if insufficient funds
   */
  async deductCoins(userId, amount) {
    if (!userId || typeof amount !== 'number' || amount <= 0) {
      console.error('Invalid parameters for deductCoins');
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/coins/${userId}/deduct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        if (response.status === 400) {
          // Insufficient funds or invalid amount
          return false;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error deducting coins:', error);
      return false;
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
      const response = await fetch(`${API_BASE_URL}/coins/${userId}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.coins;
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
   * Get all users' coin data (for debugging/admin purposes)
   * @returns {object} - Placeholder for admin functionality
   */
  getAllCoinsData() {
    console.log('getAllCoinsData is not implemented for database version');
    return {};
  }

  /**
   * Clear all coin data (for testing/reset purposes)
   */
  clearAllCoins() {
    console.log('clearAllCoins is not implemented for database version');
  }
}

// Export a singleton instance
const coinService = new CoinService();
export default coinService;
