#!/usr/bin/env node

/**
 * Token Verification Script
 * Verifies that the deployed token is working correctly
 */

const {
    Connection,
    PublicKey,
    clusterApiUrl
} = require('@solana/web3.js');

const {
    getMint,
    getAccount,
    TOKEN_PROGRAM_ID
} = require('@solana/spl-token');

const fs = require('fs');
const path = require('path');

async function verifyToken() {
    console.log('🔍 Verifying BurnBoost Token deployment...\n');

    try {
        // Load deployment info
        const deploymentPath = path.join(__dirname, '../token-deployment.json');
        if (!fs.existsSync(deploymentPath)) {
            console.error('❌ token-deployment.json not found. Run npm run token:create first.');
            process.exit(1);
        }

        const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        const connection = new Connection(deployment.rpcUrl, 'confirmed');

        console.log('📋 Deployment Information:');
        console.log(`Network: ${deployment.network}`);
        console.log(`Token: ${deployment.tokenConfig.name} (${deployment.tokenConfig.symbol})`);
        console.log(`Mint: ${deployment.addresses.mint}`);
        console.log('');

        // Verify mint account
        console.log('🪙 Verifying mint account...');
        const mintPublicKey = new PublicKey(deployment.addresses.mint);
        const mintInfo = await getMint(connection, mintPublicKey);
        
        console.log(`✅ Mint Authority: ${mintInfo.mintAuthority?.toBase58() || 'None'}`);
        console.log(`✅ Supply: ${mintInfo.supply.toString()}`);
        console.log(`✅ Decimals: ${mintInfo.decimals}`);
        console.log(`✅ Freeze Authority: ${mintInfo.freezeAuthority?.toBase58() || 'None'}`);

        // Verify token account
        console.log('\n🏦 Verifying token account...');
        const tokenAccountPublicKey = new PublicKey(deployment.addresses.tokenAccount);
        const tokenAccountInfo = await getAccount(connection, tokenAccountPublicKey);
        
        console.log(`✅ Owner: ${tokenAccountInfo.owner.toBase58()}`);
        console.log(`✅ Mint: ${tokenAccountInfo.mint.toBase58()}`);
        console.log(`✅ Amount: ${tokenAccountInfo.amount.toString()}`);

        // Calculate and display readable amounts
        const totalSupply = Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals);
        const accountBalance = Number(tokenAccountInfo.amount) / Math.pow(10, mintInfo.decimals);

        console.log('\n📊 Summary:');
        console.log(`Total Supply: ${totalSupply.toLocaleString()} ${deployment.tokenConfig.symbol}`);
        console.log(`Account Balance: ${accountBalance.toLocaleString()} ${deployment.tokenConfig.symbol}`);
        console.log(`Deployment Success: ${totalSupply === deployment.tokenConfig.initialSupply ? '✅' : '❌'}`);

        console.log('\n🔗 Explorer Links:');
        console.log(`Mint: ${deployment.explorerUrls.mint}`);
        console.log(`Token Account: ${deployment.explorerUrls.tokenAccount}`);
        console.log(`Transaction: ${deployment.explorerUrls.mintTransaction}`);

        console.log('\n🚀 Token is ready for use!');
        
        return {
            success: true,
            mintInfo,
            tokenAccountInfo,
            deployment
        };

    } catch (error) {
        console.error('\n❌ Verification failed:', error.message);
        return { success: false, error };
    }
}

// Run if called directly
if (require.main === module) {
    verifyToken()
        .then((result) => {
            process.exit(result.success ? 0 : 1);
        })
        .catch((error) => {
            console.error('Verification error:', error);
            process.exit(1);
        });
}

module.exports = { verifyToken };