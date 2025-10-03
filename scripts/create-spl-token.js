#!/usr/bin/env node

/**
 * Simple Solana Token Creation Script for Devnet
 * Creates a basic SPL token with initial supply
 */

const {
    Connection,
    Keypair,
    PublicKey,
    LAMPORTS_PER_SOL,
    clusterApiUrl
} = require('@solana/web3.js');

const {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    TOKEN_PROGRAM_ID
} = require('@solana/spl-token');

const fs = require('fs');
const path = require('path');

// Simple token configuration
const TOKEN_CONFIG = {
    name: "BurnBoost Token",
    symbol: "BBT",
    decimals: 9,
    initialSupply: 1000000000, // 1 billion tokens
};

async function createSPLToken() {
    console.log('🚀 Creating BurnBoost Token on Solana Devnet...\n');

    // Connect to devnet
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    
    // Use the current Solana CLI keypair
    const payerKeypairPath = process.env.HOME + '/.config/solana/id.json';
    
    if (!fs.existsSync(payerKeypairPath)) {
        console.error('❌ Solana CLI keypair not found. Please run: solana-keygen new');
        process.exit(1);
    }

    const payerKeypairData = JSON.parse(fs.readFileSync(payerKeypairPath, 'utf8'));
    const payer = Keypair.fromSecretKey(new Uint8Array(payerKeypairData));

    console.log(`👤 Using wallet: ${payer.publicKey.toBase58()}`);
    
    // Check balance
    const balance = await connection.getBalance(payer.publicKey);
    console.log(`💰 Current balance: ${balance / LAMPORTS_PER_SOL} SOL`);

    if (balance < 0.1 * LAMPORTS_PER_SOL) {
        console.log('💰 Requesting SOL from faucet...');
        try {
            const airdropSignature = await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
            await connection.confirmTransaction(airdropSignature);
            console.log('✅ Airdrop successful');
        } catch (error) {
            console.log('⚠️  Airdrop failed, but continuing with current balance...');
        }
    }

    try {
        console.log('\n🪙 Step 1: Creating token mint...');
        
        // Create the mint
        const mint = await createMint(
            connection,
            payer,              // Fee payer
            payer.publicKey,    // Mint authority
            payer.publicKey,    // Freeze authority (optional)
            TOKEN_CONFIG.decimals,    // Decimals
            undefined,          // Keypair (let it generate)
            undefined,          // Confirm options
            TOKEN_PROGRAM_ID    // Token program
        );

        console.log(`✅ Token mint created: ${mint.toBase58()}`);

        console.log('\n🏦 Step 2: Creating token account...');
        
        // Create associated token account for the payer
        const tokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            mint,
            payer.publicKey
        );

        console.log(`✅ Token account created: ${tokenAccount.address.toBase58()}`);

        console.log('\n🔢 Step 3: Minting initial supply...');
        
        // Calculate mint amount (initial supply * 10^decimals)
        const mintAmount = TOKEN_CONFIG.initialSupply * Math.pow(10, TOKEN_CONFIG.decimals);
        
        // Mint tokens to the token account
        const mintSignature = await mintTo(
            connection,
            payer,
            mint,
            tokenAccount.address,
            payer.publicKey,
            mintAmount
        );

        console.log(`✅ Minted ${TOKEN_CONFIG.initialSupply.toLocaleString()} ${TOKEN_CONFIG.symbol} tokens`);
        console.log(`   Transaction: ${mintSignature}`);

        // Create deployment info
        const deploymentInfo = {
            network: 'devnet',
            rpcUrl: 'https://api.devnet.solana.com',
            tokenConfig: TOKEN_CONFIG,
            addresses: {
                mint: mint.toBase58(),
                deployer: payer.publicKey.toBase58(),
                tokenAccount: tokenAccount.address.toBase58()
            },
            transactions: {
                mintCreation: mint.toBase58(), // This is actually the mint address, not tx
                tokenMinting: mintSignature
            },
            deploymentTime: new Date().toISOString(),
            explorerUrls: {
                mint: `https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`,
                tokenAccount: `https://explorer.solana.com/address/${tokenAccount.address.toBase58()}?cluster=devnet`,
                mintTransaction: `https://explorer.solana.com/tx/${mintSignature}?cluster=devnet`
            }
        };

        // Save deployment info
        fs.writeFileSync(
            path.join(__dirname, '../token-deployment.json'), 
            JSON.stringify(deploymentInfo, null, 2)
        );

        // Create .env.local file with token configuration
        const envContent = `# Solana Token Configuration (Devnet)
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_TOKEN_MINT_ADDRESS=${mint.toBase58()}
NEXT_PUBLIC_TOKEN_NAME=${TOKEN_CONFIG.name}
NEXT_PUBLIC_TOKEN_SYMBOL=${TOKEN_CONFIG.symbol}
NEXT_PUBLIC_TOKEN_DECIMALS=${TOKEN_CONFIG.decimals}
NEXT_PUBLIC_INITIAL_SUPPLY=${TOKEN_CONFIG.initialSupply}

# Wallet Information
DEPLOYER_WALLET=${payer.publicKey.toBase58()}
TOKEN_ACCOUNT_ADDRESS=${tokenAccount.address.toBase58()}
`;

        fs.writeFileSync(path.join(__dirname, '../.env.local'), envContent);

        // Success message
        console.log('\n🎉 TOKEN DEPLOYMENT SUCCESSFUL! 🎉');
        console.log('═══════════════════════════════════════════');
        console.log(`🪙 Token: ${TOKEN_CONFIG.name} (${TOKEN_CONFIG.symbol})`);
        console.log(`🔢 Supply: ${TOKEN_CONFIG.initialSupply.toLocaleString()} tokens`);
        console.log(`📍 Mint Address: ${mint.toBase58()}`);
        console.log(`🏦 Token Account: ${tokenAccount.address.toBase58()}`);
        console.log(`👤 Owner: ${payer.publicKey.toBase58()}`);
        console.log('═══════════════════════════════════════════');
        
        console.log('\n🔗 Explorer Links:');
        console.log(`Token Mint: https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`);
        console.log(`Token Account: https://explorer.solana.com/address/${tokenAccount.address.toBase58()}?cluster=devnet`);
        console.log(`Mint Transaction: https://explorer.solana.com/tx/${mintSignature}?cluster=devnet`);
        
        console.log('\n📁 Files Created:');
        console.log('• token-deployment.json - Deployment details');
        console.log('• .env.local - Environment variables for frontend');
        
        console.log('\n🚀 Next Steps:');
        console.log('1. Update your frontend to use the new mint address');
        console.log('2. Deploy your Anchor program for burn functionality');
        console.log('3. Test token transfers and burns on devnet');
        console.log('4. When ready, deploy to mainnet-beta');

        console.log('\n💡 Quick Commands:');
        console.log(`solana balance --url devnet ${payer.publicKey.toBase58()}`);
        console.log(`spl-token balance ${mint.toBase58()} --url devnet`);
        console.log(`spl-token accounts --url devnet`);

        return deploymentInfo;

    } catch (error) {
        console.error('\n❌ TOKEN DEPLOYMENT FAILED!');
        console.error('Error:', error.message);
        
        if (error.message.includes('insufficient funds')) {
            console.log('\n💡 Solution: Get more SOL from devnet faucet:');
            console.log('solana airdrop 2 --url devnet');
        }
        
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    createSPLToken()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { createSPLToken, TOKEN_CONFIG };