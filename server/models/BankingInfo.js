const mongoose = require('mongoose');

const BankingInfoSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
    trim: true
  },
  method: {
    type: String,
    required: true,
    enum: ['upi', 'account', 'card'],
    trim: true
  },
  // Store masked identifier for security
  maskedIdentifier: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  balance: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    trim: true
  },
  sessionId: {
    type: String,
    required: true
  },
  environment: {
    type: String,
    required: true,
    enum: ['development', 'production']
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index for efficient queries
BankingInfoSchema.index({ user: 1, method: 1, maskedIdentifier: 1 }, { unique: true });

module.exports = mongoose.model('BankingInfo', BankingInfoSchema); 