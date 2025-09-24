
import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import { 
  BadgeDollarSign, 
  MousePointer, 
  TrendingUp, 
  Monitor, 
  BarChart4, 
  RefreshCcw
} from 'lucide-react';
import AdMonetizationService from '@/services/AdMonetizationService';
import { Button } from '@/components/ui/button';

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
  
  const [adService] = useState(() => AdMonetizationService.getInstance());
  const [earnings, setEarnings] = useState(0);
  const [earningsBreakdown, setEarningsBreakdown] = useState({ ppc: 0, cpa: 0 });
  const [recommendedCategory, setRecommendedCategory] = useState('gaming');
  const [optimizationScore, setOptimizationScore] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  const runOptimization = useCallback(async () => {
    setIsOptimizing(true);
    try {
      const optimizationResult = await adService.optimizeAdStrategy();
      setRecommendedCategory(optimizationResult.recommendedCategory);
      setOptimizationScore(optimizationResult.confidence);
    } catch (error) {
      console.error("Optimization error:", error);
      // Set fallback values when optimization fails
      setRecommendedCategory('gaming');
      setOptimizationScore(0);
    } finally {
      setIsOptimizing(false);
    }
  }, [adService]);
  
  useEffect(() => {
    // Update earnings from service
    setEarnings(adService.getTotalEarnings());
    setEarningsBreakdown(adService.getEarningsBreakdown());
    
    // Initial optimization
    runOptimization();
  }, [adService, runOptimization]);
  
  const calculateCTR = () => {
    if (adImpressions === 0) return '0%';
    return `${Math.round((adClicks / adImpressions) * 100)}%`;
  };
  
  const calculateCVR = () => {
    if (adClicks === 0) return '0%';
    return `${Math.round((adConversions / adClicks) * 100)}%`;
  };
  
  const getEarningsColor = () => {
    if (earnings > 20) return "text-green-400";
    if (earnings > 5) return "text-game-green";
    return "text-yellow-400";
  };
  
  return (
    <div className="game-card p-4 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-xl text-white">Analytics</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-gray-300 hover:text-white hover:bg-black/20"
          onClick={runOptimization}
          disabled={isOptimizing}
        >
          <RefreshCcw className={`h-3.5 w-3.5 mr-1 ${isOptimizing ? 'animate-spin' : ''}`} />
          <span className="text-xs">Optimize</span>
        </Button>
      </div>
      
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
      
      <div className="mt-4 bg-black/10 rounded-lg p-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <TrendingUp className="w-4 h-4 text-game-green mr-2" />
            <span className={`text-sm font-medium ${getEarningsColor()}`}>
              Earnings: ${earnings.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center">
            <BarChart4 className="w-4 h-4 text-blue-400 mr-1" />
            <span className="text-xs text-blue-400">{optimizationScore.toFixed(0)}% optimized</span>
          </div>
        </div>
        
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-300">PPC Revenue:</span>
            <span className="text-white">${earningsBreakdown.ppc.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">CPA Revenue:</span>
            <span className="text-white">${earningsBreakdown.cpa.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="mt-3 pt-2 border-t border-white/10">
          <p className="text-xs text-gray-400">
            Recommended focus: <span className="text-yellow-400 font-medium">{recommendedCategory}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatsSection;
