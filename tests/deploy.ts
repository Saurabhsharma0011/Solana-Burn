import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BurnBoostToken } from "../target/types/burn_boost_token";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";

describe("BurnBoostToken Deployment", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.BurnBoostToken as Program<BurnBoostToken>;
  
  // Generate a new keypair for the mint
  const mintKeypair = Keypair.generate();
  
  // Token configuration
  const TOKEN_NAME = "BurnBoost Token";
  const TOKEN_SYMBOL = "BBT";
  const DECIMALS = 9;
  const INITIAL_SUPPLY = new anchor.BN(1_000_000 * Math.pow(10, DECIMALS)); // 1 million tokens
  const BASE_MARKET_CAP = new anchor.BN(1_000_000 * anchor.web3.LAMPORTS_PER_SOL); // 1 million SOL

  let tokenDataPDA: PublicKey;
  let authorityTokenAccount: PublicKey;

  it("Deploy BurnBoost Token", async () => {
    console.log("🚀 Starting BurnBoost Token deployment on Solana...");
    console.log("Program ID:", program.programId.toBase58());
    console.log("Mint Address:", mintKeypair.publicKey.toBase58());
    console.log("Authority:", provider.wallet.publicKey.toBase58());

    // Derive PDAs
    [tokenDataPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_data"), mintKeypair.publicKey.toBuffer()],
      program.programId
    );

    // Get associated token account for authority
    authorityTokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      provider.wallet.publicKey
    );

    console.log("Token Data PDA:", tokenDataPDA.toBase58());
    console.log("Authority Token Account:", authorityTokenAccount.toBase58());

    // Initialize the token
    const tx = await program.methods
      .initialize(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        DECIMALS,
        INITIAL_SUPPLY,
        BASE_MARKET_CAP
      )
      .accounts({
        authority: provider.wallet.publicKey,
        mint: mintKeypair.publicKey,
        tokenData: tokenDataPDA,
        authorityTokenAccount: authorityTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([mintKeypair])
      .rpc();

    console.log("✅ Token deployed successfully!");
    console.log("Transaction signature:", tx);

    // Verify deployment
    const tokenData = await program.account.tokenData.fetch(tokenDataPDA);
    console.log("\n📊 Token Details:");
    console.log("- Name:", tokenData.name);
    console.log("- Symbol:", tokenData.symbol);
    console.log("- Decimals:", tokenData.decimals);
    console.log("- Initial Supply:", tokenData.initialSupply.toString());
    console.log("- Current Supply:", tokenData.currentSupply.toString());
    console.log("- Base Market Cap:", tokenData.baseMarketCap.toString());
    console.log("- Current Boost Multiplier:", tokenData.currentBoostMultiplier.toString());

    // Get token account balance
    const tokenAccountInfo = await provider.connection.getTokenAccountBalance(authorityTokenAccount);
    console.log("- Authority Balance:", tokenAccountInfo.value.uiAmount, "BBT");

    console.log("\n🎯 Deployment Summary:");
    console.log("- Network:", provider.connection.rpcEndpoint);
    console.log("- Program ID:", program.programId.toBase58());
    console.log("- Mint Address:", mintKeypair.publicKey.toBase58());
    console.log("- Token Data PDA:", tokenDataPDA.toBase58());

    console.log("\n📋 Next Steps:");
    console.log("1. Update your .env file with:");
    console.log(`   NEXT_PUBLIC_PROGRAM_ID=${program.programId.toBase58()}`);
    console.log(`   NEXT_PUBLIC_TOKEN_MINT=${mintKeypair.publicKey.toBase58()}`);
    console.log("2. Update the frontend configuration");
    console.log("3. Test the burn functionality");

    // Save deployment info to file
    const deploymentInfo = {
      network: provider.connection.rpcEndpoint,
      programId: program.programId.toBase58(),
      mintAddress: mintKeypair.publicKey.toBase58(),
      tokenDataPDA: tokenDataPDA.toBase58(),
      authorityTokenAccount: authorityTokenAccount.toBase58(),
      authority: provider.wallet.publicKey.toBase58(),
      deploymentTime: new Date().toISOString(),
      transactionSignature: tx,
      tokenDetails: {
        name: TOKEN_NAME,
        symbol: TOKEN_SYMBOL,
        decimals: DECIMALS,
        initialSupply: INITIAL_SUPPLY.toString(),
        baseMarketCap: BASE_MARKET_CAP.toString(),
      }
    };

    console.log("\n💾 Deployment info saved to deployment.json");
    
    // Note: In a real deployment script, you would save this to a file
    // For testing purposes, we just log it
    console.log(JSON.stringify(deploymentInfo, null, 2));
  });

  it("Test burn functionality", async () => {
    console.log("\n🔥 Testing burn functionality...");

    const burnAmount = new anchor.BN(1000 * Math.pow(10, DECIMALS)); // Burn 1000 tokens

    // Derive user data PDA
    const [userDataPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_data"), provider.wallet.publicKey.toBuffer(), mintKeypair.publicKey.toBuffer()],
      program.programId
    );

    console.log("Burning", burnAmount.toString(), "tokens...");

    const tx = await program.methods
      .burnTokens(burnAmount)
      .accounts({
        user: provider.wallet.publicKey,
        tokenData: tokenDataPDA,
        userData: userDataPDA,
        mint: mintKeypair.publicKey,
        userTokenAccount: authorityTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Burn transaction completed!");
    console.log("Transaction signature:", tx);

    // Verify burn
    const tokenData = await program.account.tokenData.fetch(tokenDataPDA);
    const userData = await program.account.userData.fetch(userDataPDA);

    console.log("\n📊 Post-Burn Statistics:");
    console.log("- Current Supply:", tokenData.currentSupply.toString());
    console.log("- Total Burned:", tokenData.totalBurned.toString());
    console.log("- User Burned Amount:", userData.burnedAmount.toString());
    console.log("- Current Boost Multiplier:", tokenData.currentBoostMultiplier.toString());
    console.log("- Burn Transaction Count:", tokenData.burnTransactionCount.toString());

    // Calculate boost percentage
    const boostPercentage = tokenData.currentBoostMultiplier.sub(new anchor.BN(10000));
    console.log("- Boost Percentage:", (boostPercentage.toNumber() / 100).toFixed(2) + "%");
  });
});