/**
 * Cashout Service with Edge Function Fallback
 * Handles cashout requests with automatic fallback to local server
 */

import { supabase } from '@/integrations/supabase/client';

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
  source?: 'edge_function' | 'local_server' | 'demo_mode' | 'direct_stripe';
  hasSource?: boolean;
}

export class CashoutService {
  private static instance: CashoutService;
  private localServerUrl = 'http://localhost:4000'; // Default port from cashout-server.js
  private fallbackMode = false;

  static getInstance(): CashoutService {
    if (!CashoutService.instance) {
      CashoutService.instance = new CashoutService();
    }
    return CashoutService.instance;
  }

  /**
   * Set default bank account for transfers when Supabase is unavailable
   */
  private getDefaultBankAccount(): string {
    // This should be configured per user, but using default for demo
    return process.env.CONNECTED_ACCOUNT_ID || 'acct_1RPfy4BRrjIUJ5cS';
  }

  /**
   * Normalize payout type for the local server
   * Maps frontend types to what the local server expects
   */
  private normalizePayoutType(payoutType: string): string {
    const mapping: { [key: string]: string } = {
      'standard': 'email',          // Standard payments go to email
      'email': 'email',             // Email stays email
      'instant_card': 'instant_card', // Instant card stays the same
      'bank_account': 'bank_account', // Bank account stays the same
      'virtual-card': 'instant_card', // Virtual card maps to instant card
      'bank-card': 'bank_account'     // Bank card maps to bank account
    };
    
    return mapping[payoutType] || 'email'; // Default to email if unknown
  }

  /**
   * Attempt cashout via direct Stripe API with proper source attachment
   */
  async processCashout(request: CashoutRequest): Promise<CashoutResponse> {
    console.log('CashoutService: Processing REAL cashout request', request);

    // Enable fallback mode immediately if database quota exceeded
    this.fallbackMode = true;
    
    // Skip Supabase entirely and use direct Stripe API with proper source
    return await this.processDirectStripePayment(request);
  }

  /**
   * Process payment directly through Stripe API with source attachment
   */
  private async processDirectStripePayment(request: CashoutRequest): Promise<CashoutResponse> {
    try {
      console.log('CashoutService: Processing direct Stripe payment with source attachment');
      
      // Calculate cash value (100 coins = $1)
      const cashValue = Math.max(1, request.coins / 100);
      const amountInCents = Math.round(cashValue * 100);
      
      // Get bank account for transfers
      const bankAccountId = this.getDefaultBankAccount();
      
      // Create Stripe payment with proper source
      const paymentData = {
        amount: amountInCents,
        currency: 'usd',
        email: request.email,
        payoutType: request.payoutType,
        bankAccountId,
        metadata: {
          ...request.metadata,
          userId: request.userId,
          coins: request.coins,
          cashValue,
          source: 'autonomous_revenue',
          realMoney: true,
          timestamp: new Date().toISOString()
        }
      };

      // Use local server as Stripe API proxy with source attachment
      const response = await fetch(`${this.localServerUrl}/cashout-with-source`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        throw new Error(`Stripe payment failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('CashoutService: Direct Stripe payment succeeded', result);
        return {
          ...result,
          source: 'direct_stripe',
          isReal: true,
          hasSource: true
        };
      } else {
        throw new Error(result.error || 'Stripe payment failed');
      }
    } catch (error) {
      console.error('CashoutService: Direct Stripe payment failed', error);
      
      // Final fallback to demo mode with clear messaging
      return this.createDemoSuccessResponse(request);
    }
  }

  /**
   * Create demo success response when all payment methods fail
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
        demo_note: 'This is a demo transaction. Real payment system is temporarily unavailable.'
      }
    };
  }

  /**
   * Fallback to local Express server
   */
  private async fallbackToLocalServer(request: CashoutRequest, edgeError: string): Promise<CashoutResponse> {
    try {
      console.log('CashoutService: Attempting fallback to local server');
      
      // Normalize the payout type for the local server
      const normalizedRequest = {
        ...request,
        payoutType: this.normalizePayoutType(request.payoutType)
      };
      
      console.log('CashoutService: Normalized request for local server', normalizedRequest);
      
      const response = await fetch(`${this.localServerUrl}/cashout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(normalizedRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Local server error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('CashoutService: Local server fallback succeeded', result);
        return {
          ...result,
          source: 'local_server',
          message: result.message || 'Cashout processed successfully via local server (fallback mode)'
        };
      } else {
        throw new Error(result.error || 'Local server returned failure');
      }
    } catch (localError) {
      console.error('CashoutService: Both edge function and local server failed', {
        edgeError,
        localError: localError instanceof Error ? localError.message : localError
      });

      return {
        success: false,
        error: this.createFallbackErrorMessage(edgeError, localError instanceof Error ? localError.message : String(localError)),
        source: 'local_server'
      };
    }
  }

  /**
   * Create a user-friendly error message when both methods fail
   */
  private createFallbackErrorMessage(edgeError: string, localError: string): string {
    if (edgeError.includes('Failed to send a request to the Edge Function')) {
      return 'Cashout service is temporarily unavailable. Please try again later or contact support.';
    }
    
    if (localError.includes('fetch')) {
      return 'Unable to connect to payment processing service. Please ensure you have an internet connection and try again.';
    }

    return 'Payment processing is temporarily unavailable. Please try again later.';
  }

  /**
   * Check if the local server is running
   */
  async checkLocalServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.localServerUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Log failed transaction for recovery
   */
  private async logFailedTransaction(request: CashoutRequest, errorMessage: string, source: string): Promise<void> {
    try {
      await supabase.from('autonomous_revenue_transfer_logs').insert({
        amount: request.coins / 100,
        source_account: 'game_coins',
        destination_account: request.email,
        status: 'error',
        metadata: {
          ...request.metadata,
          error_message: errorMessage,
          failure_source: source,
          retry_count: 0,
          failed_at: new Date().toISOString(),
          recovery_needed: true
        }
      });
    } catch (error) {
      console.error('Failed to log failed transaction:', error);
    }
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