const {
  Connection,
  PublicKey,
  clusterApiUrl,
} = require('@solana/web3.js');
const {
  getAssociatedTokenAddress,
} = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

async function getTokenStatus() {
  try {
    console.log('📊 BurnBoost Token Status Report');
    console.log('================================\n');
    
    // Load deployment info
    const deploymentPath = path.join(__dirname, '../token-deployment.json');
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    
    // Configuration
    const network = 'devnet';
    const connection = new Connection(clusterApiUrl(network), 'confirmed');
    const mintAddress = new PublicKey(deployment.addresses.mint);
    const deployer = new PublicKey(deployment.addresses.deployer);
    const decimals = deployment.tokenConfig.decimals;
    const initialSupply = deployment.tokenConfig.initialSupply;
    
    console.log('🏷️ Token Information:');
    console.log(`   Name: ${deployment.tokenConfig.name}`);
    console.log(`   Symbol: ${deployment.tokenConfig.symbol}`);
    console.log(`   Mint: ${mintAddress.toString()}`);
    console.log(`   Decimals: ${decimals}`);
    console.log(`   Network: ${network.toUpperCase()}`);
    
    // Get mint info
    console.log('\n🪙 Supply Analysis:');
    const mintInfo = await connection.getParsedAccountInfo(mintAddress);
    const mintData = mintInfo.value.data.parsed.info;
    const currentSupply = parseInt(mintData.supply) / Math.pow(10, decimals);
    const totalBurned = initialSupply - currentSupply;
    const burnPercentage = (totalBurned / initialSupply) * 100;
    const boostPercentage = Math.min(burnPercentage * 0.1, 50);
    
    console.log(`   Initial Supply: ${initialSupply.toLocaleString()} BBT`);
    console.log(`   Current Supply: ${currentSupply.toLocaleString()} BBT`);
    console.log(`   Total Burned: ${totalBurned.toLocaleString()} BBT`);
    console.log(`   Burn Percentage: ${burnPercentage.toFixed(2)}%`);
    console.log(`   Market Cap Boost: +${boostPercentage.toFixed(2)}%`);
    
    // Get deployer balance
    console.log('\n👤 Deployer Wallet:');
    const deployerTokenAccount = await getAssociatedTokenAddress(mintAddress, deployer);
    const deployerBalance = await connection.getTokenAccountBalance(deployerTokenAccount);
    const deployerTokens = parseInt(deployerBalance.value.amount) / Math.pow(10, decimals);
    
    console.log(`   Address: ${deployer.toString()}`);
    console.log(`   Token Account: ${deployerTokenAccount.toString()}`);
    console.log(`   Balance: ${deployerTokens.toLocaleString()} BBT`);
    console.log(`   Percentage of Total: ${((deployerTokens / currentSupply) * 100).toFixed(2)}%`);
    
    // Check for transfer history (simplified)
    console.log('\n📈 Recent Activity:');
    
    // Load transfer info if it exists
    const transferInfoPath = path.join(__dirname, '../transfer-info.json');
    if (fs.existsSync(transferInfoPath)) {
      const transferInfo = JSON.parse(fs.readFileSync(transferInfoPath, 'utf8'));
      console.log(`   Latest Transfer: ${(transferInfo.amount / 1e6).toFixed(1)}M BBT`);
      console.log(`   To: ${transferInfo.recipient.substring(0, 8)}...`);
      console.log(`   Date: ${new Date(transferInfo.timestamp).toLocaleDateString()}`);
    }
    
    // Load burn info if it exists
    const burnInfoPath = path.join(__dirname, '../burn-info.json');
    if (fs.existsSync(burnInfoPath)) {
      const burnInfo = JSON.parse(fs.readFileSync(burnInfoPath, 'utf8'));
      console.log(`   Latest Burn: ${(burnInfo.burnAmount / 1e6).toFixed(1)}M BBT`);
      console.log(`   Cost: ${burnInfo.costAnalysis.solanaCost}`);
      console.log(`   Date: ${new Date(burnInfo.timestamp).toLocaleDateString()}`);
    }
    
    // Network performance metrics
    console.log('\n⚡ Solana Network Performance:');
    const slot = await connection.getSlot();
    const blockTime = await connection.getBlockTime(slot);
    const currentTime = Date.now() / 1000;
    const timeDiff = currentTime - blockTime;
    
    console.log(`   Current Slot: ${slot.toLocaleString()}`);
    console.log(`   Block Time: ${timeDiff.toFixed(1)}s ago`);
    console.log(`   Network: Online ✅`);
    console.log(`   Transaction Cost: ~$0.00025`);
    console.log(`   Confirmation Time: ~400ms`);
    console.log(`   TPS Capacity: 65,000+`);
    
    // Economics summary
    console.log('\n💰 Token Economics:');
    const baseMarketCap = 1000000; // $1M base
    const currentMarketCap = baseMarketCap * (1 + boostPercentage / 100);
    const marketCapIncrease = currentMarketCap - baseMarketCap;
    
    console.log(`   Base Market Cap: $${(baseMarketCap / 1e6).toFixed(1)}M`);
    console.log(`   Boosted Market Cap: $${(currentMarketCap / 1e6).toFixed(2)}M`);
    console.log(`   Boost Value: +$${(marketCapIncrease / 1e3).toFixed(1)}K`);
    console.log(`   Value per Token: $${(currentMarketCap / currentSupply).toFixed(6)}`);
    
    // Burn efficiency analysis
    console.log('\n🔥 Burn Mechanism Efficiency:');
    console.log(`   Tokens Available for Burn: ${deployerTokens.toLocaleString()} BBT`);
    console.log(`   Potential Additional Boost: +${((deployerTokens / initialSupply) * 10).toFixed(2)}%`);
    console.log(`   Max Possible Boost: 50% (${(initialSupply * 0.5).toLocaleString()} BBT burn required)`);
    
    const remainingForMaxBoost = (initialSupply * 0.5) - totalBurned;
    if (remainingForMaxBoost > 0) {
      console.log(`   Tokens to Max Boost: ${remainingForMaxBoost.toLocaleString()} BBT`);
    } else {
      console.log(`   Max Boost: ACHIEVED! 🎉`);
    }
    
    // Solana advantages
    console.log('\n🚀 Solana Burn Advantages:');
    console.log('   ✅ Ultra-low fees make frequent burning viable');
    console.log('   ✅ Fast confirmations provide instant feedback');
    console.log('   ✅ High throughput prevents network congestion');
    console.log('   ✅ Eco-friendly consensus mechanism');
    console.log('   ✅ Growing DeFi ecosystem integration');
    
    // Explorer links
    console.log('\n🔗 Quick Links:');
    console.log(`   Token: https://explorer.solana.com/address/${mintAddress.toString()}?cluster=devnet`);
    console.log(`   Deployer: https://explorer.solana.com/address/${deployer.toString()}?cluster=devnet`);
    
    if (fs.existsSync(burnInfoPath)) {
      const burnInfo = JSON.parse(fs.readFileSync(burnInfoPath, 'utf8'));
      console.log(`   Latest Burn: ${burnInfo.explorerUrl}`);
    }
    
    if (fs.existsSync(transferInfoPath)) {
      const transferInfo = JSON.parse(fs.readFileSync(transferInfoPath, 'utf8'));
      console.log(`   Latest Transfer: ${transferInfo.explorerUrl}`);
    }
    
    console.log('\n🎯 Status: ALL SYSTEMS OPERATIONAL ✅');
    
  } catch (error) {
    console.error('\n❌ Status check failed:', error.message);
    process.exit(1);
  }
}

// Run status check
getTokenStatus();