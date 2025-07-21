const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Token = require('./models/Token');
const BankingInfo = require('./models/BankingInfo');
const Transaction = require('./models/Transaction');
const BankingActivity = require('./models/BankingActivity');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/token-browser', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected for seeding'))
.catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
});

// Sample data
const sampleTokens = [
  {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    balance: '1000000000000000000', // 1 WETH
    owner: '0x123456789abcdef123456789abcdef123456789a',
    network: 'mainnet',
    chainId: '1',
    lastUpdated: new Date()
  },
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    balance: '1000000', // 1 USDT
    owner: '0x123456789abcdef123456789abcdef123456789a',
    network: 'mainnet',
    chainId: '1',
    lastUpdated: new Date()
  },
  {
    address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    balance: '2000000000000000000', // 2 WETH
    owner: '0x123456789abcdef123456789abcdef123456789a',
    network: 'polygon',
    chainId: '137',
    lastUpdated: new Date()
  }
];

const sampleBankingInfo = [
  {
    user: '0x123456789abcdef123456789abcdef123456789a',
    method: 'upi',
    maskedIdentifier: 'j****@bank',
    name: 'John Doe',
    balance: 25000.75,
    currency: 'INR',
    sessionId: 'sample-session-id-123',
    environment: 'development',
    lastUpdated: new Date()
  },
  {
    user: '0x123456789abcdef123456789abcdef123456789a',
    method: 'account',
    maskedIdentifier: '****6789',
    name: 'Jane Smith',
    balance: 5430.25,
    currency: 'USD',
    sessionId: 'sample-session-id-123',
    environment: 'development',
    lastUpdated: new Date()
  }
];

const sampleTransactions = [
  {
    tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    tokenSymbol: 'WETH',
    tokenName: 'Wrapped Ether',
    from: '0xabcdef123456789abcdef123456789abcdef1234',
    to: '0x123456789abcdef123456789abcdef123456789a',
    amount: '500000000000000000', // 0.5 WETH
    decimals: 18,
    transactionHash: '0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
    blockNumber: 12345678,
    network: 'mainnet',
    chainId: '1',
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
    createdAt: new Date()
  },
  {
    tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    tokenSymbol: 'USDT',
    tokenName: 'Tether USD',
    from: '0x123456789abcdef123456789abcdef123456789a',
    to: '0xabcdef123456789abcdef123456789abcdef1234',
    amount: '500000', // 0.5 USDT
    decimals: 6,
    transactionHash: '0xabcdef123456789abcdef123456789abcdef123456789abcdef123456789abcd',
    blockNumber: 12345679,
    network: 'mainnet',
    chainId: '1',
    timestamp: new Date(Date.now() - 43200000), // 12 hours ago
    createdAt: new Date()
  }
];

const sampleBankingActivities = [
  {
    action: 'fetch_balance',
    method: 'upi',
    maskedIdentifier: 'j****@bank',
    environment: 'development',
    sessionId: 'sample-session-id-123',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    status: 'success',
    details: { currency: 'INR' },
    timestamp: new Date(Date.now() - 3600000) // 1 hour ago
  },
  {
    action: 'fetch_balance',
    method: 'account',
    maskedIdentifier: '****6789',
    environment: 'development',
    sessionId: 'sample-session-id-123',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    status: 'success',
    details: { currency: 'USD' },
    timestamp: new Date(Date.now() - 1800000) // 30 minutes ago
  }
];

// Seed the database
const seedDatabase = async () => {
  try {
    // Clear existing data
    await Token.deleteMany({});
    await BankingInfo.deleteMany({});
    await Transaction.deleteMany({});
    await BankingActivity.deleteMany({});
    
    console.log('Cleared existing data');
    
    // Insert sample data
    await Token.insertMany(sampleTokens);
    await BankingInfo.insertMany(sampleBankingInfo);
    await Transaction.insertMany(sampleTransactions);
    await BankingActivity.insertMany(sampleBankingActivities);
    
    console.log('Sample data inserted successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase(); 