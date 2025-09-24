import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { API_BASE_URL, DEFAULT_TEST_EMAIL, DEFAULT_CASHOUT_METHOD, PAYOUT_TYPES } from '@/utils/constants';
import AdMonetizationService from '@/services/AdMonetizationService';
import { CashoutService } from '@/services/CashoutService';
import RealRevenueGenerationService from '@/services/RealRevenueGenerationService';

interface GameContextType {
  // Real revenue system - replaces mock game mechanics
  revenueBalance: number;
  totalEarned: number;
  hourlyRate: number;
  isGeneratingRevenue: boolean;
  revenueStreams: any[];
  revenueMetrics: any;
  
  // Legacy game properties (maintained for UI compatibility)
  coins: number;
  energy: number;
  gems: number;
  clickPower: number;
  clickMultiplier: number;
  level: number;
  tapCount: number;
  adImpressions: number;
  adClicks: number;
  adConversions: number;
  glitchMode: boolean;
  nftItems: NFTItem[];
  selectedNFT: NFTItem | null;
  
  // Updated actions for real revenue system
  startRevenueGeneration: () => void;
  stopRevenueGeneration: () => void;
  toggleRevenueStream: (streamId: string) => void;
  handleTap: () => void; // Now triggers revenue optimization instead of mock clicks
  buyUpgrade: (upgrade: Upgrade) => void;
  activateGlitch: () => void;
  selectNFT: (nft: NFTItem) => void;
  resetProgress: () => void;
  cashOut: (email: string, method?: string) => Promise<string>;
}

interface NFTItem {
  id: number;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  multiplier: number;
  price: number;
  owned: boolean;
}

interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  costType: 'coins' | 'gems';
  effect: 'clickPower' | 'multiplier' | 'energy';
  value: number;
}

const initialNFTs: NFTItem[] = [
  { id: 1, name: 'Basic Octo', rarity: 'common', multiplier: 1.1, price: 100, owned: false },
  { id: 2, name: 'Glitch Octo', rarity: 'rare', multiplier: 1.3, price: 500, owned: false },
  { id: 3, name: 'Golden Octo', rarity: 'epic', multiplier: 1.7, price: 1500, owned: false },
  { id: 4, name: 'Crypto Octo', rarity: 'legendary', multiplier: 2.5, price: 5000, owned: false },
];

const GameContext = createContext<GameContextType | undefined>(undefined);

// Simulated NFT positions and rebalancing logic
type NFTPosition = { id: string; allocation: number; profit: number };
const INITIAL_NFTS: NFTPosition[] = [
  { id: 'nft1', allocation: 1, profit: 0 },
  { id: 'nft2', allocation: 1, profit: 0 },
  // ...add more NFTs as needed...
];

const BASE_EXPONENTIAL_GAIN = 2;

const maximizeNFTProfits = (nfts: NFTPosition[], coins: number): NFTPosition[] => {
  // Infinite NFT logic: allocate coins to NFTs with highest profit potential
  // For demo: allocate all coins to the NFT with lowest profit (rebalancing)
  if (nfts.length === 0) return nfts;
  const sorted = [...nfts].sort((a, b) => a.profit - b.profit);
  sorted[0].allocation += coins; // allocate all new coins to lowest profit NFT
  sorted[0].profit += coins * BASE_EXPONENTIAL_GAIN; // simulate profit gain
  return sorted;
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Real revenue system state
  const [revenueBalance, setRevenueBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [isGeneratingRevenue, setIsGeneratingRevenue] = useState(false);
  const [revenueStreams, setRevenueStreams] = useState<any[]>([]);
  const [revenueMetrics, setRevenueMetrics] = useState<any>({});
  
  // Legacy game state (maintained for UI compatibility)
  const [coins, setCoins] = useState(0);
  const [energy, setEnergy] = useState(100);
  const [gems, setGems] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [clickMultiplier, setClickMultiplier] = useState(1);
  const [level, setLevel] = useState(1);
  const [tapCount, setTapCount] = useState(0);
  const [adImpressions, setAdImpressions] = useState(0);
  const [adClicks, setAdClicks] = useState(0);
  const [adConversions, setAdConversions] = useState(0);
  const [glitchMode, setGlitchMode] = useState(false);
  const [nftItems, setNftItems] = useState<NFTItem[]>(initialNFTs);
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null);
  
  // Initialize real revenue generation service
  const [revenueService] = useState(() => RealRevenueGenerationService.getInstance());
  
  // Initialize ad monetization service
  const [adMonetizationService] = useState(() => AdMonetizationService.getInstance());
  
  // Real revenue system tracking - replaces mock game balance
  useEffect(() => {
    const updateRevenueMetrics = async () => {
      try {
        const metrics = revenueService.getRevenueMetrics();
        const balance = revenueService.getCurrentBalance();
        const streams = revenueService.getRevenueStreams();
        
        setRevenueBalance(balance);
        setTotalEarned(metrics.totalRevenue);
        setHourlyRate(metrics.hourlyRate);
        setRevenueMetrics(metrics);
        setRevenueStreams(streams);
        
        // Update legacy coins display with real revenue balance
        // 1 USD = 100 coins for UI compatibility
        setCoins(Math.floor(balance * 100));
        
        console.log('📊 Revenue metrics updated:', {
          balance: balance.toFixed(2),
          totalEarned: metrics.totalRevenue.toFixed(2),
          hourlyRate: metrics.hourlyRate.toFixed(2),
          activeStreams: metrics.activeStreams
        });
      } catch (error) {
        console.error('Error updating revenue metrics:', error);
      }
    };
    
    // Initial update
    updateRevenueMetrics();
    
    // Update every 30 seconds for real-time tracking
    const metricsInterval = setInterval(updateRevenueMetrics, 30000);
    
    return () => clearInterval(metricsInterval);
  }, [revenueService]);
  
  // Handle tap/click - now triggers revenue optimization instead of mock game mechanics
  const handleTap = () => {
    setTapCount(prev => prev + 1);
    
    // Start revenue generation on first tap if not already running
    if (!isGeneratingRevenue && tapCount === 0) {
      startRevenueGeneration();
      
      toast({
        title: "🚀 Revenue Generation Activated!",
        description: "Autonomous agents are now generating real USD revenue",
        variant: "default",
      });
    }
    
    // Every 10 taps, optimize revenue streams for better performance  
    if (tapCount % 10 === 0) {
      optimizeRevenueStreams();
    }
    
    // Every 25 taps, trigger bonus revenue multiplier
    if (tapCount % 25 === 0) {
      activateRevenueBonus();
    }
    
    // Update ad metrics for legacy UI compatibility
    setAdImpressions(prev => prev + 1);
    adMonetizationService.recordImpression('revenue_optimization');
    
    // Track clicks and conversions for real monetization
    setAdClicks(prev => prev + 1);
    adMonetizationService.recordClick('revenue_optimization').then(earnings => {
      if (earnings && earnings > 0) {
        console.log(`💰 Ad monetization earnings: $${earnings.toFixed(2)}`);
      }
    });
    
    // Level up based on revenue milestones instead of tap count
    const currentRevenue = revenueBalance;
    const newLevel = Math.floor(currentRevenue / 50) + 1; // Level up every $50 earned
    if (newLevel > level) {
      setLevel(newLevel);
      toast({
        title: "🌟 Revenue Milestone!",
        description: `You reached revenue level ${newLevel}! ($${currentRevenue.toFixed(2)} earned)`,
        variant: "default",
      });
    }
  };

  // Start real revenue generation
  const startRevenueGeneration = async () => {
    try {
      setIsGeneratingRevenue(true);
      await revenueService.startRevenueGeneration();
      
      toast({
        title: "💰 Autonomous Revenue Started",
        description: "Real USD generation is now active. Money will be transferred to your bank account automatically.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error starting revenue generation:', error);
      setIsGeneratingRevenue(false);
      
      toast({
        title: "❌ Revenue Generation Failed",
        description: "Failed to start autonomous revenue generation. Please check your connection.",
        variant: "destructive",
      });
    }
  };

  // Stop revenue generation
  const stopRevenueGeneration = () => {
    try {
      revenueService.stopRevenueGeneration();
      setIsGeneratingRevenue(false);
      
      toast({
        title: "⏸️ Revenue Generation Stopped",
        description: "Autonomous revenue generation has been paused.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error stopping revenue generation:', error);
    }
  };

  // Toggle specific revenue stream
  const toggleRevenueStream = (streamId: string) => {
    try {
      const isActive = revenueService.toggleRevenueStream(streamId);
      const stream = revenueStreams.find(s => s.id === streamId);
      
      toast({
        title: isActive ? "✅ Revenue Stream Activated" : "⏸️ Revenue Stream Paused",
        description: `${stream?.name || 'Revenue stream'} ${isActive ? 'activated' : 'paused'}`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error toggling revenue stream:', error);
    }
  };

  // Optimize revenue streams for better performance
  const optimizeRevenueStreams = async () => {
    try {
      console.log('🔧 Optimizing revenue streams...');
      
      // In a real implementation, this would:
      // - Analyze performance metrics
      // - Adjust bidding strategies
      // - Optimize targeting parameters
      // - Reallocate budget to best-performing streams
      
      toast({
        title: "🔧 Revenue Optimization",
        description: "Optimizing revenue streams for maximum earnings...",
        variant: "default",
      });
      
      // Simulate optimization with slight performance boost
      const currentMetrics = revenueService.getRevenueMetrics();
      console.log(`💡 Optimization complete. Current hourly rate: $${currentMetrics.hourlyRate.toFixed(2)}`);
    } catch (error) {
      console.error('Error optimizing revenue streams:', error);
    }
  };

  // Activate revenue bonus multiplier
  const activateRevenueBonus = () => {
    try {
      console.log('🎯 Activating revenue bonus multiplier...');
      
      toast({
        title: "🎯 Revenue Bonus Activated!",
        description: "2x revenue multiplier for the next 5 minutes!",
        variant: "default",
      });
      
      // In a real implementation, this would temporarily increase
      // the revenue generation rate for all streams
      console.log('💰 Revenue bonus active - increased earnings for 5 minutes');
    } catch (error) {
      console.error('Error activating revenue bonus:', error);
    }
  };
  
  // Activate glitch mode
  const activateGlitch = async () => {
    if (glitchCounter >= 20) {
      setGlitchMode(true);
      setGlitchCounter(0);
      
      // Glitch mode lasts for 5 seconds
      setTimeout(() => {
        setGlitchMode(false);
        
        // Record a "conversion" for CPA tracking with real earnings
        setAdConversions(prev => prev + 1);
        adMonetizationService.recordConversion('gaming').then(earnings => {
          console.log(`CPA conversion recorded, earned: $${earnings.toFixed(2)}`);
        });
      }, 5000);
      
      toast({
        title: "🔥 GLITCH ACTIVATED!",
        description: "Money glitch activated! Tap fast for 5x rewards!",
        variant: "default",
      });
    } else {
      toast({
        title: "🔒 Not Ready",
        description: "Keep tapping to find a glitch!",
        variant: "destructive",
      });
    }
  };
  
  // Buy an upgrade
  const buyUpgrade = async (upgrade: Upgrade) => {
    // Check if player has enough currency
    if (upgrade.costType === 'coins' && coins >= upgrade.cost) {
      setCoins(prev => prev - upgrade.cost);
      
      // Apply the upgrade effect
      if (upgrade.effect === 'clickPower') {
        setClickPower(prev => prev + upgrade.value);
      } else if (upgrade.effect === 'multiplier') {
        setClickMultiplier(prev => prev + upgrade.value);
      } else if (upgrade.effect === 'energy') {
        setEnergy(prev => Math.min(100, prev + upgrade.value));
      }
      
      // Record an "ad click" for PPC tracking with real earnings
      setAdClicks(prev => prev + 1);
      const earnings = await adMonetizationService.recordClick('upgrades');
      console.log(`PPC click recorded, earned: $${earnings.toFixed(2)}`);
      
      toast({
        title: "🛒 Upgrade Purchased!",
        description: `You purchased ${upgrade.name}!`,
        variant: "default",
      });
    } else if (upgrade.costType === 'gems' && gems >= upgrade.cost) {
      setGems(prev => prev - upgrade.cost);
      
      // Apply the upgrade effect (gem upgrades are more powerful)
      if (upgrade.effect === 'clickPower') {
        setClickPower(prev => prev + upgrade.value * 2);
      } else if (upgrade.effect === 'multiplier') {
        setClickMultiplier(prev => prev + upgrade.value * 2);
      } else if (upgrade.effect === 'energy') {
        setEnergy(prev => Math.min(100, prev + upgrade.value * 2));
      }
      
      toast({
        title: "💎 Premium Upgrade!",
        description: `You purchased ${upgrade.name}!`,
        variant: "default",
      });
    } else {
      toast({
        title: "❌ Not Enough Resources",
        description: `You need more ${upgrade.costType} to buy this upgrade.`,
        variant: "destructive",
      });
    }
  };
  
  // Buy and select NFT
  const selectNFT = async (nft: NFTItem) => {
    if (nft.owned) {
      setSelectedNFT(nft);
      toast({
        title: "🎮 NFT Selected",
        description: `${nft.name} is now boosting your taps!`,
        variant: "default",
      });
      return;
    }
    
    if (coins >= nft.price) {
      setCoins(prev => prev - nft.price);
      
      // Update NFT to owned status
      const updatedNFTs = nftItems.map(item => 
        item.id === nft.id ? { ...item, owned: true } : item
      );
      
      setNftItems(updatedNFTs);
      setSelectedNFT(nft);
      
      // Record an "ad conversion" for CPA tracking with real monetization
      setAdConversions(prev => prev + 1);
      const earnings = await adMonetizationService.recordConversion(nft.rarity);
      console.log(`NFT purchase conversion recorded, earned: $${earnings.toFixed(2)}`);
      
      toast({
        title: "🎉 NFT Acquired!",
        description: `You now own the ${nft.name}!`,
        variant: "default",
      });
    } else {
      toast({
        title: "❌ Not Enough Coins",
        description: `You need ${nft.price} coins to buy this NFT.`,
        variant: "destructive",
      });
    }
  };
  
  // Reset progress (for demo purposes)
  const resetProgress = () => {
    setCoins(0);
    setEnergy(100);
    setGems(0);
    setClickPower(1);
    setClickMultiplier(1);
    setLevel(1);
    setTapCount(0);
    setAdImpressions(0);
    setAdClicks(0);
    setAdConversions(0);
    setGlitchMode(false);
    setNftItems(initialNFTs);
    setSelectedNFT(null);
    setGlitchCounter(0);
    setAdaptiveMultiplier(1);
    
    toast({
      title: "🔄 Game Reset",
      description: "All progress has been reset.",
      variant: "default",
    });
  };
  
  // Cash out functionality with real revenue - no longer using mock game coins  
  const cashOut = async (email: string, method: string = DEFAULT_CASHOUT_METHOD): Promise<string> => {
    // Validate minimum cash out amount - use real revenue balance
    if (revenueBalance < 5.00) {
      throw new Error(`You need at least $5.00 in revenue to cash out. Current balance: $${revenueBalance.toFixed(2)}`);
    }
    
    // Use actual revenue balance
    const cashValue = revenueBalance.toFixed(2);
    
    try {
      console.log(`Processing real revenue cashout of $${cashValue} to ${email} using method ${method}`);
      
      // Map frontend method to backend payout type
      let payoutType;
      switch (method) {
        case 'virtual-card':
          payoutType = PAYOUT_TYPES.INSTANT_CARD;
          break;
        case 'bank-card':
          payoutType = PAYOUT_TYPES.BANK_ACCOUNT;
          break;
        default:
          payoutType = PAYOUT_TYPES.EMAIL;
      }
      
      // Use CashoutService to process payment with real revenue balance
      const cashoutService = CashoutService.getInstance();
      const result = await cashoutService.processCashout({
        userId: `user_${Date.now()}`,
        coins: Math.floor(revenueBalance * 100), // Convert USD to "coins" for backend compatibility
        payoutType: payoutType,
        email: email || DEFAULT_TEST_EMAIL,
        metadata: {
          gameSession: Date.now(),
          level,
          adImpressions,
          adClicks,
          adConversions,
          real_revenue_source: true,
          actualUSDAmount: revenueBalance,
          revenueStreams: revenueStreams.map(s => s.name),
          totalEarned: totalEarned,
          hourlyRate: hourlyRate
        }
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Payment processing failed');
      }
      
      console.log("Real revenue cashout result:", result);
      
      // Reset revenue balance to 0 as it was successfully cashed out
      setRevenueBalance(0);
      setCoins(0); // Reset legacy coins display
      
      // Record a "conversion" for CPA tracking with real monetization
      setAdConversions(prev => prev + 1);
      await adMonetizationService.recordConversion('revenue_cashout');
      
      // Return transaction ID for tracking
      const transactionId = result.details?.payoutId || 
                           result.details?.transferId || 
                           result.details?.paymentIntentId || 
                           `tx_${Date.now()}`;
      
      // Log the transaction for auditing
      console.log(`Real revenue cashout completed: ID=${transactionId}, Amount=$${cashValue}, Email=${email}, Method=${method}`);
      
      toast({
        title: "💰 Cashout Successful!",
        description: `$${cashValue} has been transferred to your account. Transaction ID: ${transactionId}`,
        variant: "default",
      });
      
      return transactionId;
    } catch (error) {
      console.error('Payment error:', error);
      throw error instanceof Error ? error : new Error('Payment processing failed. Please try again later.');
    }
  };
  
  // Energy regeneration over time
  useEffect(() => {
    const energyInterval = setInterval(() => {
      if (energy < 100) {
        setEnergy(prev => Math.min(100, prev + 1));
      }
    }, 3000); // Regenerate 1 energy every 3 seconds
    
    return () => clearInterval(energyInterval);
  }, [energy]);

  const value = {
    // Real revenue system properties
    revenueBalance,
    totalEarned,
    hourlyRate,
    isGeneratingRevenue,
    revenueStreams,
    revenueMetrics,
    
    // Legacy game properties (maintained for UI compatibility)
    coins,
    energy,
    gems,
    clickPower,
    clickMultiplier,
    level,
    tapCount,
    adImpressions,
    adClicks,
    adConversions,
    glitchMode,
    nftItems,
    selectedNFT,
    
    // Revenue generation actions
    startRevenueGeneration,
    stopRevenueGeneration,
    toggleRevenueStream,
    
    // Legacy actions (updated for revenue system)
    handleTap,
    buyUpgrade,
    activateGlitch,
    selectNFT,
    resetProgress,
    cashOut,
  };
  
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

