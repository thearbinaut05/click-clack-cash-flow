import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BadgeDollarSign, ArrowRight, Loader2, CreditCard, Wallet } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useGame } from '@/contexts/GameContext';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";

interface CashOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CashOutFormValues {
  email: string;
  method: 'standard' | 'virtual-card' | 'bank-card';
}

const CashOutDialog: React.FC<CashOutDialogProps> = ({ open, onOpenChange }) => {
  const { coins, cashOut } = useGame();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Calculate the cash value (100 coins = $1)
  const cashValue = (coins / 100).toFixed(2);
  
  // Minimum cash out amount is $1 (100 coins)
  const form = useForm<CashOutFormValues>({
    defaultValues: {
      email: '',
      method: 'standard'
    }
  });

  const email = form.watch("email");
  const canCashOut = coins >= 100 && email && email.includes('@');

  const handleCashOut = async (values: CashOutFormValues) => {
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
      console.log("Attempting cashout:", { 
        amount: cashValue, 
        email: values.email,
        method: values.method 
      });
      
      const amountInCents = Math.round(parseFloat(cashValue) * 100);
      
      // Use the appropriate endpoint based on the selected method
      let endpoint, requestData;
      
      if (values.method === 'virtual-card') {
        endpoint = 'http://localhost:4000/api/create-virtual-card';
        requestData = { 
          email: values.email,
          metadata: {
            amount: amountInCents,
            user_email: values.email
          }
        };
      } else if (values.method === 'bank-card') {
        endpoint = 'http://localhost:4000/api/process-payout';
        requestData = { 
          email: values.email,
          amount: amountInCents,
          metadata: {
            user_email: values.email
          },
          payment_method_id: OWNER_STRIPE_ACCOUNT_ID // This should be replaced with actual user's payment method
        };
      } else {
        // Standard withdrawal
        endpoint = 'http://localhost:4000/api/withdraw';
        requestData = { 
          amount: parseFloat(cashValue),
          email: values.email
        };
      }
      
      // Call the API to process the cashout
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer token` // Replace with actual auth token if needed
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server returned an error");
      }
      
      const data = await response.json();
      console.log("Cashout response:", data);
      
      if (data.success || data.id || data.transferId) {
        // Use the cashOut function from GameContext to reset coins
        await cashOut(values.email);
        
        // Close the dialog
        onOpenChange(false);
        
        let successMessage = `You've successfully cashed out $${cashValue} to ${values.email}!`;
        
        if (values.method === 'virtual-card') {
          successMessage = `Virtual card created! Details sent to ${values.email}`;
        } else if (values.method === 'bank-card') {
          successMessage = `$${cashValue} will be transferred to your bank card. Details sent to ${values.email}`;
        }
        
        toast({
          title: "Payment Processed",
          description: successMessage,
        });
      } else {
        throw new Error(data.error || "Payment processing failed");
      }
    } catch (error) {
      console.error("Cashout error:", error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Server error. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Rest of the component remains the same
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
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCashOut)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-white">Email Address</Label>
                <Input 
                  id="email"
                  className="bg-black/30 border-white/20 text-white focus:border-game-green" 
                  placeholder="email@example.com"
                  type="email"
                  {...form.register("email")}
                />
                <p className="text-xs text-gray-400">
                  We'll send payment confirmation to this email
                </p>
              </div>
              
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-white">Payment Method</FormLabel>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0 rounded-md p-3 bg-black/20 border border-white/10">
                        <FormControl>
                          <RadioGroupItem value="standard" />
                        </FormControl>
                        <FormLabel className="font-normal flex items-center gap-2">
                          <BadgeDollarSign className="h-4 w-4" />
                          <div>
                            <div className="text-sm">Standard Payment</div>
                            <div className="text-xs text-gray-400">Payment sent to your email</div>
                          </div>
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0 rounded-md p-3 bg-black/20 border border-white/10">
                        <FormControl>
                          <RadioGroupItem value="virtual-card" />
                        </FormControl>
                        <FormLabel className="font-normal flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <div>
                            <div className="text-sm">Virtual Card</div>
                            <div className="text-xs text-gray-400">Create a virtual card with this balance</div>
                          </div>
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0 rounded-md p-3 bg-black/20 border border-white/10">
                        <FormControl>
                          <RadioGroupItem value="bank-card" />
                        </FormControl>
                        <FormLabel className="font-normal flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          <div>
                            <div className="text-sm">Bank Card</div>
                            <div className="text-xs text-gray-400">Transfer to your bank card</div>
                          </div>
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormItem>
                )}
              />
          
              <div className="mb-4 p-3 bg-green-900/20 border border-green-600/30 rounded-lg mt-4">
                <p className="text-sm text-green-300">
                  Your payment will be processed according to your selected method
                </p>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!canCashOut || isProcessing}
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
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CashOutDialog;
