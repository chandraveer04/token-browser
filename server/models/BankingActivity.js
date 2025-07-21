const mongoose = require('mongoose');

const BankingActivitySchema = new mongoose.Schema({
  action: {
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
  maskedIdentifier: {
    type: String,
    required: true,
    trim: true
  },
  environment: {
    type: String,
    required: true,
    enum: ['development', 'production']
  },
  sessionId: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'pending'],
    default: 'success'
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for efficient queries
BankingActivitySchema.index({ sessionId: 1 });
BankingActivitySchema.index({ method: 1, maskedIdentifier: 1 });
BankingActivitySchema.index({ timestamp: -1 });

module.exports = mongoose.model('BankingActivity', BankingActivitySchema); 