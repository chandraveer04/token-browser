const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  symbol: {
    type: String,
    required: true,
    trim: true
  },
  decimals: {
    type: Number,
    required: true,
    default: 18
  },
  balance: {
    type: String,
    required: true
  },
  owner: {
    type: String,
    required: true,
    trim: true
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
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index for efficient queries
TokenSchema.index({ owner: 1, address: 1, network: 1 }, { unique: true });

module.exports = mongoose.model('Token', TokenSchema); 