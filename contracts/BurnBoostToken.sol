// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract BurnBoostToken is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    uint256 private _totalSupply;
    uint256 private _initialSupply;
    uint256 public totalBurned;
    
    string public name;
    string public symbol;
    uint8 public decimals;
    
    // Market cap boost parameters
    uint256 public baseMarketCap;
    uint256 public currentBoostMultiplier;
    uint256 public constant BOOST_FACTOR = 10; // 0.1% boost per 1% burned
    uint256 public constant MAX_BOOST = 5000; // Max 50% boost (5000/10000)
    
    // Burn tracking
    mapping(address => uint256) public userBurnedAmount;
    uint256 public burnTransactionCount;
    
    // Events
    event TokensBurned(address indexed burner, uint256 amount, uint256 newMarketCapMultiplier);
    event MarketCapBoosted(uint256 oldMultiplier, uint256 newMultiplier, uint256 percentageBurned);
    
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _supply,
        uint256 _baseMarketCap
    ) {
        name = _name;
        symbol = _symbol;
        decimals = 18;
        _totalSupply = _supply * 10**uint256(decimals);
        _initialSupply = _totalSupply;
        _balances[msg.sender] = _totalSupply;
        baseMarketCap = _baseMarketCap;
        currentBoostMultiplier = 10000; // Starting at 100% (10000/10000)
        
        emit Transfer(address(0), msg.sender, _totalSupply);
    }
    
    // Standard ERC20 functions
    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address recipient, uint256 amount) public override returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }
    
    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowances[owner][spender];
    }
    
    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        uint256 currentAllowance = _allowances[sender][msg.sender];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        
        _transfer(sender, recipient, amount);
        _approve(sender, msg.sender, currentAllowance - amount);
        
        return true;
    }
    
    // Internal transfer function
    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "ERC20: transfer from zero address");
        require(recipient != address(0), "ERC20: transfer to zero address");
        
        uint256 senderBalance = _balances[sender];
        require(senderBalance >= amount, "ERC20: transfer amount exceeds balance");
        
        _balances[sender] = senderBalance - amount;
        _balances[recipient] += amount;
        
        emit Transfer(sender, recipient, amount);
    }
    
    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from zero address");
        require(spender != address(0), "ERC20: approve to zero address");
        
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
    
    // BURN MECHANISM WITH MARKET CAP BOOST
    function burn(uint256 amount) public returns (bool) {
        require(amount > 0, "Burn amount must be greater than 0");
        require(_balances[msg.sender] >= amount, "Insufficient balance to burn");
        
        // Update balances
        _balances[msg.sender] -= amount;
        _totalSupply -= amount;
        totalBurned += amount;
        userBurnedAmount[msg.sender] += amount;
        burnTransactionCount++;
        
        // Calculate and apply market cap boost
        uint256 oldMultiplier = currentBoostMultiplier;
        _updateMarketCapBoost();
        
        emit Transfer(msg.sender, address(0), amount);
        emit TokensBurned(msg.sender, amount, currentBoostMultiplier);
        
        if (oldMultiplier != currentBoostMultiplier) {
            emit MarketCapBoosted(oldMultiplier, currentBoostMultiplier, getBurnedPercentage());
        }
        
        return true;
    }
    
    // Calculate market cap boost based on burned percentage
    function _updateMarketCapBoost() internal {
        uint256 burnedPercentage = getBurnedPercentage();
        
        // Calculate boost: 0.1% boost for every 1% burned
        uint256 boostAmount = (burnedPercentage * BOOST_FACTOR) / 100;
        
        // Cap the maximum boost
        if (boostAmount > MAX_BOOST) {
            boostAmount = MAX_BOOST;
        }
        
        // Update multiplier (10000 = 100%, 15000 = 150%)
        currentBoostMultiplier = 10000 + boostAmount;
    }
    
    // Get current market cap with boost applied
    function getCurrentMarketCap() public view returns (uint256) {
        return (baseMarketCap * currentBoostMultiplier) / 10000;
    }
    
    // Get percentage of tokens burned (with 2 decimal precision)
    function getBurnedPercentage() public view returns (uint256) {
        if (_initialSupply == 0) return 0;
        return (totalBurned * 10000) / _initialSupply;
    }
    
    // Get remaining supply percentage
    function getRemainingSupplyPercentage() public view returns (uint256) {
        if (_initialSupply == 0) return 0;
        return (_totalSupply * 10000) / _initialSupply;
    }
    
    // Get boost percentage (e.g., 1250 = 12.50% boost)
    function getBoostPercentage() public view returns (uint256) {
        return currentBoostMultiplier - 10000;
    }
    
    // Get statistics
    function getTokenStats() public view returns (
        uint256 initialSupply,
        uint256 currentSupply,
        uint256 burned,
        uint256 burnedPercentage,
        uint256 marketCap,
        uint256 boostPercentage,
        uint256 burnTxCount
    ) {
        return (
            _initialSupply,
            _totalSupply,
            totalBurned,
            getBurnedPercentage(),
            getCurrentMarketCap(),
            getBoostPercentage(),
            burnTransactionCount
        );
    }
    
    // Check how much boost would be gained from burning specific amount
    function calculateBoostFromBurn(uint256 burnAmount) public view returns (uint256 newBoostPercentage) {
        uint256 potentialTotalBurned = totalBurned + burnAmount;
        uint256 potentialBurnedPercentage = (potentialTotalBurned * 10000) / _initialSupply;
        uint256 potentialBoostAmount = (potentialBurnedPercentage * BOOST_FACTOR) / 100;
        
        if (potentialBoostAmount > MAX_BOOST) {
            potentialBoostAmount = MAX_BOOST;
        }
        
        return potentialBoostAmount;
    }
}