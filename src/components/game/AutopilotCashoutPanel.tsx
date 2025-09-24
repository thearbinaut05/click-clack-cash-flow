import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plane, Settings, Activity, DollarSign, Clock, TrendingUp } from "lucide-react";

interface AutopilotConfig {
  enabled: boolean;
  minBalance: number;
  cashoutPercentage: number;
  email: string;
  payoutMethod: string;
  frequency: number;
  maxDailyCashouts: number;
  dailyCashoutCount?: number;
  totalCashouts?: number;
  totalAmountCashedOut?: number;
  lastCashoutAt?: string;
}

interface RecentCashout {
  amount: number;
  created_at: string;
  status?: string;
  transaction_id?: string;
}

export default function AutopilotCashoutPanel() {
  const [config, setConfig] = useState<AutopilotConfig>({
    enabled: false,
    minBalance: 10,
    cashoutPercentage: 80,
    email: "",
    payoutMethod: "standard",
    frequency: 60, // minutes
    maxDailyCashouts: 5,
  });
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [recentCashouts, setRecentCashouts] = useState<RecentCashout[]>([]);
  const { toast } = useToast();

  const loadAutopilotStatus = useCallback(async () => {
    try {
      setStatusLoading(true);
      const { data, error } = await supabase.functions.invoke('autopilot-cashout', {
        body: { action: 'get_status' }
      });

      if (error) throw error;

      if (data.config && Object.keys(data.config).length > 1) {
        setConfig({
          enabled: data.config.enabled || false,
          minBalance: data.config.min_balance || 10,
          cashoutPercentage: data.config.cashout_percentage || 80,
          email: data.config.email || "",
          payoutMethod: data.config.payout_method || "standard",
          frequency: data.config.frequency_minutes || 60,
          maxDailyCashouts: data.config.max_daily_cashouts || 5,
          dailyCashoutCount: data.config.daily_cashout_count || 0,
          totalCashouts: data.config.total_cashouts || 0,
          totalAmountCashedOut: data.config.total_amount_cashed_out || 0,
          lastCashoutAt: data.config.last_cashout_at,
        });
      }

      setRecentCashouts(data.recent_cashouts || []);
    } catch (error) {
      console.error('Error loading autopilot status:', error);
      // Set fallback data when service fails
      setConfig(prev => ({ ...prev, enabled: false }));
      setRecentCashouts([]);
      toast({
        title: "Connection Issue",
        description: "Unable to load autopilot status. Running in offline mode.",
        variant: "destructive",
      });
    } finally {
      setStatusLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAutopilotStatus();
  }, [loadAutopilotStatus]);

  const handleStartAutopilot = async () => {
    if (!config.email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address for cashouts",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('autopilot-cashout', {
        body: { 
          action: 'start_autopilot',
          config: {
            enabled: true,
            minBalance: config.minBalance,
            cashoutPercentage: config.cashoutPercentage,
            email: config.email,
            payoutMethod: config.payoutMethod,
            frequency: config.frequency,
            maxDailyCashouts: config.maxDailyCashouts,
          }
        }
      });

      if (error) throw error;

      setConfig(prev => ({ ...prev, enabled: true }));
      toast({
        title: "Autopilot Started",
        description: `Autopilot will check every ${config.frequency} minutes and cashout ${config.cashoutPercentage}% when balance exceeds $${config.minBalance}`,
      });
    } catch (error) {
      console.error('Error starting autopilot:', error);
      toast({
        title: "Error",
        description: "Failed to start autopilot cashout system",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStopAutopilot = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('autopilot-cashout', {
        body: { action: 'stop_autopilot' }
      });

      if (error) throw error;

      setConfig(prev => ({ ...prev, enabled: false }));
      toast({
        title: "Autopilot Stopped",
        description: "Automatic cashout system has been disabled",
      });
    } catch (error) {
      console.error('Error stopping autopilot:', error);
      toast({
        title: "Error",
        description: "Failed to stop autopilot system",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheck = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('autopilot-cashout', {
        body: { action: 'process_autopilot' }
      });

      if (error) throw error;

      toast({
        title: "Manual Check Complete",
        description: data.message,
      });

      // Reload status to get updated information
      await loadAutopilotStatus();
    } catch (error) {
      console.error('Error running manual check:', error);
      toast({
        title: "Error",
        description: "Failed to run manual autopilot check",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (statusLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Autopilot Cashout System
          </CardTitle>
          <CardDescription>Loading autopilot configuration...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Autopilot Cashout System
              <Badge className={config.enabled ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-500"}>
                {config.enabled ? "ACTIVE" : "INACTIVE"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Automatically send revenue to your bank account when conditions are met
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadAutopilotStatus}>
            <Activity className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        {config.totalCashouts !== undefined && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <div className="text-sm text-muted-foreground">Total Cashed Out</div>
              <div className="font-semibold">${(config.totalAmountCashedOut || 0).toFixed(2)}</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <div className="text-sm text-muted-foreground">Total Cashouts</div>
              <div className="font-semibold">{config.totalCashouts || 0}</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <Clock className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <div className="text-sm text-muted-foreground">Today</div>
              <div className="font-semibold">{config.dailyCashoutCount || 0}/{config.maxDailyCashouts}</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <Activity className="h-5 w-5 mx-auto mb-1 text-purple-500" />
              <div className="text-sm text-muted-foreground">Check Freq.</div>
              <div className="font-semibold">{config.frequency}m</div>
            </div>
          </div>
        )}

        <Separator />

        {/* Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email for Cashouts</Label>
              <Input
                id="email"
                type="email"
                value={config.email}
                onChange={(e) => setConfig(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
                disabled={config.enabled}
              />
            </div>

            <div>
              <Label htmlFor="payout-method">Payout Method</Label>
              <Select
                value={config.payoutMethod}
                onValueChange={(value) => setConfig(prev => ({ ...prev, payoutMethod: value }))}
                disabled={config.enabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Transfer</SelectItem>
                  <SelectItem value="bank-card">Bank Card</SelectItem>
                  <SelectItem value="virtual-card">Virtual Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="min-balance">Minimum Balance ($)</Label>
              <Input
                id="min-balance"
                type="number"
                value={config.minBalance}
                onChange={(e) => setConfig(prev => ({ ...prev, minBalance: parseFloat(e.target.value) || 0 }))}
                min="5"
                step="0.01"
                disabled={config.enabled}
              />
            </div>

            <div>
              <Label htmlFor="cashout-percentage">Cashout Percentage (%)</Label>
              <Input
                id="cashout-percentage"
                type="number"
                value={config.cashoutPercentage}
                onChange={(e) => setConfig(prev => ({ ...prev, cashoutPercentage: parseFloat(e.target.value) || 0 }))}
                min="10"
                max="100"
                step="5"
                disabled={config.enabled}
              />
            </div>

            <div>
              <Label htmlFor="frequency">Check Frequency (minutes)</Label>
              <Input
                id="frequency"
                type="number"
                value={config.frequency}
                onChange={(e) => setConfig(prev => ({ ...prev, frequency: parseInt(e.target.value) || 60 }))}
                min="15"
                step="15"
                disabled={config.enabled}
              />
            </div>

            <div>
              <Label htmlFor="max-daily">Max Daily Cashouts</Label>
              <Input
                id="max-daily"
                type="number"
                value={config.maxDailyCashouts}
                onChange={(e) => setConfig(prev => ({ ...prev, maxDailyCashouts: parseInt(e.target.value) || 1 }))}
                min="1"
                max="20"
                disabled={config.enabled}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Controls */}
        <div className="flex gap-4">
          {!config.enabled ? (
            <Button
              onClick={handleStartAutopilot}
              disabled={loading || !config.email}
              className="flex-1"
            >
              <Plane className="h-4 w-4 mr-2" />
              Start Autopilot
            </Button>
          ) : (
            <>
              <Button
                onClick={handleStopAutopilot}
                disabled={loading}
                variant="destructive"
                className="flex-1"
              >
                Stop Autopilot
              </Button>
              <Button
                onClick={handleManualCheck}
                disabled={loading}
                variant="outline"
              >
                Manual Check
              </Button>
            </>
          )}
        </div>

        {/* Recent Activity */}
        {recentCashouts.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-3">Recent Autopilot Cashouts</h3>
              <div className="space-y-2">
                {recentCashouts.slice(0, 5).map((cashout: RecentCashout, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">${cashout.amount.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(cashout.created_at).toLocaleString()}
                      </div>
                    </div>
                    <Badge className={
                      cashout.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                      cashout.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-red-500/10 text-red-500'
                    }>
                      {cashout.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}