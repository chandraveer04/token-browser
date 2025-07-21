const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  tokenAddress: {
    type: String,
    required: true,
    trim: true
  },
  tokenSymbol: {
    type: String,
    required: true,
    trim: true
  },
  tokenName: {
    type: String,
    required: true,
    trim: true
  },
  from: {
    type: String,
    required: true,
    trim: true
  },
  to: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: String,
    required: true
  },
  decimals: {
    type: Number,
    required: true,
    default: 18
  },
  transactionHash: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  blockNumber: {
    type: Number,
    required: true
  },
  network: {
    type: String,
    required: true,
    enum: ['development', 'mainnet', 'polygon', 'bsc']
  },
  chainId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for efficient queries
TransactionSchema.index({ from: 1, network: 1 });
TransactionSchema.index({ to: 1, network: 1 });
TransactionSchema.index({ tokenAddress: 1, network: 1 });
TransactionSchema.index({ blockNumber: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema); 