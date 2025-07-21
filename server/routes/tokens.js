const express = require('express');
const router = express.Router();
const Token = require('../models/Token');

// @route   GET api/tokens
// @desc    Get all tokens for a specific owner and network
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { owner, network } = req.query;
    
    if (!owner) {
      return res.status(400).json({ message: 'Owner address is required' });
    }
    
    const query = { owner: owner.toLowerCase() };
    
    if (network) {
      query.network = network;
    }
    
    const tokens = await Token.find(query).sort({ lastUpdated: -1 });
    res.json(tokens);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/tokens
// @desc    Add or update a token
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { address, name, symbol, decimals, balance, owner, network, chainId } = req.body;
    
    // Validate required fields
    if (!address || !owner || !network || !chainId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Format data
    const tokenData = {
      address: address.toLowerCase(),
      name: name || 'Unknown Token',
      symbol: symbol || '???',
      decimals: decimals || 18,
      balance,
      owner: owner.toLowerCase(),
      network,
      chainId,
      lastUpdated: new Date()
    };
    
    // Check if token already exists for this owner and network
    let token = await Token.findOne({ 
      address: address.toLowerCase(), 
      owner: owner.toLowerCase(),
      network
    });
    
    if (token) {
      // Update existing token
      token = await Token.findOneAndUpdate(
        { 
          address: address.toLowerCase(), 
          owner: owner.toLowerCase(),
          network
        },
        tokenData,
        { new: true }
      );
      return res.json(token);
    }
    
    // Create new token
    token = new Token(tokenData);
    await token.save();
    res.json(token);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Token already exists for this owner' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/tokens/:id
// @desc    Delete a token
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);
    
    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }
    
    await token.remove();
    res.json({ message: 'Token removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 