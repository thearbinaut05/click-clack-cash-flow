import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditResult {
  table_name: string;
  field_name: string;
  total_records: number;
  total_usd_amount: number;
  invalid_amounts: number;
  negative_amounts: number;
  null_amounts: number;
  verification_status: 'PASSED' | 'WARNING' | 'FAILED';
  issues: string[];
}

interface ConversionAudit {
  coins_to_usd_rate: number;
  expected_rate: number;
  discrepancies: Array<{
    source: string;
    coins: number;
    calculated_usd: number;
    actual_usd: number;
    discrepancy: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('USD Audit System called');
    
    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Initialize Stripe for external verification
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    }) : null;

    const body = await req.json();
    const { action, deep_audit = false } = body;

    switch (action) {
      case 'comprehensive_audit':
        return handleComprehensiveAudit(supabase, stripe, deep_audit);
      case 'verify_conversions':
        return handleConversionVerification(supabase);
      case 'stripe_reconciliation':
        return handleStripeReconciliation(supabase, stripe);
      case 'fix_discrepancies':
        return handleFixDiscrepancies(supabase, body.fixes || []);
      default:
        return new Response(
          JSON.stringify({ 
            error: 'Invalid action', 
            available_actions: ['comprehensive_audit', 'verify_conversions', 'stripe_reconciliation', 'fix_discrepancies']
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

  } catch (error) {
    console.error('USD Audit System error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleComprehensiveAudit(supabase: any, stripe: any, deep_audit: boolean): Promise<Response> {
  console.log('Starting comprehensive USD audit...');
  
  const auditResults: AuditResult[] = [];
  
  // Define all tables and fields that contain USD amounts
  const usdFields = [
    { table: 'autonomous_revenue_transactions', field: 'amount' },
    { table: 'autonomous_revenue_transfers', field: 'amount' },
    { table: 'application_balance', field: 'balance_amount' },
    { table: 'financial_statements', field: 'total_revenue' },
    { table: 'financial_statements', field: 'total_expenses' },
    { table: 'financial_statements', field: 'net_income' },
    { table: 'transaction_audit_log', field: 'amount' },
    { table: 'agent_swarms', field: 'revenue_generated' },
    { table: 'agent_swarms', field: 'total_cost' },
    { table: 'agent_swarms', field: 'hourly_cost' },
    { table: 'market_offers', field: 'payout_rate' },
    { table: 'payment_transactions', field: 'usd_amount' },
    { table: 'revenue_consolidations', field: 'total_amount' }
  ];

  for (const { table, field } of usdFields) {
    try {
      const result = await auditUSDField(supabase, table, field, deep_audit);
      auditResults.push(result);
    } catch (error) {
      auditResults.push({
        table_name: table,
        field_name: field,
        total_records: 0,
        total_usd_amount: 0,
        invalid_amounts: 0,
        negative_amounts: 0,
        null_amounts: 0,
        verification_status: 'FAILED',
        issues: [`Error accessing table: ${error.message}`]
      });
    }
  }

  // Calculate overall audit statistics
  const totalTables = auditResults.length;
  const passedTables = auditResults.filter(r => r.verification_status === 'PASSED').length;
  const warningTables = auditResults.filter(r => r.verification_status === 'WARNING').length;
  const failedTables = auditResults.filter(r => r.verification_status === 'FAILED').length;
  const totalUSDAmount = auditResults.reduce((sum, r) => sum + r.total_usd_amount, 0);
  const totalIssues = auditResults.reduce((sum, r) => sum + r.issues.length, 0);

  // Log audit to database
  await logAuditResult(supabase, {
    audit_type: 'comprehensive_usd_audit',
    total_tables_audited: totalTables,
    passed_tables: passedTables,
    warning_tables: warningTables,
    failed_tables: failedTables,
    total_usd_amount: totalUSDAmount,
    total_issues_found: totalIssues,
    audit_details: auditResults
  });

  const response = {
    audit_timestamp: new Date().toISOString(),
    audit_type: 'comprehensive_usd_audit',
    deep_audit_enabled: deep_audit,
    summary: {
      total_tables_audited: totalTables,
      passed_tables: passedTables,
      warning_tables: warningTables,
      failed_tables: failedTables,
      total_usd_amount: Number(totalUSDAmount.toFixed(2)),
      total_issues_found: totalIssues,
      overall_status: failedTables > 0 ? 'FAILED' : (warningTables > 0 ? 'WARNING' : 'PASSED')
    },
    detailed_results: auditResults,
    recommendations: generateRecommendations(auditResults)
  };

  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function auditUSDField(supabase: any, tableName: string, fieldName: string, deepAudit: boolean): Promise<AuditResult> {
  console.log(`Auditing ${tableName}.${fieldName}...`);
  
  const issues: string[] = [];
  
  // Get all records with this field
  const { data, error } = await supabase
    .from(tableName)
    .select(`id, ${fieldName}, created_at`);

  if (error) {
    throw new Error(`Failed to query ${tableName}: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return {
      table_name: tableName,
      field_name: fieldName,
      total_records: 0,
      total_usd_amount: 0,
      invalid_amounts: 0,
      negative_amounts: 0,
      null_amounts: 0,
      verification_status: 'PASSED',
      issues: ['No records found']
    };
  }

  let totalAmount = 0;
  let invalidAmounts = 0;
  let negativeAmounts = 0;
  let nullAmounts = 0;

  for (const record of data) {
    const amount = record[fieldName];
    
    if (amount === null || amount === undefined) {
      nullAmounts++;
      issues.push(`Record ${record.id}: NULL amount`);
    } else if (typeof amount !== 'number') {
      invalidAmounts++;
      issues.push(`Record ${record.id}: Invalid amount type - ${typeof amount}`);
    } else if (isNaN(amount)) {
      invalidAmounts++;
      issues.push(`Record ${record.id}: NaN amount`);
    } else if (amount < 0) {
      negativeAmounts++;
      if (tableName !== 'financial_statements' || fieldName !== 'total_expenses') {
        // Negative amounts might be valid for expenses
        issues.push(`Record ${record.id}: Negative amount - $${amount}`);
      }
    } else {
      totalAmount += amount;
    }

    // Deep audit - additional checks
    if (deepAudit) {
      if (amount > 1000000) { // Amounts over $1M might be suspicious
        issues.push(`Record ${record.id}: Large amount detected - $${amount}`);
      }
      if (amount % 0.01 !== 0) { // Check for precision issues
        issues.push(`Record ${record.id}: Precision issue - $${amount}`);
      }
    }
  }

  const totalIssues = invalidAmounts + negativeAmounts + nullAmounts;
  const verificationStatus = totalIssues === 0 ? 'PASSED' : (totalIssues < data.length * 0.1 ? 'WARNING' : 'FAILED');

  return {
    table_name: tableName,
    field_name: fieldName,
    total_records: data.length,
    total_usd_amount: Number(totalAmount.toFixed(2)),
    invalid_amounts: invalidAmounts,
    negative_amounts: negativeAmounts,
    null_amounts: nullAmounts,
    verification_status: verificationStatus,
    issues: issues
  };
}

async function handleConversionVerification(supabase: any): Promise<Response> {
  console.log('Verifying coin-to-USD conversions...');
  
  const expectedRate = 100; // 100 coins = 1 USD
  const discrepancies: any[] = [];

  // Check cashout records in autonomous_revenue_transfers
  const { data: transfers } = await supabase
    .from('autonomous_revenue_transfers')
    .select('*')
    .contains('metadata', { coins: true });

  for (const transfer of transfers || []) {
    if (transfer.metadata?.coins) {
      const coins = transfer.metadata.coins;
      const actualUSD = transfer.amount;
      const calculatedUSD = coins / expectedRate;
      const discrepancy = Math.abs(actualUSD - calculatedUSD);
      
      if (discrepancy > 0.01) { // Allow 1 cent tolerance
        discrepancies.push({
          source: `transfer_${transfer.id}`,
          coins: coins,
          calculated_usd: Number(calculatedUSD.toFixed(2)),
          actual_usd: Number(actualUSD.toFixed(2)),
          discrepancy: Number(discrepancy.toFixed(2))
        });
      }
    }
  }

  const conversionAudit: ConversionAudit = {
    coins_to_usd_rate: expectedRate,
    expected_rate: expectedRate,
    discrepancies: discrepancies
  };

  const response = {
    audit_timestamp: new Date().toISOString(),
    audit_type: 'conversion_verification',
    conversion_audit: conversionAudit,
    total_discrepancies: discrepancies.length,
    status: discrepancies.length === 0 ? 'PASSED' : 'FAILED'
  };

  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleStripeReconciliation(supabase: any, stripe: any): Promise<Response> {
  if (!stripe) {
    return new Response(
      JSON.stringify({ error: 'Stripe not configured' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  console.log('Reconciling with Stripe...');
  
  // Get transactions with Stripe IDs
  const { data: transactions } = await supabase
    .from('autonomous_revenue_transfers')
    .select('*')
    .not('provider_transfer_id', 'is', null);

  const reconciliationResults = [];

  for (const transaction of transactions || []) {
    try {
      const stripeTransfer = await stripe.transfers.retrieve(transaction.provider_transfer_id);
      const stripeAmountUSD = stripeTransfer.amount / 100;
      const dbAmountUSD = transaction.amount;
      const discrepancy = Math.abs(stripeAmountUSD - dbAmountUSD);

      reconciliationResults.push({
        transaction_id: transaction.id,
        stripe_transfer_id: transaction.provider_transfer_id,
        db_amount: Number(dbAmountUSD.toFixed(2)),
        stripe_amount: Number(stripeAmountUSD.toFixed(2)),
        discrepancy: Number(discrepancy.toFixed(2)),
        status: discrepancy < 0.01 ? 'MATCHED' : 'DISCREPANCY',
        stripe_status: stripeTransfer.status
      });
    } catch (error) {
      reconciliationResults.push({
        transaction_id: transaction.id,
        stripe_transfer_id: transaction.provider_transfer_id,
        error: error.message,
        status: 'ERROR'
      });
    }
  }

  const response = {
    audit_timestamp: new Date().toISOString(),
    audit_type: 'stripe_reconciliation',
    total_transactions_checked: reconciliationResults.length,
    matched_transactions: reconciliationResults.filter(r => r.status === 'MATCHED').length,
    discrepancy_transactions: reconciliationResults.filter(r => r.status === 'DISCREPANCY').length,
    error_transactions: reconciliationResults.filter(r => r.status === 'ERROR').length,
    reconciliation_results: reconciliationResults
  };

  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleFixDiscrepancies(supabase: any, fixes: any[]): Promise<Response> {
  console.log('Applying fixes to discrepancies...');
  
  const fixResults = [];

  for (const fix of fixes) {
    try {
      const { table, id, field, new_value, reason } = fix;
      
      // Apply the fix
      const { error } = await supabase
        .from(table)
        .update({ [field]: new_value })
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Log the fix
      await supabase
        .from('transaction_audit_log')
        .insert({
          transaction_id: id,
          transaction_type: 'usd_fix',
          amount: new_value,
          status: 'completed',
          audit_details: {
            table: table,
            field: field,
            previous_value: fix.previous_value,
            new_value: new_value,
            reason: reason,
            fixed_at: new Date().toISOString()
          }
        });

      fixResults.push({
        table: table,
        id: id,
        field: field,
        status: 'SUCCESS',
        message: 'Fix applied successfully'
      });

    } catch (error) {
      fixResults.push({
        table: fix.table,
        id: fix.id,
        field: fix.field,
        status: 'FAILED',
        error: error.message
      });
    }
  }

  const response = {
    fix_timestamp: new Date().toISOString(),
    total_fixes_attempted: fixes.length,
    successful_fixes: fixResults.filter(r => r.status === 'SUCCESS').length,
    failed_fixes: fixResults.filter(r => r.status === 'FAILED').length,
    fix_results: fixResults
  };

  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function logAuditResult(supabase: any, auditData: any): Promise<void> {
  try {
    await supabase
      .from('transaction_audit_log')
      .insert({
        transaction_id: auditData.audit_type,
        transaction_type: 'usd_audit',
        amount: auditData.total_usd_amount,
        status: auditData.failed_tables > 0 ? 'failed' : 'completed',
        audit_details: auditData
      });
  } catch (error) {
    console.error('Failed to log audit result:', error);
  }
}

function generateRecommendations(auditResults: AuditResult[]): string[] {
  const recommendations = [];
  
  const failedTables = auditResults.filter(r => r.verification_status === 'FAILED');
  const warningTables = auditResults.filter(r => r.verification_status === 'WARNING');
  
  if (failedTables.length > 0) {
    recommendations.push(`Critical: ${failedTables.length} tables failed audit. Immediate attention required.`);
  }
  
  if (warningTables.length > 0) {
    recommendations.push(`Warning: ${warningTables.length} tables have issues that should be reviewed.`);
  }
  
  const totalNullAmounts = auditResults.reduce((sum, r) => sum + r.null_amounts, 0);
  if (totalNullAmounts > 0) {
    recommendations.push(`${totalNullAmounts} null USD amounts found. Consider setting default values.`);
  }
  
  const totalNegativeAmounts = auditResults.reduce((sum, r) => sum + r.negative_amounts, 0);
  if (totalNegativeAmounts > 0) {
    recommendations.push(`${totalNegativeAmounts} negative USD amounts found. Verify these are legitimate.`);
  }
  
  recommendations.push('Schedule regular automated audits to maintain USD data integrity.');
  recommendations.push('Implement real-time validation for all USD amount inputs.');
  
  return recommendations;
}