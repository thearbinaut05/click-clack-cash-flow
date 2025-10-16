import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const RevenueMetricsPanel = () => {
  const { data: metrics } = useQuery({
    queryKey: ['revenue-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('autonomous_revenue_metrics')
        .select('*')
        .order('metric_date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    }
  });

  const { data: sources } = useQuery({
    queryKey: ['revenue-sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('autonomous_revenue_sources')
        .select('*')
        .eq('status', 'active');
      if (error) throw error;
      return data;
    }
  });

  const totalRevenue = metrics?.reduce((sum, m) => sum + Number(m.total_revenue), 0) || 0;
  const avgTransfer = metrics?.[0]?.average_transfer_amount || 0;
  const successRate = metrics?.[0] ? 
    (metrics[0].successful_transfers / (metrics[0].successful_transfers + metrics[0].failed_transfers) * 100) : 0;

  const chartData = metrics?.slice(0, 7).reverse().map(m => ({
    date: new Date(m.metric_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: Number(m.total_revenue)
  })) || [];

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Revenue Metrics & Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Total Revenue
            </p>
            <p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Avg Transfer
            </p>
            <p className="text-2xl font-bold">${avgTransfer.toFixed(2)}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Success Rate
            </p>
            <p className="text-2xl font-bold text-green-600">{successRate.toFixed(1)}%</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">7-Day Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Active Revenue Sources</h3>
          <div className="grid grid-cols-2 gap-2">
            {sources?.map((source) => (
              <div key={source.id} className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">{source.source_name}</p>
                  <Badge variant="outline">{source.source_type}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Priority: {source.priority} • 
                  Used: ${source.daily_used?.toFixed(2)} / ${source.daily_limit?.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};