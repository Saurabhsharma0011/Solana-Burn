'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useSolana } from '@/contexts/SolanaContext';

interface BurnEvent {
  timestamp: number;
  amount: number;
  cumulativeBurned: number;
  boostPercentage: number;
  marketCap: number;
}

const Analytics: React.FC = () => {
  const { tokenStats, isConnected } = useSolana();
  const [burnHistory, setBurnHistory] = useState<BurnEvent[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1D' | '7D' | '30D' | 'ALL'>('7D');

  // Mock data for demonstration - in a real app, this would come from Solana program logs
  useEffect(() => {
    if (tokenStats) {
      // Generate mock historical data for demonstration
      const generateMockData = () => {
        const data: BurnEvent[] = [];
        const now = Date.now();
        const daysBack = selectedTimeframe === '1D' ? 1 : selectedTimeframe === '7D' ? 7 : selectedTimeframe === '30D' ? 30 : 90;
        
        let cumulativeBurned = 0;
        const totalBurned = parseFloat(tokenStats.burned.replace(/,/g, ''));
        const increment = totalBurned / (daysBack * 4); // 4 data points per day
        
        for (let i = daysBack * 4; i >= 0; i--) {
          cumulativeBurned += increment * (Math.random() * 0.5 + 0.75); // Add some randomness
          const boostPercentage = Math.min((cumulativeBurned / parseFloat(tokenStats.currentSupply.replace(/,/g, ''))) * 10, 50);
          const baseMarketCap = 1000000; // $1M base
          
          data.push({
            timestamp: now - (i * 6 * 60 * 60 * 1000), // 6 hours apart
            amount: increment,
            cumulativeBurned: Math.min(cumulativeBurned, totalBurned),
            boostPercentage: Math.min(boostPercentage, parseFloat(tokenStats.boostPercentage)),
            marketCap: baseMarketCap * (1 + boostPercentage / 100)
          });
        }
        
        return data;
      };

      setBurnHistory(generateMockData());
    }
  }, [tokenStats, selectedTimeframe]);

  if (!isConnected || !tokenStats) {
    return (
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <p className="text-gray-400 text-center">Connect your Solana wallet to view analytics</p>
      </div>
    );
  }

  // Prepare data for charts
  const supplyData = [
    { name: 'Remaining Supply', value: parseFloat(tokenStats.currentSupply.replace(/,/g, '')), color: '#3B82F6' },
    { name: 'Burned Tokens', value: parseFloat(tokenStats.burned.replace(/,/g, '')), color: '#F97316' }
  ];

  const boostData = burnHistory.map(item => ({
    time: new Date(item.timestamp).toLocaleDateString(),
    boost: item.boostPercentage,
    marketCap: item.marketCap / 1e6 // Convert to millions
  }));

  const burnData = burnHistory.map(item => ({
    time: new Date(item.timestamp).toLocaleDateString(),
    cumulative: item.cumulativeBurned,
    daily: item.amount
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">📊 Solana Analytics Dashboard</h3>
          <div className="flex space-x-2">
            {(['1D', '7D', '30D', 'ALL'] as const).map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`px-3 py-1 text-sm rounded ${
                  selectedTimeframe === timeframe
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {timeframe}
              </button>
            ))}
          </div>
        </div>
        
        {/* Solana-specific metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-gray-300 text-sm">Total Value Burned</p>
            <p className="text-xl font-bold text-orange-400">
              ${(parseFloat(tokenStats.burned.replace(/,/g, '')) * 0.1).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-300 text-sm">Avg Transaction Cost</p>
            <p className="text-xl font-bold text-green-400">
              $0.00025
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-300 text-sm">Confirmation Time</p>
            <p className="text-xl font-bold text-blue-400">
              ~400ms
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-300 text-sm">Network TPS</p>
            <p className="text-xl font-bold text-purple-400">
              65,000+
            </p>
          </div>
        </div>

        {/* Solana Benefits Banner */}
        <div className="mt-4 p-4 bg-purple-900/30 rounded-lg border border-purple-700">
          <h4 className="text-purple-300 font-semibold mb-2">⚡ Powered by Solana</h4>
          <p className="text-purple-200 text-sm">
            Ultra-fast confirmations, minimal fees, and eco-friendly consensus make frequent burning economical and efficient.
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supply Distribution */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h4 className="text-lg font-semibold text-white mb-4">Supply Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={supplyData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {supplyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [value.toLocaleString(), '']}
                labelStyle={{ color: '#ffffff' }}
                contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-6 mt-4">
            {supplyData.map((item, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-gray-300 text-sm">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Market Cap & Boost Progression */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h4 className="text-lg font-semibold text-white mb-4">Market Cap Growth</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={boostData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left"
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                labelStyle={{ color: '#ffffff' }}
                contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="boost" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                name="Boost %"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="marketCap" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Market Cap (M)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Burn History */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h4 className="text-lg font-semibold text-white mb-4">Burn Activity</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={burnData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                labelStyle={{ color: '#ffffff' }}
                contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                formatter={(value: number) => [value.toLocaleString(), 'Tokens']}
              />
              <Bar 
                dataKey="daily" 
                fill="#F97316" 
                name="Daily Burns"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cumulative Burn Progress */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h4 className="text-lg font-semibold text-white mb-4">Cumulative Burns</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={burnData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                labelStyle={{ color: '#ffffff' }}
                contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                formatter={(value: number) => [value.toLocaleString(), 'Total Burned']}
              />
              <Line 
                type="monotone" 
                dataKey="cumulative" 
                stroke="#F59E0B" 
                strokeWidth={3}
                name="Cumulative Burned"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Solana Performance Comparison */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-6 rounded-xl shadow-lg">
        <h4 className="text-lg font-semibold text-white mb-4">🚀 Solana vs Other Blockchains</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { 
              name: 'Solana', 
              tps: '65,000+', 
              cost: '$0.00025', 
              time: '~400ms',
              color: 'text-purple-400'
            },
            { 
              name: 'Ethereum', 
              tps: '~15', 
              cost: '$5-50+', 
              time: '~15s',
              color: 'text-gray-400'
            },
            { 
              name: 'Bitcoin', 
              tps: '~7', 
              cost: '$1-20+', 
              time: '~10min',
              color: 'text-yellow-600'
            }
          ].map((blockchain, index) => (
            <div key={index} className={`text-center ${blockchain.color}`}>
              <h5 className="font-semibold text-lg mb-2">{blockchain.name}</h5>
              <div className="space-y-1 text-sm">
                <div><span className="text-gray-300">TPS:</span> {blockchain.tps}</div>
                <div><span className="text-gray-300">Cost:</span> {blockchain.cost}</div>
                <div><span className="text-gray-300">Time:</span> {blockchain.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Burn Impact Calculator */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <h4 className="text-lg font-semibold text-white mb-4">Burn Impact Projections</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { percentage: 10, label: '10% More Burned' },
            { percentage: 25, label: '25% More Burned' },
            { percentage: 50, label: '50% More Burned' }
          ].map(({ percentage, label }) => {
            const currentSupply = parseFloat(tokenStats.currentSupply.replace(/,/g, ''));
            const additionalBurn = currentSupply * percentage / 100;
            const newTotalBurned = parseFloat(tokenStats.burned.replace(/,/g, '')) + additionalBurn;
            const newBurnPercentage = (newTotalBurned / currentSupply) * 100;
            const newBoost = Math.min(newBurnPercentage * 0.1, 50);
            const currentMarketCap = 1000000; // Base market cap
            const newMarketCap = currentMarketCap * (1 + newBoost / 100);
            
            return (
              <div key={percentage} className="bg-gray-700 p-4 rounded-lg">
                <h5 className="text-white font-semibold mb-2">{label}</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Additional Burn:</span>
                    <span className="text-orange-400">{additionalBurn.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">New Boost:</span>
                    <span className="text-blue-400">+{newBoost.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Market Cap:</span>
                    <span className="text-green-400">${(newMarketCap / 1e6).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Solana Cost:</span>
                    <span className="text-purple-400">~$0.00025</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-4 bg-green-900/30 rounded-lg border border-green-700">
          <p className="text-green-200 text-sm">
            💡 <strong>Solana Advantage:</strong> Ultra-low transaction costs make frequent burning strategies economically viable, 
            allowing for more granular market cap optimization compared to high-fee blockchains.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;