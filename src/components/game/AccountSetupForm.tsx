
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, ArrowRight, Loader2 } from 'lucide-react';

interface AccountSetupFormProps {
  onAccountCreated: (accountId: string, accountLink?: string) => void;
}

const AccountSetupForm: React.FC<AccountSetupFormProps> = ({ onAccountCreated }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');

  const isFormValid = () => {
    return name.trim() !== '' && email.trim() !== '' && email.includes('@');
  };

  const handleCreateAccount = async () => {
    if (!isFormValid()) {
      toast({
        title: "Error",
        description: "Please fill out all fields correctly",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    if (paymentMethod === 'paypal') {
      // For now, just simulate PayPal integration
      toast({
        title: "PayPal Integration",
        description: "PayPal integration is coming soon! We'll use Stripe for now.",
      });
      setPaymentMethod('stripe');
      setIsProcessing(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Account Created",
          description: data.alreadyExists 
            ? "Your existing account was found" 
            : "Account created successfully!",
        });
        onAccountCreated(data.accountId, data.accountLink);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create account",
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

  return (
    <div className="py-2 space-y-4">
      <Tabs defaultValue="stripe" onValueChange={(v) => setPaymentMethod(v as 'stripe' | 'paypal')}>
        <TabsList className="grid w-full grid-cols-2 bg-black/30">
          <TabsTrigger value="stripe" className="data-[state=active]:bg-white/10">
            <CreditCard className="h-4 w-4 mr-2" />
            Stripe
          </TabsTrigger>
          <TabsTrigger value="paypal" className="data-[state=active]:bg-white/10">
            <span className="mr-2 font-bold text-blue-400">P</span>
            PayPal (Soon)
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="stripe" className="space-y-4 mt-4">
          <div className="mb-3 p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
            <p className="text-sm text-blue-300">
              Stripe will handle all payment processing and provide you with a secure way to receive payouts.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="paypal" className="space-y-4 mt-4">
          <div className="mb-3 p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
            <p className="text-sm text-blue-300">
              PayPal integration coming soon! For now, we'll use Stripe for all payouts.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="name" className="text-white">Full Name</Label>
          <Input 
            id="name"
            className="bg-black/30 border-white/20 text-white focus:border-game-green" 
            placeholder="Your legal full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        
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
            This email will be associated with your payment account
          </p>
        </div>
      </div>

      <Button
        disabled={!isFormValid() || isProcessing}
        onClick={handleCreateAccount}
        className="w-full bg-game-green hover:bg-game-green/80 text-black font-bold"
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Setting up account...
          </span>
        ) : (
          <span className="flex items-center gap-1">
            Continue <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </Button>
    </div>
  );
};

export default AccountSetupForm;
