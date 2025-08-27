import { supabase } from "@/integrations/supabase/client";

export interface ExternalAccountBalance {
  accountId: string;
  accountType: 'stripe' | 'bank' | 'crypto' | 'paypal';
  balance: number;
  currency: string;
  status: 'active' | 'pending' | 'error';
  lastUpdated: string;
}

export interface TransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  description?: string;
}

export class ExternalAccountsService {
  private static instance: ExternalAccountsService;

  static getInstance(): ExternalAccountsService {
    if (!ExternalAccountsService.instance) {
      ExternalAccountsService.instance = new ExternalAccountsService();
    }
    return ExternalAccountsService.instance;
  }

  async getStripeBalance(): Promise<ExternalAccountBalance | null> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-payment-processor', {
        body: { action: 'get_balance' }
      });

      if (error) throw error;

      if (data?.available?.[0]) {
        return {
          accountId: 'stripe_main',
          accountType: 'stripe',
          balance: data.available[0].amount / 100, // Convert from cents
          currency: data.available[0].currency.toUpperCase(),
          status: 'active',
          lastUpdated: new Date().toISOString(),
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting Stripe balance:', error);
      return null;
    }
  }

  async getBankAccountBalances(): Promise<ExternalAccountBalance[]> {
    try {
      // Get bank transfer history to identify connected accounts
      const { data: transfers } = await supabase
        .from('bank_transfers')
        .select('bank_account_id, amount, status, created_at')
        .order('created_at', { ascending: false });

      if (!transfers) return [];

      // Group by bank account and get latest status
      const accountMap = new Map<string, ExternalAccountBalance>();
      
      transfers.forEach(transfer => {
        if (!accountMap.has(transfer.bank_account_id)) {
          accountMap.set(transfer.bank_account_id, {
            accountId: transfer.bank_account_id,
            accountType: 'bank',
            balance: 0, // Real implementation would fetch from bank API
            currency: 'USD',
            status: transfer.status === 'completed' ? 'active' : 'pending',
            lastUpdated: transfer.created_at,
          });
        }
      });

      return Array.from(accountMap.values());
    } catch (error) {
      console.error('Error getting bank balances:', error);
      return [];
    }
  }

  async getAllExternalBalances(): Promise<ExternalAccountBalance[]> {
    const balances: ExternalAccountBalance[] = [];

    // Get Stripe balance
    const stripeBalance = await this.getStripeBalance();
    if (stripeBalance) {
      balances.push(stripeBalance);
    }

    // Get bank balances
    const bankBalances = await this.getBankAccountBalances();
    balances.push(...bankBalances);

    return balances;
  }

  async transferFromStripe(amount: number, destinationAccount?: string): Promise<{ success: boolean; transferId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-payment-processor', {
        body: {
          action: 'create_transfer',
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          destination: destinationAccount || 'acct_1RPfy4BRrjIUJ5cS', // Default connected account
          metadata: {
            transfer_type: 'external_withdrawal',
            initiated_by: 'user',
            timestamp: new Date().toISOString(),
          }
        }
      });

      if (error) throw error;

      return {
        success: true,
        transferId: data.id,
      };
    } catch (error) {
      console.error('Stripe transfer error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async transferToBankAccount(amount: number, bankAccountId: string): Promise<{ success: boolean; transferId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('initiate_bank_transfer', {
        p_amount: amount,
        p_bank_account_id: bankAccountId,
        p_transfer_type: 'withdrawal'
      });

      if (error) throw error;

      return {
        success: true,
        transferId: data ? String(data) : undefined,
      };
    } catch (error) {
      console.error('Bank transfer error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getTransferHistory(limit: number = 20) {
    try {
      const { data: transfers } = await supabase
        .from('autonomous_revenue_transfers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data: bankTransfers } = await supabase
        .from('bank_transfers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      return {
        stripeTransfers: transfers || [],
        bankTransfers: bankTransfers || [],
      };
    } catch (error) {
      console.error('Error getting transfer history:', error);
      return {
        stripeTransfers: [],
        bankTransfers: [],
      };
    }
  }

  async consolidateAllFunds(): Promise<{ success: boolean; totalAmount?: number; error?: string }> {
    try {
      // Get all external balances
      const balances = await this.getAllExternalBalances();
      
      let totalConsolidated = 0;
      const consolidationResults = [];

      for (const balance of balances) {
        if (balance.balance > 0) {
          if (balance.accountType === 'stripe') {
            const result = await this.transferFromStripe(balance.balance);
            if (result.success) {
              totalConsolidated += balance.balance;
              consolidationResults.push({
                account: balance.accountId,
                amount: balance.balance,
                status: 'success',
              });
            }
          } else if (balance.accountType === 'bank') {
            const result = await this.transferToBankAccount(balance.balance, balance.accountId);
            if (result.success) {
              totalConsolidated += balance.balance;
              consolidationResults.push({
                account: balance.accountId,
                amount: balance.balance,
                status: 'success',
              });
            }
          }
        }
      }

      return {
        success: true,
        totalAmount: totalConsolidated,
      };
    } catch (error) {
      console.error('Consolidation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}