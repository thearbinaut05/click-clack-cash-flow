
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BadgeDollarSign, ArrowRight, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useGame } from '@/contexts/GameContext';
import AccountSetupForm from './AccountSetupForm';

interface CashOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AccountStatus {
  accountId?: string;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  chargesEnabled?: boolean;
}

const CashOutDialog: React.FC<CashOutDialogProps> = ({ open, onOpenChange }) => {
  const { coins, cashOut } = useGame();
  const [accountId, setAccountId] = useState<string | null>(localStorage.getItem('stripeAccountId'));
  const [accountStatus, setAccountStatus] = useState<AccountStatus>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'account-setup' | 'account-verify' | 'cashout'>(
    accountId ? 'cashout' : 'account-setup'
  );

  // Calculate the cash value (100 coins = $1)
  const cashValue = (coins / 100).toFixed(2);
  
  // Minimum cash out amount is $1 (100 coins)
  const canCashOut = coins >= 100 && accountStatus.payoutsEnabled;

  useEffect(() => {
    // Check account status whenever the dialog opens and we have an accountId
    if (open && accountId) {
      fetchAccountStatus();
    }
  }, [open, accountId]);

  const fetchAccountStatus = async () => {
    if (!accountId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/api/account-status/${accountId}`);
      const data = await response.json();
      
      if (data.success) {
        setAccountStatus(data);
        
        if (data.payoutsEnabled) {
          setStep('cashout');
        } else {
          setStep('account-verify');
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch account status",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to cashout server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToStripe = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('http://localhost:4000/api/create-account-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accountId })
      });
      
      const data = await response.json();
      
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create account link",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to cashout server",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAccountCreated = (newAccountId: string, accountLink?: string) => {
    setAccountId(newAccountId);
    localStorage.setItem('stripeAccountId', newAccountId);
    
    if (accountLink) {
      window.location.href = accountLink;
    } else {
      setStep('account-verify');
      fetchAccountStatus();
    }
  };

  const handleCashOut = async () => {
    if (!accountId) {
      toast({
        title: "Error",
        description: "Please set up your payment account first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Use the cashOut function from GameContext
      await cashOut(accountId);
      
      // Close the dialog
      onOpenChange(false);
      
      toast({
        title: "Payment Processed",
        description: `You've successfully cashed out $${cashValue} to your account!`,
      });
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderContent = () => {
    if (step === 'account-setup') {
      return <AccountSetupForm onAccountCreated={handleAccountCreated} />;
    } else if (step === 'account-verify') {
      return (
        <div className="py-4">
          <div className="mb-4 p-4 rounded-lg bg-yellow-900/30 border border-yellow-600/30 text-yellow-200">
            <div className="flex flex-col gap-2">
              <p className="text-sm">Your Stripe account needs to be completed before you can cash out.</p>
              <div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`w-4 h-4 rounded-full ${accountStatus.detailsSubmitted ? 'bg-green-500' : 'bg-gray-600'}`}></span>
                  <span>Account details {accountStatus.detailsSubmitted ? 'submitted' : 'pending'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <span className={`w-4 h-4 rounded-full ${accountStatus.payoutsEnabled ? 'bg-green-500' : 'bg-gray-600'}`}></span>
                  <span>Payouts {accountStatus.payoutsEnabled ? 'enabled' : 'pending'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 items-center">
            <Button 
              onClick={handleContinueToStripe}
              className="w-full flex justify-center items-center gap-2"
              disabled={isProcessing}
            >
              {isProcessing ? "Redirecting..." : (
                <>
                  Continue Setup with Stripe <ExternalLink className="w-4 h-4" />
                </>
              )}
            </Button>
            
            <Button
              variant="outline" 
              onClick={fetchAccountStatus}
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="py-4">
          <div className="mb-4 p-4 rounded-lg bg-black/30 border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Your coins:</span>
              <span className="text-xl font-bold">{coins}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Cash value:</span>
              <div className="flex items-center">
                <span className="text-game-green font-bold text-lg">${cashValue}</span>
                <span className="text-xs text-gray-500 ml-2">(100 coins = $1)</span>
              </div>
            </div>
          </div>

          {!canCashOut && (
            <div className="text-center p-2 mb-4 bg-orange-900/40 text-orange-300 rounded-md text-sm">
              {coins < 100 ? (
                "You need at least 100 coins to cash out"
              ) : (
                "Your account isn't fully set up for payouts yet"
              )}
            </div>
          )}
          
          <div className="mb-4 p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
            <p className="text-sm text-green-300">
              Payout will be sent to your connected Stripe account
            </p>
          </div>
        </div>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#151b2a] border border-white/20 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <BadgeDollarSign className="h-5 w-5 text-game-green" />
            {step === 'account-setup' ? 'Set Up Payment Account' : 
             step === 'account-verify' ? 'Complete Account Setup' :
             'Cash Out Real Money'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {step === 'account-setup' ? 'Create a connected account to receive payouts' : 
             step === 'account-verify' ? 'Complete your account setup on Stripe' :
             'Convert your coins to real cash via Stripe'}
          </DialogDescription>
        </DialogHeader>

        {renderContent()}

        <DialogFooter>
          {step === 'account-setup' ? null : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              {step === 'cashout' && (
                <Button
                  disabled={!canCashOut || isProcessing}
                  onClick={handleCashOut}
                  className="bg-game-green hover:bg-game-green/80 text-black font-bold"
                >
                  {isProcessing ? "Processing..." : 
                    <span className="flex items-center gap-1">
                      Cash Out <ArrowRight className="h-4 w-4" />
                    </span>
                  }
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CashOutDialog;
