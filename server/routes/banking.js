const express = require('express');
const router = express.Router();
const BankingInfo = require('../models/BankingInfo');
const BankingActivity = require('../models/BankingActivity');

// @route   GET api/banking
// @desc    Get banking info for a user
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { user, method } = req.query;
    
    if (!user) {
      return res.status(400).json({ message: 'User address is required' });
    }
    
    const query = { user: user.toLowerCase() };
    
    if (method) {
      query.method = method;
    }
    
    const bankingInfo = await BankingInfo.find(query).sort({ lastUpdated: -1 });
    res.json(bankingInfo);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/banking
// @desc    Add or update banking info
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { user, method, maskedIdentifier, name, balance, currency, sessionId, environment } = req.body;
    
    // Validate required fields
    if (!user || !method || !maskedIdentifier || !sessionId || !environment) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Format data
    const bankingData = {
      user: user.toLowerCase(),
      method,
      maskedIdentifier,
      name: name || 'Unknown User',
      balance,
      currency,
      sessionId,
      environment,
      lastUpdated: new Date()
    };
    
    // Check if banking info already exists for this user and method
    let bankingInfo = await BankingInfo.findOne({ 
      user: user.toLowerCase(), 
      method,
      maskedIdentifier
    });
    
    if (bankingInfo) {
      // Update existing banking info
      bankingInfo = await BankingInfo.findOneAndUpdate(
        { 
          user: user.toLowerCase(), 
          method,
          maskedIdentifier
        },
        bankingData,
        { new: true }
      );
      return res.json(bankingInfo);
    }
    
    // Create new banking info
    bankingInfo = new BankingInfo(bankingData);
    await bankingInfo.save();
    res.json(bankingInfo);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Banking info already exists for this user' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/banking/activity
// @desc    Log banking activity
// @access  Public
router.post('/activity', async (req, res) => {
  try {
    const { action, method, maskedIdentifier, environment, sessionId, ipAddress, userAgent, status, details } = req.body;
    
    // Validate required fields
    if (!action || !method || !maskedIdentifier || !environment || !sessionId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Create new activity log
    const activityLog = new BankingActivity({
      action,
      method,
      maskedIdentifier,
      environment,
      sessionId,
      ipAddress,
      userAgent,
      status,
      details,
      timestamp: new Date()
    });
    
    await activityLog.save();
    res.json(activityLog);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/banking/activity
// @desc    Get banking activity logs
// @access  Public
router.get('/activity', async (req, res) => {
  try {
    const { sessionId, method, maskedIdentifier, limit } = req.query;
    
    const query = {};
    
    if (sessionId) {
      query.sessionId = sessionId;
    }
    
    if (method) {
      query.method = method;
    }
    
    if (maskedIdentifier) {
      query.maskedIdentifier = maskedIdentifier;
    }
    
    const activityLogs = await BankingActivity.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit) || 50);
      
    res.json(activityLogs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 