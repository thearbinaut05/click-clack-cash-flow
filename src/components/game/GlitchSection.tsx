
import React, { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { motion } from 'framer-motion';

const GlitchSection: React.FC = () => {
  const { activateGlitch, glitchMode } = useGame();
  const [isHovering, setIsHovering] = useState(false);
  
  return (
    <div className="game-card p-4 mt-4">
      <h2 className="font-bold text-xl text-white mb-4">Glitch Vault</h2>
      
      <div className="relative w-full h-24 rounded-xl flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className={`absolute inset-0 ${glitchMode ? 'bg-gradient-to-r from-pink-600 to-purple-600 animate-pulse' : 'bg-gradient-to-r from-indigo-900/80 to-blue-900/90'}`} />
        
        {/* Cyber grid overlay */}
        <div className="absolute inset-0 opacity-20" 
             style={{
               backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .15) 25%, rgba(255, 255, 255, .15) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .15) 75%, rgba(255, 255, 255, .15) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .15) 25%, rgba(255, 255, 255, .15) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .15) 75%, rgba(255, 255, 255, .15) 76%, transparent 77%, transparent)',
               backgroundSize: '30px 30px'
             }}
        />
        
        {/* Animated hexagon */}
        {!glitchMode && (
          <>
            <motion.div 
              className="absolute w-36 h-36 opacity-40"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z' fill='none' stroke='%2333C3F0' stroke-width='1'/%3E%3C/svg%3E")`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center'
              }}
              animate={{ 
                rotate: [0, 360],
              }}
              transition={{ 
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <motion.div 
              className="absolute w-24 h-24 opacity-50"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z' fill='none' stroke='%23EC4899' stroke-width='2'/%3E%3C/svg%3E")`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center'
              }}
              animate={{ 
                rotate: [360, 0],
              }}
              transition={{ 
                duration: 15,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </>
        )}
        
        {/* Glitch effect when active */}
        {glitchMode && (
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.div 
                key={i}
                className="absolute h-1 bg-white/80"
                style={{
                  left: 0,
                  right: 0,
                  top: `${i * 10 + Math.random() * 5}%`,
                  opacity: Math.random() * 0.5 + 0.2,
                  height: `${Math.random() * 2 + 1}px`
                }}
                animate={{
                  x: ['-100%', '100%'],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: Math.random() * 2 + 0.5,
                  repeat: Infinity,
                  ease: "linear",
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>
        )}
        
        <button
          onClick={activateGlitch}
          disabled={glitchMode}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className={`relative z-10 px-6 py-2 text-lg font-bold
                    ${glitchMode 
                      ? 'bg-white text-purple-900 rounded-md opacity-80' 
                      : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-md border border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.7)] hover:shadow-[0_0_25px_rgba(236,72,153,0.9)] transition-all duration-300'}`}
        >
          {glitchMode ? 'ACTIVATED!' : 'ACTIVATE GLITCH!'}
          
          {/* Animated border for non-active button */}
          {!glitchMode && isHovering && (
            <motion.div 
              className="absolute inset-0 rounded-md pointer-events-none"
              style={{ 
                border: '2px solid rgba(236,72,153,0.8)',
                boxShadow: '0 0 15px rgba(236,72,153,0.7)',
              }}
              animate={{
                opacity: [1, 0.6, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </button>
      </div>
      
      <div className="mt-2 text-center text-sm text-gray-300">
        {glitchMode ? 
          '5x coins active! Tap fast!' : 
          'Activate the glitch protocol for massive bonuses!'}
      </div>
    </div>
  );
};

export default GlitchSection;
