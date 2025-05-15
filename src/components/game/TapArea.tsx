
import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { motion } from 'framer-motion';
import { Mouse, MousePointerClick } from 'lucide-react';

// Component for coin/bubble animations
const CoinEffect: React.FC<{ x: number; y: number; }> = ({ x, y }) => {
  return (
    <motion.div
      className="absolute text-xl font-bold text-game-yellow z-50"
      initial={{ opacity: 1, scale: 0.5, x, y }}
      animate={{ 
        opacity: 0, 
        scale: 1.5, 
        y: y - 80, 
        x: x + (Math.random() * 40 - 20)
      }}
      transition={{ duration: 0.7 }}
    >
      +1
    </motion.div>
  );
};

// Bubble animation
const Bubble: React.FC<{ delay: number }> = ({ delay }) => {
  const randomSize = Math.floor(Math.random() * 15) + 5;
  const randomLeft = Math.floor(Math.random() * 100);
  
  return (
    <div 
      className="bubble"
      style={{ 
        width: `${randomSize}px`, 
        height: `${randomSize}px`,
        left: `${randomLeft}%`,
        animationDelay: `${delay}s`,
      }}
    />
  );
};

const TapArea: React.FC = () => {
  const { handleTap, coins, energy, glitchMode } = useGame();
  const [effects, setEffects] = useState<{id: number, x: number, y: number}[]>([]);
  const [effectId, setEffectId] = useState(0);
  
  // Handle tap with visual effect
  const onTap = (e: React.MouseEvent) => {
    if (energy > 0 || glitchMode) {
      // Get click position
      const x = e.nativeEvent.offsetX;
      const y = e.nativeEvent.offsetY;
      
      // Add effect
      const newEffect = { id: effectId, x, y };
      setEffects(prev => [...prev, newEffect]);
      setEffectId(prevId => prevId + 1);
      
      // Remove effect after animation
      setTimeout(() => {
        setEffects(prev => prev.filter(effect => effect.id !== newEffect.id));
      }, 700);
      
      // Call game context handler
      handleTap();
    }
  };
  
  return (
    <div className="relative w-full h-72 sm:h-96 overflow-hidden">
      {/* Decorative bubbles */}
      {Array.from({ length: 10 }).map((_, i) => (
        <Bubble key={i} delay={i * 0.3} />
      ))}
    
      {/* Tap area */}
      <div 
        className={`relative w-full h-full flex items-center justify-center rounded-2xl overflow-hidden 
                   ${glitchMode ? 'animate-glitch bg-gradient-to-r from-game-purple to-game-pink' : 'bg-ocean-gradient'}`}
        onClick={onTap}
      >
        {/* Visual effects for each tap */}
        {effects.map(effect => (
          <CoinEffect key={effect.id} x={effect.x} y={effect.y} />
        ))}
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <MousePointerClick 
            className={`w-16 h-16 mb-4 ${glitchMode ? 'text-white animate-pulse' : 'text-game-yellow'}`} 
          />
          
          <div className={`text-center font-bold transition-all ${glitchMode ? 'text-white text-4xl animate-pulse' : 'text-white text-2xl'}`}>
            {glitchMode ? 'GLITCH MODE!' : 'TAP TO EARN!'}
          </div>
          
          {energy <= 0 && !glitchMode && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center pointer-events-none">
              <div className="text-white text-center px-4">
                <p className="text-xl font-bold mb-2">Out of Energy!</p>
                <p>Wait for energy to regenerate...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TapArea;
