import CryptoJS from 'crypto-js';
import { BankingApi, ActivitiesApi } from './services/ApiService';

// Banking API configuration
const BANKING_API = {
  development: {
    baseUrl: 'http://localhost:3001/api/banking',
    apiKey: 'dev-api-key-123',
    encryptionKey: 'dev-encryption-key-456'
  },
  production: {
    baseUrl: 'https://api.securebanking.example.com/v1',
    apiKey: process.env.REACT_APP_BANKING_API_KEY || '',
    encryptionKey: process.env.REACT_APP_BANKING_ENCRYPTION_KEY || ''
  }
};

// Supported banking methods
export const BANKING_METHODS = {
  UPI: 'upi',
  ACCOUNT: 'account',
  CARD: 'card'
};

// Supported currencies
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' }
];

// Mock data for development
const MOCK_ACCOUNTS = {
  'upi:user@bank': {
    name: 'John Doe',
    balance: 25000.75,
    currency: 'INR',
    lastUpdated: new Date().toISOString()
  },
  'account:12345678901': {
    name: 'Jane Smith',
    balance: 5430.25,
    currency: 'USD',
    lastUpdated: new Date().toISOString()
  },
  'card:4111111111111111': {
    name: 'Test User',
    balance: 2150.50,
    currency: 'EUR',
    lastUpdated: new Date().toISOString()
  }
};

/**
 * Encrypts sensitive banking information
 * @param {string} data - Data to encrypt
 * @param {string} environment - 'development' or 'production'
 * @returns {string} - Encrypted data
 */
export const encryptData = (data, environment = 'development') => {
  const key = BANKING_API[environment].encryptionKey;
  return CryptoJS.AES.encrypt(data, key).toString();
};

/**
 * Decrypts sensitive banking information
 * @param {string} encryptedData - Encrypted data
 * @param {string} environment - 'development' or 'production'
 * @returns {string} - Decrypted data
 */
export const decryptData = (encryptedData, environment = 'development') => {
  const key = BANKING_API[environment].encryptionKey;
  const bytes = CryptoJS.AES.decrypt(encryptedData, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Validates banking information format
 * @param {string} method - Banking method (UPI, ACCOUNT, CARD)
 * @param {string} identifier - Banking identifier
 * @returns {boolean} - Whether the format is valid
 */
export const validateBankingFormat = (method, identifier) => {
  switch (method) {
    case BANKING_METHODS.UPI:
      return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(identifier);
    case BANKING_METHODS.ACCOUNT:
      return /^\d{10,16}$/.test(identifier);
    case BANKING_METHODS.CARD:
      return /^\d{16}$/.test(identifier) && luhnCheck(identifier);
    default:
      return false;
  }
};

/**
 * Luhn algorithm for credit card validation
 * @param {string} cardNumber - Credit card number
 * @returns {boolean} - Whether the card number passes Luhn check
 */
const luhnCheck = (cardNumber) => {
  let sum = 0;
  let shouldDouble = false;
  
  // Loop from right to left
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i));

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

/**
 * Fetches banking information
 * @param {string} method - Banking method (UPI, ACCOUNT, CARD)
 * @param {string} identifier - Banking identifier
 * @param {string} environment - 'development' or 'production'
 * @returns {Promise} - Banking information
 */
export const fetchBankingInfo = async (method, identifier, environment = 'development') => {
  // Validate format first
  if (!validateBankingFormat(method, identifier)) {
    throw new Error('Invalid banking information format');
  }

  // For development, use mock data
  if (environment === 'development') {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        const key = `${method}:${identifier}`;
        let bankingData;
        
        if (MOCK_ACCOUNTS[key]) {
          bankingData = MOCK_ACCOUNTS[key];
        } else {
          bankingData = {
            name: 'Demo User',
            balance: Math.random() * 10000,
            currency: 'USD',
            lastUpdated: new Date().toISOString()
          };
        }
        
        // Store in MongoDB
        try {
          const maskedIdentifier = maskBankingIdentifier(method, identifier);
          const sessionId = sessionStorage.getItem('bankingSessionId') || generateSessionToken();
          
          // Log the activity
          await BankingApi.logActivity({
            action: 'fetch_balance',
            method,
            maskedIdentifier,
            environment,
            sessionId,
            status: 'success'
          });
          
          // Save the banking info
          await BankingApi.saveBankingInfo({
            user: sessionStorage.getItem('currentAddress') || 'unknown',
            method,
            maskedIdentifier,
            name: bankingData.name,
            balance: bankingData.balance,
            currency: bankingData.currency,
            sessionId,
            environment
          });
        } catch (error) {
          console.error('Error storing banking data:', error);
          // Continue with mock data even if storage fails
        }
        
        resolve({
          success: true,
          data: bankingData
        });
      }, 800); // Simulate API delay
    });
  }

  // For production, call real API
  try {
    const encryptedData = encryptData(JSON.stringify({
      method,
      identifier
    }), environment);

    const response = await fetch(`${BANKING_API[environment].baseUrl}/balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BANKING_API[environment].apiKey}`,
        'X-Client-Timestamp': new Date().toISOString()
      },
      body: JSON.stringify({
        encryptedData
      })
    });

    if (!response.ok) {
      throw new Error('Banking API request failed');
    }

    const result = await response.json();
    
    // Decrypt the response
    if (result.encryptedData) {
      const decryptedData = decryptData(result.encryptedData, environment);
      const parsedData = JSON.parse(decryptedData);
      
      // Store in MongoDB
      try {
        const maskedIdentifier = maskBankingIdentifier(method, identifier);
        const sessionId = sessionStorage.getItem('bankingSessionId') || generateSessionToken();
        
        // Log the activity
        await BankingApi.logActivity({
          action: 'fetch_balance',
          method,
          maskedIdentifier,
          environment,
          sessionId,
          status: 'success'
        });
        
        // Save the banking info
        await BankingApi.saveBankingInfo({
          user: sessionStorage.getItem('currentAddress') || 'unknown',
          method,
          maskedIdentifier,
          name: parsedData.data.name,
          balance: parsedData.data.balance,
          currency: parsedData.data.currency,
          sessionId,
          environment
        });
      } catch (error) {
        console.error('Error storing banking data:', error);
        // Continue with API data even if storage fails
      }
      
      return parsedData;
    }
    
    return result;
  } catch (error) {
    console.error('Banking API error:', error);
    
    // Log the failure
    try {
      const maskedIdentifier = maskBankingIdentifier(method, identifier);
      const sessionId = sessionStorage.getItem('bankingSessionId') || generateSessionToken();
      
      await BankingApi.logActivity({
        action: 'fetch_balance',
        method,
        maskedIdentifier,
        environment,
        sessionId,
        status: 'failure',
        details: { error: error.message }
      });
    } catch (logError) {
      console.error('Error logging banking failure:', logError);
    }
    
    throw new Error('Failed to fetch banking information');
  }
};

/**
 * Converts currency amount
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise} - Converted amount
 */
export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  try {
    // Use a free currency conversion API
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    const data = await response.json();
    
    if (data.rates && data.rates[toCurrency]) {
      const rate = data.rates[toCurrency];
      return {
        success: true,
        amount: amount * rate,
        rate,
        fromCurrency,
        toCurrency
      };
    }
    
    throw new Error('Currency conversion failed');
  } catch (error) {
    console.error('Currency conversion error:', error);
    throw new Error('Failed to convert currency');
  }
};

/**
 * Generates a secure session token for banking operations
 * @returns {string} - Session token
 */
export const generateSessionToken = () => {
  const timestamp = new Date().getTime();
  const randomPart = Math.random().toString(36).substring(2, 15);
  const token = CryptoJS.SHA256(`${timestamp}:${randomPart}`).toString();
  
  // Store in session storage
  sessionStorage.setItem('bankingSessionId', token);
  
  return token;
};

/**
 * Logs banking activity for audit purposes
 * @param {string} action - Action performed
 * @param {string} method - Banking method
 * @param {string} maskedIdentifier - Masked banking identifier
 * @param {string} environment - 'development' or 'production'
 */
export const logBankingActivity = async (action, method, maskedIdentifier, environment = 'development') => {
  const sessionId = sessionStorage.getItem('bankingSessionId') || generateSessionToken();
  
  const logData = {
    action,
    method,
    maskedIdentifier,
    environment,
    sessionId,
    timestamp: new Date().toISOString()
  };
  
  console.log('Banking activity:', logData);
  
  // Log to MongoDB using the Activities API
  try {
    await ActivitiesApi.getActivities({
      ...logData,
      ipAddress: '127.0.0.1', // In a real app, this would be captured server-side
      userAgent: navigator.userAgent,
      status: 'success'
    });
  } catch (error) {
    console.error('Failed to log banking activity:', error);
    
    // Try using the BankingApi as fallback
    try {
      await BankingApi.logActivity({
        ...logData,
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
        status: 'success'
      });
    } catch (fallbackError) {
      console.error('Failed to log banking activity with fallback method:', fallbackError);
    }
  }
  
  // In production, also send logs to server
  if (environment === 'production') {
    try {
      await fetch(`${BANKING_API.production.baseUrl}/audit-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BANKING_API.production.apiKey}`
        },
        body: JSON.stringify(logData)
      });
    } catch (error) {
      console.error('Failed to log banking activity to production API:', error);
    }
  }
};

/**
 * Masks sensitive banking information for display
 * @param {string} method - Banking method
 * @param {string} identifier - Banking identifier
 * @returns {string} - Masked identifier
 */
export const maskBankingIdentifier = (method, identifier) => {
  switch (method) {
    case BANKING_METHODS.UPI:
      const [username, domain] = identifier.split('@');
      return `${username.charAt(0)}****@${domain}`;
    case BANKING_METHODS.ACCOUNT:
      return `****${identifier.slice(-4)}`;
    case BANKING_METHODS.CARD:
      return `****-****-****-${identifier.slice(-4)}`;
    default:
      return '********';
  }
}; 