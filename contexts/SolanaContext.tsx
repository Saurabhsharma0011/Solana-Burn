'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ConnectionProvider, WalletProvider, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  MathWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { 
  getAssociatedTokenAddress, 
  TOKEN_PROGRAM_ID, 
  burn, 
  getAccount,
  getMint,
  createBurnInstruction
} from '@solana/spl-token';

// Import wallet adapter CSS
require('@solana/wallet-adapter-react-ui/styles.css');

// Token configuration from deployment
const TOKEN_CONFIG = {
  mint: process.env.NEXT_PUBLIC_TOKEN_MINT_ADDRESS || '7GXsxJHtqsTeKV9uj8Q58Ep4GgkFA5Koer3vLYu4iURo',
  name: process.env.NEXT_PUBLIC_TOKEN_NAME || 'BurnBoost Token',
  symbol: process.env.NEXT_PUBLIC_TOKEN_SYMBOL || 'BBT',
  decimals: parseInt(process.env.NEXT_PUBLIC_TOKEN_DECIMALS || '9'),
  initialSupply: parseInt(process.env.NEXT_PUBLIC_INITIAL_SUPPLY || '1000000000'),
};

interface TokenStats {
  initialSupply: string;
  currentSupply: string;
  burned: string;
  burnedPercentage: string;
  marketCap: string;
  boostPercentage: string;
  burnTxCount: string;
}

interface SolanaContextType {
  // Connection state
  isConnected: boolean;
  publicKey: PublicKey | null;
  balance: string;
  tokenBalance: string;
  isLoading: boolean;
  error: string | null;
  
  // Token data
  tokenStats: TokenStats | null;
  userBurnedAmount: string;
  
  // Actions
  refreshData: () => Promise<void>;
  burnTokens: (amount: string) => Promise<{ signature: string; success: boolean }>;
  calculateBoost: (amount: string) => Promise<number>;
}

const SolanaContext = createContext<SolanaContextType | undefined>(undefined);

function SolanaWalletProvider({ children }: { children: ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new MathWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

function SolanaInnerProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  
  // State
  const [balance, setBalance] = useState('0');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [tokenStats, setTokenStats] = useState<TokenStats | null>(null);
  const [userBurnedAmount, setUserBurnedAmount] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mintAddress = new PublicKey(TOKEN_CONFIG.mint);

  // Helper functions
  const formatTokenAmount = (amount: number | bigint): string => {
    const tokens = Number(amount) / Math.pow(10, TOKEN_CONFIG.decimals);
    return tokens.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const parseTokenAmount = (amount: string): bigint => {
    const tokens = parseFloat(amount);
    return BigInt(tokens * Math.pow(10, TOKEN_CONFIG.decimals));
  };

  // Refresh all data
  const refreshData = async () => {
    if (!publicKey) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get SOL balance
      const solBalance = await connection.getBalance(publicKey);
      setBalance((solBalance / LAMPORTS_PER_SOL).toFixed(4));

      // Get mint info to calculate burned tokens
      const mintInfo = await getMint(connection, mintAddress);
      const currentSupply = Number(mintInfo.supply);
      const totalBurned = TOKEN_CONFIG.initialSupply * Math.pow(10, TOKEN_CONFIG.decimals) - currentSupply;
      const burnPercentage = (totalBurned / (TOKEN_CONFIG.initialSupply * Math.pow(10, TOKEN_CONFIG.decimals))) * 100;
      const boostPercentage = Math.min(burnPercentage * 0.1, 50); // 0.1% boost per 1% burned, max 50%
      
      // Calculate market cap
      const baseMarketCap = 1000000; // $1M base
      const currentMarketCap = baseMarketCap * (1 + boostPercentage / 100);

      setTokenStats({
        initialSupply: formatTokenAmount(TOKEN_CONFIG.initialSupply * Math.pow(10, TOKEN_CONFIG.decimals)),
        currentSupply: formatTokenAmount(currentSupply),
        burned: formatTokenAmount(totalBurned),
        burnedPercentage: burnPercentage.toFixed(2),
        marketCap: `$${(currentMarketCap / 1e6).toFixed(2)}M`,
        boostPercentage: boostPercentage.toFixed(2),
        burnTxCount: '0', // Would need to track this separately
      });

      // Get user token balance
      try {
        const tokenAccount = await getAssociatedTokenAddress(mintAddress, publicKey);
        const tokenAccountInfo = await getAccount(connection, tokenAccount);
        setTokenBalance(formatTokenAmount(tokenAccountInfo.amount));
      } catch (err) {
        console.log('No token account found, balance is 0');
        setTokenBalance('0');
      }

    } catch (err: any) {
      console.error('Error refreshing data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Burn tokens function
  const burnTokens = async (amount: string): Promise<{ signature: string; success: boolean }> => {
    if (!publicKey || !sendTransaction) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const burnAmount = parseTokenAmount(amount);
      
      // Get user's token account
      const tokenAccount = await getAssociatedTokenAddress(mintAddress, publicKey);
      
      // Check balance
      const tokenAccountInfo = await getAccount(connection, tokenAccount);
      if (tokenAccountInfo.amount < burnAmount) {
        throw new Error('Insufficient token balance');
      }

      // Create burn transaction
      const transaction = new Transaction();
      
      // Add burn instruction
      const burnInstruction = createBurnInstruction(
        tokenAccount, // account to burn from
        mintAddress, // mint
        publicKey, // owner
        burnAmount // amount
      );
      
      transaction.add(burnInstruction);

      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      // Refresh data after burn
      await refreshData();
      
      return { signature, success: true };
      
    } catch (err: any) {
      console.error('Burn failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate potential boost from burn
  const calculateBoost = async (amount: string): Promise<number> => {
    try {
      const burnAmount = parseTokenAmount(amount);
      const mintInfo = await getMint(connection, mintAddress);
      const currentSupply = Number(mintInfo.supply);
      const totalBurned = TOKEN_CONFIG.initialSupply * Math.pow(10, TOKEN_CONFIG.decimals) - currentSupply;
      const newTotalBurned = totalBurned + Number(burnAmount);
      const newBurnPercentage = (newTotalBurned / (TOKEN_CONFIG.initialSupply * Math.pow(10, TOKEN_CONFIG.decimals))) * 100;
      const newBoostPercentage = Math.min(newBurnPercentage * 0.1, 50);
      
      return newBoostPercentage;
    } catch (err) {
      console.error('Error calculating boost:', err);
      return 0;
    }
  };

  // Load data when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      refreshData();
    }
  }, [connected, publicKey]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (connected && publicKey) {
      const interval = setInterval(refreshData, 30000);
      return () => clearInterval(interval);
    }
  }, [connected, publicKey]);

  const contextValue: SolanaContextType = {
    isConnected: connected,
    publicKey,
    balance,
    tokenBalance,
    isLoading,
    error,
    tokenStats,
    userBurnedAmount,
    refreshData,
    burnTokens,
    calculateBoost,
  };

  return (
    <SolanaContext.Provider value={contextValue}>
      {children}
    </SolanaContext.Provider>
  );
}

export function SolanaProvider({ children }: { children: ReactNode }) {
  return (
    <SolanaWalletProvider>
      <SolanaInnerProvider>
        {children}
      </SolanaInnerProvider>
    </SolanaWalletProvider>
  );
}

export function useSolana() {
  const context = useContext(SolanaContext);
  if (context === undefined) {
    throw new Error('useSolana must be used within a SolanaProvider');
  }
  return context;
}