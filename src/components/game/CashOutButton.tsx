
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { BadgeDollarSign } from 'lucide-react';
import CashOutDialog from './CashOutDialog';
import { useGame } from '@/contexts/GameContext';
import TestCashOutButton from './TestCashOutButton';

const CashOutButton: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { coins } = useGame();

  return (
    <>
      <div className="w-full flex flex-col gap-2">
        <Button 
          onClick={() => setDialogOpen(true)}
          className="game-button-cashout w-full flex items-center justify-center gap-2 py-3 relative overflow-hidden"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent animate-pulse"></span>
          <BadgeDollarSign className="h-5 w-5" />
          <span>Cash Out Real Money (${(coins / 100).toFixed(2)})</span>
        </Button>
        
        <div className="flex justify-end">
          <TestCashOutButton />
        </div>
      </div>
      <CashOutDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
};

export default CashOutButton;
