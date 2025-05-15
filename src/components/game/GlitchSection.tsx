
import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { motion } from 'framer-motion';

const GlitchSection: React.FC = () => {
  const { activateGlitch, glitchMode } = useGame();
  
  return (
    <div className="game-card p-4 mt-4">
      <h2 className="font-bold text-xl text-white mb-4">Glitch Vault</h2>
      
      <div className="relative w-full h-24 rounded-xl flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className={`absolute inset-0 ${glitchMode ? 'bg-gradient-to-r from-game-pink to-game-purple animate-pulse' : 'bg-gradient-to-r from-game-purple/50 to-game-deep-blue/70'}`} />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10" 
             style={{
               backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent)',
               backgroundSize: '50px 50px'
             }}
        />
        
        {/* Animated rings */}
        <motion.div 
          className="absolute w-48 h-48 rounded-full border-4 border-game-teal/30"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 180],
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        <motion.div 
          className="absolute w-36 h-36 rounded-full border-4 border-game-pink/30"
          animate={{ 
            scale: [1.1, 1, 1.1],
            rotate: [180, 0],
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        <button
          onClick={activateGlitch}
          disabled={glitchMode}
          className={`relative game-button-glitch z-10 px-6 py-2 text-lg
                    ${glitchMode ? 'opacity-50 cursor-not-allowed' : 'animate-pulse-grow'}`}
        >
          {glitchMode ? 'ACTIVE!' : 'ACTIVATE GLITCH!'}
        </button>
      </div>
      
      <div className="mt-2 text-center text-sm text-gray-300">
        {glitchMode ? 
          '5x coins active! Tap fast!' : 
          'Find and activate glitches for massive bonuses!'}
      </div>
    </div>
  );
};

export default GlitchSection;
