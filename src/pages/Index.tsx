
import React from 'react';
import { GameProvider } from '@/contexts/GameContext';
import GameHeader from '@/components/game/GameHeader';
import TapArea from '@/components/game/TapArea';
import GlitchSection from '@/components/game/GlitchSection';
import ShopSection from '@/components/game/ShopSection';
import StatsSection from '@/components/game/StatsSection';
import { motion } from 'framer-motion';

const Index = () => {
  return (
    <GameProvider>
      <div className="min-h-screen bg-game-deep-blue overflow-hidden">
        <div className="container max-w-md mx-auto px-4 py-6">
          {/* Background Bubbles */}
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div 
              key={i}
              className="fixed w-8 h-8 rounded-full bg-white/5"
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
                width: `${Math.random() * 30 + 10}px`,
                height: `${Math.random() * 30 + 10}px`,
              }}
            />
          ))}
          
          {/* Game Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GameHeader />
            <TapArea />
            <GlitchSection />
            <ShopSection />
            <StatsSection />
            
            <div className="mt-6 text-center text-xs text-gray-400">
              <p>Tap to earn coins! Find glitches for bonus rewards!</p>
              <p className="mt-1">Collect unique NFTs to boost your earnings!</p>
            </div>
          </motion.div>
        </div>
      </div>
    </GameProvider>
  );
};

export default Index;
