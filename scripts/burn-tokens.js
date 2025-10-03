const {
  Connection,
  PublicKey,
  Keypair,
  clusterApiUrl,
} = require('@solana/web3.js');
const {
  burn,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function burnTokens() {
  try {
    console.log('🔥 Starting token burn operation...');
    
    // Load deployment info
    const deploymentPath = path.join(__dirname, '../token-deployment.json');
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    
    // Get burn amount from command line or prompt
    const burnAmount = process.argv[2] ? parseFloat(process.argv[2]) : 100000; // Default 100k tokens
    
    // Configuration
    const network = 'devnet';
    const connection = new Connection(clusterApiUrl(network), 'confirmed');
    const mintAddress = new PublicKey(deployment.addresses.mint);
    const decimals = deployment.tokenConfig.decimals;
    const amountWithDecimals = burnAmount * Math.pow(10, decimals);
    
    console.log('🔥 Burn Details:');
    console.log(`   Network: ${network}`);
    console.log(`   Token Mint: ${mintAddress.toString()}`);
    console.log(`   Amount: ${burnAmount.toLocaleString()} tokens`);
    console.log(`   Amount (with decimals): ${amountWithDecimals.toLocaleString()}`);
    
    // Load wallet keypair
    console.log('\n🔑 Loading wallet...');
    let walletKeypair;
    
    if (process.env.SOLANA_PRIVATE_KEY) {
      const privateKeyArray = JSON.parse(process.env.SOLANA_PRIVATE_KEY);
      walletKeypair = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
    } else {
      const keypairPath = path.join(os.homedir(), '.config/solana/id.json');
      if (fs.existsSync(keypairPath)) {
        const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
        walletKeypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
      } else {
        throw new Error('No private key found');
      }
    }
    
    console.log(`   Wallet: ${walletKeypair.publicKey.toString()}`);
    
    // Get the associated token account
    console.log('\n🏦 Getting token account...');
    const tokenAccount = await getAssociatedTokenAddress(
      mintAddress,
      walletKeypair.publicKey
    );
    console.log(`   Token Account: ${tokenAccount.toString()}`);
    
    // Check balance before burn
    console.log('\n💰 Checking balance...');
    const balanceBefore = await connection.getTokenAccountBalance(tokenAccount);
    const balanceBeforeAmount = parseInt(balanceBefore.value.amount);
    const tokensBeforeBurn = balanceBeforeAmount / Math.pow(10, decimals);
    
    console.log(`   Current Balance: ${tokensBeforeBurn.toLocaleString()} tokens`);
    
    if (balanceBeforeAmount < amountWithDecimals) {
      throw new Error(`Insufficient balance. Need ${burnAmount.toLocaleString()} tokens, have ${tokensBeforeBurn.toLocaleString()}`);
    }
    
    // Calculate burn statistics
    const totalSupply = deployment.tokenConfig.initialSupply;
    const currentBurnedTokens = totalSupply - tokensBeforeBurn;
    const newBurnedTokens = currentBurnedTokens + burnAmount;
    const newBurnPercentage = (newBurnedTokens / totalSupply) * 100;
    const boostPercentage = Math.min(newBurnPercentage * 0.1, 50); // 0.1% boost per 1% burned, max 50%
    
    console.log('\n📊 Burn Impact Analysis:');
    console.log(`   Current Burned: ${currentBurnedTokens.toLocaleString()} tokens`);
    console.log(`   After Burn: ${newBurnedTokens.toLocaleString()} tokens`);
    console.log(`   Burn Percentage: ${newBurnPercentage.toFixed(2)}%`);
    console.log(`   Market Cap Boost: +${boostPercentage.toFixed(2)}%`);
    
    // Perform the burn
    console.log('\n🔥 Executing burn transaction...');
    const burnSignature = await burn(
      connection,
      walletKeypair,
      tokenAccount,
      mintAddress,
      walletKeypair,
      amountWithDecimals
    );
    
    console.log('✅ Burn completed successfully!');
    console.log(`   Transaction Signature: ${burnSignature}`);
    console.log(`   Explorer: https://explorer.solana.com/tx/${burnSignature}?cluster=${network}`);
    
    // Verify the burn
    console.log('\n🔍 Verifying burn...');
    await connection.confirmTransaction(burnSignature, 'confirmed');
    
    const balanceAfter = await connection.getTokenAccountBalance(tokenAccount);
    const balanceAfterAmount = parseInt(balanceAfter.value.amount);
    const tokensAfterBurn = balanceAfterAmount / Math.pow(10, decimals);
    
    console.log(`   New Balance: ${tokensAfterBurn.toLocaleString()} tokens`);
    console.log(`   Tokens Burned: ${(tokensBeforeBurn - tokensAfterBurn).toLocaleString()} tokens`);
    
    // Save burn info
    const burnInfo = {
      network,
      timestamp: new Date().toISOString(),
      wallet: walletKeypair.publicKey.toString(),
      tokenMint: mintAddress.toString(),
      tokenAccount: tokenAccount.toString(),
      burnAmount,
      amountWithDecimals,
      signature: burnSignature,
      explorerUrl: `https://explorer.solana.com/tx/${burnSignature}?cluster=${network}`,
      balances: {
        before: balanceBeforeAmount,
        after: balanceAfterAmount,
        burned: balanceBeforeAmount - balanceAfterAmount
      },
      burnStatistics: {
        totalSupply,
        currentBurned: currentBurnedTokens,
        newTotalBurned: newBurnedTokens,
        burnPercentage: newBurnPercentage,
        boostPercentage
      },
      costAnalysis: {
        solanaCost: '~$0.00025',
        ethereumEstimatedCost: '$15-50+',
        savings: '99.9%+'
      }
    };
    
    const burnInfoPath = path.join(__dirname, '../burn-info.json');
    fs.writeFileSync(burnInfoPath, JSON.stringify(burnInfo, null, 2));
    
    console.log('\n🎉 Burn Summary:');
    console.log(`   ✓ Burned ${burnAmount.toLocaleString()} BBT tokens`);
    console.log(`   ✓ Transaction Cost: ~$0.00025 (Solana advantage!)`);
    console.log(`   ✓ Market Cap Boost: +${boostPercentage.toFixed(2)}%`);
    console.log(`   ✓ Transaction: ${burnSignature}`);
    console.log(`   ✓ Status: Confirmed`);
    
    console.log('\n💡 Why Solana for Burns?');
    console.log('   • Ultra-low fees make frequent burning economical');
    console.log('   • ~400ms confirmations for instant feedback');
    console.log('   • 65,000+ TPS means no network congestion');
    console.log('   • Eco-friendly Proof of Stake consensus');
    
  } catch (error) {
    console.error('\n❌ Burn failed:', error.message);
    if (error.logs) {
      console.error('Transaction logs:', error.logs);
    }
    process.exit(1);
  }
}

// Run the burn
burnTokens();