/**
 * API Service for interacting with the MongoDB backend
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Token API methods
 */
export const TokenApi = {
  // Get all tokens for an owner
  getTokens: async (owner, network) => {
    try {
      const params = new URLSearchParams();
      if (owner) params.append('owner', owner);
      if (network) params.append('network', network);
      
      const response = await fetch(`${API_URL}/tokens?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching tokens: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('TokenApi.getTokens error:', error);
      throw error;
    }
  },
  
  // Add or update a token
  saveToken: async (tokenData) => {
    try {
      const response = await fetch(`${API_URL}/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tokenData)
      });
      
      if (!response.ok) {
        throw new Error(`Error saving token: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('TokenApi.saveToken error:', error);
      throw error;
    }
  }
};

/**
 * Banking API methods
 */
export const BankingApi = {
  // Get banking info for a user
  getBankingInfo: async (user, method) => {
    try {
      const params = new URLSearchParams();
      if (user) params.append('user', user);
      if (method) params.append('method', method);
      
      const response = await fetch(`${API_URL}/banking?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching banking info: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('BankingApi.getBankingInfo error:', error);
      throw error;
    }
  },
  
  // Add or update banking info
  saveBankingInfo: async (bankingData) => {
    try {
      const response = await fetch(`${API_URL}/banking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bankingData)
      });
      
      if (!response.ok) {
        throw new Error(`Error saving banking info: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('BankingApi.saveBankingInfo error:', error);
      throw error;
    }
  },
  
  // Log banking activity
  logActivity: async (activityData) => {
    try {
      const response = await fetch(`${API_URL}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(activityData)
      });
      
      if (!response.ok) {
        throw new Error(`Error logging activity: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('BankingApi.logActivity error:', error);
      throw error;
    }
  },
  
  // Get banking activity logs
  getActivityLogs: async (sessionId, method, maskedIdentifier, limit) => {
    try {
      const params = new URLSearchParams();
      if (sessionId) params.append('sessionId', sessionId);
      if (method) params.append('method', method);
      if (maskedIdentifier) params.append('maskedIdentifier', maskedIdentifier);
      if (limit) params.append('limit', limit);
      
      const response = await fetch(`${API_URL}/activities?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching activity logs: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.activities || result;
    } catch (error) {
      console.error('BankingApi.getActivityLogs error:', error);
      throw error;
    }
  },
  
  // Get activity statistics
  getActivityStats: async (sessionId, method, environment, period) => {
    try {
      const params = new URLSearchParams();
      if (sessionId) params.append('sessionId', sessionId);
      if (method) params.append('method', method);
      if (environment) params.append('environment', environment);
      if (period) params.append('period', period);
      
      const response = await fetch(`${API_URL}/activities/stats?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching activity statistics: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('BankingApi.getActivityStats error:', error);
      throw error;
    }
  },
  
  // Delete old activity logs
  deleteOldActivities: async (olderThan, sessionId) => {
    try {
      const params = new URLSearchParams();
      if (olderThan) params.append('olderThan', olderThan);
      if (sessionId) params.append('sessionId', sessionId);
      
      const response = await fetch(`${API_URL}/activities?${params.toString()}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting activity logs: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('BankingApi.deleteOldActivities error:', error);
      throw error;
    }
  }
};

/**
 * Transaction API methods
 */
export const TransactionApi = {
  // Get transactions for an address
  getTransactions: async (address, tokenAddress, network, limit, page) => {
    try {
      const params = new URLSearchParams();
      if (address) params.append('address', address);
      if (tokenAddress) params.append('tokenAddress', tokenAddress);
      if (network) params.append('network', network);
      if (limit) params.append('limit', limit);
      if (page) params.append('page', page);
      
      const response = await fetch(`${API_URL}/transactions?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching transactions: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('TransactionApi.getTransactions error:', error);
      throw error;
    }
  },
  
  // Add a new transaction
  saveTransaction: async (transactionData) => {
    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionData)
      });
      
      if (!response.ok) {
        throw new Error(`Error saving transaction: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('TransactionApi.saveTransaction error:', error);
      throw error;
    }
  },
  
  // Get transaction statistics
  getTransactionStats: async (address, network, period) => {
    try {
      const params = new URLSearchParams();
      if (address) params.append('address', address);
      if (network) params.append('network', network);
      if (period) params.append('period', period);
      
      const response = await fetch(`${API_URL}/transactions/stats?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching transaction stats: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('TransactionApi.getTransactionStats error:', error);
      throw error;
    }
  }
};

/**
 * Activities API methods
 */
export const ActivitiesApi = {
  // Get all activities with filters
  getActivities: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      // Add all filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value);
        }
      });
      
      const response = await fetch(`${API_URL}/activities?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching activities: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('ActivitiesApi.getActivities error:', error);
      throw error;
    }
  },
  
  // Get activity statistics
  getStats: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      // Add all filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value);
        }
      });
      
      const response = await fetch(`${API_URL}/activities/stats?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching activity statistics: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('ActivitiesApi.getStats error:', error);
      throw error;
    }
  },
  
  // Delete activities
  deleteActivities: async (olderThan, sessionId) => {
    try {
      const params = new URLSearchParams();
      if (olderThan) params.append('olderThan', olderThan);
      if (sessionId) params.append('sessionId', sessionId);
      
      const response = await fetch(`${API_URL}/activities?${params.toString()}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting activities: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('ActivitiesApi.deleteActivities error:', error);
      throw error;
    }
  }
}; 