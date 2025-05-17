
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BadgeDollarSign, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useGame } from '@/contexts/GameContext';

interface CashOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CashOutDialog: React.FC<CashOutDialogProps> = ({ open, onOpenChange }) => {
  const { coins, cashOut } = useGame();
  const [cashAppTag, setCashAppTag] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate the cash value (100 coins = $1)
  const cashValue = (coins / 100).toFixed(2);
  
  // Minimum cash out amount is $1 (100 coins)
  const canCashOut = coins >= 100;

  const handleCashOut = async () => {
    if (!cashAppTag) {
      toast({
        title: "Error",
        description: "Please enter your $Cashtag",
        variant: "destructive",
      });
      return;
    }

    if (!cashAppTag.startsWith('$')) {
      toast({
        title: "Error",
        description: "Your $Cashtag must start with $",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Process the cash out
      await cashOut(cashAppTag);
      
      // Close the dialog
      onOpenChange(false);
      
      toast({
        title: "Cash Out Successful!",
        description: `$${cashValue} has been sent to ${cashAppTag}`,
      });
    } catch (error) {
      toast({
        title: "Cash Out Failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#151b2a] border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <BadgeDollarSign className="h-5 w-5 text-game-green" />
            Cash Out Winnings
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Convert your coins to real cash via Cash App
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

          {!canCashOut && (
            <div className="text-center p-2 mb-4 bg-orange-900/40 text-orange-300 rounded-md text-sm">
              You need at least 100 coins to cash out
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="cashtag" className="text-white">Your $Cashtag</Label>
            <Input 
              id="cashtag"
              className="bg-black/30 border-white/20 text-white focus:border-game-green" 
              placeholder="$YourCashTag"
              value={cashAppTag}
              onChange={(e) => setCashAppTag(e.target.value)}
            />
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
            disabled={!canCashOut || isProcessing || !cashAppTag}
            onClick={handleCashOut}
            className="bg-game-green hover:bg-game-green/80 text-black font-bold"
          >
            {isProcessing ? "Processing..." : 
              <span className="flex items-center gap-1">
                Cash Out <ArrowRight className="h-4 w-4" />
              </span>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CashOutDialog;
