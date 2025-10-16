import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, TrendingUp } from "lucide-react";

export const AccountingJournalPanel = () => {
  const { data: journals } = useQuery({
    queryKey: ['accounting-journals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounting_journals')
        .select('*, accounting_journal_entries(*)')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    }
  });

  const { data: chartOfAccounts } = useQuery({
    queryKey: ['chart-of-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    }
  });

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Accounting Journals & Chart of Accounts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Chart of Accounts
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {chartOfAccounts?.map((account) => (
              <Badge key={account.id} variant="outline" className="justify-start">
                {account.account_code}: {account.account_name}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Recent Journal Entries</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Journal #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Debit</TableHead>
                <TableHead>Credit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journals?.map((journal) => (
                <TableRow key={journal.id}>
                  <TableCell className="font-mono">{journal.journal_number}</TableCell>
                  <TableCell>{new Date(journal.transaction_date).toLocaleDateString()}</TableCell>
                  <TableCell className="max-w-xs truncate">{journal.description}</TableCell>
                  <TableCell className="text-destructive">${journal.total_debit.toFixed(2)}</TableCell>
                  <TableCell className="text-green-600">${journal.total_credit.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={journal.status === 'posted' ? 'default' : 'secondary'}>
                      {journal.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};