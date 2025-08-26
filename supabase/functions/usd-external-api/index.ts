import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface USDSummary {
  total_revenue: number;
  total_transfers: number;
  application_balance: number;
  pending_transactions: number;
  verified_balance: number;
  last_updated: string;
}

interface USDDetailedReport {
  summary: USDSummary;
  revenue_breakdown: {
    autonomous_revenue_transactions: Array<{
      id: string;
      amount: number;
      status: string;
      created_at: string;
    }>;
    autonomous_revenue_transfers: Array<{
      id: string;
      amount: number;
      status: string;
      created_at: string;
    }>;
  };
  agent_revenue: Array<{
    id: string;
    name: string;
    revenue_generated: number;
    total_cost: number;
    net_profit: number;
  }>;
  market_offers: Array<{
    id: string;
    name: string;
    payout_rate: number;
    performance_score: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('USD External API called');
    
    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();
    const format = url.searchParams.get('format') || 'json';
    const apiKey = req.headers.get('x-api-key');

    // Simple API key validation (in production, use proper authentication)
    const validApiKey = Deno.env.get('USD_API_KEY') || 'usd-access-key-2024';
    if (apiKey !== validApiKey) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    switch (endpoint) {
      case 'summary':
        return handleSummary(supabase, format);
      case 'detailed':
        return handleDetailed(supabase, format);
      case 'verification':
        return handleVerification(supabase, format);
      default:
        return new Response(
          JSON.stringify({ 
            error: 'Invalid endpoint', 
            available_endpoints: ['summary', 'detailed', 'verification'],
            usage: 'Add x-api-key header for authentication'
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

  } catch (error) {
    console.error('USD External API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleSummary(supabase: any, format: string): Promise<Response> {
  // Get application balance
  const { data: balanceData } = await supabase
    .from('application_balance')
    .select('balance_amount')
    .eq('id', 1)
    .single();

  // Get total revenue from transactions
  const { data: revenueData } = await supabase
    .from('autonomous_revenue_transactions')
    .select('amount')
    .eq('status', 'completed');

  // Get total transfers
  const { data: transferData } = await supabase
    .from('autonomous_revenue_transfers')
    .select('amount')
    .eq('status', 'completed');

  // Get pending transactions
  const { data: pendingData } = await supabase
    .from('autonomous_revenue_transactions')
    .select('amount')
    .neq('status', 'completed');

  const totalRevenue = revenueData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
  const totalTransfers = transferData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
  const pendingTransactions = pendingData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
  const applicationBalance = balanceData?.balance_amount || 0;

  const summary: USDSummary = {
    total_revenue: Number(totalRevenue.toFixed(2)),
    total_transfers: Number(totalTransfers.toFixed(2)),
    application_balance: Number(applicationBalance.toFixed(2)),
    pending_transactions: Number(pendingTransactions.toFixed(2)),
    verified_balance: Number((totalRevenue - totalTransfers).toFixed(2)),
    last_updated: new Date().toISOString()
  };

  if (format === 'csv') {
    const csv = convertSummaryToCSV(summary);
    return new Response(csv, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="usd_summary.csv"'
      }
    });
  }

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleDetailed(supabase: any, format: string): Promise<Response> {
  // Get summary first
  const summaryResponse = await handleSummary(supabase, 'json');
  const summary = await summaryResponse.json();

  // Get detailed revenue transactions (limited to recent 100)
  const { data: revenueTransactions } = await supabase
    .from('autonomous_revenue_transactions')
    .select('id, amount, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  // Get detailed transfers (limited to recent 100)
  const { data: transfers } = await supabase
    .from('autonomous_revenue_transfers')
    .select('id, amount, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  // Get agent revenue data
  const { data: agents } = await supabase
    .from('agent_swarms')
    .select('id, name, revenue_generated, total_cost')
    .order('revenue_generated', { ascending: false });

  // Get market offers
  const { data: offers } = await supabase
    .from('market_offers')
    .select('id, name, payout_rate, performance_score')
    .eq('is_active', true)
    .order('performance_score', { ascending: false })
    .limit(50);

  const detailedReport: USDDetailedReport = {
    summary,
    revenue_breakdown: {
      autonomous_revenue_transactions: revenueTransactions || [],
      autonomous_revenue_transfers: transfers || []
    },
    agent_revenue: (agents || []).map(agent => ({
      id: agent.id,
      name: agent.name,
      revenue_generated: Number((agent.revenue_generated || 0).toFixed(2)),
      total_cost: Number((agent.total_cost || 0).toFixed(2)),
      net_profit: Number(((agent.revenue_generated || 0) - (agent.total_cost || 0)).toFixed(2))
    })),
    market_offers: (offers || []).map(offer => ({
      id: offer.id,
      name: offer.name,
      payout_rate: Number((offer.payout_rate || 0).toFixed(2)),
      performance_score: Number((offer.performance_score || 0).toFixed(2))
    }))
  };

  if (format === 'csv') {
    const csv = convertDetailedToCSV(detailedReport);
    return new Response(csv, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="usd_detailed_report.csv"'
      }
    });
  }

  return new Response(JSON.stringify(detailedReport), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleVerification(supabase: any, format: string): Promise<Response> {
  const verificationResults = [];

  // Verify application balance consistency
  const { data: balanceData } = await supabase
    .from('application_balance')
    .select('*')
    .eq('id', 1)
    .single();

  const { data: allRevenue } = await supabase
    .from('autonomous_revenue_transactions')
    .select('amount, status');

  const { data: allTransfers } = await supabase
    .from('autonomous_revenue_transfers')
    .select('amount, status');

  const totalCompletedRevenue = allRevenue?.filter(r => r.status === 'completed')
    .reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
  
  const totalCompletedTransfers = allTransfers?.filter(t => t.status === 'completed')
    .reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

  const calculatedBalance = totalCompletedRevenue - totalCompletedTransfers;
  const actualBalance = balanceData?.balance_amount || 0;
  const balanceDiscrepancy = Math.abs(calculatedBalance - actualBalance);

  verificationResults.push({
    check: 'application_balance_consistency',
    status: balanceDiscrepancy < 0.01 ? 'PASSED' : 'FAILED',
    calculated_balance: Number(calculatedBalance.toFixed(2)),
    actual_balance: Number(actualBalance.toFixed(2)),
    discrepancy: Number(balanceDiscrepancy.toFixed(2)),
    tolerance: 0.01
  });

  // Verify agent revenue calculations
  const { data: agents } = await supabase
    .from('agent_swarms')
    .select('id, name, revenue_generated, total_cost, hourly_cost');

  for (const agent of agents || []) {
    const revenueConsistent = (agent.revenue_generated || 0) >= 0;
    const costConsistent = (agent.total_cost || 0) >= 0;
    const profitCalculation = (agent.revenue_generated || 0) - (agent.total_cost || 0);
    
    verificationResults.push({
      check: `agent_${agent.id}_revenue_consistency`,
      agent_name: agent.name,
      status: (revenueConsistent && costConsistent) ? 'PASSED' : 'FAILED',
      revenue_generated: Number((agent.revenue_generated || 0).toFixed(2)),
      total_cost: Number((agent.total_cost || 0).toFixed(2)),
      calculated_profit: Number(profitCalculation.toFixed(2))
    });
  }

  const verification = {
    verification_timestamp: new Date().toISOString(),
    total_checks: verificationResults.length,
    passed_checks: verificationResults.filter(r => r.status === 'PASSED').length,
    failed_checks: verificationResults.filter(r => r.status === 'FAILED').length,
    results: verificationResults
  };

  if (format === 'csv') {
    const csv = convertVerificationToCSV(verification);
    return new Response(csv, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="usd_verification.csv"'
      }
    });
  }

  return new Response(JSON.stringify(verification), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function convertSummaryToCSV(summary: USDSummary): string {
  const headers = 'Metric,Amount_USD,Last_Updated\n';
  const rows = [
    `Total Revenue,${summary.total_revenue},${summary.last_updated}`,
    `Total Transfers,${summary.total_transfers},${summary.last_updated}`,
    `Application Balance,${summary.application_balance},${summary.last_updated}`,
    `Pending Transactions,${summary.pending_transactions},${summary.last_updated}`,
    `Verified Balance,${summary.verified_balance},${summary.last_updated}`
  ].join('\n');
  
  return headers + rows;
}

function convertDetailedToCSV(report: USDDetailedReport): string {
  let csv = 'Type,ID,Name,Amount_USD,Status,Date\n';
  
  // Add revenue transactions
  for (const transaction of report.revenue_breakdown.autonomous_revenue_transactions) {
    csv += `Revenue Transaction,${transaction.id},,${transaction.amount},${transaction.status},${transaction.created_at}\n`;
  }
  
  // Add transfers
  for (const transfer of report.revenue_breakdown.autonomous_revenue_transfers) {
    csv += `Transfer,${transfer.id},,${transfer.amount},${transfer.status},${transfer.created_at}\n`;
  }
  
  // Add agent revenue
  for (const agent of report.agent_revenue) {
    csv += `Agent Revenue,${agent.id},${agent.name},${agent.revenue_generated},Active,\n`;
    csv += `Agent Cost,${agent.id},${agent.name},${agent.total_cost},Active,\n`;
  }
  
  return csv;
}

function convertVerificationToCSV(verification: any): string {
  let csv = 'Check,Status,Details\n';
  
  for (const result of verification.results) {
    const details = Object.entries(result)
      .filter(([key]) => key !== 'check' && key !== 'status')
      .map(([key, value]) => `${key}:${value}`)
      .join(';');
    csv += `${result.check},${result.status},"${details}"\n`;
  }
  
  return csv;
}