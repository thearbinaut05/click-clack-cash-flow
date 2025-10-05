/**
 * Real Cashout Service - Handles actual USD transactions via Stripe
 * NO MOCKS - REAL MONEY ONLY
 */

import { supabase } from '@/integrations/supabase/client';

interface RealCashoutRequest {
  userId: string;
  amountUSD: number;
  coins: number;
  payoutType: 'standard' | 'virtual-card' | 'bank-card';
  email: string;
  metadata?: Record<string, any>;
}

interface RealCashoutResponse {
  success: boolean;
  transactionId?: string;
  stripeTransferId?: string;
  error?: string;
  message?: string;
}

export class RealCashoutService {
  private static instance: RealCashoutService;

  static getInstance(): RealCashoutService {
    if (!RealCashoutService.instance) {
      RealCashoutService.instance = new RealCashoutService();
    }
    return RealCashoutService.instance;
  }

  /**
   * Process real cashout via Stripe
   */
  async processCashout(request: RealCashoutRequest): Promise<RealCashoutResponse> {
    try {
      console.log('🚀 PROCESSING REAL CASHOUT:', request);

      // Call real Supabase edge function for cashout
      const { data, error } = await supabase.functions.invoke('cashout', {
        body: {
          userId: request.userId,
          coins: request.coins,
          payoutType: request.payoutType,
          email: request.email,
          metadata: request.metadata
        }
      });

      if (error) {
        console.error('❌ Cashout error:', error);
        return {
          success: false,
          error: error.message || 'Cashout failed'
        };
      }

      console.log('✅ REAL CASHOUT SUCCESS:', data);

      return {
        success: true,
        transactionId: data.transaction_id,
        stripeTransferId: data.stripe_transfer_id || data.stripe_payment_intent_id,
        message: `Successfully cashed out $${request.amountUSD.toFixed(2)}`
      };
    } catch (error) {
      console.error('❌ Real cashout service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get user's cashout balance from user_earnings table
   */
  async getUserBalance(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_cashout_balance', { p_user_id: userId });

      if (error) {
        console.error('Error fetching user balance:', error);
        return 0;
      }

      return Number(data) || 0;
    } catch (error) {
      console.error('Error in getUserBalance:', error);
      return 0;
    }
  }

  /**
   * Get cashout transaction history
   */
  async getCashoutHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('real_cashout_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching cashout history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCashoutHistory:', error);
      return [];
    }
  }

  /**
   * Record ad earnings to user_earnings table
   */
  async recordAdEarnings(
    userId: string,
    earningType: 'ad_click' | 'ad_impression' | 'offerwall' | 'game_activity',
    amountUSD: number,
    adNetwork?: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_earnings')
        .insert({
          user_id: userId,
          earning_type: earningType,
          amount_usd: amountUSD,
          ad_network: adNetwork,
          metadata: metadata || {}
        });

      if (error) {
        console.error('Error recording earnings:', error);
        return false;
      }

      console.log(`✅ Recorded $${amountUSD} earnings for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error in recordAdEarnings:', error);
      return false;
    }
  }
}

export default RealCashoutService;
