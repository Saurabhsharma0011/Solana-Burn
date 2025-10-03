const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying BurnBoostToken contract...");

  // Get the ContractFactory and Signers
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Contract deployment parameters
  const TOKEN_NAME = "BurnBoost Token";
  const TOKEN_SYMBOL = "BBT";
  const INITIAL_SUPPLY = 1000000; // 1 million tokens
  const BASE_MARKET_CAP = ethers.parseEther("1000000"); // 1 million ETH base market cap

  // Deploy the contract
  const BurnBoostToken = await ethers.getContractFactory("BurnBoostToken");
  const burnBoostToken = await BurnBoostToken.deploy(
    TOKEN_NAME,
    TOKEN_SYMBOL,
    INITIAL_SUPPLY,
    BASE_MARKET_CAP
  );

  await burnBoostToken.waitForDeployment();

  const contractAddress = await burnBoostToken.getAddress();
  console.log("BurnBoostToken deployed to:", contractAddress);

  // Verify deployment
  console.log("\nVerifying deployment...");
  const name = await burnBoostToken.name();
  const symbol = await burnBoostToken.symbol();
  const totalSupply = await burnBoostToken.totalSupply();
  const baseMarketCap = await burnBoostToken.baseMarketCap();
  const currentBoostMultiplier = await burnBoostToken.currentBoostMultiplier();

  console.log("Contract Details:");
  console.log("- Name:", name);
  console.log("- Symbol:", symbol);
  console.log("- Total Supply:", ethers.formatEther(totalSupply), "tokens");
  console.log("- Base Market Cap:", ethers.formatEther(baseMarketCap), "ETH");
  console.log("- Current Boost Multiplier:", currentBoostMultiplier.toString());

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    contractDetails: {
      name: name,
      symbol: symbol,
      totalSupply: ethers.formatEther(totalSupply),
      baseMarketCap: ethers.formatEther(baseMarketCap),
      currentBoostMultiplier: currentBoostMultiplier.toString()
    }
  };

  console.log("\n=== DEPLOYMENT SUCCESSFUL ===");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", hre.network.name);
  console.log("Transaction hash:", burnBoostToken.deploymentTransaction().hash);
  
  console.log("\n=== NEXT STEPS ===");
  console.log("1. Update your .env file with:");
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("2. Verify the contract on Etherscan (if on mainnet/testnet)");
  console.log("3. Update the frontend configuration");

  // Write deployment info to file
  const fs = require("fs");
  const deploymentPath = `./deployments/${hre.network.name}-deployment.json`;
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync("./deployments")) {
    fs.mkdirSync("./deployments");
  }
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${deploymentPath}`);
}

// Error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });