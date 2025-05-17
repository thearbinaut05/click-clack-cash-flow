
import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointerClick } from 'lucide-react';

// Component for coin/bubble animations
const CoinEffect: React.FC<{ id: number; x: number; y: number; }> = ({ id, x, y }) => {
  return (
    <motion.div
      className="absolute text-xl font-bold z-50"
      style={{
        color: '#EC4899',
        textShadow: '0 0 8px rgba(236, 72, 153, 0.8)',
      }}
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

// Digital particle effect
const DigitalParticle: React.FC<{ delay: number }> = ({ delay }) => {
  const randomSize = Math.floor(Math.random() * 4) + 2;
  const randomLeft = Math.floor(Math.random() * 100);
  
  return (
    <motion.div 
      className="absolute bg-purple-500/30"
      style={{ 
        width: `${randomSize}px`, 
        height: `${randomSize}px`,
        left: `${randomLeft}%`,
        bottom: '-10px',
        borderRadius: randomSize % 2 === 0 ? '0' : '50%',
        filter: 'blur(1px)',
      }}
      animate={{ 
        y: [0, -100 - (Math.random() * 100)],
        opacity: [0.7, 0],
        x: [0, (Math.random() * 40) - 20],
      }}
      transition={{
        duration: 3 + (Math.random() * 2),
        repeat: Infinity,
        delay: delay,
        ease: "easeOut",
      }}
    />
  );
};

const TapArea: React.FC = () => {
  const { handleTap, coins, energy, glitchMode } = useGame();
  const [effects, setEffects] = useState<{id: number, x: number, y: number}[]>([]);
  const [effectId, setEffectId] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle tap with visual effect
  const onTap = (e: React.MouseEvent) => {
    if (energy > 0 || glitchMode) {
      // Get click position
      const rect = containerRef.current?.getBoundingClientRect();
      const x = e.clientX - (rect?.left || 0);
      const y = e.clientY - (rect?.top || 0);
      
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
    <div 
      ref={containerRef}
      className="relative w-full h-80 overflow-hidden rounded-3xl border border-indigo-500/30"
    >
      {/* Digital particles */}
      {Array.from({ length: 25 }).map((_, i) => (
        <DigitalParticle key={i} delay={i * 0.2} />
      ))}
    
      {/* Tap area */}
      <div 
        className={`relative w-full h-full flex items-center justify-center rounded-3xl overflow-hidden 
                  ${glitchMode 
                    ? 'animate-glitch bg-gradient-to-r from-pink-500 to-purple-600' 
                    : 'bg-gradient-to-br from-[#0a0b1e] to-[#12133d]'}`}
        onClick={onTap}
      >
        {/* Digital grid overlay */}
        <div className="absolute inset-0 opacity-10" 
            style={{
              backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(139, 92, 246, 0.5) 25%, rgba(139, 92, 246, 0.5) 26%, transparent 27%, transparent 74%, rgba(139, 92, 246, 0.5) 75%, rgba(139, 92, 246, 0.5) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(139, 92, 246, 0.5) 25%, rgba(139, 92, 246, 0.5) 26%, transparent 27%, transparent 74%, rgba(139, 92, 246, 0.5) 75%, rgba(139, 92, 246, 0.5) 76%, transparent 77%, transparent)',
              backgroundSize: '50px 50px'
            }}
        />
        
        {/* Visual effects for each tap */}
        <AnimatePresence>
          {effects.map(effect => (
            <CoinEffect key={effect.id} id={effect.id} x={effect.x} y={effect.y} />
          ))}
        </AnimatePresence>
        
        {/* Digital circuit lines */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div 
              key={i}
              className="absolute bg-purple-500/60"
              style={{
                height: '1px',
                left: '0',
                right: '0',
                top: `${20 + i * 25}%`,
                opacity: 0.5,
              }}
              animate={{
                opacity: [0.5, 0.8, 0.5],
                boxShadow: [
                  '0 0 2px rgba(139, 92, 246, 0.3)',
                  '0 0 8px rgba(139, 92, 246, 0.6)',
                  '0 0 2px rgba(139, 92, 246, 0.3)'
                ]
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
          
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div 
              key={`v-${i}`}
              className="absolute bg-purple-500/60"
              style={{
                width: '1px',
                top: '0',
                bottom: '0',
                left: `${25 + i * 25}%`,
                opacity: 0.5,
              }}
              animate={{
                opacity: [0.5, 0.8, 0.5],
                boxShadow: [
                  '0 0 2px rgba(139, 92, 246, 0.3)',
                  '0 0 8px rgba(139, 92, 246, 0.6)',
                  '0 0 2px rgba(139, 92, 246, 0.3)'
                ]
              }}
              transition={{
                duration: 2 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.7
              }}
            />
          ))}
        </div>
        
        {/* Glitch effect when active */}
        {glitchMode && (
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.div 
                key={i}
                className="absolute h-1 bg-white/60"
                style={{
                  left: 0,
                  right: 0,
                  top: `${i * 8 + Math.random() * 5}%`,
                  opacity: Math.random() * 0.5 + 0.2,
                  height: `${Math.random() * 2 + 1}px`
                }}
                animate={{
                  x: ['-100%', '100%'],
                  opacity: [0, 0.6, 0]
                }}
                transition={{
                  duration: Math.random() * 2 + 1,
                  repeat: Infinity,
                  ease: "linear",
                  delay: Math.random() * 2
                }}
              />
            ))}
            
            <motion.div
              className="absolute inset-0 bg-pink-500/10"
              animate={{ opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 0.2, repeat: Infinity }}
            />
          </div>
        )}
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.div
            animate={glitchMode ? {
              x: [0, -2, 2, -2, 0],
              y: [0, 1, -1, 1, 0],
              transition: { duration: 0.2, repeat: Infinity }
            } : {}}
          >
            <MousePointerClick 
              className={`w-16 h-16 mb-4 ${glitchMode ? 'text-white' : 'text-pink-500'}`} 
            />
          </motion.div>
          
          <motion.div
            className={`text-center font-bold transition-all ${glitchMode ? 'text-white text-4xl' : 'text-white text-2xl'}`}
            animate={glitchMode ? {
              x: [0, -2, 2, -2, 0],
              textShadow: [
                '0 0 5px rgba(236, 72, 153, 0.7)',
                '0 0 10px rgba(236, 72, 153, 0.9)',
                '0 0 5px rgba(236, 72, 153, 0.7)'
              ],
              transition: { duration: 0.5, repeat: Infinity }
            } : {}}
          >
            {glitchMode ? 'GLITCH MODE!' : 'TAP TO EARN!'}
          </motion.div>
          
          {energy <= 0 && !glitchMode && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-none backdrop-blur-sm">
              <div className="text-white text-center px-4">
                <p className="text-xl font-bold mb-2">Out of Energy!</p>
                <p>Wait for energy to regenerate...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Scan line effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none scan-effect"></div>
      </div>
    </div>
  );
};

export default TapArea;
