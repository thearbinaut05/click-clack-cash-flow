/**
 * Cashout Service with Lovable Cloud Integration
 * Handles cashout requests using Lovable Cloud backend instead of Supabase
 */

import { LovableCloudService } from './LovableCloudService';

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
  source?: 'lovable_cloud' | 'demo_mode' | 'fallback';
  transaction_id?: string;
}

export class CashoutService {
  private static instance: CashoutService;
  private lovableCloud: LovableCloudService;

  constructor() {
    this.lovableCloud = LovableCloudService.getInstance();
  }

  static getInstance(): CashoutService {
    if (!CashoutService.instance) {
      CashoutService.instance = new CashoutService();
    }
    return CashoutService.instance;
  }

  /**
   * Process cashout using local-only system
   * No external services required
   */
  async processCashout(request: CashoutRequest): Promise<CashoutResponse> {
    console.log('CashoutService: Processing cashout locally', request);

    try {
      const cashValue = Math.max(1, request.coins / 100);
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
          message: `Successfully processed $${cashValue.toFixed(2)} cashout to ${request.email}`,
          details: {
            id: result.transaction_id,
            amount: Math.round(cashValue * 100),
            currency: 'usd',
            status: 'completed',
            payment_method: request.payoutType
          }
        };
      }

      throw new Error(result.error || 'Cashout failed');
    } catch (error) {
      console.error('CashoutService: Cashout failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cashout processing failed',
        source: 'demo_mode'
      };
    }
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
   * Get revenue balance for user
   */
  async getRevenueBalance(userId: string): Promise<number> {
    try {
      return await this.lovableCloud.getRevenueBalance(userId);
    } catch (error) {
      console.error('Failed to get revenue balance:', error);
      return 0;
    }
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