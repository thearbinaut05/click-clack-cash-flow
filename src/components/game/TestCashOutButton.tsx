
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { TestTube } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { API_BASE_URL, DEFAULT_TEST_EMAIL, DEFAULT_CASHOUT_METHOD } from '@/utils/constants';
import { toast } from '@/hooks/use-toast';

const TestCashOutButton: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { coins } = useGame();
  
  const handleTestCashOut = async () => {
    setIsProcessing(true);
    
    try {
      // Calculate the cash value (100 coins = $1)
      const cashValue = (coins / 100).toFixed(2);
      const amountInCents = Math.round(parseFloat(cashValue) * 100);
      
      console.log("Testing automated cashout system:", { 
        amount: amountInCents, 
        email: DEFAULT_TEST_EMAIL,
        method: DEFAULT_CASHOUT_METHOD 
      });
      
      // Make API call to test the cashout endpoint
      const response = await fetch(`${API_BASE_URL}/cashout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountInCents,
          email: DEFAULT_TEST_EMAIL,
          method: DEFAULT_CASHOUT_METHOD,
          isTest: true, // Flag to indicate this is a test transaction
          metadata: {
            gameSession: Date.now(),
            coinCount: coins,
            testRun: true
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Cashout system test failed');
      }
      
      const result = await response.json();
      console.log("Test cashout result:", result);
      
      toast({
        title: "✅ System Test Successful",
        description: `Cashout system is working properly! Transaction ID: ${result.id || 'n/a'}`,
      });
    } catch (error) {
      console.error("Test cashout error:", error);
      toast({
        title: "❌ System Test Failed",
        description: error instanceof Error ? error.message : "Connection to cashout system failed",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button 
      onClick={handleTestCashOut}
      disabled={isProcessing}
      className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white"
      size="sm"
    >
      {isProcessing ? (
        <>Testing...</>
      ) : (
        <>
          <TestTube className="h-4 w-4" />
          Test Cashout System
        </>
      )}
    </Button>
  );
};

export default TestCashOutButton;
