
import { AD_NETWORKS, AFFILIATE_API_ENDPOINTS } from '@/utils/constants';
import RealAffiliateNetworkService from './RealAffiliateNetworkService';

export interface AdPerformanceMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cvr: number;
  ecpm: number;
  earnings: number;
  category: string;
  timestamp: Date;
}

export interface OptimizationResult {
  recommendedCategory: string;
  projectedImprovement: number;
  confidence: number;
  suggestedActions: string[];
}

export interface OfferData {
  id: string;
  name: string;
  description: string;
  category: string;
  payout: number;
  payoutType: 'cpa' | 'ppc' | 'revshare';
  network: string;
  requirements: string[];
  countries: string[];
  conversionRate: number;
  epc: number; // earnings per click
}

class AdMonetizationService {
  private static instance: AdMonetizationService;
  private metrics: AdPerformanceMetrics[] = [];
  private currentOffers: OfferData[] = [];
  private userSegment: string = 'general';
  private lastOptimization: Date | null = null;
  private affiliateNetwork: RealAffiliateNetworkService;
  
  private constructor() {
    // Initialize with some default offers if API is not available
    this.loadInitialOffers();
    this.affiliateNetwork = RealAffiliateNetworkService.getInstance();
  }
  
  static getInstance(): AdMonetizationService {
    if (!AdMonetizationService.instance) {
      AdMonetizationService.instance = new AdMonetizationService();
    }
    return AdMonetizationService.instance;
  }
  
  private async loadInitialOffers(): Promise<void> {
    try {
      const offers = await this.fetchOffers();
      if (offers && offers.length > 0) {
        this.currentOffers = offers;
      } else {
        // Fallback to default offers if API call fails
        this.currentOffers = this.getDefaultOffers();
      }
    } catch (error) {
      console.error('Failed to fetch initial offers:', error);
      this.currentOffers = this.getDefaultOffers();
    }
  }
  
  private getDefaultOffers(): OfferData[] {
    return [
      {
        id: 'offer-1',
        name: 'Mobile Game Install',
        description: 'Install and reach level 5',
        category: 'gaming',
        payout: 2.50,
        payoutType: 'cpa',
        network: 'GameAffiliates',
        requirements: ['Install app', 'Reach level 5'],
        countries: ['US', 'CA', 'UK', 'AU'],
        conversionRate: 0.08,
        epc: 0.20
      },
      {
        id: 'offer-2',
        name: 'Credit Card Sign-up',
        description: 'Apply and get approved',
        category: 'finance',
        payout: 6.00,
        payoutType: 'cpa',
        network: 'FinancePartners',
        requirements: ['Complete application', 'Credit approval'],
        countries: ['US'],
        conversionRate: 0.03,
        epc: 0.18
      },
      {
        id: 'offer-3',
        name: 'Survey Completion',
        description: 'Complete short survey',
        category: 'survey',
        payout: 1.20,
        payoutType: 'cpa',
        network: 'SurveyNetwork',
        requirements: ['Complete full survey'],
        countries: ['US', 'CA', 'UK', 'DE', 'FR'],
        conversionRate: 0.15,
        epc: 0.18
      }
    ];
  }
  
  async fetchOffers(): Promise<OfferData[]> {
    try {
      const response = await fetch(AFFILIATE_API_ENDPOINTS.offers, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching offers:', error);
      // Return default offers on any error to prevent component failures
      return this.getDefaultOffers();
    }
  }
  
  async recordImpression(category: string = 'general'): Promise<void> {
    const currentMetrics = this.getCurrentMetrics();
    
    // Update metrics
    this.metrics.push({
      ...currentMetrics,
      impressions: currentMetrics.impressions + 1,
      category,
      timestamp: new Date()
    });
    
    // Attempt to send data to backend
    try {
      await fetch(AFFILIATE_API_ENDPOINTS.stats, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'impression',
          category,
          timestamp: new Date()
        })
      });
    } catch (error) {
      console.log('Failed to record impression to server, storing locally only');
    }
  }
  
  async recordClick(category: string = 'general'): Promise<number> {
    const currentMetrics = this.getCurrentMetrics();
    const ppcRate = this.calculatePPCRate(currentMetrics.clicks + 1, category);
    
    // Update metrics
    this.metrics.push({
      ...currentMetrics,
      clicks: currentMetrics.clicks + 1,
      ctr: (currentMetrics.clicks + 1) / (currentMetrics.impressions || 1),
      category,
      earnings: currentMetrics.earnings + ppcRate,
      timestamp: new Date()
    });
    
    // Attempt to send data to backend
    try {
      await fetch(AFFILIATE_API_ENDPOINTS.stats, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'click',
          category,
          earnings: ppcRate,
          timestamp: new Date()
        })
      });
    } catch (error) {
      console.log('Failed to record click to server, storing locally only');
    }
    
    return ppcRate;
  }
  
  async recordConversion(category: string = 'general', userId?: string): Promise<number> {
    const currentMetrics = this.getCurrentMetrics();
    const cpaRate = this.calculateCPARate(currentMetrics.conversions + 1, category);
    
    // Update metrics
    this.metrics.push({
      ...currentMetrics,
      conversions: currentMetrics.conversions + 1,
      cvr: (currentMetrics.conversions + 1) / (currentMetrics.clicks || 1),
      category,
      earnings: currentMetrics.earnings + cpaRate,
      timestamp: new Date()
    });
    
    // Track real conversion in affiliate network if userId provided
    if (userId) {
      try {
        await this.affiliateNetwork.trackConversion(
          `auto_${category}_${Date.now()}`,
          userId,
          cpaRate
        );
        console.log('Real affiliate conversion tracked:', cpaRate);
      } catch (error) {
        console.log('Failed to track real affiliate conversion:', error);
      }
    }
    
    // Attempt to send data to backend
    try {
      await fetch(AFFILIATE_API_ENDPOINTS.stats, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'conversion',
          category,
          earnings: cpaRate,
          timestamp: new Date()
        })
      });
    } catch (error) {
      console.log('Failed to record conversion to server, storing locally only');
    }
    
    // Run optimization algorithm after conversions
    if (!this.lastOptimization || 
        (new Date().getTime() - this.lastOptimization.getTime()) > 3600000) { // 1 hour
      this.optimizeAdStrategy();
    }
    
    return cpaRate;
  }
  
  calculatePPCRate(clicks: number, category: string = 'general'): number {
    let baseRate = AD_NETWORKS.ppc.baseRate;
    
    // Apply tier multipliers
    for (const tier of AD_NETWORKS.ppc.tiers) {
      if (clicks >= tier.threshold) {
        baseRate *= tier.multiplier;
        break;
      }
    }
    
    // Apply time of day factor (higher rates during peak hours)
    const hour = new Date().getHours();
    const peakHourMultiplier = (hour >= 18 && hour <= 23) ? 1.15 : 
                               (hour >= 8 && hour <= 17) ? 1.05 : 0.9;
    
    // Randomize slightly to simulate market fluctuations
    const fluctuation = 0.9 + (Math.random() * 0.2); // +/- 10%
    
    return baseRate * peakHourMultiplier * fluctuation;
  }
  
  calculateCPARate(conversions: number, category: string = 'general'): number {
    let baseRate = AD_NETWORKS.cpa.baseRate;
    
    // Apply tier multipliers based on conversion count
    for (const tier of AD_NETWORKS.cpa.tiers) {
      if (conversions >= tier.threshold) {
        baseRate *= tier.multiplier;
        break;
      }
    }
    
    // Apply category modifier if available
    const categoryConfig = AD_NETWORKS.cpa.categories[category as keyof typeof AD_NETWORKS.cpa.categories];
    if (categoryConfig) {
      baseRate *= categoryConfig.baseModifier;
    }
    
    // Apply day of week factor (weekends typically have higher rates)
    const dayOfWeek = new Date().getDay();
    const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.2 : 1.0;
    
    // Randomize slightly to simulate market fluctuations
    const fluctuation = 0.9 + (Math.random() * 0.2); // +/- 10%
    
    return baseRate * weekendMultiplier * fluctuation;
  }
  
  getCurrentMetrics(): AdPerformanceMetrics {
    const latest = this.metrics[this.metrics.length - 1];
    
    if (latest) {
      return { ...latest };
    }
    
    // Default initial metrics
    return {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cvr: 0,
      ecpm: 0,
      earnings: 0,
      category: 'general',
      timestamp: new Date()
    };
  }
  
  async optimizeAdStrategy(): Promise<OptimizationResult> {
    this.lastOptimization = new Date();
    
    try {
      // Try to get optimization from server first
      const response = await fetch(AFFILIATE_API_ENDPOINTS.optimize, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: this.metrics.slice(-100), // Send last 100 data points
          currentOffers: this.currentOffers,
          userSegment: this.userSegment
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        return result;
      }
    } catch (error) {
      console.log('Failed to get optimization from server, using local algorithm');
    }
    
    // Fallback to local optimization algorithm
    return this.localOptimizeStrategy();
  }
  
  private localOptimizeStrategy(): OptimizationResult {
    // Group metrics by category
    const categoryPerformance = this.metrics
      .reduce((acc, metric) => {
        if (!acc[metric.category]) {
          acc[metric.category] = {
            impressions: 0,
            clicks: 0,
            conversions: 0,
            earnings: 0
          };
        }
        
        acc[metric.category].impressions += 1;
        acc[metric.category].clicks += metric.clicks - (acc[metric.category].clicks);
        acc[metric.category].conversions += metric.conversions - (acc[metric.category].conversions);
        acc[metric.category].earnings += metric.earnings - (acc[metric.category].earnings);
        
        return acc;
      }, {} as Record<string, { impressions: number, clicks: number, conversions: number, earnings: number }>);
    
    // Find best performing category
    let bestCategory = 'general';
    let bestEPC = 0; // Earnings per click
    
    Object.entries(categoryPerformance).forEach(([category, data]) => {
      if (data.clicks > 0) {
        const epc = data.earnings / data.clicks;
        if (epc > bestEPC) {
          bestEPC = epc;
          bestCategory = category;
        }
      }
    });
    
    // Calculate average EPC across all categories
    const allClicks = Object.values(categoryPerformance).reduce((sum, data) => sum + data.clicks, 0);
    const allEarnings = Object.values(categoryPerformance).reduce((sum, data) => sum + data.earnings, 0);
    const averageEPC = allClicks > 0 ? allEarnings / allClicks : 0;
    
    // Calculate projected improvement
    const projectedImprovement = averageEPC > 0 ? (bestEPC / averageEPC) - 1 : 0;
    
    return {
      recommendedCategory: bestCategory,
      projectedImprovement: projectedImprovement * 100, // as percentage
      confidence: this.calculateConfidenceLevel(categoryPerformance[bestCategory]?.clicks || 0),
      suggestedActions: [
        `Focus more on ${bestCategory} category offers`,
        `Increase bid for ${bestCategory} traffic`,
        `Create more content related to ${bestCategory}`
      ]
    };
  }
  
  private calculateConfidenceLevel(sampleSize: number): number {
    // Simplified confidence calculation based on sample size
    // Real statistical confidence would be more complex
    if (sampleSize > 1000) return 95;
    if (sampleSize > 500) return 90;
    if (sampleSize > 100) return 80;
    if (sampleSize > 50) return 70;
    if (sampleSize > 20) return 60;
    return 50; // baseline confidence
  }
  
  getCurrentOffers(): OfferData[] {
    return this.currentOffers;
  }
  
  getRecommendedOffer(): OfferData | null {
    if (this.currentOffers.length === 0) {
      return null;
    }
    
    // Sort by expected value (payout * conversion rate)
    const sortedOffers = [...this.currentOffers]
      .sort((a, b) => (b.payout * b.conversionRate) - (a.payout * a.conversionRate));
      
    return sortedOffers[0];
  }
  
  getTotalEarnings(): number {
    const latest = this.getCurrentMetrics();
    return latest.earnings;
  }
  
  getEarningsBreakdown(): {ppc: number, cpa: number} {
    // Calculate how much came from clicks vs conversions
    const ppcEarnings = this.metrics.reduce((sum, metric) => {
      // Simple approximation - in reality would need to track this separately
      const clickContribution = metric.clicks > 0 ? 
        (metric.clicks * this.calculatePPCRate(metric.clicks, metric.category)) : 0;
      return sum + clickContribution;
    }, 0);
    
    const totalEarnings = this.getTotalEarnings();
    
    return {
      ppc: ppcEarnings,
      cpa: totalEarnings - ppcEarnings
    };
  }
}

export default AdMonetizationService;
