import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN, Idl } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

// Program ID (will be updated after deployment)
export const PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');

// Supported clusters
export const CLUSTERS = {
  'mainnet-beta': clusterApiUrl('mainnet-beta'),
  devnet: clusterApiUrl('devnet'),
  testnet: clusterApiUrl('testnet'),
  localhost: 'http://localhost:8899'
};

// Default cluster
export const DEFAULT_CLUSTER = 'devnet';

// IDL for the BurnBoost Token program
export const IDL: Idl = {
  "version": "0.1.0",
  "name": "burn_boost_token",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        { "name": "authority", "isMut": true, "isSigner": true },
        { "name": "mint", "isMut": true, "isSigner": true },
        { "name": "tokenData", "isMut": true, "isSigner": false },
        { "name": "authorityTokenAccount", "isMut": true, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false },
        { "name": "associatedTokenProgram", "isMut": false, "isSigner": false },
        { "name": "systemProgram", "isMut": false, "isSigner": false },
        { "name": "rent", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "name", "type": "string" },
        { "name": "symbol", "type": "string" },
        { "name": "decimals", "type": "u8" },
        { "name": "initialSupply", "type": "u64" },
        { "name": "baseMarketCap", "type": "u64" }
      ]
    },
    {
      "name": "burnTokens",
      "accounts": [
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "tokenData", "isMut": true, "isSigner": false },
        { "name": "userData", "isMut": true, "isSigner": false },
        { "name": "mint", "isMut": true, "isSigner": false },
        { "name": "userTokenAccount", "isMut": true, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "amount", "type": "u64" }
      ]
    },
    {
      "name": "getTokenStats",
      "accounts": [
        { "name": "tokenData", "isMut": false, "isSigner": false },
        { "name": "mint", "isMut": false, "isSigner": false }
      ],
      "args": [],
      "returns": {
        "defined": "TokenStats"
      }
    },
    {
      "name": "calculateBoostFromBurn",
      "accounts": [
        { "name": "tokenData", "isMut": false, "isSigner": false },
        { "name": "mint", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "burnAmount", "type": "u64" }
      ],
      "returns": "u64"
    }
  ],
  "accounts": [
    {
      "name": "TokenData",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "authority", "type": "publicKey" },
          { "name": "mint", "type": "publicKey" },
          { "name": "name", "type": "string" },
          { "name": "symbol", "type": "string" },
          { "name": "decimals", "type": "u8" },
          { "name": "initialSupply", "type": "u64" },
          { "name": "currentSupply", "type": "u64" },
          { "name": "totalBurned", "type": "u64" },
          { "name": "baseMarketCap", "type": "u64" },
          { "name": "currentBoostMultiplier", "type": "u64" },
          { "name": "burnTransactionCount", "type": "u64" },
          { "name": "bump", "type": "u8" }
        ]
      }
    },
    {
      "name": "UserData",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "user", "type": "publicKey" },
          { "name": "burnedAmount", "type": "u64" },
          { "name": "bump", "type": "u8" }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "TokenStats",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "initialSupply", "type": "u64" },
          { "name": "currentSupply", "type": "u64" },
          { "name": "totalBurned", "type": "u64" },
          { "name": "burnedPercentage", "type": "u64" },
          { "name": "currentMarketCap", "type": "u64" },
          { "name": "boostPercentage", "type": "u64" },
          { "name": "burnTransactionCount", "type": "u64" }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "TokensBurned",
      "fields": [
        { "name": "user", "type": "publicKey", "index": false },
        { "name": "amount", "type": "u64", "index": false },
        { "name": "newMarketCapMultiplier", "type": "u64", "index": false }
      ]
    },
    {
      "name": "MarketCapBoosted",
      "fields": [
        { "name": "oldMultiplier", "type": "u64", "index": false },
        { "name": "newMultiplier", "type": "u64", "index": false },
        { "name": "percentageBurned", "type": "u64", "index": false }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidBurnAmount",
      "msg": "Burn amount must be greater than zero"
    },
    {
      "code": 6001,
      "name": "InsufficientBalance",
      "msg": "Insufficient balance to burn"
    }
  ]
};

// Get connection to Solana cluster
export const getConnection = (cluster: string = DEFAULT_CLUSTER): Connection => {
  const endpoint = CLUSTERS[cluster as keyof typeof CLUSTERS] || CLUSTERS[DEFAULT_CLUSTER];
  return new Connection(endpoint, 'confirmed');
};

// Get program instance
export const getProgram = (connection: Connection, wallet: any) => {
  const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
  return new Program(IDL, PROGRAM_ID, provider);
};

// Helper functions to get PDAs
export const getTokenDataPDA = (mint: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('token_data'), mint.toBuffer()],
    PROGRAM_ID
  );
};

export const getUserDataPDA = (user: PublicKey, mint: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('user_data'), user.toBuffer(), mint.toBuffer()],
    PROGRAM_ID
  );
};

// Token amount conversion functions
export const lamportsToTokens = (lamports: number | BN, decimals: number = 9): number => {
  const bn = typeof lamports === 'number' ? new BN(lamports) : lamports;
  return bn.toNumber() / Math.pow(10, decimals);
};

export const tokensToLamports = (tokens: number, decimals: number = 9): BN => {
  return new BN(tokens * Math.pow(10, decimals));
};

// Format numbers for display
export const formatTokenAmount = (amount: number | BN, decimals: number = 9): string => {
  const num = typeof amount === 'number' ? amount : lamportsToTokens(amount, decimals);
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

export const formatPercentage = (value: number | BN): string => {
  const num = typeof value === 'number' ? value : value.toNumber();
  return (num / 100).toFixed(2);
};

export const formatMarketCap = (value: number | BN): string => {
  const num = typeof value === 'number' ? value : lamportsToTokens(value);
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

// Wallet connection helper
export const connectWallet = async () => {
  if (typeof window === 'undefined') {
    throw new Error('Window is not defined');
  }

  const { solana } = window as any;
  if (!solana) {
    throw new Error('Solana wallet not found');
  }

  try {
    const response = await solana.connect();
    return response.publicKey;
  } catch (error) {
    throw new Error('Failed to connect wallet');
  }
};

// Get associated token account address
export const getAssociatedTokenAccount = async (
  mint: PublicKey,
  owner: PublicKey
): Promise<PublicKey> => {
  return await getAssociatedTokenAddress(mint, owner);
};

// Common constants
export const TOKEN_DECIMALS = 9;
export const BOOST_FACTOR = 10; // 0.1% boost per 1% burned
export const MAX_BOOST = 5000; // Max 50% boost