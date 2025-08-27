import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Wallet, CreditCard, Building2, ArrowUpRight, RefreshCw, DollarSign } from "lucide-react";

interface ExternalAccount {
  id: string;
  type: 'stripe' | 'bank' | 'crypto';
  name: string;
  balance: number;
  currency: string;
  status: 'connected' | 'pending' | 'error';
  lastSync: string;
}

export default function ExternalAccountsPanel() {
  const [accounts, setAccounts] = useState<ExternalAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferAmount, setTransferAmount] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<ExternalAccount | null>(null);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadExternalAccounts();
  }, []);

  const loadExternalAccounts = async () => {
    try {
      setLoading(true);
      
      // Get Stripe balance
      const { data: stripeBalance, error: stripeError } = await supabase.functions.invoke('stripe-payment-processor', {
        body: { action: 'get_balance' }
      });

      if (stripeError) throw stripeError;

      // Get bank transfer accounts
      const { data: bankAccounts } = await supabase
        .from('bank_transfers')
        .select('bank_account_id, amount, status')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5);

      // Create external accounts list
      const externalAccounts: ExternalAccount[] = [];

      // Add Stripe account
      if (stripeBalance?.available?.[0]) {
        externalAccounts.push({
          id: 'stripe_main',
          type: 'stripe',
          name: 'Stripe Account',
          balance: stripeBalance.available[0].amount / 100,
          currency: stripeBalance.available[0].currency.toUpperCase(),
          status: 'connected',
          lastSync: new Date().toISOString(),
        });
      }

      // Add bank accounts (simulated from transfers)
      const bankAccountMap = new Map();
      bankAccounts?.forEach(transfer => {
        if (!bankAccountMap.has(transfer.bank_account_id)) {
          bankAccountMap.set(transfer.bank_account_id, {
            id: transfer.bank_account_id,
            type: 'bank',
            name: `Bank Account ${transfer.bank_account_id.slice(-4)}`,
            balance: 0, // Would need real bank API integration
            currency: 'USD',
            status: 'connected',
            lastSync: new Date().toISOString(),
          });
        }
      });

      externalAccounts.push(...Array.from(bankAccountMap.values()));

      setAccounts(externalAccounts);
    } catch (error) {
      console.error('Error loading external accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load external account balances",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedAccount || !transferAmount) return;

    try {
      const amount = parseFloat(transferAmount);
      if (amount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Transfer amount must be greater than 0",
          variant: "destructive",
        });
        return;
      }

      if (amount > selectedAccount.balance) {
        toast({
          title: "Insufficient Funds",
          description: "Transfer amount exceeds available balance",
          variant: "destructive",
        });
        return;
      }

      // Create transfer based on account type
      let transferResult;
      
      if (selectedAccount.type === 'stripe') {
        // Transfer from Stripe to user's bank account
        transferResult = await supabase.functions.invoke('stripe-payment-processor', {
          body: {
            action: 'create_transfer',
            amount: Math.round(amount * 100),
            currency: selectedAccount.currency.toLowerCase(),
            destination: 'acct_1RPfy4BRrjIUJ5cS', // User's connected account
            metadata: {
              transfer_type: 'external_withdrawal',
              source_account: selectedAccount.id,
            }
          }
        });
      } else if (selectedAccount.type === 'bank') {
        // Initiate bank transfer
        transferResult = await supabase.rpc('initiate_bank_transfer', {
          p_amount: amount,
          p_bank_account_id: selectedAccount.id,
          p_transfer_type: 'withdrawal'
        });
      }

      if (transferResult?.error) throw transferResult.error;

      toast({
        title: "Transfer Initiated",
        description: `Successfully initiated transfer of $${amount.toFixed(2)} from ${selectedAccount.name}`,
      });

      setIsTransferDialogOpen(false);
      setTransferAmount("");
      setSelectedAccount(null);
      loadExternalAccounts();
      
    } catch (error) {
      console.error('Transfer error:', error);
      toast({
        title: "Transfer Failed",
        description: "Failed to initiate transfer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'stripe': return <CreditCard className="h-5 w-5" />;
      case 'bank': return <Building2 className="h-5 w-5" />;
      case 'crypto': return <Wallet className="h-5 w-5" />;
      default: return <DollarSign className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'error': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            External Accounts
          </CardTitle>
          <CardDescription>Loading external account balances...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              External Accounts
            </CardTitle>
            <CardDescription>Manage your connected external accounts and transfer funds</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadExternalAccounts}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {accounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No external accounts connected</p>
          </div>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getAccountIcon(account.type)}
                <div>
                  <div className="font-medium">{account.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {account.currency} • Last sync: {new Date(account.lastSync).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge className={getStatusColor(account.status)}>{account.status}</Badge>
                <div className="text-right">
                  <div className="font-semibold">${account.balance.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">{account.currency}</div>
                </div>
                
                {account.balance > 0 && (
                  <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAccount(account)}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                        Transfer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Transfer Funds</DialogTitle>
                        <DialogDescription>
                          Transfer funds from {selectedAccount?.name} to your personal account
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>From Account</Label>
                            <div className="flex items-center gap-2 p-2 border rounded">
                              {selectedAccount && getAccountIcon(selectedAccount.type)}
                              <span>{selectedAccount?.name}</span>
                            </div>
                          </div>
                          <div>
                            <Label>Available Balance</Label>
                            <div className="p-2 border rounded bg-muted">
                              ${selectedAccount?.balance.toFixed(2)} {selectedAccount?.currency}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="transfer-amount">Transfer Amount</Label>
                          <Input
                            id="transfer-amount"
                            type="number"
                            placeholder="0.00"
                            value={transferAmount}
                            onChange={(e) => setTransferAmount(e.target.value)}
                            min="0"
                            max={selectedAccount?.balance}
                            step="0.01"
                          />
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleTransfer}>
                          Initiate Transfer
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}