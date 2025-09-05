import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Bitcoin,
  CreditCard,
  Building,
  Mail
} from 'lucide-react';

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  payoutMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'processing';
  timestamp: string;
  details?: any;
  error?: string;
}

interface PayoutMethodStats {
  method: string;
  count: number;
  totalAmount: number;
  successRate: number;
}

export default function TransactionStatusDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testAmount, setTestAmount] = useState(100);
  const [stats, setStats] = useState<PayoutMethodStats[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadTransactions();
    loadStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadTransactions, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await fetch('http://localhost:4000/transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('http://localhost:4000/transactions/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || []);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const testPayoutMethod = async (method: string) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: `test_${Date.now()}`,
          coins: testAmount,
          payoutType: method,
          email: testEmail,
          metadata: { testMode: true, dashboard: true }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: `✅ ${method.toUpperCase()} Test Successful`,
          description: `Transaction ID: ${result.details?.transactionId || result.details?.id || 'N/A'}`,
        });
      } else {
        throw new Error(result.error || 'Test failed');
      }
      
      // Refresh transactions
      await loadTransactions();
    } catch (error) {
      toast({
        title: `❌ ${method.toUpperCase()} Test Failed`,
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'bitcoin':
      case 'btc':
      case 'ethereum':
      case 'eth':
      case 'litecoin':
      case 'ltc':
        return <Bitcoin className="h-4 w-4 text-orange-500" />;
      case 'instant_card':
        return <CreditCard className="h-4 w-4 text-blue-500" />;
      case 'bank_account':
        return <Building className="h-4 w-4 text-green-500" />;
      case 'paypal':
        return <span className="text-xs font-bold text-blue-600">PP</span>;
      default:
        return <Mail className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      failed: 'destructive',
      processing: 'secondary',
      pending: 'outline'
    } as const;
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>;
  };

  const filteredTransactions = transactions.filter(tx => {
    const statusMatch = filterStatus === 'all' || tx.status === filterStatus;
    const methodMatch = filterMethod === 'all' || tx.payoutMethod === filterMethod;
    return statusMatch && methodMatch;
  });

  const payoutMethods = [
    { key: 'bitcoin', label: 'Bitcoin (BTC)', icon: '₿' },
    { key: 'ethereum', label: 'Ethereum (ETH)', icon: 'Ξ' },
    { key: 'litecoin', label: 'Litecoin (LTC)', icon: 'Ł' },
    { key: 'paypal', label: 'PayPal', icon: 'PP' },
    { key: 'instant_card', label: 'Instant Card', icon: '💳' },
    { key: 'bank_account', label: 'Bank Transfer', icon: '🏦' },
    { key: 'email', label: 'Email Receipt', icon: '📧' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Transaction Status Dashboard
          </CardTitle>
          <CardDescription>
            Monitor and test all payout methods in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Panel */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-lg">Test Payout Methods</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="testEmail">Test Email</Label>
                <Input
                  id="testEmail"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              <div>
                <Label htmlFor="testAmount">Test Amount (coins)</Label>
                <Input
                  id="testAmount"
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(Number(e.target.value))}
                  placeholder="100"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {payoutMethods.map((method) => (
                <Button
                  key={method.key}
                  onClick={() => testPayoutMethod(method.key)}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <span className="text-lg">{method.icon}</span>
                  <span className="text-xs text-center">{method.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Stats Panel */}
          {stats.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <Card key={stat.method}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getMethodIcon(stat.method)}
                        <span className="font-medium text-sm">{stat.method}</span>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="text-2xl font-bold">${(stat.totalAmount || 0).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        {stat.count || 0} transactions • {(stat.successRate || 0).toFixed(1)}% success
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Label>Status:</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label>Method:</Label>
              <Select value={filterMethod} onValueChange={setFilterMethod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {payoutMethods.map((method) => (
                    <SelectItem key={method.key} value={method.key}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={loadTransactions} 
              variant="outline" 
              size="sm"
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Transactions List */}
          <div className="space-y-2">
            <h3 className="font-semibold">Recent Transactions ({filteredTransactions.length})</h3>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found. Try testing a payout method above.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredTransactions.map((tx) => (
                  <Card key={tx.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getMethodIcon(tx.payoutMethod)}
                        <div>
                          <div className="font-medium">${(tx.amount || 0).toFixed(2)} via {tx.payoutMethod}</div>
                          <div className="text-sm text-muted-foreground">
                            {tx.details?.transactionId || tx.details?.id || tx.id}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(tx.status)}
                        {getStatusBadge(tx.status)}
                      </div>
                    </div>
                    {tx.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        {tx.error}
                      </div>
                    )}
                    {tx.details && !tx.error && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {tx.details.message || tx.details.description || 'No additional details'}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}