/**
 * Failed Transaction Recovery Service
 * Handles recovery and retry of failed payment transactions
 */

import { supabase } from '@/integrations/supabase/client';

interface FailedTransaction {
  id: string;
  amount: number;
  status: string;
  error_message?: string;
  retry_count: number;
  metadata: any;
  created_at: string;
}

interface RecoveryResult {
  success: boolean;
  recoveredAmount: number;
  failedAmount: number;
  recoveredTransactions: string[];
  failedTransactions: string[];
  message: string;
}

export class FailedTransactionRecovery {
  private static instance: FailedTransactionRecovery;

  static getInstance(): FailedTransactionRecovery {
    if (!FailedTransactionRecovery.instance) {
      FailedTransactionRecovery.instance = new FailedTransactionRecovery();
    }
    return FailedTransactionRecovery.instance;
  }

  /**
   * Scan for and recover all failed transactions
   */
  async recoverAllFailedTransactions(): Promise<RecoveryResult> {
    console.log('Starting comprehensive failed transaction recovery...');

    try {
      // Get all failed transactions
      const failedTransactions = await this.getFailedTransactions();
      
      if (failedTransactions.length === 0) {
        return {
          success: true,
          recoveredAmount: 0,
          failedAmount: 0,
          recoveredTransactions: [],
          failedTransactions: [],
          message: 'No failed transactions found'
        };
      }

      console.log(`Found ${failedTransactions.length} failed transactions to recover`);

      let recoveredAmount = 0;
      let failedAmount = 0;
      const recoveredTransactions: string[] = [];
      const stillFailedTransactions: string[] = [];

      // Process each failed transaction
      for (const transaction of failedTransactions) {
        try {
          const recovered = await this.recoverSingleTransaction(transaction);
          
          if (recovered) {
            recoveredAmount += transaction.amount;
            recoveredTransactions.push(transaction.id);
            console.log(`Successfully recovered transaction ${transaction.id}: $${transaction.amount}`);
          } else {
            failedAmount += transaction.amount;
            stillFailedTransactions.push(transaction.id);
            console.log(`Failed to recover transaction ${transaction.id}: $${transaction.amount}`);
          }
        } catch (error) {
          console.error(`Error recovering transaction ${transaction.id}:`, error);
          failedAmount += transaction.amount;
          stillFailedTransactions.push(transaction.id);
        }
      }

      // Create recovery audit log
      await this.logRecoveryAudit({
        recoveredAmount,
        failedAmount,
        recoveredCount: recoveredTransactions.length,
        failedCount: stillFailedTransactions.length,
        details: {
          recoveredTransactions,
          failedTransactions: stillFailedTransactions
        }
      });

      return {
        success: recoveredTransactions.length > 0,
        recoveredAmount,
        failedAmount,
        recoveredTransactions,
        failedTransactions: stillFailedTransactions,
        message: `Recovery complete: $${recoveredAmount.toFixed(2)} recovered, $${failedAmount.toFixed(2)} still failed`
      };

    } catch (error) {
      console.error('Failed transaction recovery error:', error);
      throw new Error(`Recovery process failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all failed transactions from various sources
   */
  private async getFailedTransactions(): Promise<FailedTransaction[]> {
    const failedTransactions: FailedTransaction[] = [];

    try {
      // Get failed transfers
      const { data: failedTransfers } = await supabase
        .from('autonomous_revenue_transfers')
        .select('*')
        .eq('status', 'failed')
        .order('created_at', { ascending: false });

      if (failedTransfers) {
        failedTransactions.push(...failedTransfers.map(t => ({
          id: t.id,
          amount: t.amount,
          status: t.status,
          error_message: t.error_message,
          retry_count: t.retry_count || 0,
          metadata: t.metadata,
          created_at: t.created_at
        })));
      }

      // Get failed transactions
      const { data: failedTxns } = await supabase
        .from('autonomous_revenue_transactions')
        .select('*')
        .eq('status', 'failed')
        .order('created_at', { ascending: false });

      if (failedTxns) {
        failedTransactions.push(...failedTxns.map(t => ({
          id: t.id,
          amount: t.amount,
          status: t.status,
          error_message: (t.metadata as any)?.error_message || 'Unknown error',
          retry_count: (t.metadata as any)?.retry_count || 0,
          metadata: t.metadata,
          created_at: t.created_at
        })));
      }

      // Get pending transactions that are stale (older than 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: stalePending } = await supabase
        .from('autonomous_revenue_transactions')
        .select('*')
        .eq('status', 'pending')
        .lt('created_at', oneHourAgo)
        .order('created_at', { ascending: false });

      if (stalePending) {
        failedTransactions.push(...stalePending.map(t => ({
          id: t.id,
          amount: t.amount,
          status: 'stale_pending',
          error_message: 'Transaction stuck in pending state',
          retry_count: (t.metadata as any)?.retry_count || 0,
          metadata: t.metadata,
          created_at: t.created_at
        })));
      }

    } catch (error) {
      console.error('Error fetching failed transactions:', error);
      // Return empty array if database is inaccessible
      return [];
    }

    return failedTransactions;
  }

  /**
   * Attempt to recover a single transaction
   */
  private async recoverSingleTransaction(transaction: FailedTransaction): Promise<boolean> {
    try {
      // Skip if already retried too many times
      if (transaction.retry_count >= 3) {
        console.log(`Transaction ${transaction.id} has exceeded retry limit (${transaction.retry_count})`);
        return false;
      }

      // Try to process the transaction through Stripe
      const result = await supabase.functions.invoke('stripe-payment-processor', {
        body: {
          action: 'create_payment_intent',
          amount: Math.round(transaction.amount * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            ...transaction.metadata,
            recovery_attempt: true,
            original_transaction_id: transaction.id,
            retry_count: transaction.retry_count + 1
          }
        }
      });

      if (result.error) {
        console.error(`Recovery failed for transaction ${transaction.id}:`, result.error);
        
        // Update retry count
        await this.updateTransactionRetryCount(transaction.id, transaction.retry_count + 1, result.error.message);
        return false;
      }

      // Mark original transaction as recovered
      await this.markTransactionAsRecovered(transaction.id, result.data);
      
      // Add recovered amount to application balance
      await this.addToApplicationBalance(transaction.amount);

      return true;

    } catch (error) {
      console.error(`Error recovering transaction ${transaction.id}:`, error);
      await this.updateTransactionRetryCount(transaction.id, transaction.retry_count + 1, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Update retry count for a failed transaction
   */
  private async updateTransactionRetryCount(transactionId: string, retryCount: number, errorMessage: string): Promise<void> {
    try {
      // Try updating in transfers table
      await supabase
        .from('autonomous_revenue_transfers')
        .update({
          retry_count: retryCount,
          error_message: errorMessage,
          metadata: { last_retry_at: new Date().toISOString(), retry_count: retryCount }
        })
        .eq('id', transactionId);

      // Try updating in transactions table
      await supabase
        .from('autonomous_revenue_transactions')
        .update({
          metadata: { retry_count: retryCount, last_retry_at: new Date().toISOString(), error_message: errorMessage }
        })
        .eq('id', transactionId);

    } catch (error) {
      console.error('Error updating retry count:', error);
    }
  }

  /**
   * Mark transaction as successfully recovered
   */
  private async markTransactionAsRecovered(transactionId: string, recoveryData: any): Promise<void> {
    try {
      const recoveryMetadata = {
        recovered_at: new Date().toISOString(),
        recovery_data: recoveryData,
        status: 'recovered'
      };

      // Update in transfers table
      await supabase
        .from('autonomous_revenue_transfers')
        .update({
          status: 'completed',
          metadata: recoveryMetadata
        })
        .eq('id', transactionId);

      // Update in transactions table
      await supabase
        .from('autonomous_revenue_transactions')
        .update({
          status: 'completed',
          metadata: recoveryMetadata
        })
        .eq('id', transactionId);

    } catch (error) {
      console.error('Error marking transaction as recovered:', error);
    }
  }

  /**
   * Add recovered amount to application balance
   */
  private async addToApplicationBalance(amount: number): Promise<void> {
    try {
      const { data: currentBalance } = await supabase
        .from('application_balance')
        .select('balance_amount')
        .eq('id', 1)
        .single();

      if (currentBalance) {
        await supabase
          .from('application_balance')
          .update({
            balance_amount: currentBalance.balance_amount + amount,
            last_updated_at: new Date().toISOString()
          })
          .eq('id', 1);
      }
    } catch (error) {
      console.error('Error updating application balance:', error);
    }
  }

  /**
   * Log recovery audit for compliance
   */
  private async logRecoveryAudit(auditData: any): Promise<void> {
    try {
      await supabase
        .from('autonomous_revenue_transfer_logs')
        .insert({
          amount: auditData.recoveredAmount,
          source_account: 'failed_transaction_recovery',
          destination_account: 'application_balance',
          status: 'success',
          metadata: {
            ...auditData,
            audit_type: 'failed_transaction_recovery',
            timestamp: new Date().toISOString()
          }
        });
    } catch (error) {
      console.error('Error logging recovery audit:', error);
    }
  }

  /**
   * Get recovery statistics
   */
  async getRecoveryStats(): Promise<any> {
    try {
      const failedTransactions = await this.getFailedTransactions();
      
      const totalFailedAmount = failedTransactions.reduce((sum, t) => sum + t.amount, 0);
      const recoverableAmount = failedTransactions
        .filter(t => t.retry_count < 3)
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        totalFailedTransactions: failedTransactions.length,
        totalFailedAmount,
        recoverableTransactions: failedTransactions.filter(t => t.retry_count < 3).length,
        recoverableAmount,
        unrecoverableAmount: totalFailedAmount - recoverableAmount
      };
    } catch (error) {
      console.error('Error getting recovery stats:', error);
      return {
        totalFailedTransactions: 0,
        totalFailedAmount: 0,
        recoverableTransactions: 0,
        recoverableAmount: 0,
        unrecoverableAmount: 0
      };
    }
  }
}

export default FailedTransactionRecovery;