const {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL
} = require('@solana/web3.js');

const {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    createInitializeMintInstruction,
    createInitializeMetadataPointerInstruction,
    createInitializeInstruction,
    createUpdateFieldInstruction,
    createSetAuthorityInstruction,
    AuthorityType,
    TOKEN_2022_PROGRAM_ID,
    getMintLen,
    ExtensionType
} = require('@solana/spl-token');

const fs = require('fs');
const path = require('path');

// Token configuration
const TOKEN_CONFIG = {
    name: "BurnBoost Token",
    symbol: "BBT",
    description: "A revolutionary token that boosts market cap through strategic burning on Solana",
    decimals: 9,
    initialSupply: 1000000000, // 1 billion tokens
    image: "https://arweave.net/your-token-image-url", // You can upload to Arweave later
};

async function createBurnBoostToken() {
    console.log('🚀 Starting BurnBoost Token deployment on Solana Devnet...\n');

    // Connect to devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // Load or create keypair
    let payer;
    const keypairPath = path.join(__dirname, '../.keys/deployer.json');
    
    try {
        if (fs.existsSync(keypairPath)) {
            const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
            payer = Keypair.fromSecretKey(new Uint8Array(keypairData));
            console.log('📋 Using existing deployer keypair');
        } else {
            throw new Error('No keypair found');
        }
    } catch (error) {
        // Create new keypair
        payer = Keypair.generate();
        
        // Ensure .keys directory exists
        const keysDir = path.join(__dirname, '../.keys');
        if (!fs.existsSync(keysDir)) {
            fs.mkdirSync(keysDir, { recursive: true });
        }
        
        // Save keypair
        fs.writeFileSync(keypairPath, JSON.stringify(Array.from(payer.secretKey)));
        console.log('🔑 Created new deployer keypair');
        
        // Request airdrop
        console.log('💰 Requesting SOL airdrop...');
        const airdropSignature = await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
        await connection.confirmTransaction(airdropSignature);
    }

    console.log(`👤 Deployer Public Key: ${payer.publicKey.toBase58()}`);
    
    // Check balance
    const balance = await connection.getBalance(payer.publicKey);
    console.log(`💰 Deployer Balance: ${balance / LAMPORTS_PER_SOL} SOL\n`);

    if (balance < 0.1 * LAMPORTS_PER_SOL) {
        console.log('💰 Requesting additional SOL...');
        const airdropSignature = await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
        await connection.confirmTransaction(airdropSignature);
    }

    try {
        console.log('🪙 Creating token mint...');
        
        // Create mint account
        const mint = await createMint(
            connection,
            payer,
            payer.publicKey, // mint authority
            payer.publicKey, // freeze authority (optional)
            TOKEN_CONFIG.decimals
        );

        console.log(`✅ Token Mint Created: ${mint.toBase58()}`);

        // Create token account for the deployer
        console.log('🏦 Creating token account...');
        const tokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            mint,
            payer.publicKey
        );

        console.log(`✅ Token Account Created: ${tokenAccount.address.toBase58()}`);

        // Mint initial supply
        console.log('🪙 Minting initial supply...');
        const mintAmount = TOKEN_CONFIG.initialSupply * Math.pow(10, TOKEN_CONFIG.decimals);
        
        await mintTo(
            connection,
            payer,
            mint,
            tokenAccount.address,
            payer.publicKey,
            mintAmount
        );

        console.log(`✅ Minted ${TOKEN_CONFIG.initialSupply.toLocaleString()} ${TOKEN_CONFIG.symbol} tokens`);

        // Save deployment info
        const deploymentInfo = {
            network: 'devnet',
            tokenName: TOKEN_CONFIG.name,
            tokenSymbol: TOKEN_CONFIG.symbol,
            decimals: TOKEN_CONFIG.decimals,
            initialSupply: TOKEN_CONFIG.initialSupply,
            mintAddress: mint.toBase58(),
            deployerPublicKey: payer.publicKey.toBase58(),
            tokenAccountAddress: tokenAccount.address.toBase58(),
            deploymentDate: new Date().toISOString(),
            rpcUrl: 'https://api.devnet.solana.com',
            explorerUrl: `https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`
        };

        // Save to file
        const deploymentPath = path.join(__dirname, '../deployment-info.json');
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

        // Update environment file
        const envContent = `# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_TOKEN_MINT_ADDRESS=${mint.toBase58()}
NEXT_PUBLIC_TOKEN_NAME=${TOKEN_CONFIG.name}
NEXT_PUBLIC_TOKEN_SYMBOL=${TOKEN_CONFIG.symbol}
NEXT_PUBLIC_TOKEN_DECIMALS=${TOKEN_CONFIG.decimals}
NEXT_PUBLIC_INITIAL_SUPPLY=${TOKEN_CONFIG.initialSupply}

# Deployer Information (Keep secure!)
DEPLOYER_PUBLIC_KEY=${payer.publicKey.toBase58()}
TOKEN_ACCOUNT_ADDRESS=${tokenAccount.address.toBase58()}
`;

        fs.writeFileSync(path.join(__dirname, '../.env.local'), envContent);

        console.log('\n🎉 DEPLOYMENT SUCCESSFUL! 🎉\n');
        console.log('📊 Deployment Summary:');
        console.log('══════════════════════════════════════════');
        console.log(`Token Name: ${TOKEN_CONFIG.name}`);
        console.log(`Token Symbol: ${TOKEN_CONFIG.symbol}`);
        console.log(`Decimals: ${TOKEN_CONFIG.decimals}`);
        console.log(`Initial Supply: ${TOKEN_CONFIG.initialSupply.toLocaleString()} tokens`);
        console.log(`Mint Address: ${mint.toBase58()}`);
        console.log(`Token Account: ${tokenAccount.address.toBase58()}`);
        console.log(`Deployer: ${payer.publicKey.toBase58()}`);
        console.log(`Network: Devnet`);
        console.log('══════════════════════════════════════════');
        console.log(`🔍 View on Explorer: https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`);
        console.log(`📁 Deployment info saved to: deployment-info.json`);
        console.log(`🔧 Environment variables saved to: .env.local`);
        console.log('\n💡 Next Steps:');
        console.log('1. Update your frontend to use the new token address');
        console.log('2. Deploy your Anchor program for burn functionality');
        console.log('3. Test the token on devnet before mainnet deployment');
        console.log('\n⚠️  Remember: This is on DEVNET. For mainnet, change the network configuration.');

    } catch (error) {
        console.error('❌ Deployment failed:', error);
        
        if (error.message.includes('insufficient funds')) {
            console.log('\n💡 Tip: Request more SOL from the devnet faucet:');
            console.log('solana airdrop 2');
        }
        
        process.exit(1);
    }
}

// Helper function to create metadata (for Token-2022 if needed)
async function createTokenWithMetadata(connection, payer) {
    console.log('🏷️  Creating token with metadata (Token-2022)...');
    
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;
    
    // Calculate space needed for mint account
    const extensions = [ExtensionType.MetadataPointer];
    const mintLen = getMintLen(extensions);
    const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);
    
    const transaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint,
            space: mintLen,
            lamports,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeMetadataPointerInstruction(
            mint,
            payer.publicKey,
            mint,
            TOKEN_2022_PROGRAM_ID,
        ),
        createInitializeMintInstruction(
            mint,
            TOKEN_CONFIG.decimals,
            payer.publicKey,
            null,
            TOKEN_2022_PROGRAM_ID,
        ),
        createInitializeInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            mint: mint,
            metadata: mint,
            name: TOKEN_CONFIG.name,
            symbol: TOKEN_CONFIG.symbol,
            uri: 'https://your-metadata-uri.com/metadata.json',
            mintAuthority: payer.publicKey,
            updateAuthority: payer.publicKey,
        }),
    );
    
    const signature = await connection.sendTransaction(transaction, [payer, mintKeypair]);
    await connection.confirmTransaction(signature);
    
    return mint;
}

// Run the deployment
if (require.main === module) {
    createBurnBoostToken().catch(console.error);
}

module.exports = { createBurnBoostToken, TOKEN_CONFIG };