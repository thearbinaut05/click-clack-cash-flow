import { LovableCloudService } from "@/services/LovableCloudService";

export interface ExternalAccountBalance {
  accountId: string;
  accountType: 'lovable_cloud' | 'bank' | 'crypto' | 'paypal';
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
  private lovableCloud: LovableCloudService;

  constructor() {
    this.lovableCloud = LovableCloudService.getInstance();
  }
  private static instance: ExternalAccountsService;

  static getInstance(): ExternalAccountsService {
    if (!ExternalAccountsService.instance) {
      ExternalAccountsService.instance = new ExternalAccountsService();
    }
    return ExternalAccountsService.instance;
  }

  async getLovableCloudBalance(userId: string): Promise<ExternalAccountBalance | null> {
    try {
      const balance = await this.lovableCloud.getRevenueBalance(userId);
      const isHealthy = await this.lovableCloud.healthCheck();

      return {
        accountId: 'lovable_cloud_main',
        accountType: 'lovable_cloud',
        balance: balance,
        currency: 'USD',
        status: isHealthy ? 'active' : 'error',
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting Lovable Cloud balance:', error);
      return null;
    }
  }

  async getBankAccountBalances(): Promise<ExternalAccountBalance[]> {
    try {
      // Simulate bank account data since we're moving away from Supabase
      // In a real implementation, this would integrate with bank APIs
      return [
        {
          accountId: 'bank_account_demo',
          accountType: 'bank',
          balance: 150.75, // Mock balance
          currency: 'USD',
          status: 'active',
          lastUpdated: new Date().toISOString(),
        }
      ];
    } catch (error) {
      console.error('Error getting bank account balances:', error);
      return [];
    }
  }

  async getAllExternalBalances(userId: string = 'demo_user'): Promise<ExternalAccountBalance[]> {
    const balances: ExternalAccountBalance[] = [];

    // Get Lovable Cloud balance
    const lovableCloudBalance = await this.getLovableCloudBalance(userId);
    if (lovableCloudBalance) {
      balances.push(lovableCloudBalance);
    }

    // Get bank balances
    const bankBalances = await this.getBankAccountBalances();
    balances.push(...bankBalances);

    return balances;
  }

  async transferFromLovableCloud(userId: string, amount: number, email: string): Promise<{ success: boolean; transferId?: string; error?: string }> {
    try {
      const result = await this.lovableCloud.processCashout(userId, amount, email);
      
      return {
        success: result.success,
        transferId: result.transaction_id,
        error: result.error,
      };
    } catch (error) {
      console.error('Lovable Cloud transfer error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async transferToBankAccount(amount: number, bankAccountId: string): Promise<{ success: boolean; transferId?: string; error?: string }> {
    try {
      // Simulate bank transfer for demo purposes
      // In real implementation, this would integrate with bank APIs
      console.log(`Simulating bank transfer: $${amount} to account ${bankAccountId}`);
      
      return {
        success: true,
        transferId: `bank_transfer_${Date.now()}`,
      };
    } catch (error) {
      console.error('Bank transfer error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getTransferHistory(userId: string = 'demo_user', limit: number = 20) {
    try {
      // Get transfer history from Lovable Cloud
      const transactions = await this.lovableCloud.getRevenueTransactions(userId, limit);
      
      return {
        lovableCloudTransfers: transactions,
        bankTransfers: [], // Would be populated from real bank API integration
      };
    } catch (error) {
      console.error('Error getting transfer history:', error);
      return {
        lovableCloudTransfers: [],
        bankTransfers: [],
      };
    }
  }

  async consolidateAllFunds(userId: string = 'demo_user', email: string = 'demo@example.com'): Promise<{ success: boolean; totalAmount?: number; error?: string }> {
    try {
      // Get all external balances
      const balances = await this.getAllExternalBalances(userId);
      
      let totalConsolidated = 0;
      const consolidationResults = [];

      for (const balance of balances) {
        if (balance.balance > 0) {
          if (balance.accountType === 'lovable_cloud') {
            const result = await this.transferFromLovableCloud(userId, balance.balance, email);
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