import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Wifi, WifiOff, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface OfflineTransaction {
  id: string;
  amount: number;
  email: string;
  method: string;
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export default function OfflinePaymentHandler() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineTransactions, setOfflineTransactions] = useState<OfflineTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load offline transactions from localStorage
    const stored = localStorage.getItem('offline_transactions');
    if (stored) {
      setOfflineTransactions(JSON.parse(stored));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Save to localStorage whenever transactions change
    localStorage.setItem('offline_transactions', JSON.stringify(offlineTransactions));
  }, [offlineTransactions]);

  const addOfflineTransaction = (transaction: Omit<OfflineTransaction, 'id' | 'timestamp' | 'status'>) => {
    const newTransaction: OfflineTransaction = {
      id: `offline_${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'pending',
      ...transaction
    };

    setOfflineTransactions(prev => [newTransaction, ...prev]);
    
    toast({
      title: "Transaction Queued",
      description: "Transaction saved offline. Will process when connection is restored.",
    });
  };

  const processOfflineTransactions = async () => {
    if (!isOnline || offlineTransactions.length === 0) return;

    setIsProcessing(true);
    const pendingTransactions = offlineTransactions.filter(t => t.status === 'pending');

    for (const transaction of pendingTransactions) {
      try {
        // Update status to processing
        setOfflineTransactions(prev => 
          prev.map(t => t.id === transaction.id ? { ...t, status: 'processing' } : t)
        );

        // Attempt to process the transaction
        const response = await fetch('http://localhost:4000/cashout-with-source', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(transaction.amount * 100),
            currency: 'usd',
            email: transaction.email,
            payoutType: transaction.method,
            metadata: {
              offline_recovery: true,
              original_timestamp: transaction.timestamp
            }
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Mark as completed
            setOfflineTransactions(prev => 
              prev.map(t => t.id === transaction.id ? { ...t, status: 'completed' } : t)
            );
            
            toast({
              title: "Transaction Processed",
              description: `$${transaction.amount.toFixed(2)} successfully sent to ${transaction.email}`,
            });
          } else {
            throw new Error(result.error);
          }
        } else {
          throw new Error('Network error');
        }
      } catch (error) {
        // Mark as failed
        setOfflineTransactions(prev => 
          prev.map(t => t.id === transaction.id ? { ...t, status: 'failed' } : t)
        );
        
        console.error(`Failed to process offline transaction ${transaction.id}:`, error);
      }
    }

    setIsProcessing(false);
  };

  const retryFailedTransaction = async (transactionId: string) => {
    setOfflineTransactions(prev => 
      prev.map(t => t.id === transactionId ? { ...t, status: 'pending' } : t)
    );

    await processOfflineTransactions();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'processing': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'processing': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'failed': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  // Auto-process when coming back online
  useEffect(() => {
    if (isOnline && offlineTransactions.some(t => t.status === 'pending')) {
      processOfflineTransactions();
    }
  }, [isOnline]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Offline Payment Handler
            </CardTitle>
            <CardDescription>
              Manages payments when connection is unavailable
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-1 text-green-500">
                <Wifi className="h-4 w-4" />
                <span className="text-sm">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-500">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm">Offline</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isOnline && (
          <div className="p-3 bg-orange-900/20 border border-orange-600/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-orange-300 font-medium">Connection Unavailable</p>
              <p className="text-xs text-orange-400">
                Payments will be queued and processed when connection is restored
              </p>
            </div>
          </div>
        )}

        {isOnline && offlineTransactions.some(t => t.status === 'pending') && (
          <Button
            onClick={processOfflineTransactions}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Processing...' : `Process ${offlineTransactions.filter(t => t.status === 'pending').length} Pending Transactions`}
          </Button>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Transaction Queue ({offlineTransactions.length})</h4>
          {offlineTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No offline transactions</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {offlineTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(transaction.status)}
                    <div>
                      <div className="text-sm font-medium">${transaction.amount.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        {transaction.email} • {transaction.method}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                    {transaction.status === 'failed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retryFailedTransaction(transaction.id)}
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Export the function to add offline transactions
export const addOfflineTransaction = (transaction: Omit<OfflineTransaction, 'id' | 'timestamp' | 'status'>) => {
  const existing = localStorage.getItem('offline_transactions');
  const transactions = existing ? JSON.parse(existing) : [];
  
  const newTransaction = {
    id: `offline_${Date.now()}`,
    timestamp: new Date().toISOString(),
    status: 'pending',
    ...transaction
  };
  
  transactions.unshift(newTransaction);
  localStorage.setItem('offline_transactions', JSON.stringify(transactions));
  
  return newTransaction;
};