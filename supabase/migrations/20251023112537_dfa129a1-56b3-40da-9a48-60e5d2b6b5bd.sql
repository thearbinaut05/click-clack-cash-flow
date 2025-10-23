-- Enable public read access to financial tables for dashboard visibility
-- This allows the UI to display USD balances without authentication

-- Application Balance - public read access
DROP POLICY IF EXISTS "Public read access" ON public.application_balance;
CREATE POLICY "Public read access" 
ON public.application_balance 
FOR SELECT 
USING (true);

-- Autonomous Revenue Transfers - public read access
DROP POLICY IF EXISTS "Public read access" ON public.autonomous_revenue_transfers;
CREATE POLICY "Public read access" 
ON public.autonomous_revenue_transfers 
FOR SELECT 
USING (true);

-- Bank Transfers - public read access
DROP POLICY IF EXISTS "Public read access" ON public.bank_transfers;
CREATE POLICY "Public read access" 
ON public.bank_transfers 
FOR SELECT 
USING (true);

-- Balance Transfers - public read access
DROP POLICY IF EXISTS "Public read access" ON public.balance_transfers;
CREATE POLICY "Public read access" 
ON public.balance_transfers 
FOR SELECT 
USING (true);

-- Stripe Transfers - public read access
DROP POLICY IF EXISTS "Public read access" ON public.stripe_transfers;
CREATE POLICY "Public read access" 
ON public.stripe_transfers 
FOR SELECT 
USING (true);

-- Cash Out Requests - public read access
DROP POLICY IF EXISTS "Public read access" ON public.cash_out_requests;
CREATE POLICY "Public read access" 
ON public.cash_out_requests 
FOR SELECT 
USING (true);

-- Real-time USD Balance - public read access
DROP POLICY IF EXISTS "Public read access" ON public.usd_balance_real_time;
CREATE POLICY "Public read access" 
ON public.usd_balance_real_time 
FOR SELECT 
USING (true);

-- Consolidated Amounts - public read access
DROP POLICY IF EXISTS "Public read access" ON public.consolidated_amounts;
CREATE POLICY "Public read access" 
ON public.consolidated_amounts 
FOR SELECT 
USING (true);

-- Autopilot Config - public read access
DROP POLICY IF EXISTS "Public read access" ON public.autopilot_config;
CREATE POLICY "Public read access" 
ON public.autopilot_config 
FOR SELECT 
USING (true);

-- Revenue Transfer Logs - public read access
DROP POLICY IF EXISTS "Public read access" ON public.autonomous_revenue_transfer_logs;
CREATE POLICY "Public read access" 
ON public.autonomous_revenue_transfer_logs 
FOR SELECT 
USING (true);

-- Accounting Journals - public read access
DROP POLICY IF EXISTS "Public read access" ON public.accounting_journals;
CREATE POLICY "Public read access" 
ON public.accounting_journals 
FOR SELECT 
USING (true);

-- Compliance Audit Log - public read access
DROP POLICY IF EXISTS "Public read access" ON public.compliance_audit_log;
CREATE POLICY "Public read access" 
ON public.compliance_audit_log 
FOR SELECT 
USING (true);

-- Agent Swarms - public read access
DROP POLICY IF EXISTS "Public read access" ON public.agent_swarms;
CREATE POLICY "Public read access" 
ON public.agent_swarms 
FOR SELECT 
USING (true);

-- Bank Connections Registry - public read access
DROP POLICY IF EXISTS "Public read access" ON public.bank_connections_registry;
CREATE POLICY "Public read access" 
ON public.bank_connections_registry 
FOR SELECT 
USING (true);

-- Revenue Metrics - public read access
DROP POLICY IF EXISTS "Public read access" ON public.autonomous_revenue_metrics;
CREATE POLICY "Public read access" 
ON public.autonomous_revenue_metrics 
FOR SELECT 
USING (true);

-- Campaigns - public read access
DROP POLICY IF EXISTS "Public read access" ON public.campaigns;
CREATE POLICY "Public read access" 
ON public.campaigns 
FOR SELECT 
USING (true);

-- Worker Pool - public read access
DROP POLICY IF EXISTS "Public read access" ON public.autonomous_revenue_workers;
CREATE POLICY "Public read access" 
ON public.autonomous_revenue_workers 
FOR SELECT 
USING (true);

-- Task Queue - public read access
DROP POLICY IF EXISTS "Public read access" ON public.autonomous_revenue_task_queue;
CREATE POLICY "Public read access" 
ON public.autonomous_revenue_task_queue 
FOR SELECT 
USING (true);