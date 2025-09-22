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
  source?: 'edge_function' | 'local_server';
}

export class CashoutService {
  private static instance: CashoutService;
  private localServerUrl = 'http://localhost:4000'; // Default port from cashout-server.js

  static getInstance(): CashoutService {
    if (!CashoutService.instance) {
      CashoutService.instance = new CashoutService();
    }
    return CashoutService.instance;
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
   * Attempt cashout via Supabase Edge Function with fallback to local server
   */
  async processCashout(request: CashoutRequest): Promise<CashoutResponse> {
    console.log('CashoutService: Processing cashout request', request);

    // First, try the Supabase edge function
    try {
      const { data: result, error } = await supabase.functions.invoke('cashout', {
        body: request
      });

      if (error) {
        console.warn('CashoutService: Edge function failed, attempting fallback', error);
        return await this.fallbackToLocalServer(request, error.message);
      }

      if (result?.success) {
        console.log('CashoutService: Edge function succeeded', result);
        return {
          ...result,
          source: 'edge_function'
        };
      } else {
        console.warn('CashoutService: Edge function returned failure, attempting fallback', result);
        return await this.fallbackToLocalServer(request, result?.error || 'Edge function returned failure');
      }
    } catch (error) {
      console.warn('CashoutService: Edge function threw error, attempting fallback', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown edge function error';
      return await this.fallbackToLocalServer(request, errorMessage);
    }
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
   * Test the cashout service with a small test request
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
        testRun: true
      }
    });
  }
}

export default CashoutService;