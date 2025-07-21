const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json({ extended: false }));
app.use(cors());

// Define routes
app.use('/api/tokens', require('./routes/tokens'));
app.use('/api/banking', require('./routes/banking'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/activities', require('./routes/activities'));

// Serve static files from the React app
const path = require('path');
app.use(express.static(path.join(__dirname, '../build')));

// The catch-all handler: for any request that doesn't match an API route, send back React's index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server Error', error: err.message });
});

// Define port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app; 