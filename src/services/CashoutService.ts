/**
 * Cashout Service with Real Affiliate Network Integration
 * Handles cashout requests using real affiliate earnings via PayPal/Payoneer
 */

import { LovableCloudService } from './LovableCloudService';
import RealAffiliateNetworkService from './RealAffiliateNetworkService';

interface CashoutRequest {
  userId: string;
  coins: number;
  payoutType: string;
  email: string;
  metadata?: Record<string, unknown>;
}

interface CashoutResponse {
  success: boolean;
  error?: string;
  details?: Record<string, unknown>;
  message?: string;
  isReal?: boolean;
  autonomous_revenue_balance?: number;
  source?: 'affiliate_network' | 'lovable_cloud' | 'demo_mode' | 'fallback';
  transaction_id?: string;
}

export class CashoutService {
  private static instance: CashoutService;
  private lovableCloud: LovableCloudService;
  private affiliateNetwork: RealAffiliateNetworkService;

  constructor() {
    this.lovableCloud = LovableCloudService.getInstance();
    this.affiliateNetwork = RealAffiliateNetworkService.getInstance();
  }

  static getInstance(): CashoutService {
    if (!CashoutService.instance) {
      CashoutService.instance = new CashoutService();
    }
    return CashoutService.instance;
  }

  /**
   * Process cashout using real affiliate network earnings
   * Pays out via PayPal or Payoneer from actual CPA/CPL/PPC revenue
   */
  async processCashout(request: CashoutRequest): Promise<CashoutResponse> {
    console.log('CashoutService: Processing real affiliate network cashout', request);

    try {
      const cashValue = Math.max(1, request.coins / 100);
      
      // Get available balance from affiliate network
      const affiliateBalance = this.affiliateNetwork.getAvailableBalance(request.userId);
      
      console.log(`Affiliate balance: $${affiliateBalance.toFixed(2)}, Requested: $${cashValue.toFixed(2)}`);
      
      // Check if user has sufficient approved earnings
      if (affiliateBalance < cashValue) {
        // Fallback to demo mode if insufficient real earnings
        console.log('Insufficient affiliate earnings, using demo mode');
        return this.processDemoCashout(request, cashValue);
      }

      // Determine payout method
      const payoutMethod = this.determinePayoutMethod(request.payoutType);
      
      // Process real payout through affiliate network
      const result = await this.affiliateNetwork.requestPayout(
        request.userId,
        cashValue,
        request.email,
        payoutMethod
      );

      if (result.success) {
        return {
          success: true,
          source: 'affiliate_network',
          isReal: true,
          transaction_id: result.transactionId,
          autonomous_revenue_balance: affiliateBalance - cashValue,
          message: `Successfully processed REAL $${cashValue.toFixed(2)} cashout via ${payoutMethod.toUpperCase()} to ${request.email}`,
          details: {
            id: result.transactionId,
            amount: Math.round(cashValue * 100),
            currency: 'usd',
            status: 'completed',
            payment_method: payoutMethod,
            real_payment: true,
            network_source: 'affiliate_cpa_cpl_ppc'
          }
        };
      }

      throw new Error(result.error || 'Cashout failed');
    } catch (error) {
      console.error('CashoutService: Cashout failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cashout processing failed',
        source: 'affiliate_network'
      };
    }
  }

  /**
   * Determine payout method from request
   */
  private determinePayoutMethod(payoutType: string): 'paypal' | 'payoneer' {
    // Default to PayPal for most payment types
    if (payoutType.toLowerCase().includes('payoneer')) {
      return 'payoneer';
    }
    return 'paypal';
  }

  /**
   * Process demo cashout when insufficient real earnings
   */
  private async processDemoCashout(request: CashoutRequest, cashValue: number): Promise<CashoutResponse> {
    const revenueBalance = await this.lovableCloud.getRevenueBalance(request.userId);
    
    if (revenueBalance < cashValue) {
      return {
        success: false,
        error: `Insufficient balance. Available: $${revenueBalance.toFixed(2)}, Requested: $${cashValue.toFixed(2)}`,
        source: 'demo_mode'
      };
    }

    const result = await this.lovableCloud.processCashout(
      request.userId,
      cashValue,
      request.email
    );

    if (result.success) {
      return {
        success: true,
        source: 'demo_mode',
        isReal: false,
        transaction_id: result.transaction_id,
        autonomous_revenue_balance: Math.max(0, revenueBalance - cashValue),
        message: `DEMO: Processed $${cashValue.toFixed(2)} cashout to ${request.email}. Complete offers to earn real money!`,
        details: {
          id: result.transaction_id,
          amount: Math.round(cashValue * 100),
          currency: 'usd',
          status: 'completed',
          payment_method: request.payoutType,
          demo_mode: true
        }
      };
    }

    throw new Error(result.error || 'Demo cashout failed');
  }

  /**
   * Create demo success response when Lovable Cloud is unavailable
   */
  private createDemoSuccessResponse(request: CashoutRequest): CashoutResponse {
    const cashValue = Math.max(1, request.coins / 100);
    
    return {
      success: true,
      source: 'demo_mode',
      isReal: false,
      message: `DEMO: $${cashValue.toFixed(2)} cashout to ${request.email} (${request.payoutType})`,
      details: {
        id: `demo_${Date.now()}`,
        amount: Math.round(cashValue * 100),
        currency: 'usd',
        status: 'demo_success',
        demo_note: 'This is a demo transaction. Lovable Cloud service is temporarily unavailable.'
      }
    };
  }

  /**
   * Get revenue balance for user (combines affiliate + demo balance)
   */
  async getRevenueBalance(userId: string): Promise<number> {
    try {
      const affiliateBalance = this.affiliateNetwork.getAvailableBalance(userId);
      const demoBalance = await this.lovableCloud.getRevenueBalance(userId);
      return affiliateBalance + demoBalance;
    } catch (error) {
      console.error('Failed to get revenue balance:', error);
      return 0;
    }
  }

  /**
   * Get real affiliate balance only
   */
  getAffiliateBalance(userId: string): number {
    return this.affiliateNetwork.getAvailableBalance(userId);
  }

  /**
   * Get revenue report from affiliate network
   */
  getAffiliateReport(userId: string) {
    return this.affiliateNetwork.getRevenueReport(userId);
  }

  /**
   * Get revenue transactions for user
   */
  async getRevenueTransactions(userId: string, limit: number = 50) {
    try {
      return await this.lovableCloud.getRevenueTransactions(userId, limit);
    } catch (error) {
      console.error('Failed to get revenue transactions:', error);
      return [];
    }
  }

  /**
   * Check Lovable Cloud service health
   */
  async checkServiceHealth(): Promise<boolean> {
    return await this.lovableCloud.healthCheck();
  }

  /**
   * Test the cashout service with a small test request (REAL MONEY)
   */
  async testCashout(email: string = 'test@example.com', coins: number = 100): Promise<CashoutResponse> {
    return this.processCashout({
      userId: `test_${Date.now()}`,
      coins: Math.max(100, coins),
      payoutType: 'standard',
      email,
      metadata: {
        gameSession: Date.now(),
        coinCount: coins,
        testRun: true,
        realMoney: true // This is a real money test
      }
    });
  }

  /**
   * Force recovery of all failed transactions
   */
  async recoverFailedTransactions(): Promise<any> {
    try {
      const { FailedTransactionRecovery } = await import('./FailedTransactionRecovery');
      const recovery = FailedTransactionRecovery.getInstance();
      return await recovery.recoverAllFailedTransactions();
    } catch (error) {
      console.error('Error during transaction recovery:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Recovery failed',
        recoveredAmount: 0,
        failedAmount: 0
      };
    }
  }
}

export default CashoutService;