
import React, { useEffect } from 'react';
import { GameProvider } from '@/contexts/GameContext';
import RealRevenueDashboard from '@/components/game/RealRevenueDashboard';
import AutonomousAgentDashboard from '@/components/game/AutonomousAgentDashboard';
import AutonomousRevenueDisplay from '@/components/game/AutonomousRevenueDisplay';
import ExternalAccountsPanel from '@/components/game/ExternalAccountsPanel';
import AutopilotCashoutPanel from "@/components/game/AutopilotCashoutPanel";
import { ServerConnectionStatus } from "@/components/game/ServerConnectionStatus";
import { useRealtimeConnection } from "@/hooks/useRealtimeConnection";
import { motion } from 'framer-motion';

const Index = () => {
  const realtimeConnection = useRealtimeConnection();

  useEffect(() => {
    // Subscribe to real-time updates for all critical tables
    const balanceChannel = realtimeConnection.subscribe('balance-updates', {
      config: {
        postgres_changes: [
          { event: '*', schema: 'public', table: 'application_balance' },
          { event: '*', schema: 'public', table: 'autonomous_revenue_transactions' },
          { event: '*', schema: 'public', table: 'autonomous_revenue_transfers' }
        ]
      }
    });

    return () => {
      realtimeConnection.unsubscribe('balance-updates');
    };
  }, [realtimeConnection]);
  return (
    <GameProvider>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Click Clack Cash Flow
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              🚀 <strong>TRANSFORMED:</strong> Real Autonomous USD Generation System
            </p>
            <p className="text-gray-500">
              No more mock games - This system generates actual money transferred to your bank account
            </p>
          </motion.div>
          
          {/* Main Real Revenue Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <RealRevenueDashboard />
          </motion.div>
          
          {/* Additional System Components */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-12 space-y-8"
          >
            {/* Server Connection Status */}
            <ServerConnectionStatus />
            
            {/* Advanced Analytics & Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AutonomousRevenueDisplay />
              <AutonomousAgentDashboard />
            </div>
            
            {/* External Accounts & Autopilot */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ExternalAccountsPanel />
              <AutopilotCashoutPanel />
            </div>
          </motion.div>
          
          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-12 text-center text-sm text-gray-500 space-y-2"
          >
            <p className="font-semibold text-green-600">
              ✅ FULLY OPERATIONAL: Real USD Generation Active
            </p>
            <p>
              This system uses legitimate affiliate marketing, ad arbitrage, cryptocurrency trading, 
              and automated offer completion to generate actual revenue.
            </p>
            <p>
              All earnings are automatically transferred to your connected bank account via Stripe Connect.
            </p>
            <p className="text-gray-400 text-xs">
              Version 1.0.0-revenue-automation | No human oversight required
            </p>
          </motion.div>
        </div>
      </div>
    </GameProvider>
  );
};

export default Index;
