
import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { BadgeDollarSign, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const GameHeader: React.FC = () => {
  const { coins, energy, gems, level, tapCount } = useGame();
  
  return (
    <div className="w-full mb-4">
      <div className="flex justify-between items-center mb-4">
        <motion.h1 
          className="game-title text-3xl font-bold"
          animate={{
            textShadow: [
              '0 0 5px rgba(236, 72, 153, 0.4), 0 0 10px rgba(139, 92, 246, 0.3)',
              '0 0 10px rgba(236, 72, 153, 0.6), 0 0 20px rgba(139, 92, 246, 0.5)',
              '0 0 5px rgba(236, 72, 153, 0.4), 0 0 10px rgba(139, 92, 246, 0.3)'
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          CyberClick
        </motion.h1>
        <div className="flex gap-2">
          <div className="game-counter">
            <span>Lvl</span>
            <span>{level}</span>
          </div>
          <div className="game-counter">
            <Clock className="w-4 h-4" />
            <span>{tapCount}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="game-card flex items-center justify-center p-3">
          <BadgeDollarSign className="w-5 h-5 text-pink-500 mr-2" />
          <motion.span 
            className="font-bold text-white"
            animate={coins > 0 ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            {coins}
          </motion.span>
        </div>
        
        <div className="game-card p-3">
          <div className="w-full bg-black/50 rounded-full h-2.5 overflow-hidden">
            <motion.div 
              className="h-2.5 rounded-full transition-all duration-300" 
              style={{ 
                width: `${energy}%`,
                background: `linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%)`,
                boxShadow: '0 0 8px rgba(139, 92, 246, 0.5)'
              }}
              animate={{
                boxShadow: [
                  '0 0 8px rgba(139, 92, 246, 0.5)',
                  '0 0 12px rgba(139, 92, 246, 0.7)',
                  '0 0 8px rgba(139, 92, 246, 0.5)'
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
          <div className="text-xs text-white text-center mt-1">
            Energy: {Math.floor(energy)}%
          </div>
        </div>
        
        <div className="game-card flex items-center justify-center p-3">
          <span className="text-purple-400 mr-1">💎</span>
          <motion.span 
            className="font-bold text-white"
            animate={gems > 0 ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            {gems}
          </motion.span>
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
