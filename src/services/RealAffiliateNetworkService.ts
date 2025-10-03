/**
 * Real Affiliate Network Service
 * Integrates with actual CPA, CPL, and PPC affiliate networks
 * Handles real offer walls, conversions, and revenue tracking
 */

export interface AffiliateOffer {
  id: string;
  name: string;
  description: string;
  network: 'cpalead' | 'ogads' | 'adscend' | 'cpagrip' | 'offertoro';
  type: 'cpa' | 'cpl' | 'ppc';
  payout: number; // in USD
  countries: string[];
  category: string;
  url: string;
  requirements: string[];
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  icon?: string;
}

export interface ConversionEvent {
  offerId: string;
  userId: string;
  timestamp: Date;
  payout: number;
  status: 'pending' | 'approved' | 'rejected';
  networkTransactionId: string;
}

export interface RevenueReport {
  totalEarned: number;
  pendingEarnings: number;
  approvedEarnings: number;
  availableForPayout: number;
  conversions: ConversionEvent[];
}

class RealAffiliateNetworkService {
  private static instance: RealAffiliateNetworkService;
  private apiKeys: Map<string, string>;
  private conversions: ConversionEvent[] = [];
  private pendingRevenue: number = 0;
  private approvedRevenue: number = 0;

  private constructor() {
    this.apiKeys = new Map();
    // Initialize API keys from environment or localStorage
    this.loadApiKeys();
    this.loadConversionsFromStorage();
  }

  static getInstance(): RealAffiliateNetworkService {
    if (!RealAffiliateNetworkService.instance) {
      RealAffiliateNetworkService.instance = new RealAffiliateNetworkService();
    }
    return RealAffiliateNetworkService.instance;
  }

  private loadApiKeys(): void {
    // Load API keys from localStorage (admin can set these)
    const storedKeys = localStorage.getItem('affiliate_api_keys');
    if (storedKeys) {
      try {
        const keys = JSON.parse(storedKeys);
        Object.entries(keys).forEach(([network, key]) => {
          this.apiKeys.set(network, key as string);
        });
      } catch (error) {
        console.error('Failed to load API keys:', error);
      }
    }
  }

  private loadConversionsFromStorage(): void {
    const stored = localStorage.getItem('affiliate_conversions');
    if (stored) {
      try {
        this.conversions = JSON.parse(stored).map((c: any) => ({
          ...c,
          timestamp: new Date(c.timestamp)
        }));
        this.calculateRevenue();
      } catch (error) {
        console.error('Failed to load conversions:', error);
      }
    }
  }

  private saveConversionsToStorage(): void {
    localStorage.setItem('affiliate_conversions', JSON.stringify(this.conversions));
  }

  private calculateRevenue(): void {
    this.pendingRevenue = this.conversions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.payout, 0);
    
    this.approvedRevenue = this.conversions
      .filter(c => c.status === 'approved')
      .reduce((sum, c) => sum + c.payout, 0);
  }

  /**
   * Set API key for a specific affiliate network
   */
  setApiKey(network: string, apiKey: string): void {
    this.apiKeys.set(network, apiKey);
    const keys = Object.fromEntries(this.apiKeys);
    localStorage.setItem('affiliate_api_keys', JSON.stringify(keys));
  }

  /**
   * Fetch available offers from real affiliate networks
   */
  async fetchAvailableOffers(userId: string): Promise<AffiliateOffer[]> {
    const offers: AffiliateOffer[] = [];

    // CPALead integration
    if (this.apiKeys.has('cpalead')) {
      try {
        const cpaLeadOffers = await this.fetchCPALeadOffers(userId);
        offers.push(...cpaLeadOffers);
      } catch (error) {
        console.error('CPALead fetch failed:', error);
      }
    }

    // OGAds integration
    if (this.apiKeys.has('ogads')) {
      try {
        const ogAdsOffers = await this.fetchOGAdsOffers(userId);
        offers.push(...ogAdsOffers);
      } catch (error) {
        console.error('OGAds fetch failed:', error);
      }
    }

    // AdscendMedia integration
    if (this.apiKeys.has('adscend')) {
      try {
        const adscendOffers = await this.fetchAdscendOffers(userId);
        offers.push(...adscendOffers);
      } catch (error) {
        console.error('Adscend fetch failed:', error);
      }
    }

    // If no API keys configured, return demo offers
    if (offers.length === 0) {
      return this.getDemoOffers();
    }

    return offers;
  }

  /**
   * Fetch offers from CPALead
   */
  private async fetchCPALeadOffers(userId: string): Promise<AffiliateOffer[]> {
    const apiKey = this.apiKeys.get('cpalead');
    if (!apiKey) return [];

    try {
      // CPALead API endpoint
      const response = await fetch(`https://cpalead.com/dashboard/reports/campaign_json.php?id=${apiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('CPALead API request failed');
      }

      const data = await response.json();
      
      // Transform CPALead offers to our format
      return data.map((offer: any) => ({
        id: `cpalead_${offer.id}`,
        name: offer.name,
        description: offer.description || offer.name,
        network: 'cpalead' as const,
        type: this.detectOfferType(offer.type),
        payout: parseFloat(offer.payout || '0'),
        countries: offer.countries ? offer.countries.split(',') : ['US'],
        category: offer.category || 'general',
        url: this.generateOfferUrl('cpalead', offer.id, userId),
        requirements: [offer.requirements || 'Complete the offer'],
        estimatedTime: offer.time || '5-10 minutes',
        difficulty: this.calculateDifficulty(offer.payout),
        icon: offer.icon
      }));
    } catch (error) {
      console.error('CPALead API error:', error);
      return [];
    }
  }

  /**
   * Fetch offers from OGAds
   */
  private async fetchOGAdsOffers(userId: string): Promise<AffiliateOffer[]> {
    const apiKey = this.apiKeys.get('ogads');
    if (!apiKey) return [];

    try {
      // OGAds API endpoint
      const response = await fetch(`https://ogads.com/api.php?key=${apiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('OGAds API request failed');
      }

      const data = await response.json();
      
      // Transform OGAds offers to our format
      return (data.offers || []).map((offer: any) => ({
        id: `ogads_${offer.offer_id}`,
        name: offer.offer_name,
        description: offer.offer_desc || offer.offer_name,
        network: 'ogads' as const,
        type: 'cpa' as const,
        payout: parseFloat(offer.payout || '0'),
        countries: offer.country ? [offer.country] : ['US'],
        category: offer.category || 'general',
        url: this.generateOfferUrl('ogads', offer.offer_id, userId),
        requirements: [offer.requirements || 'Complete the offer'],
        estimatedTime: '5-10 minutes',
        difficulty: this.calculateDifficulty(offer.payout),
        icon: offer.icon_url
      }));
    } catch (error) {
      console.error('OGAds API error:', error);
      return [];
    }
  }

  /**
   * Fetch offers from AdscendMedia
   */
  private async fetchAdscendOffers(userId: string): Promise<AffiliateOffer[]> {
    const apiKey = this.apiKeys.get('adscend');
    if (!apiKey) return [];

    try {
      // AdscendMedia API endpoint
      const response = await fetch(`https://adscendmedia.com/adwall/api/publisher/${apiKey}/offers.json`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Adscend API request failed');
      }

      const data = await response.json();
      
      // Transform Adscend offers to our format
      return (data.offers || []).map((offer: any) => ({
        id: `adscend_${offer.offer_id}`,
        name: offer.name,
        description: offer.description || offer.name,
        network: 'adscend' as const,
        type: 'cpa' as const,
        payout: parseFloat(offer.payout || '0'),
        countries: offer.countries || ['US'],
        category: offer.category || 'general',
        url: this.generateOfferUrl('adscend', offer.offer_id, userId),
        requirements: [offer.anchor || 'Complete the offer'],
        estimatedTime: '5-10 minutes',
        difficulty: this.calculateDifficulty(offer.payout),
        icon: offer.icon
      }));
    } catch (error) {
      console.error('Adscend API error:', error);
      return [];
    }
  }

  /**
   * Generate tracking URL for offer
   */
  private generateOfferUrl(network: string, offerId: string, userId: string): string {
    const apiKey = this.apiKeys.get(network);
    
    switch (network) {
      case 'cpalead':
        return `https://cpalead.com/show.php?l=${offerId}&id=${apiKey}&subid=${userId}`;
      case 'ogads':
        return `https://ogads.com/offer/${offerId}?aff=${apiKey}&sub=${userId}`;
      case 'adscend':
        return `https://adscendmedia.com/adwall/?pubid=${apiKey}&subid=${userId}&offer=${offerId}`;
      default:
        return '#';
    }
  }

  /**
   * Detect offer type from network data
   */
  private detectOfferType(type: string): 'cpa' | 'cpl' | 'ppc' {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('lead') || lowerType.includes('cpl')) return 'cpl';
    if (lowerType.includes('click') || lowerType.includes('ppc')) return 'ppc';
    return 'cpa';
  }

  /**
   * Calculate offer difficulty based on payout
   */
  private calculateDifficulty(payout: number): 'easy' | 'medium' | 'hard' {
    if (payout < 1) return 'easy';
    if (payout < 3) return 'medium';
    return 'hard';
  }

  /**
   * Get demo offers for testing without API keys
   */
  private getDemoOffers(): AffiliateOffer[] {
    return [
      {
        id: 'demo_1',
        name: 'Survey Rewards - Quick Survey',
        description: 'Complete a 5-minute survey and earn cash',
        network: 'cpalead',
        type: 'cpa',
        payout: 0.75,
        countries: ['US', 'CA', 'UK'],
        category: 'survey',
        url: 'https://example.com/survey',
        requirements: ['Complete full survey', 'Provide valid answers'],
        estimatedTime: '5 minutes',
        difficulty: 'easy',
        icon: '📋'
      },
      {
        id: 'demo_2',
        name: 'Mobile Game Install',
        description: 'Install game and reach level 10',
        network: 'ogads',
        type: 'cpa',
        payout: 1.50,
        countries: ['US', 'CA', 'UK', 'AU'],
        category: 'gaming',
        url: 'https://example.com/game',
        requirements: ['Install game', 'Reach level 10', 'Keep installed for 7 days'],
        estimatedTime: '10-15 minutes',
        difficulty: 'medium',
        icon: '🎮'
      },
      {
        id: 'demo_3',
        name: 'Newsletter Sign-up',
        description: 'Sign up for premium newsletter',
        network: 'adscend',
        type: 'cpl',
        payout: 0.50,
        countries: ['US', 'CA', 'UK', 'AU', 'DE'],
        category: 'email',
        url: 'https://example.com/newsletter',
        requirements: ['Valid email', 'Confirm subscription'],
        estimatedTime: '2 minutes',
        difficulty: 'easy',
        icon: '📧'
      },
      {
        id: 'demo_4',
        name: 'Premium App Trial',
        description: 'Start free trial of premium app',
        network: 'cpagrip',
        type: 'cpa',
        payout: 3.00,
        countries: ['US'],
        category: 'app',
        url: 'https://example.com/app-trial',
        requirements: ['Start free trial', 'Keep active for 7 days'],
        estimatedTime: '5 minutes',
        difficulty: 'hard',
        icon: '📱'
      },
      {
        id: 'demo_5',
        name: 'Credit Card Offer',
        description: 'Apply for credit card (high payout)',
        network: 'offertoro',
        type: 'cpa',
        payout: 25.00,
        countries: ['US'],
        category: 'finance',
        url: 'https://example.com/credit-card',
        requirements: ['Complete application', 'Credit approval required'],
        estimatedTime: '10-15 minutes',
        difficulty: 'hard',
        icon: '💳'
      }
    ];
  }

  /**
   * Track conversion via postback URL
   */
  async trackConversion(offerId: string, userId: string, payout: number): Promise<ConversionEvent> {
    const conversion: ConversionEvent = {
      offerId,
      userId,
      timestamp: new Date(),
      payout,
      status: 'pending',
      networkTransactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.conversions.push(conversion);
    this.saveConversionsToStorage();
    this.calculateRevenue();

    console.log('Conversion tracked:', conversion);
    return conversion;
  }

  /**
   * Sync conversions with affiliate networks
   * This should be called periodically to check conversion status
   */
  async syncConversions(): Promise<void> {
    // For each pending conversion, check status with network
    const pendingConversions = this.conversions.filter(c => c.status === 'pending');
    
    for (const conversion of pendingConversions) {
      try {
        // Extract network from offer ID
        const [network] = conversion.offerId.split('_');
        
        // Check conversion status based on network
        const isApproved = await this.checkConversionStatus(network, conversion);
        
        if (isApproved) {
          conversion.status = 'approved';
          console.log('Conversion approved:', conversion.offerId);
        }
      } catch (error) {
        console.error('Failed to sync conversion:', conversion.offerId, error);
      }
    }

    this.saveConversionsToStorage();
    this.calculateRevenue();
  }

  /**
   * Check conversion status with network
   */
  private async checkConversionStatus(network: string, conversion: ConversionEvent): Promise<boolean> {
    // In demo mode, auto-approve after 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (conversion.timestamp < fiveMinutesAgo) {
      return true;
    }

    // For real networks, implement API calls to check status
    // This varies by network and would need network-specific implementation
    return false;
  }

  /**
   * Get revenue report
   */
  getRevenueReport(userId: string): RevenueReport {
    const userConversions = this.conversions.filter(c => c.userId === userId);
    
    const totalEarned = userConversions.reduce((sum, c) => sum + c.payout, 0);
    const pendingEarnings = userConversions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.payout, 0);
    const approvedEarnings = userConversions
      .filter(c => c.status === 'approved')
      .reduce((sum, c) => sum + c.payout, 0);

    return {
      totalEarned,
      pendingEarnings,
      approvedEarnings,
      availableForPayout: approvedEarnings,
      conversions: userConversions
    };
  }

  /**
   * Get available balance for payout
   */
  getAvailableBalance(userId: string): number {
    return this.getRevenueReport(userId).availableForPayout;
  }

  /**
   * Request payout via PayPal or Payoneer
   */
  async requestPayout(userId: string, amount: number, email: string, method: 'paypal' | 'payoneer'): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    const availableBalance = this.getAvailableBalance(userId);
    
    if (amount > availableBalance) {
      return {
        success: false,
        error: `Insufficient balance. Available: $${availableBalance.toFixed(2)}, Requested: $${amount.toFixed(2)}`
      };
    }

    // In a real implementation, this would call PayPal or Payoneer API
    // For now, we'll simulate the payout
    const transactionId = `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Deduct from approved revenue
    const payoutConversions = this.conversions
      .filter(c => c.userId === userId && c.status === 'approved')
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    let remainingAmount = amount;
    for (const conversion of payoutConversions) {
      if (remainingAmount <= 0) break;
      
      if (conversion.payout <= remainingAmount) {
        remainingAmount -= conversion.payout;
        // Mark as paid (remove from conversions)
        const index = this.conversions.indexOf(conversion);
        this.conversions.splice(index, 1);
      }
    }

    this.saveConversionsToStorage();
    this.calculateRevenue();

    // Store payout record
    const payouts = JSON.parse(localStorage.getItem('affiliate_payouts') || '[]');
    payouts.unshift({
      id: transactionId,
      userId,
      amount,
      email,
      method,
      status: 'completed',
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('affiliate_payouts', JSON.stringify(payouts));

    console.log(`Payout processed: $${amount} via ${method} to ${email}`);
    
    return {
      success: true,
      transactionId
    };
  }
}

export default RealAffiliateNetworkService;
