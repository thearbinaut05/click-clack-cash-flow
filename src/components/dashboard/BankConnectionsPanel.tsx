import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Building2, CheckCircle, XCircle, Clock } from "lucide-react";

export const BankConnectionsPanel = () => {
  const { data: connections } = useQuery({
    queryKey: ['bank-connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_connections_registry')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: transfers } = useQuery({
    queryKey: ['bank-transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_transfers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Bank Connections & Transfers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-3">Connected Banks</h3>
          <div className="grid gap-2">
            {connections?.map((conn) => (
              <div key={conn.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  {getStatusIcon(conn.status)}
                  <div>
                    <p className="font-medium text-sm">{conn.provider}</p>
                    <p className="text-xs text-muted-foreground">
                      {conn.is_real_time ? 'Real-time' : 'Batch'} • 
                      Last check: {new Date(conn.last_check || '').toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge variant={conn.status === 'active' ? 'default' : 'secondary'}>
                  {conn.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Recent Transfers</h3>
          <div className="space-y-2">
            {transfers?.map((transfer) => (
              <div key={transfer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium text-sm">{transfer.transfer_type}</p>
                  <p className="text-xs text-muted-foreground">
                    {transfer.reference_number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${transfer.amount.toFixed(2)}</p>
                  <Badge variant={
                    transfer.status === 'completed' ? 'default' : 
                    transfer.status === 'failed' ? 'destructive' : 
                    'secondary'
                  }>
                    {transfer.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};