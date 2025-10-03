# 🔥 BurnBoost Token //currenlty the platform is on devnet but will soon deploy on mainnet

A revolutionary deflationary cryptocurrency with market cap boost mechanism. Burn tokens to permanently reduce supply and increase market capitalization.

## 🌟 Features

### Smart Contract Features
- **ERC20 Standard**: Full compatibility with all ERC20 interfaces
- **Burn Mechanism**: Permanently remove tokens from circulation
- **Market Cap Boost**: 0.1% market cap increase for every 1% burned
- **Maximum Boost**: Capped at 50% to prevent excessive inflation
- **Transparent Tracking**: Complete burn history and statistics
- **Gas Optimized**: Efficient contract design for lower transaction costs

### Frontend Features
- **Modern UI/UX**: Dark theme with gradient backgrounds
- **Real-time Data**: Live updates of token statistics and burn progress
- **Interactive Charts**: Analytics dashboard with burn history and market cap growth
- **Mobile Responsive**: Optimized for all screen sizes
- **Web3 Integration**: MetaMask and other wallet support
- **Burn Calculator**: Preview boost impact before burning

## 🏗️ Project Structure

```
contract/
├── contracts/               # Smart contracts
│   └── BurnBoostToken.sol  # Main token contract
├── scripts/                # Deployment scripts
│   └── deploy.js           # Contract deployment
├── test/                   # Contract tests
│   └── BurnBoostToken.test.js
├── app/                    # Next.js frontend
│   ├── page.tsx           # Main application page
│   ├── layout.tsx         # App layout
│   └── globals.css        # Global styles
├── components/             # React components
│   ├── Dashboard.tsx      # Main dashboard
│   ├── BurnInterface.tsx  # Token burning interface
│   └── Analytics.tsx      # Analytics and charts
├── contexts/              # React contexts
│   └── Web3Context.tsx   # Web3 state management
├── lib/                   # Utility libraries
│   └── web3.ts           # Web3 utilities and contract ABI
└── types/                 # TypeScript definitions
    └── ethereum.d.ts     # Ethereum type definitions
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MetaMask or compatible Web3 wallet

### Installation

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd contract
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

3. **Compile the smart contract**
```bash
npm run compile
```

4. **Run tests**
```bash
npm run test
```

5. **Start local blockchain (optional)**
```bash
npm run node
```

6. **Deploy contract (choose network)**
```bash
# Local deployment
npm run deploy:local

# Testnet deployment (Sepolia)
npm run deploy:sepolia

# Mainnet deployment
npm run deploy:mainnet
```

7. **Update contract address**
```bash
# Add the deployed contract address to .env.local
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

8. **Start the frontend**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📋 Contract Details

### Token Specifications
- **Name**: BurnBoost Token
- **Symbol**: BBT
- **Decimals**: 18
- **Initial Supply**: 1,000,000 BBT
- **Base Market Cap**: 1,000,000 ETH (configurable)

### Burn Mechanism
- **Boost Formula**: 0.1% market cap increase per 1% tokens burned
- **Maximum Boost**: 50% (achieved at 50% burn rate)
- **Permanence**: Burned tokens are permanently removed
- **Transparency**: All burns are tracked and verifiable

### Key Functions

#### Core ERC20
```solidity
function transfer(address to, uint256 amount) external returns (bool)
function approve(address spender, uint256 amount) external returns (bool)
function transferFrom(address from, address to, uint256 amount) external returns (bool)
```

#### Burn Functions
```solidity
function burn(uint256 amount) public returns (bool)
function calculateBoostFromBurn(uint256 burnAmount) public view returns (uint256)
```

#### Analytics Functions
```solidity
function getCurrentMarketCap() public view returns (uint256)
function getBurnedPercentage() public view returns (uint256)
function getTokenStats() public view returns (...)
```

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
npm run test

# Run with coverage report
npm run test:coverage

# Test specific functionality
npx hardhat test --grep "Burn Mechanism"
```

### Test Coverage
- ✅ ERC20 functionality
- ✅ Burn mechanism
- ✅ Market cap boost calculations
- ✅ Access controls
- ✅ Event emissions
- ✅ Edge cases and error handling

## 🌐 Deployment Networks

### Supported Networks
- **Hardhat Local**: Development and testing
- **Sepolia Testnet**: Testing with real network conditions
- **Ethereum Mainnet**: Production deployment

### Environment Variables
```env
# Required for deployment
PRIVATE_KEY=your_wallet_private_key
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key
ETHERSCAN_API_KEY=your_etherscan_api_key

# Frontend configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=deployed_contract_address
NEXT_PUBLIC_CHAIN_ID=1_or_11155111
```

## 📊 Analytics Dashboard

The frontend provides comprehensive analytics:

### Dashboard Features
- **Token Statistics**: Supply, burns, boost percentage
- **User Analytics**: Personal balance and burn history
- **Market Metrics**: Current and projected market cap
- **Burn Progress**: Visual progress toward maximum boost
- **Interactive Charts**: Historical data visualization

### Chart Types
- **Supply Distribution**: Pie chart of burned vs remaining tokens
- **Market Cap Growth**: Line chart showing boost progression
- **Burn Activity**: Bar chart of daily burn volumes
- **Cumulative Burns**: Line chart of total burns over time

## 🔧 Development

### Local Development Setup

1. **Start local blockchain**
```bash
npm run node
```

2. **Deploy to local network**
```bash
npm run deploy:local
```

3. **Configure MetaMask**
- Network: Localhost 8545
- Chain ID: 31337
- Import account using private key from Hardhat

4. **Start frontend development server**
```bash
npm run dev
```

### Building for Production

```bash
# Build optimized frontend
npm run build

# Start production server
npm run start
```

## 🔐 Security Considerations

### Smart Contract Security
- **Audited Functions**: All burn mechanisms thoroughly tested
- **Overflow Protection**: SafeMath equivalent in Solidity 0.8+
- **Access Controls**: Proper permission management
- **Event Logging**: Comprehensive event emissions for transparency

### Frontend Security
- **Input Validation**: All user inputs validated
- **Transaction Verification**: Contract calls verified before execution
- **Error Handling**: Graceful error management and user feedback

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Write comprehensive tests for new features
- Follow existing code style and conventions
- Update documentation for any API changes
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and code comments
- **Issues**: Report bugs via GitHub Issues
- **Community**: Join our Discord/Telegram for discussions

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core burn mechanism
- ✅ Market cap boost functionality
- ✅ Frontend dashboard
- ✅ Analytics and charts

### Phase 2 (Planned)
- 🔄 Governance system
- 🔄 Staking mechanisms
- 🔄 Advanced burn strategies
- 🔄 Cross-chain compatibility

### Phase 3 (Future)
- 📅 DAO implementation
- 📅 Yield farming integration
- 📅 Mobile app development
- 📅 Enterprise partnerships

---

**Built with ❤️ using Next.js, Hardhat, and Ethereum**
# Solana-Burn
