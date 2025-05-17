
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { BadgeDollarSign } from 'lucide-react';
import CashOutDialog from './CashOutDialog';
import { useGame } from '@/contexts/GameContext';

const CashOutButton: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { coins } = useGame();

  return (
    <>
      <Button 
        onClick={() => setDialogOpen(true)}
        className="game-button-cashout w-full mt-4 flex items-center justify-center gap-2 py-3 relative overflow-hidden"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent animate-pulse"></span>
        <BadgeDollarSign className="h-5 w-5" />
        <span>Cash Out Real Money (${(coins / 100).toFixed(2)})</span>
      </Button>
      <CashOutDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
};

export default CashOutButton;
