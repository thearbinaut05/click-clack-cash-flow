import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { API_BASE_URL, DEFAULT_TEST_EMAIL, DEFAULT_CASHOUT_METHOD, PAYOUT_TYPES } from '@/utils/constants';
import AdMonetizationService from '@/services/AdMonetizationService';
import { CashoutService } from '@/services/CashoutService';
import { MasterOrchestrationSystem, SystemConfig, SystemMetrics, RealTimeUpdate } from '@/services/MasterOrchestrationSystem';

interface GameContextType {
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
  handleTap: () => void;
  buyUpgrade: (upgrade: Upgrade) => void;
  activateGlitch: () => void;
  selectNFT: (nft: NFTItem) => void;
  resetProgress: () => void;
  cashOut: (email: string, method?: string) => Promise<string>;
  // New master orchestration system integration
  orchestrationSystem: MasterOrchestrationSystem | null;
  systemMetrics: SystemMetrics | null;
  isSystemRunning: boolean;
  recentUpdates: RealTimeUpdate[];
  startMasterSystem: () => Promise<void>;
  stopMasterSystem: () => Promise<void>;
  manualGlitchTrigger: (nftId: string) => Promise<boolean>;
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
  // Game state
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
  
  // Adaptive difficulty (increases reward based on player behavior)
  const [adaptiveMultiplier, setAdaptiveMultiplier] = useState(1);
  
  // Counter for glitch mode opportunity
  const [glitchCounter, setGlitchCounter] = useState(0);
  
  // Track application balance from autonomous revenue
  const [applicationBalance, setApplicationBalance] = useState(0);
  
  // Master orchestration system state
  const [orchestrationSystem, setOrchestrationSystem] = useState<MasterOrchestrationSystem | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [isSystemRunning, setIsSystemRunning] = useState(false);
  const [recentUpdates, setRecentUpdates] = useState<RealTimeUpdate[]>([]);
  
  // Initialize ad monetization service
  const [adMonetizationService] = useState(() => AdMonetizationService.getInstance());
  
  // Sync coins with autonomous revenue from application balance
  useEffect(() => {
    const syncWithApplicationBalance = async () => {
      try {
        const response = await fetch('https://tqbybefpnwxukzqkanip.supabase.co/rest/v1/application_balance?id=eq.1', {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxYnliZWZwbnd4dWt6cWthbmlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNjAyMDMsImV4cCI6MjA2MzkzNjIwM30.trGBxEF0wr4S_4gBteqV_TuWcIEMbzfDJiA1lga6Yko',
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const balance = data[0].balance_amount;
            setApplicationBalance(balance);
            // Convert autonomous revenue to game coins (1 USD = 100 coins)
            const autonomousCoins = Math.floor(balance * 100);
            if (autonomousCoins > coins) {
              setCoins(autonomousCoins);
            }
          }
        }
      } catch (error) {
        console.log('Could not sync with application balance:', error);
      }
    };
    
    // Initial sync
    syncWithApplicationBalance();
    
    // Sync every 30 seconds
    const syncInterval = setInterval(syncWithApplicationBalance, 30000);
    
    return () => clearInterval(syncInterval);
  }, [coins]);
  
  // Handle tap/click
  const handleTap = () => {
    setTapCount(prev => {
      const newTapCount = prev + 1;
      // Exponential gain logic, tied to real user action
      setCoins(coins + Math.pow(BASE_EXPONENTIAL_GAIN, newTapCount));
      return newTapCount;
    });
    
    // Use energy (except in glitch mode)
    if (!glitchMode && energy > 0) {
      setEnergy(prev => Math.max(0, prev - 0.5));
    }
    
    // Increment glitch counter
    setGlitchCounter(prev => prev + 1);
    
    // Check for glitch opportunity
    if (glitchCounter >= 20 && !glitchMode && Math.random() < 0.2) {
      toast({
        title: "🎮 GLITCH DETECTED!",
        description: "Quick! Activate the money glitch!",
        variant: "default",
      });
    }
    
    // Random chance to get gems (0.5%)
    if (Math.random() < 0.005) {
      setGems(prev => prev + 1);
      toast({
        title: "💎 Gem Found!",
        description: "You found a rare gem!",
        variant: "default",
      });
    }
    
    // Track ad metrics with real-time service
    if (tapCount % 10 === 0) {
      setAdImpressions(prev => prev + 1);
      adMonetizationService.recordImpression(selectedNFT?.rarity || 'general');
      // PPC logic: record click and add earnings from real ad service
      setAdClicks(prev => prev + 1);
      adMonetizationService.recordClick(selectedNFT?.rarity || 'general').then(earnings => {
        // Only add coins if real earnings are returned
        if (earnings && earnings > 0) {
          setCoins(prev => prev + Math.floor(earnings * 100));
        }
      });
    }
    
    // Level up logic
    if (tapCount > 0 && tapCount % 50 === 0) {
      setLevel(prev => prev + 1);
      // Give energy bonus on level up
      setEnergy(prev => Math.min(100, prev + 25));
      toast({
        title: "🌟 Level Up!",
        description: `You reached level ${level + 1}!`,
        variant: "default",
      });
    }
    
    // Adaptive difficulty adjustment
    // If player is tapping quickly, increase the multiplier
    if (tapCount % 20 === 0) {
      setAdaptiveMultiplier(prev => Math.min(3, prev + 0.1));
    }
    
    // NFT rebalancing: maximize profits after each click (commented out for now to fix error)
    // setNFTPositions(prevNFTs => maximizeNFTProfits(prevNFTs, Math.pow(BASE_EXPONENTIAL_GAIN, tapCount)));
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
  
  // Cash out functionality with Stripe - using clicker game coins only
  const cashOut = async (email: string, method: string = DEFAULT_CASHOUT_METHOD): Promise<string> => {
    // Validate minimum cash out amount - only check clicker game coins
    if (coins < 500) {
      throw new Error("You need at least 500 coins ($5) from the clicker game to cash out");
    }
    
    // Calculate cash value
    const cashValue = (coins / 100).toFixed(2);
    
    try {
      console.log(`Processing clicker game cashout of $${cashValue} to ${email} using method ${method}`);
      
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
      
      // Use CashoutService to process payment with clicker game coins
      const cashoutService = CashoutService.getInstance();
      const result = await cashoutService.processCashout({
        userId: `user_${Date.now()}`,
        coins: coins,
        payoutType: payoutType,
        email: email || DEFAULT_TEST_EMAIL,
        metadata: {
          gameSession: Date.now(),
          level,
          adImpressions,
          adClicks,
          adConversions,
          clicker_game_source: true,
          coinCount: coins
        }
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Payment processing failed');
      }
      
      console.log("Clicker game cashout result:", result);
      
      // Reset clicker game coins to 0 as they were successfully cashed out
      setCoins(0);
      
      // Record a "conversion" for CPA tracking with real monetization
      setAdConversions(prev => prev + 1);
      await adMonetizationService.recordConversion('finance');
      
      // Return transaction ID for tracking
      const transactionId = result.details?.payoutId || 
                           result.details?.transferId || 
                           result.details?.paymentIntentId || 
                           `tx_${Date.now()}`;
      
      // Log the transaction for auditing
      console.log(`Clicker game cashout completed: ID=${transactionId}, Amount=$${cashValue}, Email=${email}, Method=${method}`);
      
      return transactionId;
    } catch (error) {
      console.error('Payment error:', error);
      throw error instanceof Error ? error : new Error('Payment processing failed. Please try again later.');
    }
  };
  
  // Initialize master orchestration system
  useEffect(() => {
    const initializeOrchestrationSystem = async () => {
      try {
        // Define system configuration
        const systemConfig: SystemConfig = {
          rebalancing: {
            maxLeverage: 4.0,
            targetHealthFactor: 2.0,
            rebalanceThreshold: 1.5,
            fibonacciMultiplier: 1.618,
            quantumLeapFactor: 1.618
          },
          glitchEngine: {
            enabled: true,
            maxGlitchValue: 50000, // $50k max per glitch
            autoOfframpThreshold: 1000, // Auto-offramp at $1k
            fibonacciBase: 1.618
          },
          quantumAcquisition: {
            enabled: true,
            maxRiskLevel: 0.7,
            minProfitThreshold: 100, // $100 minimum profit
            complianceJurisdiction: 'SEC_US'
          },
          riskManagement: {
            maxPositionSize: 100000, // $100k max position
            stopLossPercentage: 0.1, // 10% stop loss
            maxDailyLoss: 5000, // $5k max daily loss
            emergencyShutdownThreshold: 0.9 // 90% risk threshold
          }
        };

        console.log('🎯 Initializing Master Orchestration System...');
        
        const system = new MasterOrchestrationSystem(systemConfig);
        setOrchestrationSystem(system);

        // Subscribe to real-time updates
        const unsubscribe = system.subscribeToUpdates((update: RealTimeUpdate) => {
          setRecentUpdates(prev => [...prev.slice(-19), update]); // Keep last 20 updates
          
          // Update coins based on profit from system
          if (update.profit && update.profit > 0) {
            const coinsFromProfit = Math.floor(update.profit * 100); // $1 = 100 coins
            setCoins(prev => prev + coinsFromProfit);
            
            // Record revenue in the system
            system.recordRevenue(update.profit, update.type);
            
            toast({
              title: "💰 Automated Profit!",
              description: `+${coinsFromProfit} coins from ${update.type}`,
              variant: "default",
            });
          }
        });

        // Update system metrics every 30 seconds
        const metricsInterval = setInterval(async () => {
          if (system) {
            try {
              const metrics = await system.getSystemMetrics();
              setSystemMetrics(metrics);
            } catch (error) {
              console.error('Error updating system metrics:', error);
            }
          }
        }, 30000);

        console.log('✅ Master Orchestration System initialized successfully');

        // Cleanup function
        return () => {
          unsubscribe();
          clearInterval(metricsInterval);
        };
      } catch (error) {
        console.error('❌ Failed to initialize orchestration system:', error);
      }
    };

    initializeOrchestrationSystem();
  }, []);

  // Master system control functions
  const startMasterSystem = async (): Promise<void> => {
    if (!orchestrationSystem) {
      toast({
        title: "❌ System Not Ready",
        description: "Master system is still initializing...",
        variant: "destructive",
      });
      return;
    }

    try {
      await orchestrationSystem.startMasterSystem();
      setIsSystemRunning(true);
      
      toast({
        title: "🚀 Master System Started",
        description: "All automated systems are now active!",
        variant: "default",
      });
    } catch (error) {
      console.error('Error starting master system:', error);
      toast({
        title: "❌ Startup Failed",
        description: "Failed to start master system. Check console for details.",
        variant: "destructive",
      });
    }
  };

  const stopMasterSystem = async (): Promise<void> => {
    if (!orchestrationSystem) return;

    try {
      await orchestrationSystem.stopMasterSystem();
      setIsSystemRunning(false);
      
      toast({
        title: "🛑 Master System Stopped",
        description: "All automated systems have been stopped.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error stopping master system:', error);
    }
  };

  const manualGlitchTrigger = async (nftId: string): Promise<boolean> => {
    if (!orchestrationSystem) return false;

    try {
      // Trigger manual glitch through the system
      const nft = nftItems.find(item => item.id.toString() === nftId);
      if (!nft) return false;

      // Simulate glitch trigger with Fibonacci exponential gain
      const glitchMultiplier = 1.618 + Math.random() * 2; // 1.618 to 3.618x
      const coinsGained = Math.floor(nft.price * glitchMultiplier);
      
      setCoins(prev => prev + coinsGained);
      
      // Record as system revenue
      const profitValue = coinsGained / 100; // Convert to USD
      orchestrationSystem.recordRevenue(profitValue, 'manual_glitch');
      
      toast({
        title: "⚡ INFINITE GLITCH ACTIVATED!",
        description: `${nft.name} generated ${coinsGained} coins with ${glitchMultiplier.toFixed(2)}x multiplier!`,
        variant: "default",
      });

      return true;
    } catch (error) {
      console.error('Error triggering manual glitch:', error);
      return false;
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
    handleTap,
    buyUpgrade,
    activateGlitch,
    selectNFT,
    resetProgress,
    cashOut,
    // Master orchestration system
    orchestrationSystem,
    systemMetrics,
    isSystemRunning,
    recentUpdates,
    startMasterSystem,
    stopMasterSystem,
    manualGlitchTrigger,
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

