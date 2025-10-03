'use client';

import React, { useState, useEffect } from 'react';
import { useSolana } from '@/contexts/SolanaContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const SolanaBurnInterface: React.FC = () => {
  const { 
    isConnected, 
    publicKey, 
    tokenBalance, 
    tokenStats, 
    isLoading, 
    error,
    burnTokens, 
    calculateBoost,
    refreshData 
  } = useSolana();
  
  const [burnAmount, setBurnAmount] = useState('');
  const [estimatedBoost, setEstimatedBoost] = useState<number>(0);
  const [isBurning, setIsBurning] = useState(false);
  const [burnError, setBurnError] = useState<string | null>(null);
  const [burnSuccess, setBurnSuccess] = useState<string | null>(null);

  // Calculate estimated boost when burn amount changes
  useEffect(() => {
    if (burnAmount && parseFloat(burnAmount) > 0) {
      calculateBoost(burnAmount).then(setEstimatedBoost);
    } else {
      setEstimatedBoost(0);
    }
  }, [burnAmount, calculateBoost]);

  const handleBurn = async () => {
    if (!burnAmount || parseFloat(burnAmount) <= 0) {
      setBurnError('Please enter a valid burn amount');
      return;
    }

    if (parseFloat(burnAmount) > parseFloat(tokenBalance.replace(/,/g, ''))) {
      setBurnError('Insufficient balance');
      return;
    }

    setIsBurning(true);
    setBurnError(null);
    setBurnSuccess(null);

    try {
      const result = await burnTokens(burnAmount);
      
      if (result.success) {
        setBurnSuccess(`Successfully burned ${burnAmount} BBT tokens! Transaction: ${result.signature.substring(0, 8)}...`);
        setBurnAmount('');
        // Refresh data is called automatically in burnTokens function
      }
    } catch (err: any) {
      setBurnError(err.message || 'Burn transaction failed');
    } finally {
      setIsBurning(false);
    }
  };

  const setMaxAmount = () => {
    if (tokenBalance && tokenBalance !== '0') {
      setBurnAmount(tokenBalance.replace(/,/g, ''));
    }
  };

  const currentBoost = tokenStats ? parseFloat(tokenStats.boostPercentage) : 0;
  const boostIncrease = estimatedBoost - currentBoost;

  if (!isConnected) {
    return (
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg text-center">
        <h3 className="text-2xl font-bold text-white mb-4">🔥 Burn BBT Tokens</h3>
        <p className="text-gray-300 mb-6">
          Connect your Solana wallet to burn tokens and boost the market cap
        </p>
        <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
        
        <div className="mt-8 p-4 bg-purple-900/30 rounded-lg border border-purple-700">
          <h4 className="text-purple-300 font-semibold mb-2">⚡ Why Burn on Solana?</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-200">
            <div>• Ultra-low fees (~$0.00025)</div>
            <div>• Instant confirmations (~400ms)</div>
            <div>• High throughput (65,000+ TPS)</div>
            <div>• Eco-friendly consensus</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-white">🔥 Burn BBT Tokens</h3>
          <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !text-sm" />
        </div>
        
        <div className="text-sm text-gray-300">
          <p><strong>Connected:</strong> {publicKey?.toString().substring(0, 8)}...{publicKey?.toString().substring(-8)}</p>
          <p><strong>Your BBT Balance:</strong> {tokenBalance} BBT</p>
        </div>
      </div>

      {/* Current Stats */}
      {tokenStats && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h4 className="text-lg font-semibold text-white mb-4">📊 Current Token Stats</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-gray-300 text-sm">Total Burned</p>
              <p className="text-xl font-bold text-orange-400">{tokenStats.burned}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-300 text-sm">Burn Percentage</p>
              <p className="text-xl font-bold text-red-400">{tokenStats.burnedPercentage}%</p>
            </div>
            <div className="text-center">
              <p className="text-gray-300 text-sm">Market Cap Boost</p>
              <p className="text-xl font-bold text-green-400">+{tokenStats.boostPercentage}%</p>
            </div>
            <div className="text-center">
              <p className="text-gray-300 text-sm">Market Cap</p>
              <p className="text-xl font-bold text-blue-400">{tokenStats.marketCap}</p>
            </div>
          </div>
        </div>
      )}

      {/* Burn Interface */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <h4 className="text-lg font-semibold text-white mb-4">🔥 Burn Tokens</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount to Burn
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={burnAmount}
                onChange={(e) => setBurnAmount(e.target.value)}
                placeholder="Enter amount of BBT to burn"
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="0"
                max={tokenBalance.replace(/,/g, '')}
              />
              <button
                onClick={setMaxAmount}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Max
              </button>
            </div>
          </div>

          {/* Burn Preview */}
          {burnAmount && parseFloat(burnAmount) > 0 && (
            <div className="bg-gray-700 p-4 rounded-lg">
              <h5 className="text-white font-semibold mb-2">🔍 Burn Preview</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-300">Tokens to Burn:</p>
                  <p className="text-orange-400 font-bold">{parseFloat(burnAmount).toLocaleString()} BBT</p>
                </div>
                <div>
                  <p className="text-gray-300">Additional Boost:</p>
                  <p className="text-green-400 font-bold">+{boostIncrease.toFixed(4)}%</p>
                </div>
                <div>
                  <p className="text-gray-300">Transaction Cost:</p>
                  <p className="text-blue-400 font-bold">~$0.00025</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {(error || burnError) && (
            <div className="bg-red-900/30 border border-red-700 p-4 rounded-lg">
              <p className="text-red-300 text-sm">{error || burnError}</p>
            </div>
          )}

          {/* Success Display */}
          {burnSuccess && (
            <div className="bg-green-900/30 border border-green-700 p-4 rounded-lg">
              <p className="text-green-300 text-sm">{burnSuccess}</p>
            </div>
          )}

          {/* Burn Button */}
          <button
            onClick={handleBurn}
            disabled={isBurning || isLoading || !burnAmount || parseFloat(burnAmount) <= 0}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isBurning ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Burning Tokens...
              </span>
            ) : (
              `🔥 Burn ${burnAmount || '0'} BBT Tokens`
            )}
          </button>
        </div>
      </div>

      {/* Solana Advantages */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-6 rounded-xl shadow-lg">
        <h4 className="text-lg font-semibold text-white mb-4">⚡ Solana Burn Advantages</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-200">
          <div className="flex items-center">
            <span className="text-green-400 mr-2">✓</span>
            Ultra-low fees make frequent burning economical
          </div>
          <div className="flex items-center">
            <span className="text-green-400 mr-2">✓</span>
            ~400ms confirmations for instant feedback
          </div>
          <div className="flex items-center">
            <span className="text-green-400 mr-2">✓</span>
            65,000+ TPS prevents network congestion
          </div>
          <div className="flex items-center">
            <span className="text-green-400 mr-2">✓</span>
            Eco-friendly Proof of Stake consensus
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-900/30 rounded-lg">
          <p className="text-blue-200 text-sm">
            💡 <strong>Pro Tip:</strong> With Solana's ultra-low fees, you can implement micro-burning strategies 
            to gradually optimize your market cap boost without worrying about transaction costs!
          </p>
        </div>
      </div>
    </div>
  );
};

export default SolanaBurnInterface;