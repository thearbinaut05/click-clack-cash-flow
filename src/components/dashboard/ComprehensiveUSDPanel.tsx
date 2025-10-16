import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, Wallet, ArrowDownCircle, ArrowUpCircle, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface USDSource {
  source: string;
  available: number;
  pending: number;
  total: number;
  status: string;
  lastUpdated?: string;
}

export const ComprehensiveUSDPanel = () => {
  // Application Balance
  const { data: appBalance } = useQuery({
    queryKey: ['app-balance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('application_balance')
        .select('*')
        .limit(1)
        .single();
      return data;
    }
  });

  // Autonomous Revenue Transfers
  const { data: revenueTransfers } = useQuery({
    queryKey: ['revenue-transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('autonomous_revenue_transfers')
        .select('amount, status, created_at');
      return data || [];
    }
  });

  // Bank Transfers
  const { data: bankTransfers } = useQuery({
    queryKey: ['bank-transfers-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_transfers')
        .select('amount, status, created_at, net_amount');
      return data || [];
    }
  });

  // Balance Transfers
  const { data: balanceTransfers } = useQuery({
    queryKey: ['balance-transfers-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('balance_transfers')
        .select('amount, status, created_at');
      return data || [];
    }
  });

  // Stripe Transfers
  const { data: stripeTransfers } = useQuery({
    queryKey: ['stripe-transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stripe_transfers')
        .select('amount, status, created_at');
      return data || [];
    }
  });

  // Cash Out Requests
  const { data: cashOutRequests } = useQuery({
    queryKey: ['cashout-requests-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cash_out_requests')
        .select('amount, status, created_at');
      return data || [];
    }
  });

  // Real-time USD Balance
  const { data: realtimeUSD } = useQuery({
    queryKey: ['realtime-usd'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usd_balance_real_time')
        .select('*');
      return data || [];
    }
  });

  // Consolidated Amounts
  const { data: consolidatedAmounts } = useQuery({
    queryKey: ['consolidated-amounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consolidated_amounts')
        .select('*');
      return data || [];
    }
  });

  // Autopilot Config
  const { data: autopilotConfig } = useQuery({
    queryKey: ['autopilot-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('autopilot_config')
        .select('*')
        .limit(1)
        .single();
      return data;
    }
  });

  // Revenue Transfer Logs
  const { data: transferLogs } = useQuery({
    queryKey: ['transfer-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('autonomous_revenue_transfer_logs')
        .select('amount, status, created_at');
      return data || [];
    }
  });

  // Calculate aggregated USD sources
  const calculateUSDSources = (): USDSource[] => {
    const sources: USDSource[] = [];

    // Application Balance
    if (appBalance) {
      sources.push({
        source: 'Application Balance',
        available: Number(appBalance.balance_amount || 0),
        pending: Number(appBalance.pending_transfers || 0),
        total: Number(appBalance.balance_amount || 0) + Number(appBalance.pending_transfers || 0),
        status: 'active',
        lastUpdated: appBalance.last_updated_at
      });
    }

    // Revenue Transfers
    if (revenueTransfers && revenueTransfers.length > 0) {
      const completed = revenueTransfers
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const pending = revenueTransfers
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      
      sources.push({
        source: 'Revenue Transfers',
        available: completed,
        pending: pending,
        total: completed + pending,
        status: 'active'
      });
    }

    // Bank Transfers
    if (bankTransfers && bankTransfers.length > 0) {
      const completed = bankTransfers
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.net_amount || t.amount || 0), 0);
      const pending = bankTransfers
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + Number(t.net_amount || t.amount || 0), 0);
      
      sources.push({
        source: 'Bank Transfers',
        available: completed,
        pending: pending,
        total: completed + pending,
        status: 'active'
      });
    }

    // Stripe Transfers
    if (stripeTransfers && stripeTransfers.length > 0) {
      const completed = stripeTransfers
        .filter(t => t.status === 'succeeded' || t.status === 'paid')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const pending = stripeTransfers
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      
      sources.push({
        source: 'Stripe Transfers',
        available: completed,
        pending: pending,
        total: completed + pending,
        status: 'active'
      });
    }

    // Real-time USD Balance
    if (realtimeUSD && realtimeUSD.length > 0) {
      const available = realtimeUSD
        .filter(u => u.balance_type === 'available')
        .reduce((sum, u) => sum + Number(u.amount_usd || 0), 0);
      const pending = realtimeUSD
        .filter(u => u.balance_type === 'pending')
        .reduce((sum, u) => sum + Number(u.amount_usd || 0), 0);
      
      sources.push({
        source: 'Real-time USD Balance',
        available: available,
        pending: pending,
        total: available + pending,
        status: 'active'
      });
    }

    // Consolidated Amounts
    if (consolidatedAmounts && consolidatedAmounts.length > 0) {
      const ready = consolidatedAmounts
        .filter(c => c.status === 'ready_for_transfer')
        .reduce((sum, c) => sum + Number(c.total_usd || 0), 0);
      const transferred = consolidatedAmounts
        .filter(c => c.status === 'transferred')
        .reduce((sum, c) => sum + Number(c.total_usd || 0), 0);
      
      sources.push({
        source: 'Consolidated Funds',
        available: ready,
        pending: 0,
        total: ready + transferred,
        status: 'active'
      });
    }

    // Transfer Logs (successful)
    if (transferLogs && transferLogs.length > 0) {
      const successful = transferLogs
        .filter(t => t.status === 'success' || t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      
      sources.push({
        source: 'Transfer Logs (Processed)',
        available: successful,
        pending: 0,
        total: successful,
        status: 'completed'
      });
    }

    return sources;
  };

  const usdSources = calculateUSDSources();
  const totalAvailable = usdSources.reduce((sum, s) => sum + s.available, 0);
  const totalPending = usdSources.reduce((sum, s) => sum + s.pending, 0);
  const grandTotal = totalAvailable + totalPending;

  // Cash Out Statistics
  const totalCashedOut = autopilotConfig?.total_amount_cashed_out || 0;
  const totalCashOuts = autopilotConfig?.total_cashouts || 0;

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Comprehensive USD Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-center gap-2 text-green-300 text-sm mb-1">
              <DollarSign className="h-4 w-4" />
              Total Available
            </div>
            <div className="text-3xl font-bold text-green-400">
              ${totalAvailable.toFixed(2)}
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-center gap-2 text-yellow-300 text-sm mb-1">
              <Clock className="h-4 w-4" />
              Pending
            </div>
            <div className="text-3xl font-bold text-yellow-400">
              ${totalPending.toFixed(2)}
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-center gap-2 text-blue-300 text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              Grand Total
            </div>
            <div className="text-3xl font-bold text-blue-400">
              ${grandTotal.toFixed(2)}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <div className="flex items-center gap-2 text-purple-300 text-sm mb-1">
              <ArrowDownCircle className="h-4 w-4" />
              Cashed Out
            </div>
            <div className="text-3xl font-bold text-purple-400">
              ${totalCashedOut.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalCashOuts} transactions
            </div>
          </div>
        </div>

        {/* Progress Visualization */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Available / Total</span>
            <span>{grandTotal > 0 ? ((totalAvailable / grandTotal) * 100).toFixed(1) : 0}%</span>
          </div>
          <Progress value={grandTotal > 0 ? (totalAvailable / grandTotal) * 100 : 0} className="h-3" />
        </div>

        {/* Detailed Breakdown Table */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <ArrowUpCircle className="h-4 w-4" />
            USD Sources Breakdown
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usdSources.map((source, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{source.source}</TableCell>
                  <TableCell className="text-right text-green-600 font-semibold">
                    ${source.available.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-yellow-600">
                    ${source.pending.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${source.total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={source.status === 'active' ? 'default' : 'secondary'}>
                      {source.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right text-green-600">
                  ${totalAvailable.toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-yellow-600">
                  ${totalPending.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  ${grandTotal.toFixed(2)}
                </TableCell>
                <TableCell>-</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};