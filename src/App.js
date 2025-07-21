import { useState, useEffect } from "react";
import { ethers } from "ethers";
import './App.css';
import BankingForm from "./BankingForm";
import { TokenApi, TransactionApi } from "./services/ApiService";

// ERC20 ABI for token interactions
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint amount)"
];

// Common token addresses on mainnet
const COMMON_TOKENS = {
  // Ethereum Mainnet
  "1": [
    { address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", symbol: "WETH", name: "Wrapped Ether" },
    { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", name: "Tether USD" },
    { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", name: "USD Coin" },
    { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI", name: "Dai Stablecoin" },
    { address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", symbol: "UNI", name: "Uniswap" },
    { address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", symbol: "LINK", name: "ChainLink Token" }
  ],
  // Polygon
  "137": [
    { address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", symbol: "WETH", name: "Wrapped Ether" },
    { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", symbol: "USDT", name: "Tether USD" },
    { address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", symbol: "USDC", name: "USD Coin" }
  ],
  // Binance Smart Chain
  "56": [
    { address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", symbol: "WBNB", name: "Wrapped BNB" },
    { address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", symbol: "BUSD", name: "BUSD Token" },
    { address: "0x55d398326f99059fF775485246999027B3197955", symbol: "USDT", name: "Tether USD" }
  ]
};

// Network configurations
const NETWORKS = {
  development: {
    name: "Ganache",
    rpcUrl: "http://127.0.0.1:7545",
    chainId: "0x539",
    blockExplorer: ""
  },
  mainnet: {
    name: "Ethereum Mainnet",
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY", // Replace with your Infura key
    chainId: "0x1",
    blockExplorer: "https://etherscan.io"
  },
  polygon: {
    name: "Polygon Mainnet",
    rpcUrl: "https://polygon-rpc.com",
    chainId: "0x89",
    blockExplorer: "https://polygonscan.com"
  },
  bsc: {
    name: "Binance Smart Chain",
    rpcUrl: "https://bsc-dataseed.binance.org",
    chainId: "0x38",
    blockExplorer: "https://bscscan.com"
  }
};

function App() {
  // State variables
  const [tokens, setTokens] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [address, setAddress] = useState("");
  const [eth, setEth] = useState("");
  const [history, setHistory] = useState([]);
  const [provider, setProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [network, setNetwork] = useState("development");
  const [customTokenAddress, setCustomTokenAddress] = useState("");
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);
  const [chainId, setChainId] = useState("");
  const [nativeTokenSymbol, setNativeTokenSymbol] = useState("ETH");
  const [fiatValue, setFiatValue] = useState(null);

  // Connect to selected network on component mount or network change
  useEffect(() => {
    const connectToNetwork = async () => {
      try {
        let networkProvider;
        let accounts = [];
        let currentChainId = "";
        
        // Check if we should use MetaMask
        if (window.ethereum && network !== "development") {
          try {
            // Request account access
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            networkProvider = new ethers.providers.Web3Provider(window.ethereum);
            const { chainId } = await networkProvider.getNetwork();
            currentChainId = chainId.toString();
            setIsMetaMaskConnected(true);
            setChainId(currentChainId);
            
            // Set native token symbol based on network
            if (chainId === 1) setNativeTokenSymbol("ETH");
            else if (chainId === 137) setNativeTokenSymbol("MATIC");
            else if (chainId === 56) setNativeTokenSymbol("BNB");
            else setNativeTokenSymbol("ETH");
            
            // Listen for chain changes
            window.ethereum.on('chainChanged', (chainId) => {
              window.location.reload();
            });
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
              if (accounts.length > 0) {
                setSelectedAccount(accounts[0]);
                setAddress(accounts[0]);
                fetchEth(accounts[0], networkProvider);
                fetchTokens(accounts[0], networkProvider, chainId.toString());
              } else {
                setIsMetaMaskConnected(false);
              }
            });
          } catch (error) {
            console.error("User denied account access or MetaMask not available");
            setErrorMessage("Please connect to MetaMask to use this application in production mode");
          }
        } else {
          // Use RPC URL for selected network
          const networkConfig = NETWORKS[network];
          networkProvider = new ethers.providers.JsonRpcProvider(networkConfig.rpcUrl);
          
          if (network === "development") {
            // For Ganache, get accounts from the node
            accounts = await networkProvider.listAccounts();
            currentChainId = "0x539"; // Ganache chain ID
            setNativeTokenSymbol("ETH");
          }
        }
        
        setProvider(networkProvider);
        setAccounts(accounts);
        
        if (accounts.length > 0) {
          setSelectedAccount(accounts[0]);
          setAddress(accounts[0]);
          // Store current address in session storage for other components
          sessionStorage.setItem('currentAddress', accounts[0]);
          fetchEth(accounts[0], networkProvider);
          fetchTokens(accounts[0], networkProvider, currentChainId);
        }
      } catch (error) {
        console.error("Failed to connect to network:", error);
        setErrorMessage(`Failed to connect to ${NETWORKS[network].name}. Please check your connection.`);
      }
    };

    connectToNetwork();
  }, [network]);

  // Handle network change
  const handleNetworkChange = (e) => {
    setNetwork(e.target.value);
    setTokens([]);
    setHistory([]);
    setEth("");
  };

  // Handle account selection change
  const handleAccountChange = (e) => {
    const selectedAccount = e.target.value;
    setSelectedAccount(selectedAccount);
    setAddress(selectedAccount);
    
    if (selectedAccount) {
      fetchEth(selectedAccount, provider);
      fetchTokens(selectedAccount, provider, chainId);
    }
  };

  // Handle manual address input
  const handleAddressChange = (e) => {
    setAddress(e.target.value);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (address) {
      fetchEth(address, provider);
      fetchTokens(address, provider, chainId);
    }
  };

  // Add custom token
  const handleAddCustomToken = async (e) => {
    e.preventDefault();
    if (!customTokenAddress || !ethers.utils.isAddress(customTokenAddress)) {
      setErrorMessage("Please enter a valid token address");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      const tokenContract = new ethers.Contract(customTokenAddress, ERC20_ABI, provider);
      const name = await tokenContract.name().catch(() => `Token ${customTokenAddress.substring(0, 6)}`);
      const symbol = await tokenContract.symbol().catch(() => "TKN");
      const decimals = await tokenContract.decimals().catch(() => 18);
      const balance = await tokenContract.balanceOf(address);
      
      // Add to tokens list if not already there
      setTokens(prevTokens => {
        const exists = prevTokens.some(token => token.address.toLowerCase() === customTokenAddress.toLowerCase());
        if (exists) {
          return prevTokens;
        }
        
        return [...prevTokens, {
          address: customTokenAddress,
          name,
          symbol,
          decimals,
          totalBalance: balance.toString()
        }];
      });
      
      setCustomTokenAddress("");
    } catch (error) {
      console.error("Error adding custom token:", error);
      setErrorMessage("Failed to add token. Make sure it's a valid ERC20 token.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tokens
  const fetchTokens = async (walletAddress, currentProvider, currentChainId) => {
    if (!walletAddress || !ethers.utils.isAddress(walletAddress) || !currentProvider) {
      setErrorMessage("Please enter a valid Ethereum wallet address");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      const tokenResults = [];
      
      if (network === "development") {
        // For Ganache, scan the first few accounts as potential token contracts
        const sampleTokenAddresses = accounts.slice(0, 5);
        
        for (const tokenAddress of sampleTokenAddresses) {
          try {
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, currentProvider);
            const name = await tokenContract.name().catch(() => `Token ${tokenAddress.substring(0, 6)}`);
            const symbol = await tokenContract.symbol().catch(() => "TKN");
            const decimals = await tokenContract.decimals().catch(() => 18);
            const balance = await tokenContract.balanceOf(walletAddress);
            
            if (balance.gt(0)) {
              const tokenData = {
                address: tokenAddress,
                name,
                symbol,
                decimals,
                totalBalance: balance.toString()
              };
              
              tokenResults.push(tokenData);
              
              // Store token in MongoDB
              try {
                await TokenApi.saveToken({
                  address: tokenAddress,
                  name,
                  symbol,
                  decimals,
                  balance: balance.toString(),
                  owner: walletAddress.toLowerCase(),
                  network,
                  chainId: currentChainId
                });
              } catch (error) {
                console.error("Error saving token to MongoDB:", error);
                // Continue even if storage fails
              }
            }
          } catch (error) {
            // Not a token contract or doesn't implement ERC20 - skip
          }
        }
      } else {
        // For production networks, use common token list based on chain ID
        const networkId = parseInt(currentChainId).toString();
        const commonTokens = COMMON_TOKENS[networkId] || [];
        
        for (const token of commonTokens) {
          try {
            const tokenContract = new ethers.Contract(token.address, ERC20_ABI, currentProvider);
            const decimals = await tokenContract.decimals().catch(() => 18);
            const balance = await tokenContract.balanceOf(walletAddress);
            
            if (balance.gt(0)) {
              const tokenData = {
                address: token.address,
                name: token.name,
                symbol: token.symbol,
                decimals,
                totalBalance: balance.toString()
              };
              
              tokenResults.push(tokenData);
              
              // Store token in MongoDB
              try {
                await TokenApi.saveToken({
                  address: token.address,
                  name: token.name,
                  symbol: token.symbol,
                  decimals,
                  balance: balance.toString(),
                  owner: walletAddress.toLowerCase(),
                  network,
                  chainId: currentChainId
                });
              } catch (error) {
                console.error("Error saving token to MongoDB:", error);
                // Continue even if storage fails
              }
            }
          } catch (error) {
            console.error(`Error fetching token ${token.symbol}:`, error);
          }
        }
      }
      
      setTokens(tokenResults);
      
      // Fetch fiat value if not in development mode
      if (network !== "development") {
        fetchFiatValue(walletAddress);
      }
      
      // Try to load tokens from MongoDB as well
      try {
        const storedTokens = await TokenApi.getTokens(walletAddress.toLowerCase(), network);
        
        // Merge with existing tokens
        if (storedTokens && storedTokens.length > 0) {
          const existingAddresses = tokenResults.map(t => t.address.toLowerCase());
          
          const additionalTokens = storedTokens.filter(
            token => !existingAddresses.includes(token.address.toLowerCase())
          ).map(token => ({
            address: token.address,
            name: token.name,
            symbol: token.symbol,
            decimals: token.decimals,
            totalBalance: token.balance
          }));
          
          if (additionalTokens.length > 0) {
            setTokens([...tokenResults, ...additionalTokens]);
          }
        }
      } catch (error) {
        console.error("Error fetching tokens from MongoDB:", error);
        // Continue with blockchain-fetched tokens
      }
    } catch (error) {
      console.error("Error fetching tokens:", error);
      setErrorMessage("Failed to fetch tokens. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

    // Fetch ETH balance
  const fetchEth = async (walletAddress, currentProvider) => {
    if (!currentProvider || !walletAddress) return;
    
    try {
      const balance = await currentProvider.getBalance(walletAddress);
      setEth(balance.toHexString());
    } catch (error) {
      console.error("Error fetching ETH balance:", error);
    }
  };

  // Fetch fiat value (USD) using CoinGecko API
  const fetchFiatValue = async (walletAddress) => {
    try {
      // Get ETH price from CoinGecko
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const data = await response.json();
      const ethPrice = data.ethereum.usd;
      
      // Calculate fiat value
      if (eth) {
        const ethBalance = parseFloat(ethers.utils.formatEther(eth));
        const usdValue = (ethBalance * ethPrice).toFixed(2);
        setFiatValue(usdValue);
      }
    } catch (error) {
      console.error("Error fetching fiat value:", error);
    }
  };

  // Get token transaction history
  const tokenHistory = async (tokenAddress) => {
    if (!provider || !address || !tokenAddress) return;
    
    setIsLoading(true);
    
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const name = await tokenContract.name().catch(() => "Unknown Token");
      const symbol = await tokenContract.symbol().catch(() => "???");
      const decimals = await tokenContract.decimals().catch(() => 18);
      
      // Get Transfer events where the address is either sender or receiver
      const filterFrom = tokenContract.filters.Transfer(address);
      const filterTo = tokenContract.filters.Transfer(null, address);
      
      // Get the current block number
      const currentBlock = await provider.getBlockNumber();
      // Look back 1000 blocks or from block 0 if chain is shorter
      const fromBlock = Math.max(0, currentBlock - 1000);
      
      // Get events
      const eventsFrom = await tokenContract.queryFilter(filterFrom, fromBlock);
      const eventsTo = await tokenContract.queryFilter(filterTo, fromBlock);
      
      // Combine and sort events
      const allEvents = [...eventsFrom, ...eventsTo].sort((a, b) => b.blockNumber - a.blockNumber);
      
      // Format events
      const formattedEvents = await Promise.all(allEvents.slice(0, 20).map(async (event) => {
        const block = await event.getBlock();
        
        const transactionData = {
          blockNumber: event.blockNumber,
          from: event.args[0],
          to: event.args[1],
          totalBalance: event.args[2].toString(),
          transactionHash: event.transactionHash,
          timestamp: new Date(block.timestamp * 1000).toLocaleString(),
          decimals
        };
        
        // Store transaction in MongoDB
        try {
          await TransactionApi.saveTransaction({
            tokenAddress,
            tokenSymbol: symbol,
            tokenName: name,
            from: event.args[0],
            to: event.args[1],
            amount: event.args[2].toString(),
            decimals,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            network,
            chainId: chainId || "0",
            timestamp: new Date(block.timestamp * 1000)
          });
        } catch (error) {
          console.error("Error saving transaction to MongoDB:", error);
          // Continue even if storage fails
        }
        
        return transactionData;
      }));
      
      setHistory({
        token: { name, symbol, decimals },
        paginatedItems: formattedEvents
      });
    } catch (error) {
      console.error("Error fetching token history:", error);
      setErrorMessage("Failed to fetch token transaction history.");
      setHistory({ paginatedItems: [] });
      
      // Try to load transactions from MongoDB
      try {
        const response = await TransactionApi.getTransactions(address, tokenAddress, network);
        
        if (response && response.transactions && response.transactions.length > 0) {
          const formattedEvents = response.transactions.map(tx => ({
            blockNumber: tx.blockNumber,
            from: tx.from,
            to: tx.to,
            totalBalance: tx.amount,
            transactionHash: tx.transactionHash,
            timestamp: new Date(tx.timestamp).toLocaleString(),
            decimals: tx.decimals
          }));
          
          setHistory({
            token: { 
              name: response.transactions[0].tokenName, 
              symbol: response.transactions[0].tokenSymbol, 
              decimals: response.transactions[0].decimals 
            },
            paginatedItems: formattedEvents
          });
        }
      } catch (mongoError) {
        console.error("Error fetching transactions from MongoDB:", mongoError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get block explorer URL based on current network
  const getBlockExplorerUrl = (txHash) => {
    const explorer = NETWORKS[network].blockExplorer;
    if (!explorer) return "#";
    return `${explorer}/tx/${txHash}`;
  };

  return (
    <>
      <div className="App">
        {/* Header section */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Token Browser</h1>
            <p className="text-gray-600">Browse tokens across different networks</p>
        </div>
      </header>
        
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
            {errorMessage && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {errorMessage}
              </div>
            )}
            
            {/* Network Selection */}
            <div className="mb-6">
              <label htmlFor="network-select" className="block text-l font-medium leading-6 text-gray-900 mb-2">
                Select Network
              </label>
              <select
                id="network-select"
                value={network}
                onChange={handleNetworkChange}
                className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
              >
                <option value="development">Development (Ganache)</option>
                <option value="mainnet">Ethereum Mainnet</option>
                <option value="polygon">Polygon</option>
                <option value="bsc">Binance Smart Chain</option>
              </select>
            </div>
            
            {/* Account Selection (Only for Ganache) */}
            {network === "development" && accounts.length > 0 && (
              <div className="mb-6">
                <label htmlFor="account-select" className="block text-l font-medium leading-6 text-gray-900 mb-2">
                  Select Ganache Account
                </label>
                <select
                  id="account-select"
                  value={selectedAccount}
                  onChange={handleAccountChange}
                  className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="">Select an account</option>
                  {accounts.map((account, index) => (
                    <option key={account} value={account}>
                      Account {index}: {account}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* MetaMask Connection Status */}
            {network !== "development" && (
              <div className={`mb-6 p-3 rounded ${isMetaMaskConnected ? 'bg-green-100' : 'bg-yellow-100'}`}>
                <p className="font-medium">
                  {isMetaMaskConnected 
                    ? `Connected to MetaMask: ${selectedAccount?.substring(0, 6)}...${selectedAccount?.substring(selectedAccount.length - 4)}` 
                    : "Please connect to MetaMask to use this application in production mode"}
                </p>
              </div>
            )}
            
            {/* Banking Form Integration */}
            <div className="mt-10 mb-10">
              <h2 className="text-2xl font-bold mb-4">Banking Services</h2>
              <p className="text-gray-600 mb-4">Connect your banking services to manage your crypto-fiat transactions</p>
              <BankingForm environment={network === "development" ? "development" : "production"} />
            </div>
            
            {/* Manual Address Input */}
            <form onSubmit={handleSubmit} className="mb-6">
              <div className="space-y-4">
                <div className="border-b border-gray-900/10 pb-4">
                  <div className="col-span-full">
                    <label htmlFor="wallet-address" className="block text-l font-medium leading-6 text-gray-900">
                      Enter Address Manually 🎯
                  </label>
                    <div className="mt-2 flex">
                    <input
                        onChange={handleAddressChange}
                        value={address}
                      type="text"
                      id="wallet-address"
                        placeholder="0x..."
                        className="block w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-l leading-6 p-3"
                    />
                    <button
                      type="submit"
                        className="ml-4 rounded-lg border w-48 text-sm justify-center bg-blue-400 text-white p-3 font-bold"
                        disabled={isLoading}
                    >
                        {isLoading ? "Loading..." : "Show me the tokens!"}
                    </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
            
            {/* Custom Token Input */}
            <form onSubmit={handleAddCustomToken} className="mb-6">
              <div className="space-y-4">
                <div className="border-b border-gray-900/10 pb-4">
                  <div className="col-span-full">
                    <label htmlFor="custom-token" className="block text-l font-medium leading-6 text-gray-900">
                      Add Custom Token
                    </label>
                    <div className="mt-2 flex">
                      <input
                        onChange={(e) => setCustomTokenAddress(e.target.value)}
                        value={customTokenAddress}
                        type="text"
                        id="custom-token"
                        placeholder="Token contract address"
                        className="block w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-l leading-6 p-3"
                      />
                      <button
                        type="submit"
                        className="ml-4 rounded-lg border w-48 text-sm justify-center bg-green-500 text-white p-3 font-bold"
                        disabled={isLoading}
                      >
                        Add Token
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* Balance Display */}
                    {eth && (
              <div className="block mb-6">
                <div className="relative text-black-900 bg-green-200 rounded inline-block px-4 py-2">
                  {nativeTokenSymbol} balance:&nbsp;
                          <strong>
                    {ethers.utils.formatEther(eth)}
                          </strong>
                  {fiatValue && (
                    <span className="ml-2 text-gray-700">
                      (≈ ${fiatValue} USD)
                    </span>
                  )}
                        </div>
                      </div>
                    )}

            {/* Transaction History */}
                    {history.paginatedItems?.length > 0 && (
                      <div className="relative overflow-x-auto justify-center w-full h-140 my-10 bg-teal-50 rounded px-4 py-2">
                        <h1 className="text-xl font-bold mb-2">
                          Transaction history for {history.token.name} ({history.token.symbol})
                        </h1>
                        <table className="min-w-full divide-y-4 divide-gray-200 text-sm">
                          <thead>
                            <tr>
                              <th className="whitespace-nowrap py-4 text-left font-bold text-gray-1000">
                                Block number
                              </th>
                              <th className="whitespace-nowrap py-4 text-left font-bold text-gray-900">
                        From
                      </th>
                      <th className="whitespace-nowrap py-4 text-left font-bold text-gray-900">
                        To
                              </th>
                              <th className="whitespace-nowrap py-4 text-left font-bold text-gray-900">Amount</th>
                      <th className="whitespace-nowrap py-4 text-left font-bold text-gray-900">Time</th>
                      {network !== "development" && (
                        <th className="whitespace-nowrap py-4 text-left font-bold text-gray-900">Explorer</th>
                      )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {history.paginatedItems.map((item, index) => (
                              <tr key={index}>
                                <td className="py-4 whitespace-nowrap text-sm">{item.blockNumber}</td>
                        <td className="py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.from.substring(0, 6)}...{item.from.substring(item.from.length - 4)}
                        </td>
                                <td className="py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.to.substring(0, 6)}...{item.to.substring(item.to.length - 4)}
                                </td>
                                <td className="py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                            {ethers.utils.formatUnits(item.totalBalance, item.decimals)}
                                  </div>
                                </td>
                        <td className="py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.timestamp}
                        </td>
                        {network !== "development" && (
                                <td className="py-4 whitespace-nowrap text-sm text-blue-500">
                                  <a
                              href={getBlockExplorerUrl(item.transactionHash)}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                              [View on Explorer]
                                  </a>
                                </td>
                        )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

            {/* Token List */}
                    {tokens.length > 0 && (
                      <div className="relative overflow-x-auto justify-center w-full h-140 mt-10 mb-10 bg-blue-50 rounded px-4 py-2">
                        <h1 className="text-3xl font-bold">Tokens</h1>
                        <table className="min-w-full divide-y-4 divide-gray-200 text-sm">
                          <thead>
                            <tr>
                              <th className="whitespace-nowrap py-4 text-left font-bold text-gray-1000">Name</th>
                              <th className="whitespace-nowrap py-4 text-left font-bold text-gray-900">Symbol</th>
                              <th className="whitespace-nowrap py-4 text-left font-bold text-gray-900">Balance</th>
                      <th className="whitespace-nowrap py-4 text-left font-bold text-gray-900">Address</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {tokens.map((token, index) => (
                              <tr key={index}>
                                    <td className="whitespace-nowrap font-bold py-4 text-blue-500">
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          tokenHistory(token.address);
                                        }}
                                        className="font-bold"
                                      >
                                        {token.name}
                                      </button>
                                    </td>
                                    <td className="whitespace-nowrap py-4 text-gray-900">{token.symbol}</td>
                                    <td className="whitespace-nowrap py-4 text-gray-900">
                          {ethers.utils.formatUnits(token.totalBalance, token.decimals)}
                        </td>
                        <td className="whitespace-nowrap py-4 text-gray-500">
                          {token.address.substring(0, 6)}...{token.address.substring(token.address.length - 4)}
                                    </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
            
            {/* No Tokens Found */}
            {!isLoading && tokens.length === 0 && address && (
              <div className="text-center py-8 text-gray-500">
                {network === "development" 
                  ? "No tokens found for this address. You may need to deploy some ERC20 tokens to Ganache first."
                  : "No tokens found for this address. Try adding custom tokens or checking a different address."}
              </div>
            )}
            
            {/* Network Information */}
            <div className="mt-8 text-sm text-gray-500">
              <p>Currently connected to: <strong>{NETWORKS[network].name}</strong></p>
              {chainId && <p>Chain ID: {chainId}</p>}
            </div>
          </div>
        </main>
        </div>
    </>
  );
}

export default App;