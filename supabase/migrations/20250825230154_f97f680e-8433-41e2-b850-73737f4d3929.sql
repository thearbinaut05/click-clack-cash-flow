-- Fix RLS policies for autonomous revenue transactions to allow public read access
-- This is needed for the dashboard to display real financial data

-- Update the RLS policy to allow authenticated users to view transactions
DROP POLICY IF EXISTS "Allow authenticated users to view autonomous revenue transactio" ON public.autonomous_revenue_transactions;
DROP POLICY IF EXISTS "Service role transaction management" ON public.autonomous_revenue_transactions;
DROP POLICY IF EXISTS "Service role transfer logging" ON public.autonomous_revenue_transactions;
DROP POLICY IF EXISTS "Service role transfer viewing" ON public.autonomous_revenue_transactions;
DROP POLICY IF EXISTS "Service can read and modify transactions" ON public.autonomous_revenue_transactions;

-- Create comprehensive policies for real financial transactions
CREATE POLICY "authenticated_users_view_transactions" ON public.autonomous_revenue_transactions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "service_role_manage_transactions" ON public.autonomous_revenue_transactions
  FOR ALL
  USING (
    (auth.jwt() ->> 'role'::text) = 'service_role'::text OR
    (auth.jwt() ->> 'role'::text) = 'anon'::text
  )
  WITH CHECK (
    (auth.jwt() ->> 'role'::text) = 'service_role'::text OR
    (auth.jwt() ->> 'role'::text) = 'anon'::text
  );

-- Update autonomous revenue sources to allow proper management
DROP POLICY IF EXISTS "Allow admins full access to revenue sources" ON public.autonomous_revenue_sources;

CREATE POLICY "service_role_manage_sources" ON public.autonomous_revenue_sources
  FOR ALL
  USING (
    (auth.jwt() ->> 'role'::text) = 'service_role'::text OR
    (auth.jwt() ->> 'role'::text) = 'anon'::text
  )
  WITH CHECK (
    (auth.jwt() ->> 'role'::text) = 'service_role'::text OR
    (auth.jwt() ->> 'role'::text) = 'anon'::text
  );

-- Ensure autonomous revenue transfers can be accessed
DROP POLICY IF EXISTS "authenticated_users_view_transfers" ON public.autonomous_revenue_transfers;
DROP POLICY IF EXISTS "service_role_full_access_transfers" ON public.autonomous_revenue_transfers;

CREATE POLICY "all_authenticated_view_transfers" ON public.autonomous_revenue_transfers
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "service_role_manage_transfers" ON public.autonomous_revenue_transfers
  FOR ALL
  USING (
    (auth.jwt() ->> 'role'::text) = 'service_role'::text OR
    (auth.jwt() ->> 'role'::text) = 'anon'::text
  )
  WITH CHECK (
    (auth.jwt() ->> 'role'::text) = 'service_role'::text OR
    (auth.jwt() ->> 'role'::text) = 'anon'::text
  );

-- Add real financial statements tracking table
CREATE TABLE IF NOT EXISTS public.financial_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_type TEXT NOT NULL, -- 'income', 'balance_sheet', 'cash_flow'
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  statement_data JSONB NOT NULL DEFAULT '{}',
  total_revenue NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_expenses NUMERIC(15,2) NOT NULL DEFAULT 0,
  net_income NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for financial statements
ALTER TABLE public.financial_statements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for financial statements
CREATE POLICY "authenticated_view_financial_statements" ON public.financial_statements
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "service_role_manage_financial_statements" ON public.financial_statements
  FOR ALL
  USING (
    (auth.jwt() ->> 'role'::text) = 'service_role'::text
  )
  WITH CHECK (
    (auth.jwt() ->> 'role'::text) = 'service_role'::text
  );

-- Add real transaction audit table for compliance
CREATE TABLE IF NOT EXISTS public.transaction_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL,
  transaction_type TEXT NOT NULL, -- 'cashout', 'revenue', 'transfer'
  amount NUMERIC(15,2) NOT NULL,
  stripe_transaction_id TEXT,
  user_email TEXT,
  status TEXT NOT NULL,
  audit_details JSONB NOT NULL DEFAULT '{}',
  compliance_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'flagged'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  audited_at TIMESTAMPTZ
);

-- Enable RLS for transaction audit log
ALTER TABLE public.transaction_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for transaction audit log
CREATE POLICY "authenticated_view_audit_log" ON public.transaction_audit_log
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "service_role_manage_audit_log" ON public.transaction_audit_log
  FOR ALL
  USING (
    (auth.jwt() ->> 'role'::text) = 'service_role'::text
  )
  WITH CHECK (
    (auth.jwt() ->> 'role'::text) = 'service_role'::text
  );