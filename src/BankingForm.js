import React, { useState, useEffect } from 'react';
import { 
  BANKING_METHODS, 
  SUPPORTED_CURRENCIES, 
  fetchBankingInfo, 
  validateBankingFormat, 
  maskBankingIdentifier, 
  convertCurrency,
  logBankingActivity,
  generateSessionToken
} from './BankingService';
import { BankingApi, ActivitiesApi } from './services/ApiService';

const BankingForm = ({ environment = 'development' }) => {
  // Form state
  const [bankingMethod, setBankingMethod] = useState(BANKING_METHODS.UPI);
  const [identifier, setIdentifier] = useState('');
  const [targetCurrency, setTargetCurrency] = useState('USD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [showSecurityInput, setShowSecurityInput] = useState(false);
  
  // Result state
  const [bankingInfo, setBankingInfo] = useState(null);
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  
  // Initialize banking session
  useEffect(() => {
    if (!sessionStorage.getItem('bankingSessionId')) {
      sessionStorage.setItem('bankingSessionId', generateSessionToken());
    }
    
    // Load previous banking info from MongoDB if available
    const loadSavedBankingInfo = async () => {
      try {
        const currentAddress = sessionStorage.getItem('currentAddress');
        if (currentAddress) {
          const savedInfo = await BankingApi.getBankingInfo(currentAddress);
          if (savedInfo && savedInfo.length > 0) {
            // Use the most recent banking info
            const latestInfo = savedInfo[0];
            
            // Set the banking method based on saved info
            setBankingMethod(latestInfo.method);
            
            // Load activity logs using the Activities API
            try {
              const sessionId = latestInfo.sessionId;
              const result = await ActivitiesApi.getActivities({
                sessionId,
                limit: 5
              });
              
              if (result && result.activities && result.activities.length > 0) {
                setActivityLogs(result.activities);
              }
            } catch (activityError) {
              console.error('Error fetching activity logs with Activities API:', activityError);
              
              // Fallback to BankingApi
              try {
                const logs = await BankingApi.getActivityLogs(latestInfo.sessionId, null, null, 5);
                if (logs && logs.length > 0) {
                  setActivityLogs(logs);
                }
              } catch (fallbackError) {
                console.error('Error fetching activity logs with fallback method:', fallbackError);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved banking info:', error);
        // Continue without saved info
      }
    };
    
    loadSavedBankingInfo();
  }, []);

  // Handle method change
  const handleMethodChange = (e) => {
    setBankingMethod(e.target.value);
    setIdentifier('');
    setBankingInfo(null);
    setError('');
  };

  // Handle identifier change
  const handleIdentifierChange = (e) => {
    setIdentifier(e.target.value);
    setError('');
  };

  // Handle currency change
  const handleCurrencyChange = (e) => {
    setTargetCurrency(e.target.value);
    
    // If we already have banking info, convert the amount
    if (bankingInfo) {
      handleCurrencyConversion(bankingInfo.balance, bankingInfo.currency, e.target.value);
    }
  };

  // Handle security code input
  const handleSecurityCodeChange = (e) => {
    setSecurityCode(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset states
    setError('');
    setBankingInfo(null);
    setConvertedAmount(null);
    
    // Validate input
    if (!identifier) {
      setError('Please enter your banking identifier');
      return;
    }
    
    if (!validateBankingFormat(bankingMethod, identifier)) {
      setError('Invalid format for the selected banking method');
      return;
    }
    
    // In production, require security code
    if (environment === 'production' && !showSecurityInput) {
      setShowSecurityInput(true);
      return;
    }
    
    // In production, validate security code
    if (environment === 'production' && showSecurityInput) {
      if (!securityCode || securityCode.length < 6) {
        setError('Please enter a valid security code');
        return;
      }
    }
    
    // Proceed with fetching banking info
    setIsSubmitting(true);
    
    try {
      // Log the banking activity
      await logBankingActivity(
        'fetch_balance', 
        bankingMethod, 
        maskBankingIdentifier(bankingMethod, identifier),
        environment
      );
      
      // Fetch banking info
      const result = await fetchBankingInfo(bankingMethod, identifier, environment);
      
      if (result.success && result.data) {
        setBankingInfo(result.data);
        
        // Convert currency if needed
        if (result.data.currency !== targetCurrency) {
          handleCurrencyConversion(result.data.balance, result.data.currency, targetCurrency);
        } else {
          setConvertedAmount({
            amount: result.data.balance,
            fromCurrency: result.data.currency,
            toCurrency: result.data.currency,
            rate: 1
          });
        }
        
        // Refresh activity logs using Activities API
        try {
          const sessionId = sessionStorage.getItem('bankingSessionId');
          const result = await ActivitiesApi.getActivities({
            sessionId,
            limit: 5
          });
          
          if (result && result.activities && result.activities.length > 0) {
            setActivityLogs(result.activities);
          }
        } catch (activityError) {
          console.error('Error fetching activity logs with Activities API:', activityError);
          
          // Fallback to BankingApi
          try {
            const logs = await BankingApi.getActivityLogs(sessionStorage.getItem('bankingSessionId'), null, null, 5);
            if (logs && logs.length > 0) {
              setActivityLogs(logs);
            }
          } catch (fallbackError) {
            console.error('Error fetching activity logs with fallback method:', fallbackError);
          }
        }
      } else {
        setError('Failed to fetch banking information');
      }
    } catch (error) {
      console.error('Banking form error:', error);
      setError(error.message || 'An error occurred while fetching banking information');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle currency conversion
  const handleCurrencyConversion = async (amount, fromCurrency, toCurrency) => {
    try {
      const result = await convertCurrency(amount, fromCurrency, toCurrency);
      setConvertedAmount(result);
    } catch (error) {
      console.error('Currency conversion error:', error);
      setError('Failed to convert currency');
    }
  };

  // Reset form
  const handleReset = () => {
    setIdentifier('');
    setBankingInfo(null);
    setConvertedAmount(null);
    setError('');
    setShowSecurityInput(false);
    setSecurityCode('');
  };

  // Get placeholder text based on selected method
  const getPlaceholder = () => {
    switch (bankingMethod) {
      case BANKING_METHODS.UPI:
        return 'username@bank';
      case BANKING_METHODS.ACCOUNT:
        return '10-16 digit account number';
      case BANKING_METHODS.CARD:
        return '16 digit card number';
      default:
        return 'Enter identifier';
    }
  };

  // Find currency symbol
  const getCurrencySymbol = (code) => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === code);
    return currency ? currency.symbol : code;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-6">Banking Information</h2>
      
      {/* Environment indicator */}
      <div className={`mb-4 p-2 rounded text-sm ${environment === 'development' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
        <p>
          <span className="font-semibold">Mode:</span> {environment === 'development' ? 'Development (using mock data)' : 'Production (using secure API)'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Banking method selection */}
        <div className="mb-4">
          <label htmlFor="banking-method" className="block text-sm font-medium text-gray-700 mb-1">
            Banking Method
          </label>
          <select
            id="banking-method"
            value={bankingMethod}
            onChange={handleMethodChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <option value={BANKING_METHODS.UPI}>UPI ID</option>
            <option value={BANKING_METHODS.ACCOUNT}>Bank Account</option>
            <option value={BANKING_METHODS.CARD}>Credit/Debit Card</option>
          </select>
        </div>
        
        {/* Banking identifier input */}
        <div className="mb-4">
          <label htmlFor="banking-identifier" className="block text-sm font-medium text-gray-700 mb-1">
            {bankingMethod === BANKING_METHODS.UPI ? 'UPI ID' : 
             bankingMethod === BANKING_METHODS.ACCOUNT ? 'Account Number' : 'Card Number'}
          </label>
          <input
            type="text"
            id="banking-identifier"
            value={identifier}
            onChange={handleIdentifierChange}
            placeholder={getPlaceholder()}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>
        
        {/* Security code input (for production) */}
        {showSecurityInput && environment === 'production' && (
          <div className="mb-4">
            <label htmlFor="security-code" className="block text-sm font-medium text-gray-700 mb-1">
              Security Code / OTP
            </label>
            <input
              type="password"
              id="security-code"
              value={securityCode}
              onChange={handleSecurityCodeChange}
              placeholder="Enter security code"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              For security purposes, please enter the OTP sent to your registered mobile number
            </p>
          </div>
        )}
        
        {/* Target currency selection */}
        <div className="mb-4">
          <label htmlFor="target-currency" className="block text-sm font-medium text-gray-700 mb-1">
            Display Currency
          </label>
          <select
            id="target-currency"
            value={targetCurrency}
            onChange={handleCurrencyChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            {SUPPORTED_CURRENCIES.map(currency => (
              <option key={currency.code} value={currency.code}>
                {currency.name} ({currency.symbol})
              </option>
            ))}
          </select>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {/* Submit button */}
        <div className="flex space-x-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Fetching...' : showSecurityInput ? 'Verify & Fetch' : 'Fetch Balance'}
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            disabled={isSubmitting}
          >
            Reset
          </button>
        </div>
      </form>
      
      {/* Banking information display */}
      {bankingInfo && (
        <div className="mt-8 p-4 bg-blue-50 rounded-md">
          <h3 className="text-lg font-semibold mb-2">Account Information</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm text-gray-600">Account Holder:</div>
            <div className="text-sm font-medium">{bankingInfo.name}</div>
            
            <div className="text-sm text-gray-600">Original Balance:</div>
            <div className="text-sm font-medium">
              {getCurrencySymbol(bankingInfo.currency)} {bankingInfo.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            
            {convertedAmount && convertedAmount.fromCurrency !== convertedAmount.toCurrency && (
              <>
                <div className="text-sm text-gray-600">Converted Balance:</div>
                <div className="text-sm font-medium">
                  {getCurrencySymbol(convertedAmount.toCurrency)} {convertedAmount.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                
                <div className="text-sm text-gray-600">Exchange Rate:</div>
                <div className="text-sm font-medium">
                  1 {convertedAmount.fromCurrency} = {convertedAmount.rate.toFixed(4)} {convertedAmount.toCurrency}
                </div>
              </>
            )}
            
            <div className="text-sm text-gray-600">Last Updated:</div>
            <div className="text-sm font-medium">
              {new Date(bankingInfo.lastUpdated).toLocaleString()}
            </div>
          </div>
          
          {/* Security notice */}
          <div className="mt-4 text-xs text-gray-500">
            <p className="font-semibold">Security Notice:</p>
            <p>Your banking information is {environment === 'production' ? 'end-to-end encrypted' : 'displayed for testing purposes only'}.</p>
            <p>Never share your banking credentials or OTP with anyone.</p>
          </div>
        </div>
      )}
      
      {/* Recent Activity Logs */}
      {activityLogs.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-md">
          <h3 className="text-lg font-semibold mb-2">Recent Banking Activity</h3>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Time</th>
                <th className="text-left py-2">Action</th>
                <th className="text-left py-2">Method</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {activityLogs.map((log, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{formatDate(log.timestamp)}</td>
                  <td className="py-2">{log.action.replace('_', ' ')}</td>
                  <td className="py-2">{log.method.toUpperCase()}</td>
                  <td className={`py-2 ${log.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {log.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BankingForm; 