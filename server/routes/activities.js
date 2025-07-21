const express = require('express');
const router = express.Router();
const BankingActivity = require('../models/BankingActivity');

// @route   GET api/activities
// @desc    Get banking activity logs with various filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { sessionId, method, maskedIdentifier, environment, status, startDate, endDate, limit, page } = req.query;
    
    const query = {};
    
    // Apply filters if provided
    if (sessionId) query.sessionId = sessionId;
    if (method) query.method = method;
    if (maskedIdentifier) query.maskedIdentifier = maskedIdentifier;
    if (environment) query.environment = environment;
    if (status) query.status = status;
    
    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    // Pagination
    const pageSize = parseInt(limit) || 20;
    const currentPage = parseInt(page) || 1;
    const skip = (currentPage - 1) * pageSize;
    
    // Get activities with pagination
    const activities = await BankingActivity.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(pageSize);
    
    // Get total count for pagination
    const total = await BankingActivity.countDocuments(query);
    
    res.json({
      activities,
      pagination: {
        total,
        pageSize,
        currentPage,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/activities
// @desc    Log a new banking activity
// @access  Public
router.post('/', async (req, res) => {
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
      status: status || 'success',
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

// @route   GET api/activities/stats
// @desc    Get activity statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const { sessionId, method, environment, period } = req.query;
    
    const query = {};
    
    // Apply filters if provided
    if (sessionId) query.sessionId = sessionId;
    if (method) query.method = method;
    if (environment) query.environment = environment;
    
    // Time period filter
    if (period) {
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'day':
          startDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(0); // Beginning of time
      }
      
      query.timestamp = { $gte: startDate };
    }
    
    // Get activity counts by status
    const successCount = await BankingActivity.countDocuments({
      ...query,
      status: 'success'
    });
    
    const failureCount = await BankingActivity.countDocuments({
      ...query,
      status: 'failure'
    });
    
    const pendingCount = await BankingActivity.countDocuments({
      ...query,
      status: 'pending'
    });
    
    // Get activity counts by action
    const actionCounts = await BankingActivity.aggregate([
      { $match: query },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get activity counts by method
    const methodCounts = await BankingActivity.aggregate([
      { $match: query },
      { $group: { _id: '$method', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      total: successCount + failureCount + pendingCount,
      byStatus: {
        success: successCount,
        failure: failureCount,
        pending: pendingCount
      },
      byAction: actionCounts.map(item => ({ action: item._id, count: item.count })),
      byMethod: methodCounts.map(item => ({ method: item._id, count: item.count }))
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/activities
// @desc    Delete old activity logs
// @access  Public
router.delete('/', async (req, res) => {
  try {
    const { olderThan, sessionId } = req.query;
    
    if (!olderThan && !sessionId) {
      return res.status(400).json({ message: 'Either olderThan or sessionId parameter is required' });
    }
    
    const query = {};
    
    // Delete by age
    if (olderThan) {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(olderThan));
      query.timestamp = { $lt: date };
    }
    
    // Delete by session ID
    if (sessionId) {
      query.sessionId = sessionId;
    }
    
    const result = await BankingActivity.deleteMany(query);
    
    res.json({
      message: `${result.deletedCount} activity logs deleted`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 