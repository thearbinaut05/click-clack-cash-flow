
import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { 
  BadgeDollarSign, 
  MousePointer, 
  TrendingUp, 
  Monitor
} from 'lucide-react';

const StatsSection: React.FC = () => {
  const { 
    coins, 
    clickPower, 
    clickMultiplier, 
    level, 
    tapCount, 
    adImpressions, 
    adClicks, 
    adConversions 
  } = useGame();
  
  const calculateCTR = () => {
    if (adImpressions === 0) return '0%';
    return `${Math.round((adClicks / adImpressions) * 100)}%`;
  };
  
  const calculateCVR = () => {
    if (adClicks === 0) return '0%';
    return `${Math.round((adConversions / adClicks) * 100)}%`;
  };
  
  return (
    <div className="game-card p-4 mt-4">
      <h2 className="font-bold text-xl text-white mb-4">Analytics</h2>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/20 rounded-lg p-3">
          <h3 className="text-white text-sm mb-2 flex items-center">
            <MousePointer className="w-4 h-4 mr-1" />
            Game Stats
          </h3>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300 text-xs">Total Clicks:</span>
              <span className="text-white text-xs">{tapCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300 text-xs">Tap Power:</span>
              <span className="text-white text-xs">{clickPower}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300 text-xs">Multiplier:</span>
              <span className="text-white text-xs">x{clickMultiplier.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300 text-xs">Level:</span>
              <span className="text-white text-xs">{level}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-black/20 rounded-lg p-3">
          <h3 className="text-white text-sm mb-2 flex items-center">
            <Monitor className="w-4 h-4 mr-1" />
            Ad Metrics
          </h3>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300 text-xs">Impressions:</span>
              <span className="text-white text-xs">{adImpressions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300 text-xs">Clicks (PPC):</span>
              <span className="text-white text-xs">{adClicks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300 text-xs">CTR:</span>
              <span className="text-white text-xs">{calculateCTR()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300 text-xs">Conversions (CPA):</span>
              <span className="text-white text-xs">{adConversions}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex items-center">
        <TrendingUp className="w-4 h-4 text-game-green mr-2" />
        <span className="text-sm text-game-green">
          Estimated Earnings: ${(adClicks * 0.1 + adConversions * 0.5).toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default StatsSection;
