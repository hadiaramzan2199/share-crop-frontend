import api from './api';

class RedemptionService {
  /**
   * Get redemption configuration
   */
  async getConfig() {
    try {
      const response = await api.get('/api/coins/redemption-config');
      return response.data;
    } catch (error) {
      console.error('Error getting redemption config:', error);
      throw error;
    }
  }

  /**
   * Create a redemption request
   */
  async createRedemption(coinsRequested, payoutMethodId) {
    try {
      const response = await api.post('/api/coins/redeem', {
        coins_requested: coinsRequested,
        payout_method_id: payoutMethodId || null
      });
      return response.data;
    } catch (error) {
      console.error('Error creating redemption:', error);
      throw error;
    }
  }

  /**
   * Get user's redemption requests
   */
  async getRedemptions() {
    try {
      const response = await api.get('/api/coins/redemption-requests');
      return response.data;
    } catch (error) {
      console.error('Error getting redemptions:', error);
      throw error;
    }
  }

  /**
   * Get payout methods
   */
  async getPayoutMethods() {
    try {
      const response = await api.get('/api/coins/payout-methods');
      return response.data;
    } catch (error) {
      console.error('Error getting payout methods:', error);
      throw error;
    }
  }

  /**
   * Create payout method (Stripe Connect onboarding)
   */
  async createPayoutMethod() {
    try {
      const response = await api.post('/api/coins/payout-methods');
      return response.data;
    } catch (error) {
      console.error('Error creating payout method:', error);
      throw error;
    }
  }

  /**
   * Set default payout method
   */
  async setDefaultPayoutMethod(methodId) {
    try {
      const response = await api.patch(`/api/coins/payout-methods/${methodId}/default`);
      return response.data;
    } catch (error) {
      console.error('Error setting default payout method:', error);
      throw error;
    }
  }

  /**
   * Delete payout method
   */
  async deletePayoutMethod(methodId) {
    try {
      const response = await api.delete(`/api/coins/payout-methods/${methodId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting payout method:', error);
      throw error;
    }
  }

  /**
   * Sync payout methods from Stripe (after Connect onboarding)
   */
  async syncPayoutMethods() {
    try {
      const response = await api.post('/api/coins/payout-methods/sync');
      return response.data;
    } catch (error) {
      console.error('Error syncing payout methods:', error);
      throw error;
    }
  }
}

const redemptionService = new RedemptionService();
export default redemptionService;
