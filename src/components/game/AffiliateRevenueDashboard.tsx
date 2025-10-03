import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import RealAffiliateNetworkService from '@/services/RealAffiliateNetworkService';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AffiliateRevenueDashboardProps {
  userId: string;
}

export const AffiliateRevenueDashboard: React.FC<AffiliateRevenueDashboardProps> = ({ userId }) => {
  const [report, setReport] = useState<any>(null);
  const [payoutEmail, setPayoutEmail] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'paypal' | 'payoneer'>('paypal');
  const [isProcessing, setIsProcessing] = useState(false);
  const affiliateService = RealAffiliateNetworkService.getInstance();

  useEffect(() => {
    loadReport();
    
    // Reload report every 30 seconds
    const interval = setInterval(loadReport, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadReport = async () => {
    try {
      const newReport = affiliateService.getRevenueReport(userId);
      setReport(newReport);
      
      // Auto-sync conversions
      await affiliateService.syncConversions();
    } catch (error) {
      console.error('Failed to load report:', error);
    }
  };

  const handlePayout = async () => {
    if (!payoutEmail) {
      toast({
        title: 'Email Required',
        description: 'Please enter your PayPal/Payoneer email',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid payout amount',
        variant: 'destructive',
      });
      return;
    }

    if (amount < 5) {
      toast({
        title: 'Minimum Payout',
        description: 'Minimum payout is $5.00',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const result = await affiliateService.requestPayout(
        userId,
        amount,
        payoutEmail,
        payoutMethod
      );

      if (result.success) {
        toast({
          title: '🎉 Payout Successful!',
          description: `$${amount.toFixed(2)} sent via ${payoutMethod.toUpperCase()} to ${payoutEmail}`,
          variant: 'default',
        });
        
        setPayoutAmount('');
        loadReport();
      } else {
        toast({
          title: 'Payout Failed',
          description: result.error || 'Please try again',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Payout failed',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!report) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading revenue report...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-500" />
          Affiliate Revenue Dashboard
        </CardTitle>
        <CardDescription>
          Track earnings from CPA, CPL, and PPC offers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Revenue Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Earned</div>
            <div className="text-2xl font-bold text-green-400">
              ${report.totalEarned.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-400">
              ${report.pendingEarnings.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Approved</div>
            <div className="text-2xl font-bold text-blue-400">
              ${report.approvedEarnings.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Available</div>
            <div className="text-2xl font-bold text-purple-400">
              ${report.availableForPayout.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Payout Section */}
        {report.availableForPayout >= 5 && (
          <div className="border rounded-lg p-4 space-y-4 bg-gradient-to-br from-green-500/10 to-transparent">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Request Payout
            </h3>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="payout-email">Email Address</Label>
                <Input
                  id="payout-email"
                  type="email"
                  placeholder="your@email.com"
                  value={payoutEmail}
                  onChange={(e) => setPayoutEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payout-amount">Amount (Min $5.00)</Label>
                <Input
                  id="payout-amount"
                  type="number"
                  min="5"
                  max={report.availableForPayout}
                  step="0.01"
                  placeholder="0.00"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="flex gap-2">
                  <Button
                    variant={payoutMethod === 'paypal' ? 'default' : 'outline'}
                    onClick={() => setPayoutMethod('paypal')}
                    className="flex-1"
                  >
                    PayPal
                  </Button>
                  <Button
                    variant={payoutMethod === 'payoneer' ? 'default' : 'outline'}
                    onClick={() => setPayoutMethod('payoneer')}
                    className="flex-1"
                  >
                    Payoneer
                  </Button>
                </div>
              </div>
              
              <Button 
                onClick={handlePayout}
                disabled={isProcessing || !payoutEmail || !payoutAmount}
                className="w-full"
                size="lg"
              >
                {isProcessing ? 'Processing...' : 'Request Payout'}
              </Button>
            </div>
          </div>
        )}

        {/* Recent Conversions */}
        <div className="space-y-2">
          <h3 className="font-semibold">Recent Conversions</h3>
          {report.conversions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No conversions yet. Complete offers to start earning!
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {report.conversions.slice(0, 10).map((conversion: any) => (
                <div 
                  key={conversion.networkTransactionId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{conversion.offerId}</span>
                      {conversion.status === 'approved' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : conversion.status === 'pending' ? (
                        <Clock className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(conversion.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-400">
                      ${conversion.payout.toFixed(2)}
                    </div>
                    <Badge 
                      variant={conversion.status === 'approved' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {conversion.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AffiliateRevenueDashboard;
