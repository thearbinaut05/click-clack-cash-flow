
import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { BadgeDollarSign, Click } from 'lucide-react';

const GameHeader: React.FC = () => {
  const { coins, energy, gems, level, tapCount } = useGame();
  
  return (
    <div className="w-full mb-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="game-title text-3xl font-bold">Inkie's Escape</h1>
        <div className="flex gap-2">
          <div className="game-counter">
            <span>Lvl</span>
            <span>{level}</span>
          </div>
          <div className="game-counter">
            <Click className="w-4 h-4" />
            <span>{tapCount}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="game-card flex items-center justify-center p-3">
          <BadgeDollarSign className="w-5 h-5 text-game-yellow mr-2" />
          <span className="font-bold text-white">{coins}</span>
        </div>
        
        <div className="game-card p-3">
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-game-green h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${energy}%` }}
            />
          </div>
          <div className="text-xs text-white text-center mt-1">
            Energy: {Math.floor(energy)}%
          </div>
        </div>
        
        <div className="game-card flex items-center justify-center p-3">
          <span className="text-game-teal mr-1">💎</span>
          <span className="font-bold text-white">{gems}</span>
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
