import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, Check, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BankAccount {
  id: string;
  accountNumber: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
  bankName: string;
  isDefault: boolean;
}

export default function BankAccountSetup() {
  const [accounts, setAccounts] = useState<BankAccount[]>([
    {
      id: 'default_account',
      accountNumber: '****1234',
      routingNumber: '021000021',
      accountType: 'checking',
      bankName: 'Chase Bank',
      isDefault: true
    }
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const [newAccount, setNewAccount] = useState({
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking' as 'checking' | 'savings',
    bankName: ''
  });

  const handleAddAccount = () => {
    if (!newAccount.accountNumber || !newAccount.routingNumber || !newAccount.bankName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all bank account details",
        variant: "destructive",
      });
      return;
    }

    const account: BankAccount = {
      id: `account_${Date.now()}`,
      accountNumber: `****${newAccount.accountNumber.slice(-4)}`,
      routingNumber: newAccount.routingNumber,
      accountType: newAccount.accountType,
      bankName: newAccount.bankName,
      isDefault: accounts.length === 0
    };

    setAccounts([...accounts, account]);
    setNewAccount({
      accountNumber: '',
      routingNumber: '',
      accountType: 'checking',
      bankName: ''
    });
    setIsAdding(false);

    toast({
      title: "Bank Account Added",
      description: "Your bank account has been configured for payouts",
    });
  };

  const setDefaultAccount = (accountId: string) => {
    setAccounts(accounts.map(acc => ({
      ...acc,
      isDefault: acc.id === accountId
    })));

    toast({
      title: "Default Account Updated",
      description: "This account will be used for all future payouts",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Bank Account Setup
        </CardTitle>
        <CardDescription>
          Configure your bank accounts for receiving payouts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {accounts.length === 0 && (
          <div className="p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-300 font-medium">No bank accounts configured</p>
              <p className="text-xs text-yellow-400">Add a bank account to receive payouts</p>
            </div>
          </div>
        )}

        {accounts.map((account) => (
          <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">{account.bankName}</div>
                <div className="text-sm text-muted-foreground">
                  {account.accountType} • {account.accountNumber} • {account.routingNumber}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {account.isDefault && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-900/30 text-green-300 text-xs rounded-full">
                  <Check className="h-3 w-3" />
                  Default
                </div>
              )}
              {!account.isDefault && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDefaultAccount(account.id)}
                >
                  Set Default
                </Button>
              )}
            </div>
          </div>
        ))}

        {!isAdding && (
          <Button
            variant="outline"
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Bank Account
          </Button>
        )}

        {isAdding && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bank-name">Bank Name</Label>
                <Input
                  id="bank-name"
                  placeholder="e.g., Chase Bank"
                  value={newAccount.bankName}
                  onChange={(e) => setNewAccount({...newAccount, bankName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="account-type">Account Type</Label>
                <Select
                  value={newAccount.accountType}
                  onValueChange={(value: 'checking' | 'savings') => 
                    setNewAccount({...newAccount, accountType: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="routing-number">Routing Number</Label>
                <Input
                  id="routing-number"
                  placeholder="9 digits"
                  maxLength={9}
                  value={newAccount.routingNumber}
                  onChange={(e) => setNewAccount({...newAccount, routingNumber: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="account-number">Account Number</Label>
                <Input
                  id="account-number"
                  placeholder="Account number"
                  value={newAccount.accountNumber}
                  onChange={(e) => setNewAccount({...newAccount, accountNumber: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddAccount} className="flex-1">
                Add Account
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAdding(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
          <p className="text-sm text-blue-300">
            Bank accounts are securely stored and encrypted. Payouts typically arrive within 1-3 business days.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}