const {
  Connection,
  PublicKey,
  Keypair,
  clusterApiUrl,
} = require('@solana/web3.js');
const {
  getOrCreateAssociatedTokenAccount,
  transfer,
  TOKEN_PROGRAM_ID,
} = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function transferTokens() {
  try {
    console.log('🚀 Starting token transfer...');
    
    // Load deployment info
    const deploymentPath = path.join(__dirname, '../token-deployment.json');
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    
    // Configuration
    const network = 'devnet';
    const connection = new Connection(clusterApiUrl(network), 'confirmed');
    const mintAddress = new PublicKey(deployment.addresses.mint);
    const recipientAddress = new PublicKey('H7T5exF4PKCgR1qKxa7nJDJMreDGyn88SGfmoPP18FS1');
    const transferAmount = 50_000_000; // 50 million tokens
    const decimals = deployment.tokenConfig.decimals;
    const amountWithDecimals = transferAmount * Math.pow(10, decimals);
    
    console.log('📊 Transfer Details:');
    console.log(`   Network: ${network}`);
    console.log(`   Token Mint: ${mintAddress.toString()}`);
    console.log(`   Recipient: ${recipientAddress.toString()}`);
    console.log(`   Amount: ${transferAmount.toLocaleString()} tokens`);
    console.log(`   Amount (with decimals): ${amountWithDecimals.toLocaleString()}`);
    
    // Load sender keypair (from deployment)
    console.log('\n🔑 Loading sender wallet...');
    let senderKeypair;
    
    if (process.env.SOLANA_PRIVATE_KEY) {
      // Parse private key from environment variable
      const privateKeyArray = JSON.parse(process.env.SOLANA_PRIVATE_KEY);
      senderKeypair = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
    } else {
      // Try to load from default Solana CLI location
      const fs = require('fs');
      const os = require('os');
      const keypairPath = path.join(os.homedir(), '.config/solana/id.json');
      
      if (fs.existsSync(keypairPath)) {
        const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
        senderKeypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
      } else {
        throw new Error('No private key found. Set SOLANA_PRIVATE_KEY or ensure Solana CLI is configured');
      }
    }
    
    console.log(`   Sender: ${senderKeypair.publicKey.toString()}`);
    
    // Get sender's token account
    console.log('\n🏦 Getting sender token account...');
    const senderTokenAccount = new PublicKey(deployment.addresses.tokenAccount);
    console.log(`   Sender Token Account: ${senderTokenAccount.toString()}`);
    
    // Get or create recipient's token account
    console.log('\n🎯 Getting/creating recipient token account...');
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      senderKeypair,
      mintAddress,
      recipientAddress
    );
    console.log(`   Recipient Token Account: ${recipientTokenAccount.address.toString()}`);
    
    // Check sender's balance before transfer
    console.log('\n💰 Checking sender balance...');
    const senderBalance = await connection.getTokenAccountBalance(senderTokenAccount);
    const senderBalanceAmount = parseInt(senderBalance.value.amount);
    console.log(`   Sender Balance: ${(senderBalanceAmount / Math.pow(10, decimals)).toLocaleString()} tokens`);
    
    if (senderBalanceAmount < amountWithDecimals) {
      throw new Error(`Insufficient balance. Need ${(amountWithDecimals / Math.pow(10, decimals)).toLocaleString()} tokens, have ${(senderBalanceAmount / Math.pow(10, decimals)).toLocaleString()}`);
    }
    
    // Perform the transfer
    console.log('\n🔄 Executing transfer...');
    const signature = await transfer(
      connection,
      senderKeypair,
      senderTokenAccount,
      recipientTokenAccount.address,
      senderKeypair,
      amountWithDecimals
    );
    
    console.log('\n✅ Transfer completed successfully!');
    console.log(`   Transaction Signature: ${signature}`);
    console.log(`   Explorer: https://explorer.solana.com/tx/${signature}?cluster=${network}`);
    
    // Verify the transfer
    console.log('\n🔍 Verifying transfer...');
    await connection.confirmTransaction(signature, 'confirmed');
    
    const recipientBalance = await connection.getTokenAccountBalance(recipientTokenAccount.address);
    const recipientBalanceAmount = parseInt(recipientBalance.value.amount);
    console.log(`   Recipient Balance: ${(recipientBalanceAmount / Math.pow(10, decimals)).toLocaleString()} tokens`);
    
    const updatedSenderBalance = await connection.getTokenAccountBalance(senderTokenAccount);
    const updatedSenderBalanceAmount = parseInt(updatedSenderBalance.value.amount);
    console.log(`   Updated Sender Balance: ${(updatedSenderBalanceAmount / Math.pow(10, decimals)).toLocaleString()} tokens`);
    
    // Save transfer info
    const transferInfo = {
      network,
      timestamp: new Date().toISOString(),
      sender: senderKeypair.publicKey.toString(),
      recipient: recipientAddress.toString(),
      amount: transferAmount,
      amountWithDecimals,
      tokenMint: mintAddress.toString(),
      senderTokenAccount: senderTokenAccount.toString(),
      recipientTokenAccount: recipientTokenAccount.address.toString(),
      signature,
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=${network}`,
      balances: {
        senderBefore: senderBalanceAmount,
        senderAfter: updatedSenderBalanceAmount,
        recipientAfter: recipientBalanceAmount
      }
    };
    
    const transferInfoPath = path.join(__dirname, '../transfer-info.json');
    fs.writeFileSync(transferInfoPath, JSON.stringify(transferInfo, null, 2));
    
    console.log('\n🎉 Transfer Summary:');
    console.log(`   ✓ Sent ${transferAmount.toLocaleString()} BBT tokens`);
    console.log(`   ✓ To: ${recipientAddress.toString()}`);
    console.log(`   ✓ Transaction: ${signature}`);
    console.log(`   ✓ Status: Confirmed`);
    
  } catch (error) {
    console.error('\n❌ Transfer failed:', error.message);
    if (error.logs) {
      console.error('Transaction logs:', error.logs);
    }
    process.exit(1);
  }
}

// Run the transfer
transferTokens();