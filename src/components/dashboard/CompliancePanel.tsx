import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Shield, AlertTriangle } from "lucide-react";

export const CompliancePanel = () => {
  const { data: audits } = useQuery({
    queryKey: ['compliance-audits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    }
  });

  const { data: checks } = useQuery({
    queryKey: ['compliance-checks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_checks')
        .select('*')
        .order('check_date', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    }
  });

  const getRiskColor = (level: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-destructive'
    };
    return colors[level as keyof typeof colors] || 'text-muted-foreground';
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Compliance & Audit Trail
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-3">Recent Audits</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audits?.map((audit) => (
                <TableRow key={audit.id}>
                  <TableCell>{audit.audit_type}</TableCell>
                  <TableCell>{audit.entity_type}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={audit.compliance_score || 0} className="w-20" />
                      <span className="text-xs">{audit.compliance_score}%</span>
                    </div>
                  </TableCell>
                  <TableCell className={getRiskColor(audit.risk_level || '')}>
                    {audit.risk_level}
                  </TableCell>
                  <TableCell>
                    <Badge variant={audit.status === 'passed' ? 'default' : 'destructive'}>
                      {audit.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Compliance Checks
          </h3>
          <div className="space-y-2">
            {checks?.map((check) => (
              <div key={check.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{check.check_type}</p>
                  <p className="text-xs text-muted-foreground">{check.entity_type}</p>
                </div>
                <Badge variant={check.passed ? 'default' : 'destructive'}>
                  {check.passed ? 'Passed' : 'Failed'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};