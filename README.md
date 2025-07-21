# Dynamic Token Browser

A versatile blockchain token browser that works in both development and production environments. This application allows you to:

- Browse ERC20 tokens across different networks (Ethereum, Polygon, BSC, and Ganache)
- View token balances and transaction history
- Add custom tokens by contract address
- Connect to MetaMask for production use
- See real-time fiat value conversions
- Connect banking services for crypto-fiat transactions
- Store all data in MongoDB for persistent access
- Track and analyze banking activities

## Features

### Development Mode (Ganache)
- Automatically connects to local Ganache instance
- Lists all available Ganache accounts
- Scans for deployed ERC20 tokens
- Displays token balances and transaction history
- Uses mock banking data for testing
- Stores all information in MongoDB database

### Production Mode
- Connects to Ethereum Mainnet, Polygon, or Binance Smart Chain
- Integrates with MetaMask for wallet connection
- Shows common tokens for each network
- Displays fiat value of crypto holdings
- Links to block explorers for transaction details
- Secure banking integration with end-to-end encryption
- Persistent data storage in MongoDB

### Banking Integration
- Connect various banking methods (UPI, Bank Account, Credit/Debit Card)
- Fetch banking balances securely
- Convert between multiple currencies
- View exchange rates in real-time
- Enhanced security with encryption and OTP verification in production mode
- Track banking activity history

### MongoDB Integration
- Store token information persistently
- Track transaction history across sessions
- Save banking information securely
- Log all banking activities for audit purposes
- Retrieve historical data even when blockchain is unavailable
- Perform analytics on transaction patterns

### Activities Tracking and Analysis
- Comprehensive activity logging for all banking operations
- Activity statistics by method, status, and time period
- Historical activity data with pagination
- Activity filtering by session, method, and identifier
- Data retention management with automatic cleanup options
- Visual activity analytics dashboard

## Setup Instructions

### Prerequisites
- Node.js and npm installed
- MongoDB installed and running
- Ganache for local development
- MetaMask extension for production use

### Installation
1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up MongoDB:
   - Create a `.env` file in the server directory with the following content:
     ```
     PORT=5000
     MONGO_URI=mongodb://localhost:27017/token-browser
     NODE_ENV=development
     BANKING_API_KEY=your_api_key
     BANKING_ENCRYPTION_KEY=your_encryption_key
     ```
   - Start MongoDB service on your machine
   - Run the seed script to populate initial data:
     ```
     npm run seed
     ```

4. For development with Ganache:
   - Start Ganache on port 7545
   - Deploy some ERC20 tokens to test (optional)

5. For production use:
   - Update the Infura API key in the NETWORKS configuration
   - Install and set up MetaMask in your browser
   - Set environment variables for banking API integration:
     ```
     REACT_APP_BANKING_API_KEY=your_api_key
     REACT_APP_BANKING_ENCRYPTION_KEY=your_encryption_key
     ```

### Running the Application
```
npm run dev
```
This command will start both the React frontend and the Express backend server.

## Usage Guide

1. **Select Network**: Choose between Development (Ganache) or production networks
2. **Connect Wallet**:
   - In development mode: Select from available Ganache accounts
   - In production mode: Connect via MetaMask
3. **View Tokens**: See token balances for the selected address
4. **Add Custom Tokens**: Enter a valid ERC20 contract address to add it to the list
5. **View Transaction History**: Click on any token name to see its transaction history
6. **Banking Services**:
   - Select your preferred banking method
   - Enter your banking identifier (UPI ID, account number, or card number)
   - Choose your display currency
   - Fetch your banking balance
   - View converted amounts in your preferred currency
7. **View Activity History**: See your recent banking activities in the activity log section
8. **Analyze Activities**: View statistics and patterns in your banking activities

## Technology Stack
- React.js
- ethers.js for blockchain interaction
- Tailwind CSS for styling
- CoinGecko API for fiat conversions
- CryptoJS for secure banking data encryption
- Exchange Rate API for currency conversions
- MongoDB for data persistence
- Express.js for backend API
- Mongoose for MongoDB object modeling

## Database Schema
The application uses the following MongoDB collections:

1. **Tokens** - Stores token information
   - address: Token contract address
   - name: Token name
   - symbol: Token symbol
   - decimals: Token decimals
   - balance: Token balance
   - owner: Wallet address
   - network: Network name
   - chainId: Network chain ID

2. **Transactions** - Stores transaction history
   - tokenAddress: Token contract address
   - tokenSymbol: Token symbol
   - tokenName: Token name
   - from: Sender address
   - to: Receiver address
   - amount: Transaction amount
   - decimals: Token decimals
   - transactionHash: Transaction hash
   - blockNumber: Block number
   - network: Network name
   - chainId: Network chain ID
   - timestamp: Transaction timestamp

3. **BankingInfo** - Stores banking information
   - user: Wallet address
   - method: Banking method (upi, account, card)
   - maskedIdentifier: Masked banking identifier
   - name: Account holder name
   - balance: Account balance
   - currency: Account currency
   - sessionId: Banking session ID
   - environment: 'development' or 'production'
   - lastUpdated: Last update timestamp

4. **BankingActivity** - Stores banking activity logs
   - action: Activity type
   - method: Banking method
   - maskedIdentifier: Masked banking identifier
   - environment: 'development' or 'production'
   - sessionId: Banking session ID
   - ipAddress: User IP address
   - userAgent: User agent
   - status: 'success', 'failure', or 'pending'
   - details: Additional details
   - timestamp: Activity timestamp

## API Endpoints

### Token API
- `GET /api/tokens?owner=&network=` - Get tokens for a specific owner and network
- `POST /api/tokens` - Add or update a token
- `DELETE /api/tokens/:id` - Delete a token

### Banking API
- `GET /api/banking?user=&method=` - Get banking info for a user
- `POST /api/banking` - Add or update banking info

### Transaction API
- `GET /api/transactions?address=&tokenAddress=&network=&limit=&page=` - Get transactions for an address
- `POST /api/transactions` - Add a new transaction
- `GET /api/transactions/stats?address=&network=&period=` - Get transaction statistics

### Activities API
- `GET /api/activities?sessionId=&method=&maskedIdentifier=&environment=&status=&startDate=&endDate=&limit=&page=` - Get activity logs with various filters
- `POST /api/activities` - Log a new banking activity
- `GET /api/activities/stats?sessionId=&method=&environment=&period=` - Get activity statistics
- `DELETE /api/activities?olderThan=&sessionId=` - Delete old activity logs

## Configuration
You can customize the common tokens list and network configurations in the App.js file:
- `COMMON_TOKENS`: Token addresses for each network
- `NETWORKS`: RPC URLs and block explorer links

Banking configuration can be found in BankingService.js:
- `BANKING_API`: API endpoints and keys
- `BANKING_METHODS`: Supported banking methods
- `SUPPORTED_CURRENCIES`: Available currencies for conversion

MongoDB configuration can be found in server/config/db.js:
- Connection settings for MongoDB

## Security Features
- End-to-end encryption for banking data
- OTP verification for production banking operations
- Masked banking identifiers for logging
- Secure session tokens
- HTTPS API communication
- MongoDB data persistence for audit trails
- Activity logging for security monitoring
- Automatic cleanup of old activity logs

## Notes
- For production use, replace "YOUR_INFURA_KEY" with your actual Infura API key
- Token detection in development mode is limited to scanning the first few Ganache accounts
- Fiat conversion is only available in production mode
- Banking API integration requires valid API credentials in production mode
- Mock banking data is used in development mode for testing purposes
- MongoDB must be running for the application to work properly
- The application uses local MongoDB by default, but can be configured to use MongoDB Atlas
- Activity logs can be automatically cleaned up after a specified period
