const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// @route   GET api/transactions
// @desc    Get transactions for an address
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { address, tokenAddress, network, limit, page } = req.query;
    
    if (!address && !tokenAddress) {
      return res.status(400).json({ message: 'Address or token address is required' });
    }
    
    const query = {};
    
    // Filter by address (as sender or receiver)
    if (address) {
      query.$or = [
        { from: address.toLowerCase() },
        { to: address.toLowerCase() }
      ];
    }
    
    // Filter by token address
    if (tokenAddress) {
      query.tokenAddress = tokenAddress.toLowerCase();
    }
    
    // Filter by network
    if (network) {
      query.network = network;
    }
    
    // Pagination
    const pageSize = parseInt(limit) || 20;
    const currentPage = parseInt(page) || 1;
    const skip = (currentPage - 1) * pageSize;
    
    // Get transactions
    const transactions = await Transaction.find(query)
      .sort({ blockNumber: -1 })
      .skip(skip)
      .limit(pageSize);
    
    // Get total count for pagination
    const total = await Transaction.countDocuments(query);
    
    res.json({
      transactions,
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

// @route   POST api/transactions
// @desc    Add a new transaction
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { 
      tokenAddress, 
      tokenSymbol, 
      tokenName, 
      from, 
      to, 
      amount, 
      decimals, 
      transactionHash, 
      blockNumber, 
      network,
      chainId,
      timestamp 
    } = req.body;
    
    // Validate required fields
    if (!tokenAddress || !from || !to || !amount || !transactionHash || !blockNumber || !network || !chainId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check if transaction already exists
    let transaction = await Transaction.findOne({ transactionHash });
    
    if (transaction) {
      return res.status(400).json({ message: 'Transaction already exists' });
    }
    
    // Create new transaction
    transaction = new Transaction({
      tokenAddress: tokenAddress.toLowerCase(),
      tokenSymbol: tokenSymbol || 'Unknown',
      tokenName: tokenName || 'Unknown Token',
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      amount,
      decimals: decimals || 18,
      transactionHash,
      blockNumber,
      network,
      chainId,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      createdAt: new Date()
    });
    
    await transaction.save();
    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Transaction already exists' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/transactions/stats
// @desc    Get transaction statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const { address, network, period } = req.query;
    
    if (!address) {
      return res.status(400).json({ message: 'Address is required' });
    }
    
    const query = {
      $or: [
        { from: address.toLowerCase() },
        { to: address.toLowerCase() }
      ]
    };
    
    // Filter by network
    if (network) {
      query.network = network;
    }
    
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
    
    // Get sent transactions
    const sent = await Transaction.countDocuments({
      ...query,
      from: address.toLowerCase()
    });
    
    // Get received transactions
    const received = await Transaction.countDocuments({
      ...query,
      to: address.toLowerCase()
    });
    
    // Get unique tokens
    const uniqueTokens = await Transaction.distinct('tokenAddress', query);
    
    res.json({
      sent,
      received,
      total: sent + received,
      uniqueTokensCount: uniqueTokens.length
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 