
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BadgeDollarSign, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useGame } from '@/contexts/GameContext';

interface CashOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CashOutDialog: React.FC<CashOutDialogProps> = ({ open, onOpenChange }) => {
  const { coins, cashOut } = useGame();
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Calculate the cash value (100 coins = $1)
  const cashValue = (coins / 100).toFixed(2);
  
  // Minimum cash out amount is $1 (100 coins)
  const canCashOut = coins >= 100 && email && email.includes('@');

  const handleCashOut = async () => {
    if (!canCashOut) {
      toast({
        title: "Error",
        description: coins < 100 ? 
          "You need at least 100 coins to cash out" : 
          "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Call the API to process the cashout
      const response = await fetch('http://localhost:4000/api/cashout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          amount: parseFloat(cashValue),
          email: email
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Use the cashOut function from GameContext to reset coins
        await cashOut(email);
        
        // Close the dialog
        onOpenChange(false);
        
        toast({
          title: "Payment Processed",
          description: `You've successfully cashed out $${cashValue} to ${email}!`,
        });
      } else {
        throw new Error(data.error || "Payment processing failed");
      }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#151b2a] border border-white/20 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <BadgeDollarSign className="h-5 w-5 text-game-green" />
            Cash Out Real Money
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Convert your coins to real cash
          </DialogDescription>
        </DialogHeader>

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

          {coins < 100 && (
            <div className="text-center p-2 mb-4 bg-orange-900/40 text-orange-300 rounded-md text-sm">
              You need at least 100 coins to cash out
            </div>
          )}
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-white">Email Address</Label>
              <Input 
                id="email"
                className="bg-black/30 border-white/20 text-white focus:border-game-green" 
                placeholder="email@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-gray-400">
                We'll send payment confirmation to this email
              </p>
            </div>
          </div>
          
          <div className="mb-4 p-3 bg-green-900/20 border border-green-600/30 rounded-lg mt-4">
            <p className="text-sm text-green-300">
              Your payment will be processed and sent to your email address
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            disabled={!canCashOut || isProcessing}
            onClick={handleCashOut}
            className="bg-game-green hover:bg-game-green/80 text-black font-bold"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Processing...
              </span>
            ) : (
              <span className="flex items-center gap-1">
                Cash Out <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CashOutDialog;
