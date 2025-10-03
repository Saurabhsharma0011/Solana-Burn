'use client';

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useSolana } from '@/contexts/SolanaContext';

const SolanaDashboard: React.FC = () => {
  const { connected } = useWallet();
  const { 
    publicKey,
    balance, 
    tokenBalance,
    tokenStats, 
    userBurnedAmount,
    isLoading,
    error 
  } = useSolana();

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-center max-w-md w-full mx-4">
          <h1 className="text-3xl font-bold text-white mb-6">🔥 BurnBoost Token</h1>
          <p className="text-gray-300 mb-8">
            Connect your Solana wallet to start burning tokens and boosting market cap
          </p>
          <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700 !rounded-lg" />
          {error && (
            <p className="text-red-400 mt-4 text-sm">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-white">🔥 BurnBoost Dashboard</h1>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-300">Connected Wallet</p>
                <p className="text-white font-mono text-sm">
                  {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-4)}
                </p>
              </div>
              <WalletMultiButton className="!bg-red-600 hover:!bg-red-700 !rounded-lg !text-sm" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Your Balances</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">SOL Balance:</span>
                <span className="text-white font-semibold">{balance} SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">BBT Balance:</span>
                <span className="text-white font-semibold">{tokenBalance} BBT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Tokens Burned:</span>
                <span className="text-orange-400 font-semibold">{userBurnedAmount} BBT</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Market Status</h3>
            {tokenStats ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Current Market Cap:</span>
                  <span className="text-green-400 font-semibold">{tokenStats.marketCap}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Boost Applied:</span>
                  <span className="text-blue-400 font-semibold">+{tokenStats.boostPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Burned:</span>
                  <span className="text-orange-400 font-semibold">{tokenStats.burnedPercentage}%</span>
                </div>
              </div>
            ) : (
              <div className="text-gray-400">Loading market data...</div>
            )}
          </div>

          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Network Info</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Network:</span>
                <span className="text-purple-400 font-semibold">Solana Devnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Program:</span>
                <span className="text-gray-400 text-xs font-mono">
                  Fg6P...sLnS
                </span>
              </div>
              {tokenStats && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Burns:</span>
                  <span className="text-yellow-400 font-semibold">{tokenStats.burnTxCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Token Statistics */}
        {tokenStats && (
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
            <h3 className="text-xl font-semibold text-white mb-6">Token Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-gray-300 text-sm">Current Supply</p>
                <p className="text-2xl font-bold text-white">
                  {parseFloat(tokenStats.currentSupply).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">BBT</p>
              </div>
              
              <div className="text-center">
                <p className="text-gray-300 text-sm">Tokens Burned</p>
                <p className="text-2xl font-bold text-orange-400">
                  {parseFloat(tokenStats.burned).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">{tokenStats.burnedPercentage}% of initial</p>
              </div>
              
              <div className="text-center">
                <p className="text-gray-300 text-sm">Market Cap Boost</p>
                <p className="text-2xl font-bold text-blue-400">
                  +{tokenStats.boostPercentage}%
                </p>
                <p className="text-xs text-gray-400">Applied boost</p>
              </div>
              
              <div className="text-center">
                <p className="text-gray-300 text-sm">Burn Transactions</p>
                <p className="text-2xl font-bold text-purple-400">
                  {tokenStats.burnTxCount}
                </p>
                <p className="text-xs text-gray-400">Total burns</p>
              </div>
            </div>
          </div>
        )}

        {/* Burn Progress Bar */}
        {tokenStats && (
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">Burn Progress</h3>
            <div className="relative">
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-red-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(parseFloat(tokenStats.burnedPercentage), 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-gray-300">0%</span>
                <span className="text-white font-semibold">{tokenStats.burnedPercentage}% Burned</span>
                <span className="text-gray-300">100%</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              Maximum boost: 50% (achieved at 50% tokens burned)
            </p>
          </div>
        )}

        {/* Market Cap Visualization */}
        {tokenStats && (
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">Market Cap Growth on Solana</h3>
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <p className="text-gray-300 text-sm">Base Market Cap</p>
                <p className="text-xl font-bold text-gray-400">
                  {/* Calculate base market cap */}
                  $1,000,000
                </p>
              </div>
              
              <div className="flex items-center">
                <div className="text-2xl text-green-400">→</div>
                <div className="mx-2 text-blue-400 font-semibold">+{tokenStats.boostPercentage}%</div>
                <div className="text-2xl text-green-400">→</div>
              </div>
              
              <div className="text-center">
                <p className="text-gray-300 text-sm">Boosted Market Cap</p>
                <p className="text-xl font-bold text-green-400">
                  {tokenStats.marketCap}
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-purple-900/30 rounded-lg border border-purple-700">
              <h4 className="text-purple-300 font-semibold mb-2">🚀 Powered by Solana</h4>
              <ul className="text-sm text-purple-200 space-y-1">
                <li>• Lightning-fast transactions (~400ms)</li>
                <li>• Ultra-low fees (~$0.00025 per transaction)</li>
                <li>• Eco-friendly proof-of-stake consensus</li>
                <li>• High-performance blockchain infrastructure</li>
              </ul>
            </div>
          </div>
        )}

        {/* Loading and Error States */}
        {isLoading && (
          <div className="bg-blue-900 border border-blue-700 text-blue-100 px-4 py-3 rounded-lg mt-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-300 mr-2"></div>
              Processing transaction...
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg mt-6">
            {error}
          </div>
        )}

        {/* Solana Features Showcase */}
        <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-white mb-4">Why Solana?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">⚡</div>
              <h4 className="text-white font-semibold">Ultra Fast</h4>
              <p className="text-gray-300 text-sm">65,000+ TPS with 400ms block times</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">💰</div>
              <h4 className="text-white font-semibold">Low Cost</h4>
              <p className="text-gray-300 text-sm">$0.00025 average transaction fee</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🌱</div>
              <h4 className="text-white font-semibold">Eco-Friendly</h4>
              <p className="text-gray-300 text-sm">Energy-efficient proof-of-stake</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SolanaDashboard;