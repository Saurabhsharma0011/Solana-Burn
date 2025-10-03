'use client';

import React, { useState } from 'react';
import { SolanaProvider } from '@/contexts/SolanaContext';
import SolanaDashboard from '@/components/SolanaDashboard';
import SolanaBurnInterface from '@/components/SolanaBurnInterface';
import Analytics from '@/components/Analytics';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'burn' | 'analytics'>('dashboard');

  return (
    <SolanaProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <nav className="bg-gray-800 shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <div className="text-2xl font-bold text-white">🔥 BurnBoost</div>
                <div className="text-sm text-purple-300 bg-purple-900/30 px-2 py-1 rounded">
                  Powered by Solana
                </div>
                <div className="hidden md:flex space-x-6">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === 'dashboard'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setActiveTab('burn')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === 'burn'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    Burn Tokens
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === 'analytics'
                        ? 'bg-green-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    Analytics
                  </button>
                </div>
              </div>
              
              <div className="md:hidden">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as any)}
                  className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
                >
                  <option value="dashboard">Dashboard</option>
                  <option value="burn">Burn Tokens</option>
                  <option value="analytics">Analytics</option>
                </select>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'dashboard' && <SolanaDashboard />}
          {activeTab === 'burn' && (
            <div className="max-w-2xl mx-auto">
              <SolanaBurnInterface />
            </div>
          )}
          {activeTab === 'analytics' && <Analytics />}
        </main>

        <footer className="bg-gray-800 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-400">
              <p className="text-sm">
                BurnBoost Token - Deflationary cryptocurrency with market cap boost mechanism
              </p>
              <p className="text-xs mt-2">
                ⚡ Powered by Solana - Ultra-fast, low-cost, eco-friendly blockchain
              </p>
              <div className="flex justify-center space-x-4 mt-4 text-xs">
                <span className="text-purple-400">~400ms confirmations</span>
                <span className="text-green-400">~$0.00025 fees</span>
                <span className="text-blue-400">65,000+ TPS</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </SolanaProvider>
  );
}