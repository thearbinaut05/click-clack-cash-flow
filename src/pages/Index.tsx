
import React from 'react';
import { GameProvider } from '@/contexts/GameContext';
import GameHeader from '@/components/game/GameHeader';
import TapArea from '@/components/game/TapArea';
import GlitchSection from '@/components/game/GlitchSection';
import ShopSection from '@/components/game/ShopSection';
import StatsSection from '@/components/game/StatsSection';
import AutonomousAgentDashboard from '@/components/game/AutonomousAgentDashboard';
import AutonomousRevenueDisplay from '@/components/game/AutonomousRevenueDisplay';
import ExternalAccountsPanel from '@/components/game/ExternalAccountsPanel';
import TransactionStatusDashboard from '@/components/game/TransactionStatusDashboard';
import { motion } from 'framer-motion';

const Index = () => {
  return (
    <GameProvider>
      <div className="min-h-screen bg-gradient-to-b from-game-deep-blue to-[#09152d] overflow-hidden">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          {/* Background Bubbles */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div 
              key={i}
              className="fixed rounded-full bg-white/5"
              initial={{ x: Math.random() * 100 - 50, y: -20, opacity: 0.7 }}
              animate={{ 
                y: [Math.random() * -100, window.innerHeight + 100],
                opacity: [0.7, 0]
              }}
              transition={{ 
                duration: Math.random() * 15 + 10,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 5
              }}
              style={{ 
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 30 + 5}px`,
                height: `${Math.random() * 30 + 5}px`,
                filter: 'blur(1px)',
              }}
            />
          ))}
          
          {/* Light rays */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div 
                key={i}
                className="absolute bg-white/5"
                style={{
                  width: '200px',
                  height: '100vh',
                  left: `${i * 33 + 10}%`,
                  transform: `rotate(${15 + i * 5}deg)`,
                  transformOrigin: 'top center',
                  filter: 'blur(8px)'
                }}
              />
            ))}
          </div>
          
          {/* Game Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 space-y-8"
          >
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 animate-pulse">
                Click Clack Cash Flow
              </h1>
              <p className="text-gray-400 text-lg">
                Autonomous AI-Powered Revenue Generation System
              </p>
            </div>
            
            {/* Revenue & External Accounts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AutonomousRevenueDisplay />
              <AutonomousAgentDashboard />
            </div>
            
            {/* External Accounts Panel */}
            <ExternalAccountsPanel />
            
            {/* Transaction Status Dashboard */}
            <TransactionStatusDashboard />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-6">
                <StatsSection />
                <ShopSection />
              </div>
              
              <div className="flex flex-col items-center justify-center">
                <GameHeader />
                <TapArea />
              </div>
              
              <div className="space-y-6">
                <GlitchSection />
              </div>
            </div>
            
            <div className="mt-6 text-center text-xs text-gray-400">
              <p>Autonomous AI system generating revenue 24/7!</p>
              <p className="mt-1">No human oversight required - fully automated optimization!</p>
            </div>
          </motion.div>
        </div>
      </div>
    </GameProvider>
  );
};

export default Index;
