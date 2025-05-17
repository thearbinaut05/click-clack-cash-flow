
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
      <div className="min-h-screen bg-gradient-to-b from-[#0a0b1e] via-[#0f1642] to-[#12133d] overflow-hidden">
        {/* Digital noise overlay */}
        <div className="fixed inset-0 bg-noise opacity-[0.03] pointer-events-none z-0"></div>
        
        <div className="container max-w-md mx-auto px-4 py-6 relative z-10">
          {/* Floating particles */}
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div 
              key={i}
              className="fixed rounded-full"
              style={{
                background: i % 2 === 0 
                  ? 'radial-gradient(circle, rgba(236,72,153,0.4) 0%, rgba(236,72,153,0) 70%)' 
                  : 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(139,92,246,0) 70%)',
                width: `${Math.random() * 60 + 20}px`,
                height: `${Math.random() * 60 + 20}px`,
                left: `${Math.random() * 100}%`,
                filter: 'blur(8px)',
              }}
              initial={{ y: Math.random() * -100, opacity: 0.7 }}
              animate={{ 
                y: [null, window.innerHeight + 100],
                opacity: [0.7, 0]
              }}
              transition={{ 
                duration: Math.random() * 20 + 15,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 10
              }}
            />
          ))}
          
          {/* Digital grid lines */}
          <div className="fixed inset-0 pointer-events-none opacity-[0.06]" 
              style={{
                backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(139, 92, 246, 0.5) 25%, rgba(139, 92, 246, 0.5) 26%, transparent 27%, transparent 74%, rgba(139, 92, 246, 0.5) 75%, rgba(139, 92, 246, 0.5) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(139, 92, 246, 0.5) 25%, rgba(139, 92, 246, 0.5) 26%, transparent 27%, transparent 74%, rgba(139, 92, 246, 0.5) 75%, rgba(139, 92, 246, 0.5) 76%, transparent 77%, transparent)',
                backgroundSize: '80px 80px',
                zIndex: 0
              }}
          />
          
          {/* Light beams */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div 
                key={i}
                className="absolute bg-gradient-to-t from-purple-600/10 to-transparent"
                style={{
                  width: '200px',
                  height: '100vh',
                  left: `${i * 33 + 10}%`,
                  transform: `rotate(${15 + i * 5}deg)`,
                  transformOrigin: 'top center',
                  filter: 'blur(40px)',
                  opacity: 0.3 + (i * 0.1)
                }}
                animate={{
                  opacity: [0.3 + (i * 0.1), 0.1 + (i * 0.05), 0.3 + (i * 0.1)]
                }}
                transition={{
                  duration: 8 + (i * 3),
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
          
          {/* Game Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <GameHeader />
            <TapArea />
            <GlitchSection />
            <ShopSection />
            <StatsSection />
            
            <div className="mt-6 text-center text-xs text-game-teal/80">
              <p>Tap to earn coins! Find glitches for bonus rewards!</p>
              <p className="mt-1">Collect NFTs to boost your earnings!</p>
            </div>
          </motion.div>
        </div>
      </div>
    </GameProvider>
  );
};

export default Index;
