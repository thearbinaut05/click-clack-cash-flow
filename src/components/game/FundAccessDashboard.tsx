import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, TrendingUp, Zap, Shield, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';

interface FundData {
  total_usd: number;
  available_usd: number;
  pending_usd: number;
  last_updated: string;
  source_system: string;
}

interface SystemHealth {
  overall_status: string;
  components: {
    supabase: { status: string };
    stripe: { status: string; available_balance?: number };
  };
}

const FundAccessDashboard: React.FC = () => {
  const [fundData, setFundData] = useState<FundData[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadFundData = async () => {
    try {
      const { data, error } = await supabase
        .rpc('calculate_real_time_usd_balance');
      
      if (error) throw error;
      
      setFundData(data || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading fund data:', error);
      toast({
        title: "Error Loading Funds",
        description: "Failed to fetch real-time USD balance",
        variant: "destructive",
      });
    }
  };

  const checkSystemHealth = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('financial-failsafe-system', {
        body: { action: 'health_check' }
      });
      
      if (error) throw error;
      
      setSystemHealth(data);
    } catch (error) {
      console.error('Error checking system health:', error);
    }
  };

  const initiateUSDSweep = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('usd-audit-system', {
        body: { action: 'comprehensive_usd_sweep' }
      });
      
      if (error) throw error;
      
      toast({
        title: "✅ USD Sweep Initiated",
        description: `Processing ${data.total_amount_found || 0} USD across ${data.sources_scanned || 0} sources`,
      });
      
      // Reload fund data after sweep
      setTimeout(loadFundData, 2000);
    } catch (error) {
      console.error('Error initiating USD sweep:', error);
      toast({
        title: "❌ Sweep Failed",
        description: error.message || "Failed to initiate USD sweep",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processAutonomousTransfer = async () => {
    setIsProcessing(true);
    try {
      const totalAvailable = fundData.reduce((sum, fund) => sum + fund.available_usd, 0);
      
      if (totalAvailable < 1) {
        toast({
          title: "Insufficient Funds",
          description: "Need at least $1 to process transfer",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('autopilot-cashout', {
        body: { 
          action: 'process_autonomous_transfer',
          amount: totalAvailable,
          method: 'instant_card'
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "🚀 Autonomous Transfer Initiated",
        description: `Processing $${totalAvailable.toFixed(2)} via intelligent routing`,
      });
      
      // Reload data
      setTimeout(loadFundData, 3000);
    } catch (error) {
      console.error('Error processing autonomous transfer:', error);
      toast({
        title: "❌ Transfer Failed",
        description: error.message || "Autonomous transfer failed",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await Promise.all([loadFundData(), checkSystemHealth()]);
      setIsLoading(false);
    };
    
    initialize();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadFundData();
      checkSystemHealth();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const totalUSD = fundData.reduce((sum, fund) => sum + fund.total_usd, 0);
  const availableUSD = fundData.reduce((sum, fund) => sum + fund.available_usd, 0);
  const pendingUSD = fundData.reduce((sum, fund) => sum + fund.pending_usd, 0);

  if (isLoading) {
    return (
      <Card className="w-full bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading fund access dashboard...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="w-full bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-100">
            <DollarSign className="h-6 w-6 text-green-400" />
            <span>Fund Access Dashboard</span>
            <Badge variant="outline" className="bg-green-500/10 text-green-300 border-green-500/30">
              LIVE
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Funds Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-4 rounded-lg border border-green-500/30">
              <div className="text-sm text-green-300">Total USD</div>
              <div className="text-2xl font-bold text-green-100">${totalUSD.toFixed(2)}</div>
            </div>
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-4 rounded-lg border border-blue-500/30">
              <div className="text-sm text-blue-300">Available</div>
              <div className="text-2xl font-bold text-blue-100">${availableUSD.toFixed(2)}</div>
            </div>
            <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 p-4 rounded-lg border border-amber-500/30">
              <div className="text-sm text-amber-300">Pending</div>
              <div className="text-2xl font-bold text-amber-100">${pendingUSD.toFixed(2)}</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Fund Accessibility</span>
              <span>{totalUSD > 0 ? Math.round((availableUSD / totalUSD) * 100) : 0}%</span>
            </div>
            <Progress 
              value={totalUSD > 0 ? (availableUSD / totalUSD) * 100 : 0} 
              className="h-2 bg-slate-700"
            />
          </div>

          {/* Fund Sources */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <span>Fund Sources</span>
            </h4>
            {fundData.map((fund, index) => (
              <div key={index} className="bg-slate-800/50 p-3 rounded-lg border border-slate-600/50">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-white">{fund.source_system}</div>
                    <div className="text-sm text-muted-foreground">
                      Last updated: {new Date(fund.last_updated).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">${fund.total_usd.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      Available: ${fund.available_usd.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* System Health */}
          {systemHealth && (
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600/50">
              <div className="flex items-center space-x-2 mb-3">
                <Shield className="h-5 w-5 text-blue-400" />
                <span className="font-medium text-white">System Health</span>
                <Badge 
                  variant={systemHealth.overall_status === 'healthy' ? 'default' : 'destructive'}
                  className="ml-2"
                >
                  {systemHealth.overall_status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Supabase: </span>
                  <span className={systemHealth.components.supabase.status === 'healthy' ? 'text-green-400' : 'text-red-400'}>
                    {systemHealth.components.supabase.status}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Stripe: </span>
                  <span className={systemHealth.components.stripe.status === 'healthy' ? 'text-green-400' : 'text-red-400'}>
                    {systemHealth.components.stripe.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={loadFundData}
              variant="outline"
              className="flex items-center space-x-2 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            
            <Button 
              onClick={initiateUSDSweep}
              disabled={isProcessing}
              className="flex items-center space-x-2 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
            >
              <Zap className="h-4 w-4" />
              <span>{isProcessing ? 'Sweeping...' : 'USD Sweep'}</span>
            </Button>
            
            <Button 
              onClick={processAutonomousTransfer}
              disabled={isProcessing || availableUSD < 1}
              className="flex items-center space-x-2 bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
            >
              <DollarSign className="h-4 w-4" />
              <span>{isProcessing ? 'Processing...' : 'Auto Transfer'}</span>
            </Button>
          </div>

          {/* Last Refresh Info */}
          <div className="text-center text-sm text-muted-foreground">
            Last refreshed: {lastRefresh.toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FundAccessDashboard;