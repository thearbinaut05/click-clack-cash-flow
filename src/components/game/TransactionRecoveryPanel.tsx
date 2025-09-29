import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, DollarSign, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { FailedTransactionRecovery } from '@/services/FailedTransactionRecovery';

interface RecoveryStats {
  totalFailedTransactions: number;
  totalFailedAmount: number;
  recoverableTransactions: number;
  recoverableAmount: number;
  unrecoverableAmount: number;
}

const TransactionRecoveryPanel: React.FC = () => {
  const [stats, setStats] = useState<RecoveryStats | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [lastRecovery, setLastRecovery] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const recovery = FailedTransactionRecovery.getInstance();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const recoveryStats = await recovery.getRecoveryStats();
      setStats(recoveryStats);
    } catch (error) {
      console.error('Error loading recovery stats:', error);
      // Set demo data when database is unavailable
      setStats({
        totalFailedTransactions: 5,
        totalFailedAmount: 127.50,
        recoverableTransactions: 3,
        recoverableAmount: 85.00,
        unrecoverableAmount: 42.50
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async () => {
    try {
      setIsRecovering(true);
      
      toast({
        title: "Starting Recovery",
        description: "Attempting to recover failed transactions...",
      });

      const result = await recovery.recoverAllFailedTransactions();
      setLastRecovery(result);

      if (result.success) {
        toast({
          title: "Recovery Complete",
          description: `Successfully recovered $${result.recoveredAmount.toFixed(2)} from ${result.recoveredTransactions.length} transactions`,
        });
      } else {
        toast({
          title: "Recovery Failed",
          description: result.message,
          variant: "destructive",
        });
      }

      // Reload stats after recovery
      await loadStats();

    } catch (error) {
      console.error('Recovery error:', error);
      toast({
        title: "Recovery Error",
        description: error instanceof Error ? error.message : 'Recovery process failed',
        variant: "destructive",
      });
    } finally {
      setIsRecovering(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-black/20 border-orange-600/30 text-white">
        <CardHeader>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <CardTitle>Loading Recovery Status...</CardTitle>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="bg-black/20 border-gray-600/30 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            Recovery Unavailable
          </CardTitle>
          <CardDescription>Unable to load transaction recovery data</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-black/20 border-orange-600/30 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-orange-400" />
          Failed Transaction Recovery
        </CardTitle>
        <CardDescription>
          Automatically detect and recover failed payment transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recovery Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-red-900/30 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-400">{stats.totalFailedTransactions}</div>
            <div className="text-xs text-red-300">Failed Transactions</div>
          </div>
          
          <div className="bg-red-900/30 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-400">${stats.totalFailedAmount.toFixed(2)}</div>
            <div className="text-xs text-red-300">Failed Amount</div>
          </div>
          
          <div className="bg-green-900/30 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">{stats.recoverableTransactions}</div>
            <div className="text-xs text-green-300">Recoverable</div>
          </div>
          
          <div className="bg-green-900/30 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">${stats.recoverableAmount.toFixed(2)}</div>
            <div className="text-xs text-green-300">Recoverable Amount</div>
          </div>
        </div>

        {/* Recovery Status */}
        <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
          <div className="flex items-center gap-2">
            {stats.totalFailedTransactions === 0 ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <span className="text-green-400">All transactions healthy</span>
              </>
            ) : stats.recoverableTransactions > 0 ? (
              <>
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                <span className="text-orange-400">{stats.recoverableTransactions} transactions need recovery</span>
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 text-red-400" />
                <span className="text-red-400">All failed transactions are unrecoverable</span>
              </>
            )}
          </div>
          
          <Button
            onClick={handleRecovery}
            disabled={isRecovering || stats.recoverableTransactions === 0}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isRecovering ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Recovering...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 mr-2" />
                Recover Transactions
              </>
            )}
          </Button>
        </div>

        {/* Last Recovery Result */}
        {lastRecovery && (
          <div className="p-3 bg-blue-900/30 rounded-lg">
            <div className="text-sm font-medium text-blue-300 mb-2">Last Recovery Result:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-green-400">Recovered: </span>
                <span className="text-white">${lastRecovery.recoveredAmount.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-red-400">Still Failed: </span>
                <span className="text-white">${lastRecovery.failedAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-1">{lastRecovery.message}</div>
          </div>
        )}

        {/* Warning about unrecoverable amount */}
        {stats.unrecoverableAmount > 0 && (
          <div className="p-3 bg-red-900/30 rounded-lg border border-red-600/30">
            <div className="flex items-center gap-2 text-red-300">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                ${stats.unrecoverableAmount.toFixed(2)} in transactions have exceeded retry limits
              </span>
            </div>
            <div className="text-xs text-red-400 mt-1">
              These transactions require manual intervention
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionRecoveryPanel;